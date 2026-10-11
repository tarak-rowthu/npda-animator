/**
 * PDA Automaton Validator
 *
 * Checks that a PDA definition is well-formed and, for DPDAs,
 * that the transition function is deterministic.
 *
 * Determinism conditions (formal):
 *   For every state q and stack-top symbol X:
 *   1. There is at most one transition δ(q, a, X) for each input symbol a.
 *   2. If δ(q, ε, X) is defined, then δ(q, a, X) must be undefined for every a ∈ Σ.
 */

import type { PDADefinition, ValidationResult, ValidationError } from '../../types/pda';
import { isEpsilon } from '../simulation-engine/pdaEngine';

export function validatePDA(pda: PDADefinition): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // 1. Must have exactly one initial state
  const initialStates = pda.states.filter((s) => s.isInitial);
  if (initialStates.length === 0) {
    errors.push({ type: 'missing-initial', message: 'No initial state is defined.' });
  } else if (initialStates.length > 1) {
    errors.push({
      type: 'missing-initial',
      message: `Multiple initial states defined: ${initialStates.map((s) => s.name).join(', ')}. A PDA may have only one initial state.`,
    });
  }

  // 2. Initial stack symbol must be in stack alphabet
  if (!pda.stackAlphabet.includes(pda.initialStackSymbol)) {
    errors.push({
      type: 'missing-stack-symbol',
      message: `Initial stack symbol "${pda.initialStackSymbol}" is not in the stack alphabet [${pda.stackAlphabet.join(', ')}].`,
    });
  }

  // 3. All transition state references must be valid
  const stateIds = new Set(pda.states.map((s) => s.id));
  for (const t of pda.transitions) {
    if (!stateIds.has(t.fromState)) {
      errors.push({ type: 'missing-state', message: `Transition "${t.id}" references unknown state "${t.fromState}".` });
    }
    if (!stateIds.has(t.toState)) {
      errors.push({ type: 'missing-state', message: `Transition "${t.id}" references unknown state "${t.toState}".` });
    }
  }

  // 4. All transition symbols must be in the respective alphabets
  for (const t of pda.transitions) {
    if (!isEpsilon(t.inputSymbol) && !pda.inputAlphabet.includes(t.inputSymbol)) {
      errors.push({
        type: 'alphabet',
        message: `Transition "${t.id}" uses input symbol "${t.inputSymbol}" which is not in the input alphabet [${pda.inputAlphabet.join(', ')}].`,
      });
    }
    if (!pda.stackAlphabet.includes(t.stackTopSymbol)) {
      errors.push({
        type: 'alphabet',
        message: `Transition "${t.id}" reads stack symbol "${t.stackTopSymbol}" which is not in the stack alphabet [${pda.stackAlphabet.join(', ')}].`,
      });
    }
    // Each character of stackPush must be in stack alphabet
    for (const ch of t.stackPush) {
      if (!pda.stackAlphabet.includes(ch)) {
        errors.push({
          type: 'alphabet',
          message: `Transition "${t.id}" pushes symbol "${ch}" which is not in the stack alphabet [${pda.stackAlphabet.join(', ')}].`,
        });
      }
    }
  }

  // 5. Determinism check
  // Group transitions by (fromState, stackTopSymbol)
  const groups = new Map<string, typeof pda.transitions[0][]>();
  for (const t of pda.transitions) {
    const key = `${t.fromState}::${t.stackTopSymbol}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  for (const [key, transitions] of groups) {
    const [stateId, stackTop] = key.split('::');
    const stateName = pda.states.find((s) => s.id === stateId)?.name ?? stateId;

    const epsilonTransitions = transitions.filter((t) => isEpsilon(t.inputSymbol));
    const nonEpsilonTransitions = transitions.filter((t) => !isEpsilon(t.inputSymbol));

    // 5a. Multiple epsilon transitions for same (state, stack-top)
    if (epsilonTransitions.length > 1) {
      errors.push({
        type: 'determinism',
        message: `Non-determinism: Multiple ε-transitions from state "${stateName}" with stack-top "${stackTop}": ${epsilonTransitions.map((t) => t.id).join(', ')}.`,
        conflictingTransitions: epsilonTransitions.map((t) => t.id),
      });
    }

    // 5b. Epsilon transition conflicts with a non-epsilon transition on same (state, stack-top)
    if (epsilonTransitions.length > 0 && nonEpsilonTransitions.length > 0) {
      const ids = [...epsilonTransitions, ...nonEpsilonTransitions].map((t) => t.id);
      errors.push({
        type: 'determinism',
        message: `Non-determinism: State "${stateName}" with stack-top "${stackTop}" has both an ε-transition and input-consuming transition(s). These conflict: ${ids.join(', ')}.`,
        conflictingTransitions: ids,
      });
    }

    // 5c. Multiple transitions on same (state, input symbol, stack-top)
    const inputGroups = new Map<string, typeof pda.transitions[0][]>();
    for (const t of nonEpsilonTransitions) {
      if (!inputGroups.has(t.inputSymbol)) inputGroups.set(t.inputSymbol, []);
      inputGroups.get(t.inputSymbol)!.push(t);
    }
    for (const [sym, ts] of inputGroups) {
      if (ts.length > 1) {
        errors.push({
          type: 'determinism',
          message: `Non-determinism: Multiple transitions from state "${stateName}" on input "${sym}" with stack-top "${stackTop}": ${ts.map((t) => t.id).join(', ')}.`,
          conflictingTransitions: ts.map((t) => t.id),
        });
      }
    }
  }

  // Warnings
  if (pda.states.filter((s) => s.isAccepting).length === 0 && pda.acceptanceCriterion === 'final-state') {
    warnings.push('No accepting states are defined. The PDA will never accept by final-state criterion.');
  }

  if (pda.transitions.length === 0) {
    warnings.push('The PDA has no transitions defined.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
