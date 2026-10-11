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

describe('PDASimulator: aⁿbⁿ Language PDA', () => {
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
