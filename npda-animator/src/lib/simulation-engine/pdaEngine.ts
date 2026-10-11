/**
 * PDA Simulation Engine
 *
 * Stack convention:
 *   - stack[stack.length - 1] is the TOP of the stack.
 *   - When a transition fires with stackPush = "AZ0", the current top is REMOVED
 *     and the characters of "AZ0" are pushed left-to-right, so 'A' ends on top.
 *   - stackPush = "" means POP (remove the top symbol without pushing anything).
 *   - stackPush = stackTopSymbol means no net change (replace top with itself).
 *
 * Epsilon transitions:
 *   - inputSymbol === "" or inputSymbol === "ε" means the transition does NOT consume input.
 *   - For a DPDA, an epsilon transition in state q with stack-top X conflicts with
 *     any non-epsilon transition in state q with stack-top X on ANY input symbol.
 */

import type {
  PDADefinition,
  PDATransition,
  SimulationConfig,
  ExecutionStatus,
  ExecutionStep,
  SimulationResult,
  AcceptanceCriterion,
} from '../../types/pda';

export const EPSILON = 'ε';
export const MAX_STEPS_DEFAULT = 1000;

// ── helpers ──────────────────────────────────────────────────────────────────

export function isEpsilon(sym: string): boolean {
  return sym === '' || sym === EPSILON;
}

/** Return a deep clone of a SimulationConfig */
export function cloneConfig(c: SimulationConfig): SimulationConfig {
  return {
    state: c.state,
    input: c.input,
    inputPos: c.inputPos,
    stack: [...c.stack],
    stepNumber: c.stepNumber,
  };
}

/** Remaining unread input */
export function remainingInput(cfg: SimulationConfig): string {
  return cfg.input.slice(cfg.inputPos);
}

/** Current top of stack, or undefined if empty */
export function stackTop(cfg: SimulationConfig): string | undefined {
  return cfg.stack.length > 0 ? cfg.stack[cfg.stack.length - 1] : undefined;
}

// ── transition matching ───────────────────────────────────────────────────────

/**
 * Find the applicable transition for the given configuration.
 * For a DPDA there should be at most one (validated elsewhere).
 * We prefer non-epsilon transitions over epsilon ones only when looking for
 * "the" applicable transition during deterministic simulation;
 * here we return the FIRST matching transition in definition order.
 */
export function findApplicableTransition(
  pda: PDADefinition,
  cfg: SimulationConfig
): PDATransition | undefined {
  const top = stackTop(cfg);
  if (top === undefined) return undefined; // stack is empty — no transition can fire

  const nextInputChar = cfg.input[cfg.inputPos]; // may be undefined (end of input)

  for (const t of pda.transitions) {
    if (t.fromState !== cfg.state) continue;
    if (t.stackTopSymbol !== top) continue;

    if (isEpsilon(t.inputSymbol)) {
      return t; // epsilon transition — always applicable if stack-top matches
    }

    if (nextInputChar !== undefined && t.inputSymbol === nextInputChar) {
      return t;
    }
  }
  return undefined;
}

// ── stack manipulation ────────────────────────────────────────────────────────

/**
 * Apply a transition to a configuration and return the NEW configuration.
 * Does NOT mutate the original.
 */
export function applyTransition(
  cfg: SimulationConfig,
  transition: PDATransition
): SimulationConfig {
  const newStack = [...cfg.stack];
  newStack.pop(); // remove the matched stack-top

  // Push the replacement string left-to-right (first char ends on top last, so push in reverse)
  if (transition.stackPush !== '') {
    for (let i = transition.stackPush.length - 1; i >= 0; i--) {
      newStack.push(transition.stackPush[i]);
    }
  }
  // If stackPush === '', stack top was simply popped (already done above)

  const consumedInput = !isEpsilon(transition.inputSymbol);

  return {
    state: transition.toState,
    input: cfg.input,
    inputPos: cfg.inputPos + (consumedInput ? 1 : 0),
    stack: newStack,
    stepNumber: cfg.stepNumber + 1,
  };
}

// ── acceptance evaluation ─────────────────────────────────────────────────────

export function isAccepted(
  pda: PDADefinition,
  cfg: SimulationConfig,
  criterion: AcceptanceCriterion
): boolean {
  const inputConsumed = cfg.inputPos >= cfg.input.length;
  if (!inputConsumed) return false;

  if (criterion === 'final-state') {
    const state = pda.states.find((s) => s.id === cfg.state);
    return state?.isAccepting ?? false;
  } else {
    // empty-stack acceptance: stack must be empty
    return cfg.stack.length === 0;
  }
}

// ── explanation builders ──────────────────────────────────────────────────────

