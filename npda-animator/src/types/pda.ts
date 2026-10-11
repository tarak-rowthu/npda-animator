// ============================================================
// Core PDA Type Definitions
// ============================================================

/** A single PDA state */
export interface PDAState {
  id: string;
  name: string;
  isInitial: boolean;
  isAccepting: boolean;
  /** Optional layout position for the diagram */
  position?: { x: number; y: number };
}

/**
 * A PDA transition rule.
 * Convention: stack replacement is written left-to-right as the NEW top of stack goes first.
 * e.g., stackPush = "AZ0" means A is pushed on top of Z0.
 * An empty string "" means POP (replace stack-top with nothing).
 * The special symbol "ε" or "" for inputSymbol means epsilon (no input consumed).
 */
export interface PDATransition {
  id: string;
  fromState: string;         // state id
  toState: string;           // state id
  inputSymbol: string;       // "" or "ε" for epsilon
  stackTopSymbol: string;    // symbol that must be on top of stack
  stackPush: string;         // string to push (left = new top); "" = pop only
}

/** Acceptance criterion */
export type AcceptanceCriterion = 'final-state' | 'empty-stack';

/** Full PDA definition */
export interface PDADefinition {
  id: string;
  name: string;
  description: string;
  states: PDAState[];
  inputAlphabet: string[];    // symbols (single chars or multi-char tokens)
  stackAlphabet: string[];    // symbols including Z0
  initialStackSymbol: string; // e.g. "Z0"
  transitions: PDATransition[];
  acceptanceCriterion: AcceptanceCriterion;
}

// ============================================================
// Simulation Types
// ============================================================

/** A snapshot of the full PDA configuration at a given moment */
export interface SimulationConfig {
  state: string;            // current state id
  input: string;            // full input string
  inputPos: number;         // index of next unread character
  stack: string[];          // stack[stack.length - 1] is the TOP
  stepNumber: number;
}

export type ExecutionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'accepted'
  | 'rejected'
  | 'invalid-input'
  | 'step-limit-reached'
  | 'stuck';                // no applicable transition, not in accepting config

/** One entry in the execution trace */
export interface ExecutionStep {
  stepNumber: number;
  configBefore: SimulationConfig;
  configAfter: SimulationConfig;
  transitionApplied: PDATransition | null;  // null if stuck/accepted/rejected
  explanation: string;                       // human-readable
  technicalExplanation: string;              // formal notation
}

/** Final simulation result */
export interface SimulationResult {
  accepted: boolean;
  reason: string;
  status: ExecutionStatus;
  steps: ExecutionStep[];
  finalConfig: SimulationConfig;
}

// ============================================================
// Animation Event Types (Decoupled Simulation -> Animation Layer)
// ============================================================

export type StackOperationType = 'push' | 'pop' | 'replace' | 'none';

export interface TransitionAnimationEvent {
  id: string;
  stepNumber: number;
  fromState: string;
  toState: string;
  inputSymbolConsumed: string | null;
  isEpsilon: boolean;
  stackBefore: string[];
  stackAfter: string[];
  transitionRule: PDATransition | null;
  operationType: StackOperationType;
  pushedSymbols?: string;
  poppedSymbol?: string;
  status: ExecutionStatus;
  isAccepted: boolean;
  isRejected: boolean;
  isStuck: boolean;
  timestamp: number;
}


// ============================================================
// Validator Types
// ============================================================

export interface ValidationError {
  type: 'determinism' | 'missing-initial' | 'missing-stack-symbol' | 'alphabet' | 'missing-state';
  message: string;
  conflictingTransitions?: string[];  // transition ids
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// ============================================================
// Storage / Dashboard Types
// ============================================================

export interface SimulationRecord {
  id: string;
  pdaId: string;
  pdaName: string;
  inputString: string;
  result: ExecutionStatus;
  stepCount: number;
  timestamp: number;
}

export interface UserProgress {
  simulationsPerformed: number;
  stringsTested: number;
  quizScore: number;
  quizQuestionsAnswered: number;
  recentSimulations: SimulationRecord[];
  savedAutomata: PDADefinition[];
  learningProgress: Record<string, boolean>; // topic id -> completed
}

// ============================================================
// Quiz Types
// ============================================================

export type QuestionType = 'multiple-choice' | 'true-false' | 'transition-trace' | 'stack-ops' | 'acceptance-predict';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  topic: string;
}
