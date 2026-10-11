import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, GitBranch, Layers, ChevronRight, BookOpen, Zap } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { BUILT_IN_EXAMPLES } from '../lib/examples/builtinExamples';
import type { PDADefinition } from '../types/pda';

function AnimatedAutomaton() {
  // Simple animated preview showing a state diagram processing "(())"
  const states = [
    { id: 'q0', x: 80,  y: 100, label: 'q0', isAccepting: true  },
    { id: 'q1', x: 220, y: 100, label: 'q1', isAccepting: true  },
    { id: 'qd', x: 360, y: 100, label: 'dead', isAccepting: false },
  ];

  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 6), 1200);
    return () => clearInterval(id);
  }, []);

  const currentState = step === 0 ? 'q0' : 'q1';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.5rem',
      overflow: 'hidden',
    }}>
      <svg width="100%" height="160" viewBox="0 0 440 160" style={{ display: 'block' }}>
        <defs>
          <marker id="hero-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-text-muted)" />
          </marker>
          <filter id="hero-glow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Initial arrow */}
        <line x1="30" y1="100" x2="52" y2="100" stroke="var(--color-info)" strokeWidth="2" markerEnd="url(#hero-arrow)" />

        {/* q0 -> q1 */}
        <path d="M 108,100 L 192,100" stroke="var(--color-text-muted)" strokeWidth="1.5" fill="none" markerEnd="url(#hero-arrow)" />
        <text x="150" y="92" textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--color-text-muted)', fontFamily: 'monospace' }}>(,B→PB</text>

        {/* q1 self-loop */}
        <path d="M 220,72 C 185,30 255,30 220,72" stroke="var(--color-text-muted)" strokeWidth="1.5" fill="none" markerEnd="url(#hero-arrow)" />
        <text x="220" y="22" textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--color-text-muted)', fontFamily: 'monospace' }}>(,P→PP / ),P→ε</text>

        {/* q1 -> dead */}
        <path d="M 248,100 L 332,100" stroke="var(--color-text-muted)" strokeWidth="1.5" fill="none" markerEnd="url(#hero-arrow)" />
        <text x="290" y="92" textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--color-error)', fontFamily: 'monospace' }}>),B→err</text>

        {/* States */}
        {states.map((s) => {
          const isCurr = s.id === currentState;
          return (
            <g key={s.id}>
              {isCurr && (
                <circle cx={s.x} cy={s.y} r="38" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.4"
                  style={{ animation: 'pulse-ring 1.5s infinite' }} />
              )}
              {s.isAccepting && (
                <circle cx={s.x} cy={s.y} r="33" fill="none"
                  stroke={isCurr ? 'var(--color-accent)' : 'var(--color-success)'} strokeWidth="1.5" />
              )}
              <circle cx={s.x} cy={s.y} r="28"
                fill={isCurr ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-2)'}
                stroke={isCurr ? 'var(--color-accent)' : s.isAccepting ? 'var(--color-success)' : 'var(--color-border)'}
                strokeWidth="2"
                filter={isCurr ? 'url(#hero-glow)' : undefined}
              />
              <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', fill: isCurr ? 'var(--color-accent-light)' : 'var(--color-text)' }}>
                {s.label}
              </text>
            </g>
          );
        })}

        {/* Input tape preview */}
        {['(', '(', ')', ')'].map((ch, i) => (
          <g key={i}>
            <rect x={8 + i * 38} y={138} width={36} height={18} rx="3"
              fill={i < step / 1.5 ? 'var(--color-surface-2)' : i === Math.floor(step / 1.5) ? 'rgba(99,102,241,0.3)' : 'var(--color-surface)'}
              stroke="var(--color-border)" strokeWidth="1.5" />
            <text x={26 + i * 38} y={150} textAnchor="middle"
              style={{ fontSize: '11px', fontFamily: 'monospace', fill: 'var(--color-text)', fontWeight: 600 }}>
              {ch}
            </text>
          </g>
        ))}
        <text x={163} y={150} textAnchor="middle" style={{ fontSize: '11px', fill: 'var(--color-text-muted)', fontFamily: 'monospace' }}>⊣</text>
      </svg>
    </div>
  );
}

