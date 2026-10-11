/**
 * Built-in PDA examples.
 * All transition IDs are stable strings for reproducibility.
 */

import type { PDADefinition } from '../../types/pda';

// ── Example 1: Balanced Parentheses ──────────────────────────────────────────
// Language: { w ∈ {(,)}* | w is balanced }
// Acceptance: final state
export const balancedParensPDA: PDADefinition = {
  id: 'balanced-parens',
  name: 'Balanced Parentheses',
  description:
    'Recognizes balanced parentheses: { w ∈ {(,)}* | parentheses in w are balanced }. ' +
    'Uses final-state acceptance. Stack symbol B marks the bottom; P marks each unmatched open paren.',
  states: [
    { id: 'q0', name: 'q0', isInitial: true,  isAccepting: true,  position: { x: 100, y: 200 } },
    { id: 'q1', name: 'q1', isInitial: false, isAccepting: false, position: { x: 350, y: 200 } },
    { id: 'q_dead', name: 'q_dead', isInitial: false, isAccepting: false, position: { x: 550, y: 300 } },
  ],
  inputAlphabet: ['(', ')'],
  stackAlphabet: ['B', 'P'],
  initialStackSymbol: 'B',
  transitions: [
    // From q0: reading '(' with bottom B -> go to q1, push P on top of B
    { id: 'bp-t1', fromState: 'q0', toState: 'q1', inputSymbol: '(', stackTopSymbol: 'B', stackPush: 'PB' },
    // From q0: reading ')' with bottom B -> unmatched close -> dead state
    { id: 'bp-t2', fromState: 'q0', toState: 'q_dead', inputSymbol: ')', stackTopSymbol: 'B', stackPush: 'B' },
    // From q1: reading '(' with P on top -> stay in q1, push another P
    { id: 'bp-t3', fromState: 'q1', toState: 'q1', inputSymbol: '(', stackTopSymbol: 'P', stackPush: 'PP' },
    // From q1: reading ')' with P on top -> pop P (matches one open paren)
    { id: 'bp-t4', fromState: 'q1', toState: 'q1', inputSymbol: ')', stackTopSymbol: 'P', stackPush: '' },
    // From q1: when stack top is B (all opened parens closed), return to q0 via ε
    { id: 'bp-t5', fromState: 'q1', toState: 'q0', inputSymbol: 'ε', stackTopSymbol: 'B', stackPush: 'B' },
  ],
  acceptanceCriterion: 'final-state',
};

// ── Example 2: a^n b^n ───────────────────────────────────────────────────────
// Language: { a^n b^n | n >= 0 }
// Stack alphabet: { B, A }   B = bottom marker, A = counter for 'a'
// States: q0 (start), q1 (reading a's), q2 (reading b's), q_acc (accepting)
// Acceptance: final state

export const anbnPDA: PDADefinition = {
  id: 'anbn',
  name: 'aⁿbⁿ Language',
  description:
    'Recognizes { aⁿbⁿ | n ≥ 0 }. For each "a" read, push A onto the stack. ' +
    'For each "b" read, pop one A. Accept if the stack contains only B when input is consumed.',
  states: [
    { id: 'q0', name: 'q0', isInitial: true,  isAccepting: true,  position: { x: 80,  y: 200 } },
    { id: 'q1', name: 'q1', isInitial: false, isAccepting: false, position: { x: 280, y: 200 } },
    { id: 'q2', name: 'q2', isInitial: false, isAccepting: false, position: { x: 480, y: 200 } },
    { id: 'q_acc', name: 'q_acc', isInitial: false, isAccepting: true, position: { x: 680, y: 200 } },
  ],
  inputAlphabet: ['a', 'b'],
  stackAlphabet: ['B', 'A'],
  initialStackSymbol: 'B',
  transitions: [
    // Empty string (n=0): consume no input, go to accepting
    // Actually q0 is already accepting. Just need to make sure no bad transitions exist.

    // q0: read 'a' with B -> go to q1, push A on top of B
    { id: 'anbn-t1', fromState: 'q0', toState: 'q1', inputSymbol: 'a', stackTopSymbol: 'B', stackPush: 'AB' },

    // q1: read 'a' with A -> stay in q1, push A
    { id: 'anbn-t2', fromState: 'q1', toState: 'q1', inputSymbol: 'a', stackTopSymbol: 'A', stackPush: 'AA' },

    // q1: read 'b' with A -> go to q2, pop A
    { id: 'anbn-t3', fromState: 'q1', toState: 'q2', inputSymbol: 'b', stackTopSymbol: 'A', stackPush: '' },

    // q2: read 'b' with A -> stay in q2, pop A
    { id: 'anbn-t4', fromState: 'q2', toState: 'q2', inputSymbol: 'b', stackTopSymbol: 'A', stackPush: '' },

    // q2: read epsilon (no input left) with B -> go to q_acc
    { id: 'anbn-t5', fromState: 'q2', toState: 'q_acc', inputSymbol: 'ε', stackTopSymbol: 'B', stackPush: 'B' },
  ],
  acceptanceCriterion: 'final-state',
};