export function buildExplanation(
  pda: PDADefinition,
  cfg: SimulationConfig,
  transition: PDATransition | null,
  nextCfg: SimulationConfig | null
): { explanation: string; technicalExplanation: string } {
  if (!transition || !nextCfg) {
    const top = stackTop(cfg) ?? '(empty)';
    const nextChar = cfg.input[cfg.inputPos] ?? '(end of input)';
    return {
      explanation: `No applicable transition found in state "${cfg.state}" with input symbol "${nextChar}" and stack top "${top}". The PDA is stuck.`,
      technicalExplanation: `δ(${cfg.state}, ${nextChar}, ${top}) = undefined — no applicable transition.`,
    };
  }

  const fromStateName = pda.states.find((s) => s.id === transition.fromState)?.name ?? transition.fromState;
  const toStateName = pda.states.find((s) => s.id === transition.toState)?.name ?? transition.toState;
  const inSym = isEpsilon(transition.inputSymbol) ? 'ε (no input consumed)' : `"${transition.inputSymbol}"`;
  const push = transition.stackPush === '' ? 'nothing (POP)' : `"${transition.stackPush}" (left = new top)`;

  return {
    explanation:
      `In state "${fromStateName}", reading ${inSym} from the tape, with "${transition.stackTopSymbol}" on top of the stack. ` +
      `We pop "${transition.stackTopSymbol}" and push ${push}. ` +
      `The PDA moves to state "${toStateName}".`,
    technicalExplanation:
      `δ(${transition.fromState}, ${isEpsilon(transition.inputSymbol) ? 'ε' : transition.inputSymbol}, ${transition.stackTopSymbol}) = ` +
      `(${transition.toState}, ${transition.stackPush === '' ? 'ε' : transition.stackPush})`,
  };
}

// ── main simulation class ─────────────────────────────────────────────────────

export class PDASimulator {
  private pda: PDADefinition;
  private configs: SimulationConfig[];   // history[0] = initial, history[i] = after step i
  private steps: ExecutionStep[];
  private status: ExecutionStatus;
  private maxSteps: number;

  constructor(pda: PDADefinition, input: string, maxSteps = MAX_STEPS_DEFAULT) {
    this.pda = pda;
    this.maxSteps = maxSteps;
    this.steps = [];
    this.status = 'idle';
    this.configs = [this.buildInitialConfig(input)];
  }

  private buildInitialConfig(input: string): SimulationConfig {
    const initialState = this.pda.states.find((s) => s.isInitial);
    return {
      state: initialState?.id ?? '',
      input,
      inputPos: 0,
      stack: [this.pda.initialStackSymbol],
      stepNumber: 0,
    };
  }

  get currentConfig(): SimulationConfig {
    return this.configs[this.configs.length - 1];
  }

  get currentStatus(): ExecutionStatus {
    return this.status;
  }

  get currentStep(): number {
    return this.currentConfig.stepNumber;
  }

  get executionSteps(): ExecutionStep[] {
    return this.steps;
  }

  get isFinished(): boolean {
    return (
      this.status === 'accepted' ||
      this.status === 'rejected' ||
      this.status === 'stuck' ||
      this.status === 'invalid-input' ||
      this.status === 'step-limit-reached'
    );
  }

  /** Validate that all input symbols are in the alphabet */
  validateInput(): boolean {
    for (const ch of this.currentConfig.input) {
      if (!this.pda.inputAlphabet.includes(ch)) return false;
    }
    return true;
  }

  /** Execute exactly one transition. Returns false if simulation is already done. */
  stepForward(): boolean {
    if (this.isFinished) return false;
    if (this.status === 'idle') this.status = 'running';

    const cfg = this.currentConfig;

    // Step limit check
    if (cfg.stepNumber >= this.maxSteps) {
      this.status = 'step-limit-reached';
      return false;
    }

    const transition = findApplicableTransition(this.pda, cfg);

    if (!transition) {
      // No applicable transition — evaluate acceptance
      if (isAccepted(this.pda, cfg, this.pda.acceptanceCriterion)) {
        this.status = 'accepted';
      } else {
        this.status = cfg.inputPos >= cfg.input.length ? 'rejected' : 'stuck';
      }
      // Record a "stuck / terminal" step with null transition
      const { explanation, technicalExplanation } = buildExplanation(this.pda, cfg, null, null);
      this.steps.push({
        stepNumber: cfg.stepNumber,
        configBefore: cloneConfig(cfg),
        configAfter: cloneConfig(cfg),
        transitionApplied: null,
        explanation,
        technicalExplanation,
      });
      return false;
    }

    const nextCfg = applyTransition(cfg, transition);
    const { explanation, technicalExplanation } = buildExplanation(this.pda, cfg, transition, nextCfg);

    this.steps.push({
      stepNumber: cfg.stepNumber + 1,
      configBefore: cloneConfig(cfg),
      configAfter: cloneConfig(nextCfg),
      transitionApplied: transition,
      explanation,
      technicalExplanation,
    });

    this.configs.push(nextCfg);
    this.status = 'running';

    // Check if the new config is immediately terminal (input consumed, might be accepted)
    this.checkTerminalAfterStep();

    return true;
  }