export function HomePage() {
  const { setPage, selectPDA } = useAppStore();

  function goToSimulator(pdaId?: string) {
    if (pdaId) {
      const pda = BUILT_IN_EXAMPLES.find((e: PDADefinition) => e.id === pdaId);
      if (pda) selectPDA(pda);
    }
    setPage('simulator');
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      {/* Hero */}
      <section style={{
        padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 3rem)',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '48px', height: '48px',
              background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <GitBranch size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent-light)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Interactive Educational Tool
              </div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
                N-PDA Animator
              </h1>
            </div>
          </div>

          <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '600px', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            An Interactive Deterministic Pushdown Automaton Simulation and Language Recognition Tool.
            Visualize stack operations, trace transitions step by step, and understand how PDAs recognize context-free languages.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <button className="btn btn-primary" onClick={() => goToSimulator()} style={{ fontSize: '0.95rem', padding: '0.6rem 1.25rem' }}>
              <Play size={18} /> Start Simulation
            </button>
            <button className="btn btn-secondary" onClick={() => setPage('theory')} style={{ fontSize: '0.95rem', padding: '0.6rem 1.25rem' }}>
              <BookOpen size={18} /> Learn the Concepts
            </button>
            <button className="btn btn-secondary" onClick={() => setPage('examples')} style={{ fontSize: '0.95rem', padding: '0.6rem 1.25rem' }}>
              <Layers size={18} /> Explore Examples
            </button>
          </div>
        </motion.div>

        {/* Animated preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Preview — Balanced Parentheses PDA
          </div>
          <AnimatedAutomaton />
        </motion.div>

        {/* Concept cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
            What is a Pushdown Automaton?
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              {
                title: 'PDA = FA + Stack',
                icon: <Layers size={20} />,
                desc: 'A PDA extends a finite automaton with an unbounded stack, enabling it to recognize context-free languages — impossible for finite automata alone.',
              },
              {
                title: 'Stack Memory',
                icon: <Zap size={20} />,
                desc: 'The stack provides a LIFO memory structure. Symbols are pushed (added) and popped (removed) as transitions fire, tracking nested or counted structure.',
              },
              {
                title: 'Transition Function',
                icon: <GitBranch size={20} />,
                desc: 'δ(q, a, X) = (q\', γ) — in state q, reading input a, with X on the stack, move to q\' and replace X with the string γ.',
              },
              {
                title: 'DFA vs PDA',
                icon: <ChevronRight size={20} />,
                desc: 'A DFA recognizes regular languages. A DPDA recognizes deterministic context-free languages — a strictly larger class. An NPDA recognizes all CFLs.',
              },
            ].map((card) => (
              <div key={card.title} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ color: 'var(--color-accent-light)' }}>{card.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{card.title}</div>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Examples preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
            Built-in Examples
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {BUILT_IN_EXAMPLES.map((ex: PDADefinition) => (
              <div
                key={ex.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'border-color 0.15s ease', padding: '1rem' }}
                onClick={() => goToSimulator(ex.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && goToSimulator(ex.id)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                aria-label={`Load ${ex.name} example`}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                  {ex.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {ex.description.slice(0, 100)}…
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-accent">
                    {ex.states.length} states
                  </span>
                  <span className="badge badge-muted">
                    {ex.acceptanceCriterion === 'final-state' ? 'Final State' : 'Empty Stack'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Formal definition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          style={{ marginTop: '2rem' }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>
            Formal Definition
          </h2>
          <div className="math-formula">
            M = (Q, Σ, Γ, δ, q₀, Z₀, F)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
            {[
              { sym: 'Q', desc: 'Finite set of states' },
              { sym: 'Σ', desc: 'Input alphabet' },
              { sym: 'Γ', desc: 'Stack alphabet' },
              { sym: 'δ', desc: 'Transition function' },
              { sym: 'q₀', desc: 'Initial state' },
              { sym: 'Z₀', desc: 'Initial stack symbol' },
              { sym: 'F', desc: 'Set of accepting states' },
            ].map((item) => (
              <div key={item.sym} style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-light)', fontWeight: 700, minWidth: '1.5rem' }}>{item.sym}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>— {item.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
