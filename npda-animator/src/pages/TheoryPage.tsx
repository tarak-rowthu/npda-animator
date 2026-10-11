import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { markTopicCompleted } from '../lib/storage/storage';
import { useAppStore } from '../hooks/useAppStore';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  content: React.ReactNode;
}

const TOPICS: Topic[] = [
  {
    id: 'intro',
    title: '1. Introduction to Pushdown Automata',
    content: (
      <div>
        <p>A <strong>Pushdown Automaton (PDA)</strong> is a computational model that extends a finite automaton with an auxiliary stack memory. PDAs can recognize the class of <em>context-free languages (CFLs)</em>, which strictly includes the regular languages recognized by finite automata.</p>
        <div className="math-formula" style={{ margin: '1rem 0' }}>PDA = Finite Automaton + Stack</div>
        <p>The stack provides unlimited (but structured) memory. A PDA reads input symbols one at a time, changes state according to a transition function, and simultaneously manipulates the stack by pushing or popping symbols.</p>
        <p style={{ marginTop: '0.75rem' }}>PDAs were introduced by Oettinger (1961) and Evey (1963), and formalized in connection with context-free grammars through the work of Chomsky and others.</p>
      </div>
    ),
  },
  {
    id: 'components',
    title: '2. Components of a PDA',
    content: (
      <div>
        <p>A PDA consists of seven components:</p>
        <div style={{ display: 'grid', gap: '0.5rem', margin: '0.75rem 0' }}>
          {[
            { sym: 'Q', full: 'Finite set of states' },
            { sym: 'Σ (Sigma)', full: 'Input alphabet — the set of valid input symbols' },
            { sym: 'Γ (Gamma)', full: 'Stack alphabet — symbols that may appear on the stack' },
            { sym: 'δ (delta)', full: 'Transition function — the "program" of the PDA' },
            { sym: 'q₀', full: 'The unique initial (start) state' },
            { sym: 'Z₀', full: 'The initial stack symbol — loaded onto the stack at the start' },
            { sym: 'F', full: 'The set of accepting (final) states (used for final-state acceptance)' },
          ].map((item) => (
            <div key={item.sym} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <code style={{ color: 'var(--color-accent-light)', minWidth: '80px', fontWeight: 700 }}>{item.sym}</code>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{item.full}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'formal-def',
    title: '3. Formal Definition of a PDA',
    content: (
      <div>
        <div className="math-formula">M = (Q, Σ, Γ, δ, q₀, Z₀, F)</div>
        <p style={{ marginTop: '0.75rem' }}>The <strong>transition function</strong> is the core of a PDA:</p>
        <div className="math-formula">δ : Q × (Σ ∪ {'{ε}'}) × Γ → P(Q × Γ*)</div>
        <p style={{ marginTop: '0.75rem' }}>This means: given a current state, an optional input symbol (or ε for epsilon), and the current top-of-stack symbol, the transition function returns a <em>set</em> of (new state, stack replacement string) pairs. For a deterministic PDA, this set has at most one element.</p>
        <p style={{ marginTop: '0.75rem' }}>A <strong>configuration</strong> of a PDA is a triple (q, w, γ) where:</p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--color-text)', lineHeight: 2 }}>
          <li>q ∈ Q is the current state</li>
          <li>w ∈ Σ* is the remaining unread input</li>
          <li>γ ∈ Γ* is the current stack contents (leftmost = top)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'transitions',
    title: '4. States and Transition Functions',
    content: (
      <div>
        <p>A transition <strong>δ(q, a, X) = (q', γ)</strong> means:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>The PDA is in state <code>q</code></li>
          <li>The next input symbol is <code>a</code> (or ε if no input is consumed)</li>
          <li>The top of the stack is <code>X</code></li>
          <li>The PDA moves to state <code>q'</code></li>
          <li>The top of the stack is replaced with the string <code>γ</code> (leftmost = new top)</li>
        </ul>
        <p>If <code>γ = ε</code>, the stack top is simply popped. If <code>γ = X</code>, the stack is unchanged. If <code>γ = YX</code>, Y is pushed on top of X.</p>
      </div>
    ),
  },
  {
    id: 'stack-ops',
    title: '5. Stack Operations',
    content: (
      <div>
        <p>The stack in a PDA is a <strong>Last-In, First-Out (LIFO)</strong> data structure. Three primitive operations occur during transitions:</p>
        <div style={{ display: 'grid', gap: '0.5rem', margin: '0.75rem 0' }}>
          {[
            { op: 'PUSH', desc: 'Add a symbol to the top of the stack. Represented by γ having more symbols than X alone.', example: 'δ(q, a, X) = (q\', AX) — pushes A on top of X' },
            { op: 'POP', desc: 'Remove the top symbol without adding anything.', example: 'δ(q, b, A) = (q\', ε) — pops A' },
            { op: 'REPLACE', desc: 'Replace the top symbol with another (or multiple).', example: 'δ(q, ε, X) = (q\', Y) — replaces X with Y' },
            { op: 'NO-OP', desc: 'Leave the stack unchanged.', example: 'δ(q, a, X) = (q\', X) — stack is unchanged' },
          ].map((item) => (
            <div key={item.op} style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-accent)' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-accent-light)', marginBottom: '0.25rem' }}>{item.op}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>{item.desc}</div>
              <code style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.example}</code>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'dpda',
    title: '6. Deterministic PDA (DPDA)',
    content: (
      <div>
        <p>A PDA is <strong>deterministic</strong> if and only if its transition function satisfies two conditions for every state q and stack-top symbol X:</p>
        <div style={{ margin: '0.75rem 0', padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-error)' }}>Determinism Conditions</div>
          <ol style={{ marginLeft: '1.5rem', lineHeight: 2, fontSize: '0.9rem' }}>
            <li>For each input symbol a, at most one transition δ(q, a, X) is defined.</li>
            <li>If δ(q, ε, X) is defined, then δ(q, a, X) must be <em>undefined</em> for every a ∈ Σ.</li>
          </ol>
        </div>
        <p>DPDAs recognize the <strong>deterministic context-free languages (DCFLs)</strong>, which are a proper subset of all CFLs. DCFLs include languages like {'{ aⁿbⁿ | n ≥ 0 }'} and balanced parentheses, but NOT palindromes over a two-symbol alphabet (without a center marker).</p>
      </div>
    ),
  },
  {
    id: 'npda',
    title: '7. Nondeterministic PDA (NPDA)',
    content: (
      <div>
        <p>An <strong>NPDA</strong> may have multiple applicable transitions for the same configuration. Acceptance is by <em>existence</em>: a string is accepted if <em>at least one</em> sequence of choices leads to acceptance.</p>
        <p style={{ marginTop: '0.75rem' }}>NPDAs are strictly more powerful than DPDAs. They recognize exactly the class of <strong>context-free languages</strong>. For example, the palindrome language {'{w ∈ {a,b}* | w = wᴿ}'} requires an NPDA (it cannot be recognized by any DPDA).</p>
        <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
          <strong>DPDA ⊂ NDPDA = CFL</strong>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>Every DPDA is an NPDA, but not every NPDA has a deterministic equivalent.</p>
        </div>
        <p style={{ color: 'var(--color-warning)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          ⚠ This simulator implements <strong>deterministic</strong> PDA execution. It enforces determinism constraints and will not silently use nondeterministic transitions.
        </p>
      </div>
    ),
  },
  {
    id: 'final-state',
    title: '8. Acceptance by Final State',
    content: (
      <div>
        <p>Under <strong>final-state (accepting state) acceptance</strong>, a string w is accepted if there exists a computation from the initial configuration that:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>Consumes all of w (the tape is fully read)</li>
          <li>Ends in a state q ∈ F (an accepting/final state)</li>
          <li>The stack contents are <em>irrelevant</em></li>
        </ul>
        <p>Most DPDAs are defined with final-state acceptance. This matches the intuition of "the machine has finished in a 'good' state."</p>
      </div>
    ),
  },
  {
    id: 'empty-stack',
    title: '9. Acceptance by Empty Stack',
    content: (
      <div>
        <p>Under <strong>empty-stack acceptance</strong>, a string w is accepted if there exists a computation that:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>Consumes all of w</li>
          <li>Leaves the stack completely empty</li>
          <li>The current state is <em>irrelevant</em></li>
        </ul>
        <p>For NPDAs, the two acceptance criteria are equivalent in expressive power (every language accepted by one criterion is accepted by the other for some modified PDA). However, for DPDAs this equivalence does NOT hold — a language may be accepted by a DPDA under one criterion but not the other.</p>
      </div>
    ),
  },
  {
    id: 'comparison',
    title: '10. PDA vs. Finite Automaton',
    content: (
      <div>
        <p>The fundamental difference is memory:</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="trace-table" style={{ marginTop: '0.75rem' }}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Finite Automaton</th>
                <th>DPDA</th>
                <th>NPDA</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Memory', 'None (finite states only)', 'Unbounded stack', 'Unbounded stack'],
                ['Stack', 'No', 'Yes (single)', 'Yes (single)'],
                ['Transitions', 'Deterministic', 'Deterministic', 'Nondeterministic'],
                ['Language Class', 'Regular', 'Deterministic CFL', 'Context-Free'],
                ['Example Language', 'a*b*', 'aⁿbⁿ', 'Palindromes'],
                ['Closure under ∩', 'Yes', 'No', 'No'],
                ['Closure under complement', 'Yes', 'Yes', 'No'],
              ].map(([feat, ...vals]) => (
                <tr key={feat}>
                  <td style={{ fontWeight: 600 }}>{feat}</td>
                  {vals.map((v, i) => <td key={i}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'dpda-npda',
    title: '11. DPDA vs. NPDA',
    content: (
      <div>
        <p>The key theoretical result is:</p>
        <div className="math-formula">DCFL ⊊ CFL</div>
        <p style={{ marginTop: '0.75rem' }}>The class of deterministic context-free languages is a <strong>proper subset</strong> of context-free languages. Notable separations:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>{'{ ww^R | w ∈ {a,b}* }'} (even-length palindromes) is CFL but NOT DCFL</li>
          <li>{'{ aⁿbⁿ | n ≥ 0 } ∪ { aⁿb²ⁿ | n ≥ 0 }'} is CFL but NOT DCFL</li>
          <li>Balanced parentheses IS DCFL</li>
          <li>{'{ aⁿbⁿ | n ≥ 0 }'} IS DCFL</li>
        </ul>
        <p>DPDAs have important practical applications because they are efficiently parseable (O(n) with LR parsers).</p>
      </div>
    ),
  },
  {
    id: 'applications',
    title: '12. Applications of Pushdown Automata',
    content: (
      <div>
        <p>PDAs are not merely theoretical — they have concrete engineering applications:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li><strong>Parsing programming languages</strong>: LALR and LR parsers (used in GCC, yacc, bison) are based on DPDAs</li>
          <li><strong>XML and HTML validation</strong>: Matching nested tags requires a stack</li>
          <li><strong>Expression evaluation</strong>: Evaluating arithmetic expressions with correct precedence</li>
          <li><strong>Bracket matching</strong>: Checking balanced delimiters in compilers and editors</li>
          <li><strong>Natural language processing</strong>: Parsing context-free grammars in computational linguistics</li>
          <li><strong>Protocol verification</strong>: Checking correctness of communication protocols</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'limitations',
    title: '13. Limitations of Deterministic PDAs',
    content: (
      <div>
        <p>Despite their power over finite automata, DPDAs have notable limitations:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>They cannot recognize all context-free languages (NPDAs are strictly more powerful)</li>
          <li>DCFLs are NOT closed under union, intersection, or concatenation</li>
          <li>DCFLs ARE closed under complement and set difference</li>
          <li>A DPDA can only use a single stack (two stacks ≡ Turing machine)</li>
          <li>They cannot recognize languages requiring two independent counters</li>
          <li>The membership problem is decidable and in P (O(n) for DPDAs)</li>
        </ul>
        <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          <strong>⚠ Common Misconception:</strong> "Every CFL can be recognized by a DPDA." This is FALSE. Only DCFLs can be recognized by DPDAs.
        </div>
      </div>
    ),
  },
];

export function TheoryPage() {
  const { refreshProgress } = useAppStore();
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set(['intro']));
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  function toggleTopic(id: string) {
    setOpenTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!completed.has(id)) {
          setCompleted((c) => new Set([...c, id]));
          markTopicCompleted(id);
          refreshProgress();
        }
      }
      return next;
    });
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Theory of Pushdown Automata</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          A comprehensive guide to PDA theory — from basic concepts to formal definitions and limitations.
        </p>
        <div style={{ marginTop: '0.75rem' }}>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${(completed.size / TOPICS.length) * 100}%` }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {completed.size} of {TOPICS.length} topics read
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {TOPICS.map((topic) => {
          const isOpen = openTopics.has(topic.id);
          const isDone = completed.has(topic.id);

          return (
            <div key={topic.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => toggleTopic(topic.id)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--color-text)',
                }}
                aria-expanded={isOpen}
              >
                {isDone ? (
                  <CheckCircle2 size={16} color="var(--color-success)" />
                ) : isOpen ? (
                  <ChevronDown size={16} color="var(--color-accent-light)" />
                ) : (
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                )}
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{topic.title}</span>
              </button>

              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    padding: '0 1rem 1rem',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '1rem',
                  }}
                >
                  {topic.content}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
