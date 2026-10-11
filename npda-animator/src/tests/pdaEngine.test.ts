import { describe, it, expect } from 'vitest';
import { PDASimulator } from '../lib/simulation-engine/pdaEngine';
import { balancedParensPDA, anbnPDA, markedPalindromePDA } from '../lib/examples/builtinExamples';
import { validatePDA } from '../lib/automaton-validator/validator';
import type { PDADefinition } from '../types/pda';

describe('PDASimulator: Balanced Parentheses PDA', () => {
  it('accepts the empty string ε', () => {
    const res = PDASimulator.runBatch(balancedParensPDA, '');
    expect(res.accepted).toBe(true);
  });

  it('accepts simple pairs "()" and nested "(())"', () => {
    expect(PDASimulator.runBatch(balancedParensPDA, '()').accepted).toBe(true);
    expect(PDASimulator.runBatch(balancedParensPDA, '(())').accepted).toBe(true);
    expect(PDASimulator.runBatch(balancedParensPDA, '()()').accepted).toBe(true);
    expect(PDASimulator.runBatch(balancedParensPDA, '(()())').accepted).toBe(true);
  });

  it('rejects unbalanced parentheses', () => {
    expect(PDASimulator.runBatch(balancedParensPDA, '(').accepted).toBe(false);
    expect(PDASimulator.runBatch(balancedParensPDA, ')').accepted).toBe(false);
    expect(PDASimulator.runBatch(balancedParensPDA, ')(').accepted).toBe(false);
    expect(PDASimulator.runBatch(balancedParensPDA, '(()').accepted).toBe(false);
    expect(PDASimulator.runBatch(balancedParensPDA, '())').accepted).toBe(false);
  });
});

describe('PDASimulator: aⁿbⁿ Language PDA — required acceptance/rejection matrix', () => {
  // Each case pinned from the bug report. The engine must reach the correct
  // verdict based solely on the input it is given — never a previously-seen
  // string from a prior simulation run.

  it('accepts: empty string (n=0)', () => {
    const res = PDASimulator.runBatch(anbnPDA, '');
    expect(res.accepted).toBe(true);
    expect(res.finalConfig.input).toBe('');
  });

  it('accepts: "ab" (n=1)', () => {
    const res = PDASimulator.runBatch(anbnPDA, 'ab');
    expect(res.accepted).toBe(true);
    expect(res.finalConfig.input).toBe('ab');
  });

  it('accepts: "aabb" (n=2)', () => {
    const res = PDASimulator.runBatch(anbnPDA, 'aabb');
    expect(res.accepted).toBe(true);
    expect(res.finalConfig.input).toBe('aabb');
  });

  it('accepts: "aaabbb" (n=3)', () => {
    const res = PDASimulator.runBatch(anbnPDA, 'aaabbb');
    expect(res.accepted).toBe(true);
    expect(res.finalConfig.input).toBe('aaabbb');
  });

  it('rejects: "abb" (extra b)', () => {
    const res = PDASimulator.runBatch(anbnPDA, 'abb');
    expect(res.accepted).toBe(false);
    // The engine must have processed "abb", NOT any previous input
    expect(res.finalConfig.input).toBe('abb');
  });

  it('rejects: "aab" (missing b)', () => {
    const res = PDASimulator.runBatch(anbnPDA, 'aab');
    expect(res.accepted).toBe(false);
    expect(res.finalConfig.input).toBe('aab');
  });

  it('rejects: "abab" (interleaved)', () => {
    const res = PDASimulator.runBatch(anbnPDA, 'abab');
    expect(res.accepted).toBe(false);
    expect(res.finalConfig.input).toBe('abab');
  });

  it('rejects: "ba" (reversed order)', () => {
    const res = PDASimulator.runBatch(anbnPDA, 'ba');
    expect(res.accepted).toBe(false);
    expect(res.finalConfig.input).toBe('ba');
  });
});

describe('PDASimulator: aⁿbⁿ Language PDA — legacy acceptance/rejection tests', () => {
  it('accepts valid aⁿbⁿ strings', () => {
    expect(PDASimulator.runBatch(anbnPDA, '').accepted).toBe(true);
    expect(PDASimulator.runBatch(anbnPDA, 'ab').accepted).toBe(true);
    expect(PDASimulator.runBatch(anbnPDA, 'aabb').accepted).toBe(true);
    expect(PDASimulator.runBatch(anbnPDA, 'aaabbb').accepted).toBe(true);
  });

  it('rejects mismatched a/b counts or incorrect ordering', () => {
    expect(PDASimulator.runBatch(anbnPDA, 'a').accepted).toBe(false);
    expect(PDASimulator.runBatch(anbnPDA, 'b').accepted).toBe(false);
    expect(PDASimulator.runBatch(anbnPDA, 'ba').accepted).toBe(false);
    expect(PDASimulator.runBatch(anbnPDA, 'aab').accepted).toBe(false);
    expect(PDASimulator.runBatch(anbnPDA, 'abb').accepted).toBe(false);
  });
});

