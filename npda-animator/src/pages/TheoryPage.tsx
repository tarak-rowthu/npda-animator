import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { markTopicCompleted } from '../lib/storage/storage';
import { useAppStore } from '../hooks/useAppStore';
import { ChevronDown, ChevronRight, CheckCircle2, Compass } from 'lucide-react';

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
        <div className="math-formula">PDA = Finite State Control + Unbounded LIFO Stack</div>
        <p>The stack provides unlimited structured memory. A PDA reads input symbols one at a time, changes state according to a transition function, and simultaneously manipulates the stack by pushing or popping symbols.</p>
        <p style={{ marginTop: '0.75rem' }}>PDAs were introduced by Oettinger (1961) and Evey (1963), and formalized in connection with context-free grammars through the work of Chomsky and Schützenberger.</p>
      </div>
    ),
  },
  {
    id: 'components',
    title: '2. Components of a PDA',
    content: (
      <div>
        <p>A formal PDA consists of seven mathematical components forming a 7-tuple:</p>
        <div style={{ display: 'grid', gap: '0.5rem', margin: '0.75rem 0' }}>
          {[
            { sym: 'Q', full: 'Finite set of states' },
            { sym: 'Σ (Sigma)', full: 'Input alphabet — the set of valid input tape symbols' },
            { sym: 'Γ (Gamma)', full: 'Stack alphabet — symbols permitted to reside on the stack' },
            { sym: 'δ (delta)', full: 'Transition function — maps current state, input, stack top to target state & replacement' },
            { sym: 'q₀', full: 'Unique initial (start) state, q₀ ∈ Q' },
            { sym: 'Z₀', full: 'Initial stack symbol — loaded onto the stack at engine initialization' },
            { sym: 'F', full: 'Set of accepting (final) states, F ⊆ Q (for final-state acceptance)' },
          ].map((item) => (
            <div key={item.sym} style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(13, 18, 32, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
              <code style={{ color: 'var(--color-accent-light)', minWidth: '90px', fontWeight: 800 }}>{item.sym}</code>
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
        <p style={{ marginTop: '0.75rem' }}>The <strong>transition function</strong> is the core program of a PDA:</p>
        <div className="math-formula">δ : Q × (Σ ∪ {'{ε}'}) × Γ → P(Q × Γ*)</div>
        <p style={{ marginTop: '0.75rem' }}>This specifies: given the current state, an optional input symbol (or ε for an epsilon move without advancing the tape read head), and the current top-of-stack symbol, the transition function yields a <em>set</em> of (new state, stack replacement string) pairs. For a deterministic PDA, this set contains at most one element.</p>
        <p style={{ marginTop: '0.75rem' }}>An instantaneous <strong>configuration</strong> (ID) of a PDA is written as a triple (q, w, γ) where:</p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--color-text)', lineHeight: 2 }}>
          <li><strong>q ∈ Q</strong> is the current active state</li>
          <li><strong>w ∈ Σ*</strong> is the unconsumed portion of the input tape</li>
          <li><strong>γ ∈ Γ*</strong> is the current stack contents (leftmost character = top of stack)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'transitions',
    title: '4. States and Transition Functions',
    content: (
      <div>
        <p>A transition <strong>δ(q, a, X) = (q', γ)</strong> designates:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>The automaton is currently in state <code>q</code></li>
          <li>The next symbol under the read head is <code>a</code> (or ε if no tape symbol is consumed)</li>
          <li>The current symbol at the top of the stack is <code>X</code></li>
          <li>The engine shifts to state <code>q'</code></li>
          <li>The top of the stack symbol <code>X</code> is replaced with string <code>γ</code> (leftmost symbol = new top)</li>
        </ul>
        <p>If <code>γ = ε</code>, symbol X is popped. If <code>γ = X</code>, the stack is unchanged. If <code>γ = YX</code>, Y is pushed onto X.</p>
      </div>
    ),
  },
  {
    id: 'stack-ops',
    title: '5. Stack Operations',
    content: (
      <div>
        <p>The stack in a PDA is a strict <strong>Last-In, First-Out (LIFO)</strong> structure. Three fundamental primitive operations occur:</p>
        <div style={{ display: 'grid', gap: '0.65rem', margin: '0.75rem 0' }}>
          {[
            { op: 'PUSH', desc: 'Add one or more symbols to the stack top. Represented by |γ| > 1.', example: 'δ(q, a, X) = (q\', AX) — pushes A on top of X' },
            { op: 'POP', desc: 'Remove the top symbol without replacement.', example: 'δ(q, b, A) = (q\', ε) — pops A from the stack' },
            { op: 'REPLACE', desc: 'Swap the top symbol with a different symbol.', example: 'δ(q, ε, X) = (q\', Y) — replaces X with Y' },
            { op: 'NO-OP', desc: 'Leave the stack top unmodified.', example: 'δ(q, a, X) = (q\', X) — preserves X at stack top' },
          ].map((item) => (
            <div key={item.op} style={{ padding: '0.85rem', background: 'rgba(13, 18, 32, 0.65)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-accent)', borderTop: '1px solid var(--color-border-subtle)', borderRight: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontWeight: 800, color: 'var(--color-accent-light)', marginBottom: '0.25rem' }}>{item.op}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>{item.desc}</div>
              <code style={{ fontSize: '0.8rem', color: 'var(--color-accent-secondary)', background: 'rgba(85, 199, 245, 0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{item.example}</code>
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
        <p>A PDA is <strong>deterministic</strong> if and only if its transition function δ satisfies two formal constraints for every state q ∈ Q and stack symbol X ∈ Γ:</p>
        <div style={{ margin: '0.85rem 0', padding: '1rem 1.25rem', background: 'rgba(255, 100, 124, 0.08)', border: '1px solid rgba(255, 100, 124, 0.25)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-error)' }}>Formal Determinism Axioms</div>
          <ol style={{ marginLeft: '1.25rem', lineHeight: 2, fontSize: '0.88rem' }}>
            <li>For every input symbol a ∈ Σ, |δ(q, a, X)| ≤ 1.</li>
            <li>If δ(q, ε, X) is defined, then δ(q, a, X) MUST be undefined for all a ∈ Σ.</li>
          </ol>
        </div>
        <p>DPDAs recognize the <strong>deterministic context-free languages (DCFLs)</strong>. DCFLs are a proper subclass of CFLs, permitting linear-time parsing essential for computer compilers and language parsers.</p>
      </div>
    ),
  },
  {
    id: 'npda',
    title: '7. Nondeterministic PDA (NPDA)',
    content: (
      <div>
        <p>An <strong>NPDA</strong> permits branching paths where multiple transitions are legal for a given configuration. An input string is accepted if <em>at least one computation branch</em> halts in an accepting configuration.</p>
        <div style={{ margin: '0.85rem 0', padding: '0.85rem', background: 'rgba(13, 18, 32, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
          <strong style={{ color: 'var(--color-accent-light)' }}>Hierarchy: Regular ⊊ DCFL ⊊ CFL (NPDA)</strong>
          <p style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>Unlike finite automata (where DFA ≡ NFA), nondeterminism strictly increases PDA computing capacity.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'final-state',
    title: '8. Acceptance by Final State',
    content: (
      <div>
        <p>Under <strong>final-state acceptance (L(M))</strong>, a string w is accepted if there exists an execution computation from (q₀, w, Z₀) that:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>Fully consumes the input tape (remaining string = ε)</li>
          <li>Reaches an accepting state q ∈ F</li>
          <li>The remaining stack contents do not affect acceptance</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'empty-stack',
    title: '9. Acceptance by Empty Stack',
    content: (
      <div>
        <p>Under <strong>empty-stack acceptance (N(M))</strong>, a string w is accepted if there exists an execution computation from (q₀, w, Z₀) that:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>Fully consumes the input tape (remaining string = ε)</li>
          <li>Pops all symbols until the stack is completely empty (stack = ε)</li>
          <li>The final state does not affect acceptance</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'comparison',
    title: '10. Automata Comparison Matrix',
    content: (
      <div>
        <p>Comparison of computational models across theoretical characteristics:</p>
        <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
          <table className="trace-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Finite Automaton (DFA)</th>
                <th>DPDA</th>
                <th>NPDA</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Memory Auxiliary', 'None (state only)', '1 LIFO Stack', '1 LIFO Stack'],
                ['Branching', 'Deterministic', 'Deterministic', 'Nondeterministic'],
                ['Language Class', 'Regular Languages', 'Deterministic CFL', 'Context-Free (All)'],
                ['Canonical Example', 'a*b*', 'aⁿbⁿ (n ≥ 0)', 'Palindromes w wᴿ'],
                ['Closed under Complement', 'Yes', 'Yes', 'No'],
                ['Parsing Complexity', 'O(n) time', 'O(n) time (LR)', 'O(n³) (CYK)'],
              ].map(([feat, ...vals]) => (
                <tr key={feat}>
                  <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{feat}</td>
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
    title: '11. DCFL vs. CFL Separation',
    content: (
      <div>
        <p>A central theorem in formal language theory:</p>
        <div className="math-formula">DCFL ⊊ CFL</div>
        <p style={{ marginTop: '0.75rem' }}>Languages that are context-free but impossible for any DPDA include:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li>Even-length palindromes: <code>{'{ ww^R | w ∈ {a,b}* }'}</code> without center marker</li>
          <li>Union of counted powers: <code>{'{ aⁿbⁿ | n ≥ 0 } ∪ { aⁿb²ⁿ | n ≥ 0 }'}</code></li>
        </ul>
      </div>
    ),
  },
  {
    id: 'applications',
    title: '12. Practical Applications in Computer Science',
    content: (
      <div>
        <p>Pushdown automata directly underpin real-world computing infrastructure:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li><strong>Programming Language Compilers</strong>: LR(1) and LALR(1) syntax analyzers in GCC, Clang, Rustc, Bison</li>
          <li><strong>Hierarchical Format Parsers</strong>: JSON, XML, HTML document tree matching</li>
          <li><strong>Arithmetic Expression Evaluation</strong>: Shunting-yard algorithm and operator precedence stacks</li>
          <li><strong>Formal Verification</strong>: Safety property checking in software call-stack invariants</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'limitations',
    title: '13. Theoretical Limitations & The Chomsky Hierarchy',
    content: (
      <div>
        <p>Single-stack PDAs cannot recognize languages requiring two independent counting mechanisms:</p>
        <ul style={{ marginLeft: '1.5rem', margin: '0.75rem 0', lineHeight: 2 }}>
          <li><code>{'{ aⁿbⁿcⁿ | n ≥ 0 }'}</code> is context-sensitive (requires a Turing machine)</li>
          <li><code>{'{ ww | w ∈ {a,b}* }'}</code> (string duplication) is non-context-free</li>
          <li>Adding a <strong>second stack</strong> turns a PDA into a model computationally equivalent to a <strong>Turing Machine</strong></li>
        </ul>
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

  const progressPct = Math.round((completed.size / TOPICS.length) * 100);

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '1.75rem 1.25rem', overflowY: 'auto', height: '100%' }}>
      {/* Glossy Header Card */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, rgba(21, 29, 46, 0.95) 0%, rgba(13, 18, 32, 0.9) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Compass size={18} color="var(--color-accent-light)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Academic Curriculum
          </span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '0.45rem' }}>
          Theory of Pushdown Automata
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '640px' }}>
          Master the formal mathematical foundations, 7-tuple specifications, instantaneous descriptions, and language recognition hierarchies.
        </p>

        {/* Learning Mastery Bar */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>Reading Progress</span>
            <span style={{ color: 'var(--color-accent-light)', fontWeight: 700 }}>
              {completed.size} of {TOPICS.length} topics read ({progressPct}%)
            </span>
          </div>
          <div className="progress-bar" style={{ height: '6px' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, var(--color-accent) 0%, var(--color-success) 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Accordion Topics List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {TOPICS.map((topic) => {
          const isOpen = openTopics.has(topic.id);
          const isDone = completed.has(topic.id);

          return (
            <div
              key={topic.id}
              className={`glass-panel ${isOpen ? 'active-topic' : ''}`}
              style={{
                padding: 0,
                overflow: 'hidden',
                borderColor: isOpen ? 'rgba(139, 141, 255, 0.35)' : 'var(--color-border)',
                transition: 'all 0.2s ease',
              }}
            >
              <button
                onClick={() => toggleTopic(topic.id)}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  background: isOpen ? 'rgba(139, 141, 255, 0.08)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--color-text)',
                  transition: 'background 0.15s ease',
                }}
                aria-expanded={isOpen}
              >
                {isDone ? (
                  <CheckCircle2 size={18} color="var(--color-success)" style={{ flexShrink: 0 }} />
                ) : isOpen ? (
                  <ChevronDown size={18} color="var(--color-accent-light)" style={{ flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={18} color="var(--color-text-dim)" style={{ flexShrink: 0 }} />
                )}
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isOpen ? '#FFFFFF' : 'var(--color-text)', flex: 1 }}>
                  {topic.title}
                </span>
                {isDone && (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                    Completed
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: '1.25rem',
                      color: 'var(--color-text)',
                      fontSize: '0.88rem',
                      lineHeight: 1.7,
                      borderTop: '1px solid var(--color-border-subtle)',
                      background: 'rgba(8, 11, 20, 0.35)',
                    }}
                  >
                    {topic.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