  private checkTerminalAfterStep(): void {
    const cfg = this.currentConfig;
    const inputConsumed = cfg.inputPos >= cfg.input.length;

    if (inputConsumed) {
      // Check acceptance immediately after consuming all input
      if (isAccepted(this.pda, cfg, this.pda.acceptanceCriterion)) {
        this.status = 'accepted';
        return;
      }

      // There might still be epsilon transitions to fire — don't declare rejected yet
      // The next stepForward call will try to find one; if none, we reject then.
    }
  }

  /** Undo the last transition. Returns false if at the initial config. */
  stepBackward(): boolean {
    if (this.configs.length <= 1) return false;
    this.configs.pop();
    if (this.steps.length > 0) this.steps.pop();
    // Reset status to running (we're back in the simulation)
    this.status = this.configs.length === 1 ? 'idle' : 'running';
    return true;
  }

  /** Reset to initial configuration */
  reset(): void {
    const input = this.configs[0].input;
    this.configs = [this.buildInitialConfig(input)];
    this.steps = [];
    this.status = 'idle';
  }

  /** Run until terminal or step limit */
  runToCompletion(): SimulationResult {
    const epsilonLoopGuard = new Set<string>();

    while (!this.isFinished) {
      const cfg = this.currentConfig;
      const cfgKey = `${cfg.state}|${cfg.inputPos}|${cfg.stack.join(',')}`;

      if (epsilonLoopGuard.has(cfgKey)) {
        this.status = 'step-limit-reached';
        break;
      }
      epsilonLoopGuard.add(cfgKey);

      this.stepForward();

      if (this.currentConfig.stepNumber >= this.maxSteps) {
        this.status = 'step-limit-reached';
        break;
      }
    }

    const finalCfg = this.currentConfig;
    const accepted = this.status === 'accepted';

    return {
      accepted,
      reason: this.buildResultReason(),
      status: this.status,
      steps: [...this.steps],
      finalConfig: cloneConfig(finalCfg),
    };
  }

  private buildResultReason(): string {
    const cfg = this.currentConfig;
    switch (this.status) {
      case 'accepted':
        if (this.pda.acceptanceCriterion === 'final-state') {
          const stateName = this.pda.states.find((s) => s.id === cfg.state)?.name ?? cfg.state;
          return `Input fully consumed in accepting state "${stateName}".`;
        } else {
          return `Input fully consumed with an empty stack.`;
        }
      case 'rejected':
        if (cfg.inputPos >= cfg.input.length) {
          if (this.pda.acceptanceCriterion === 'final-state') {
            const stateName = this.pda.states.find((s) => s.id === cfg.state)?.name ?? cfg.state;
            return `Input fully consumed but final state "${stateName}" is not an accepting state.`;
          } else {
            return `Input fully consumed but the stack is not empty: [${cfg.stack.join(', ')}].`;
          }
        }
        return `No applicable transition in state "${cfg.state}" with remaining input "${remainingInput(cfg)}" and stack top "${stackTop(cfg) ?? '(empty)'}" .`;
      case 'stuck':
        return `The PDA is stuck: no transition applies for state="${cfg.state}", input="${cfg.input[cfg.inputPos] ?? 'end'}", stack-top="${stackTop(cfg) ?? '(empty)'}"`;
      case 'step-limit-reached':
        return `Execution limit of ${this.maxSteps} steps reached. The PDA may be in an infinite loop.`;
      case 'invalid-input':
        return `The input string contains symbols not in the input alphabet.`;
      default:
        return 'Simulation incomplete.';
    }
  }

  /** Compute a full run result WITHOUT side effects (used for batch testing) */
  static runBatch(
    pda: PDADefinition,
    input: string,
    maxSteps = MAX_STEPS_DEFAULT
  ): SimulationResult {
    const sim = new PDASimulator(pda, input, maxSteps);
    if (!sim.validateInput()) {
      return {
        accepted: false,
        reason: 'Input contains symbols not in the input alphabet.',
        status: 'invalid-input',
        steps: [],
        finalConfig: sim.currentConfig,
      };
    }
    return sim.runToCompletion();
  }
}