describe('PDASimulator: input-synchronisation regression guard', () => {
  // Regression: a new PDASimulator must always process exactly the input
  // it was constructed with, regardless of what other simulators existed.
  // This guards against the "displays abb but processes aabb" class of bug
  // where a stale simulator object is reused after the input field changes.

  it('each runBatch call processes its own input independently', () => {
    // Run "aabb" first — this MUST NOT contaminate a later run of "abb"
    const r1 = PDASimulator.runBatch(anbnPDA, 'aabb');
    expect(r1.accepted).toBe(true);
    expect(r1.finalConfig.input).toBe('aabb');

    const r2 = PDASimulator.runBatch(anbnPDA, 'abb');
    expect(r2.accepted).toBe(false);
    expect(r2.finalConfig.input).toBe('abb'); // must not silently use 'aabb'
  });

  it('two PDASimulator instances for different inputs are fully independent', () => {
    const simAabb = new PDASimulator(anbnPDA, 'aabb');
    const simAbb  = new PDASimulator(anbnPDA, 'abb');

    const r1 = simAabb.runToCompletion();
    const r2 = simAbb.runToCompletion();

    expect(r1.accepted).toBe(true);
    expect(r1.finalConfig.input).toBe('aabb');

    expect(r2.accepted).toBe(false);
    expect(r2.finalConfig.input).toBe('abb');
  });

  it('resetting a simulator rebuilds with the same original input', () => {
    const sim = new PDASimulator(anbnPDA, 'aabb');
    sim.runToCompletion();
    sim.reset();
    // After reset the engine is back to step 0 with the same input
    expect(sim.currentConfig.input).toBe('aabb');
    expect(sim.currentConfig.inputPos).toBe(0);
    expect(sim.currentConfig.stepNumber).toBe(0);
    expect(sim.currentStatus).toBe('idle');
  });
});

describe('PDASimulator: Marked Palindrome wcwᴿ PDA', () => {
  it('accepts marked palindromes', () => {
    expect(PDASimulator.runBatch(markedPalindromePDA, 'c').accepted).toBe(true);
    expect(PDASimulator.runBatch(markedPalindromePDA, 'aca').accepted).toBe(true);
    expect(PDASimulator.runBatch(markedPalindromePDA, 'bcb').accepted).toBe(true);
    expect(PDASimulator.runBatch(markedPalindromePDA, 'abcba').accepted).toBe(true);
  });

  it('rejects non-palindromes or strings without marker', () => {
    expect(PDASimulator.runBatch(markedPalindromePDA, 'a').accepted).toBe(false);
    expect(PDASimulator.runBatch(markedPalindromePDA, 'ab').accepted).toBe(false);
    expect(PDASimulator.runBatch(markedPalindromePDA, 'abb').accepted).toBe(false);
  });
});

describe('PDASimulator: Interactive Step Controls', () => {
  it('supports stepForward and stepBackward reversibility', () => {
    const sim = new PDASimulator(balancedParensPDA, '()');
    expect(sim.currentConfig.state).toBe('q0');
    expect(sim.currentConfig.stack).toEqual(['B']);

    // Step 1: read '('
    const step1 = sim.stepForward();
    expect(step1).not.toBeNull();
    expect(sim.currentConfig.state).toBe('q1');
    expect(sim.currentConfig.stack).toEqual(['B', 'P']);

    // Step 2: read ')'
    const step2 = sim.stepForward();
    expect(step2).not.toBeNull();
    expect(sim.currentConfig.stack).toEqual(['B']);

    // Step backward back to step 1
    const back1 = sim.stepBackward();
    expect(back1).not.toBeNull();
    expect(sim.currentConfig.stack).toEqual(['B', 'P']);
    expect(sim.currentConfig.inputPos).toBe(1);

    // Step backward to step 0
    const back0 = sim.stepBackward();
    expect(back0).not.toBeNull();
    expect(sim.currentConfig.stack).toEqual(['B']);
    expect(sim.currentConfig.inputPos).toBe(0);
  });
});

describe('Automaton Validator: Determinism and Soundness', () => {
  it('validates all built-in PDAs as valid deterministic PDAs', () => {
    expect(validatePDA(balancedParensPDA).valid).toBe(true);
    expect(validatePDA(anbnPDA).valid).toBe(true);
    expect(validatePDA(markedPalindromePDA).valid).toBe(true);
  });

  it('detects nondeterministic transitions (duplicate rules for same state/input/stackTop)', () => {
    const nonDetPDA: PDADefinition = {
      ...balancedParensPDA,
      transitions: [
        ...balancedParensPDA.transitions,
        {
          id: 'dup-rule',
          fromState: 'q0',
          toState: 'q_dead',
          inputSymbol: '(',
          stackTopSymbol: 'B',
          stackPush: 'B',
        },
      ],
    };

    const val = validatePDA(nonDetPDA);
    expect(val.valid).toBe(false);
    expect(val.errors.some(e => e.message.includes('Nondeterministic') || e.message.includes('Multiple transitions'))).toBe(true);
  });

  it('rejects input with symbols outside the input alphabet', () => {
    const res = PDASimulator.runBatch(anbnPDA, 'abc');
    expect(res.accepted).toBe(false);
    expect(res.status).toBe('invalid-input');
  });

  it('supports empty-stack acceptance criterion correctly', () => {
    // PDA for aⁿbⁿ accepting by empty stack
    const emptyStackPDA: PDADefinition = {
      ...anbnPDA,
      id: 'anbn-empty-stack',
      acceptanceCriterion: 'empty-stack',
      transitions: [
        ...anbnPDA.transitions,
        // When q_acc reaches B, pop B to empty the stack
        { id: 'pop-bottom', fromState: 'q_acc', toState: 'q_acc', inputSymbol: 'ε', stackTopSymbol: 'B', stackPush: '' },
      ],
    };
    expect(PDASimulator.runBatch(emptyStackPDA, 'aabb').accepted).toBe(true);
    expect(PDASimulator.runBatch(emptyStackPDA, 'aab').accepted).toBe(false);
  });
});