// ── Example 3: Even-length palindromes over {a,b} with center marker ────────
// Language: { w c w^R | w ∈ {a,b}*, c is the center marker }
// This IS recognizable by a DPDA because the center is explicitly marked.
// (General palindromes without a center marker require NPDA — noted in the UI.)
// Stack: B = bottom, symbol mirrors

export const markedPalindromePDA: PDADefinition = {
  id: 'marked-palindrome',
  name: 'Marked Palindromes (wcwᴿ)',
  description:
    'Recognizes strings of the form wcwᴿ where w ∈ {a,b}* and c is the center marker. ' +
    'This language IS recognizable by a DPDA because the center is explicitly marked. ' +
    '(General even/odd palindromes over {a,b} without a center marker require an NPDA.)',
  states: [
    { id: 'p0', name: 'p0', isInitial: true,  isAccepting: false, position: { x: 80,  y: 200 } },
    { id: 'p1', name: 'p1', isInitial: false, isAccepting: false, position: { x: 300, y: 200 } },
    { id: 'p_acc', name: 'p_acc', isInitial: false, isAccepting: true, position: { x: 520, y: 200 } },
  ],
  inputAlphabet: ['a', 'b', 'c'],
  stackAlphabet: ['B', 'a', 'b'],
  initialStackSymbol: 'B',
  transitions: [
    // Phase 1 (p0): push input symbols until 'c' is seen
    { id: 'pal-t1', fromState: 'p0', toState: 'p0', inputSymbol: 'a', stackTopSymbol: 'B', stackPush: 'aB' },
    { id: 'pal-t2', fromState: 'p0', toState: 'p0', inputSymbol: 'a', stackTopSymbol: 'a', stackPush: 'aa' },
    { id: 'pal-t3', fromState: 'p0', toState: 'p0', inputSymbol: 'a', stackTopSymbol: 'b', stackPush: 'ab' },
    { id: 'pal-t4', fromState: 'p0', toState: 'p0', inputSymbol: 'b', stackTopSymbol: 'B', stackPush: 'bB' },
    { id: 'pal-t5', fromState: 'p0', toState: 'p0', inputSymbol: 'b', stackTopSymbol: 'a', stackPush: 'ba' },
    { id: 'pal-t6', fromState: 'p0', toState: 'p0', inputSymbol: 'b', stackTopSymbol: 'b', stackPush: 'bb' },
    // See 'c': switch to pop phase
    { id: 'pal-t7', fromState: 'p0', toState: 'p1', inputSymbol: 'c', stackTopSymbol: 'B', stackPush: 'B' },
    { id: 'pal-t8', fromState: 'p0', toState: 'p1', inputSymbol: 'c', stackTopSymbol: 'a', stackPush: 'a' },
    { id: 'pal-t9', fromState: 'p0', toState: 'p1', inputSymbol: 'c', stackTopSymbol: 'b', stackPush: 'b' },
    // Phase 2 (p1): match and pop
    { id: 'pal-t10', fromState: 'p1', toState: 'p1', inputSymbol: 'a', stackTopSymbol: 'a', stackPush: '' },
    { id: 'pal-t11', fromState: 'p1', toState: 'p1', inputSymbol: 'b', stackTopSymbol: 'b', stackPush: '' },
    // Accept when stack has only B and input is done
    { id: 'pal-t12', fromState: 'p1', toState: 'p_acc', inputSymbol: 'ε', stackTopSymbol: 'B', stackPush: 'B' },
  ],
  acceptanceCriterion: 'final-state',
};

// ── All examples export ───────────────────────────────────────────────────────

export const BUILT_IN_EXAMPLES: PDADefinition[] = [
  balancedParensPDA,
  anbnPDA,
  markedPalindromePDA,
];

export const EXAMPLE_TEST_STRINGS: Record<string, { accepted: string[]; rejected: string[] }> = {
  'balanced-parens': {
    accepted: ['', '()', '(())', '()()', '(()())'],
    rejected: ['(', ')', '(()', '())(' , '(()))'],
  },
  'anbn': {
    accepted: ['', 'ab', 'aabb', 'aaabbb'],
    rejected: ['aab', 'abb', 'abab', 'ba', 'aabbb'],
  },
  'marked-palindrome': {
    accepted: ['c', 'aca', 'bcb', 'abcba', 'aabcbaa'],
    rejected: ['abc', 'ac', 'abcab', 'acb'],
  },
};
