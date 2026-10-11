import type { QuizQuestion } from '../../types/pda';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'What is the formal 7-tuple definition of a Pushdown Automaton?',
    options: [
      { id: 'a', text: 'M = (Q, Σ, Γ, δ, q0, Z0, F)' },
      { id: 'b', text: 'M = (Q, Σ, δ, q0, F)' },
      { id: 'c', text: 'M = (Q, Σ, Γ, δ, q0, F)' },
      { id: 'd', text: 'M = (Q, Σ, Γ, δ, Z0, F)' },
    ],
    correctOptionId: 'a',
    explanation:
      'A PDA is formally defined as M = (Q, Σ, Γ, δ, q0, Z0, F) where Q = states, Σ = input alphabet, Γ = stack alphabet, δ = transition function, q0 = initial state, Z0 = initial stack symbol, F = accepting states.',
    topic: 'Formal Definition',
  },
  {
    id: 'q2',
    type: 'true-false',
    question: 'A Deterministic PDA (DPDA) can recognize every context-free language.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctOptionId: 'false',
    explanation:
      'FALSE. The class of deterministic context-free languages (DCFLs) is a proper subset of context-free languages. For example, the language { ww^R | w ∈ {a,b}* } (palindromes without a center marker) is context-free but cannot be recognized by any DPDA.',
    topic: 'DPDA vs NPDA',
  },
  {
    id: 'q3',
    type: 'multiple-choice',
    question: 'In a PDA, what does the transition δ(q1, a, X) = (q2, YZ) mean?',
    options: [
      { id: 'a', text: 'In state q1, reading "a", with X on stack top: move to q2 and replace X with YZ (Y on top)' },
      { id: 'b', text: 'In state q1, reading "a", with X on stack top: move to q2 and push both Y and Z below X' },
      { id: 'c', text: 'In state q1, reading "a", with X on stack top: move to q2, pop Y, push Z' },
      { id: 'd', text: 'In state q1, reading Y, with X on stack top: move to q2 and push Z' },
    ],
    correctOptionId: 'a',
    explanation:
      'The transition δ(q1, a, X) = (q2, YZ) means: in state q1, consuming input "a", with X on top of the stack — move to state q2 and replace X with YZ (where Y becomes the new top of the stack).',
    topic: 'Transition Function',
  },
  {
    id: 'q4',
    type: 'multiple-choice',
    question: 'What is an epsilon (ε) transition in a PDA?',
    options: [
      { id: 'a', text: 'A transition that reads an empty string — no input symbol is consumed' },
      { id: 'b', text: 'A transition that empties the stack' },
      { id: 'c', text: 'A transition that goes to the initial state' },
      { id: 'd', text: 'A transition that pushes nothing onto the stack' },
    ],
    correctOptionId: 'a',
    explanation:
      'An ε-transition fires without consuming any input symbol. It allows the PDA to change state and/or manipulate the stack without reading from the tape.',
    topic: 'Epsilon Transitions',
  },
  {
    id: 'q5',
    type: 'true-false',
    question: 'For a DPDA, an ε-transition and an input-consuming transition can both be defined for the same state and stack-top symbol.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctOptionId: 'false',
    explanation:
      'FALSE. For a DPDA to be deterministic, if δ(q, ε, X) is defined, then δ(q, a, X) must be undefined for every input symbol a ∈ Σ. Having both would create non-determinism.',
    topic: 'DPDA Determinism',
  },
  {
    id: 'q6',
    type: 'multiple-choice',
    question: 'Which acceptance criterion requires that the input is fully consumed AND the automaton is in a designated final state?',
    options: [
      { id: 'a', text: 'Acceptance by final state' },
      { id: 'b', text: 'Acceptance by empty stack' },
      { id: 'c', text: 'Acceptance by halt' },
      { id: 'd', text: 'Acceptance by timeout' },
    ],
    correctOptionId: 'a',
    explanation:
      'Acceptance by final state requires the input to be fully consumed and the automaton to be in a state q ∈ F (accepting states). Acceptance by empty stack instead requires the stack to be empty when the input is exhausted.',
    topic: 'Acceptance Criteria',
  },
  {
    id: 'q7',
    type: 'acceptance-predict',
    question: 'Consider a PDA for the language {aⁿbⁿ | n ≥ 1}. Is the string "aabb" accepted?',
    options: [
      { id: 'yes', text: 'Yes — Accepted' },
      { id: 'no', text: 'No — Rejected' },
    ],
    correctOptionId: 'yes',
    explanation:
      '"aabb" has 2 a\'s followed by 2 b\'s, so n=2. It belongs to the language {aⁿbⁿ | n ≥ 1}. The PDA pushes A for each \'a\' and pops A for each \'b\', ending with only the bottom marker on the stack — ACCEPTED.',
    topic: 'Language Recognition',
  },
  {
    id: 'q8',
    type: 'acceptance-predict',
    question: 'Consider a PDA for the language {aⁿbⁿ | n ≥ 0}. Is the string "abab" accepted?',
    options: [
      { id: 'yes', text: 'Yes — Accepted' },
      { id: 'no', text: 'No — Rejected' },
    ],
    correctOptionId: 'no',
    explanation:
      '"abab" is NOT of the form aⁿbⁿ because it interleaves a\'s and b\'s. After reading "ab", the stack is back to just the bottom marker, but there is still "ab" left to read. The second "a" cannot be processed correctly — REJECTED.',
    topic: 'Language Recognition',
  },
  {
    id: 'q9',
    type: 'stack-ops',
    question: 'A stack currently contains [B, A, A] (B at bottom, A on top). A transition with stackPush = "BA" fires (popping the top A). What does the stack look like afterwards?',
    options: [
      { id: 'a', text: '[B, A, B, A] — B is new top' },
      { id: 'b', text: '[B, A, A, B] — wait, that\'s wrong' },
      { id: 'c', text: '[B, A, A] — stack is unchanged (wrong assumption)' },
      { id: 'd', text: '[B, A, B, A] — A is new top' },
    ],
    correctOptionId: 'd',
    explanation:
      'The stack top (A) is popped, leaving [B, A]. Then "BA" is pushed: first B, then A on top. Final stack from bottom to top: [B, A, B, A] with A on top.',
    topic: 'Stack Operations',
  },
  {
    id: 'q10',
    type: 'true-false',
    question: 'Every regular language can be recognized by a PDA.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctOptionId: 'true',
    explanation:
      'TRUE. Every regular language is also a context-free language (CFL), and every CFL is recognized by some PDA. A PDA can simulate any finite automaton by ignoring its stack.',
    topic: 'PDA vs Finite Automaton',
  },
  {
    id: 'q11',
    type: 'transition-trace',
    question: 'In state q0 with stack [B] and reading "(": which action is correct for a balanced-parentheses PDA?',
    options: [
      { id: 'a', text: 'Push P onto the stack → stack becomes [B, P]' },
      { id: 'b', text: 'Pop B from the stack → stack becomes []' },
      { id: 'c', text: 'Reject immediately' },
      { id: 'd', text: 'Do nothing — no transition applies' },
    ],
    correctOptionId: 'a',
    explanation:
      'Reading an open parenthesis "(" should push a marker P onto the stack to remember that an unmatched "(" exists. The stack grows from [B] to [B, P]. B remains as the bottom sentinel.',
    topic: 'Stack Operations',
  },
  {
    id: 'q12',
    type: 'multiple-choice',
    question: 'Which of the following languages is recognized by a DPDA but NOT by any finite automaton?',
    options: [
      { id: 'a', text: '{ aⁿbⁿ | n ≥ 0 }' },
      { id: 'b', text: '{ aⁿ | n ≥ 0 }' },
      { id: 'c', text: '{ w | w is a palindrome over {a,b} }' },
      { id: 'd', text: '{ ab, ba }' },
    ],
    correctOptionId: 'a',
    explanation:
      '{ aⁿbⁿ | n ≥ 0 } requires counting and comparing — it requires unbounded memory (a stack) and cannot be recognized by any finite automaton. It can, however, be recognized by a DPDA.',
    topic: 'Language Classes',
  },
];
