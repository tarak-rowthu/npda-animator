import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play, GitBranch, Layers, BookOpen, Zap,
  Sparkles, CheckCircle2, ArrowRight, Activity, Cpu
} from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { BUILT_IN_EXAMPLES } from '../lib/examples/builtinExamples';
import type { PDADefinition } from '../types/pda';

function AnimatedAutomaton() {
  const states = [
    { id: 'q0', x: 80,  y: 85, label: 'q0', isAccepting: true },
    { id: 'q1', x: 220, y: 85, label: 'q1', isAccepting: true },
    { id: 'qd', x: 360, y: 85, label: 'dead', isAccepting: false },
  ];

  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 6), 1400);
    return () => clearInterval(id);
  }, []);

  const currentState = step === 0 ? 'q0' : step < 5 ? 'q1' : 'q0';

  return (
    <div className="glass-panel" style={{
      padding: '1.25rem 1.5rem',
      borderRadius: 'var(--radius-xl)',
      background: 'linear-gradient(180deg, rgba(21, 29, 46, 0.95) 0%, rgba(13, 18, 32, 0.9) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow inside preview card */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 141, 255, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Activity size={14} color="var(--color-accent-light)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Live Engine Preview: Balanced Parentheses DPDA
          </span>
        </div>
        <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
          Step {step + 1} / 6
        </span>
      </div>

      <svg width="100%" height="150" viewBox="0 0 440 150" style={{ display: 'block' }}>
        <defs>
          <marker id="hero-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-text-muted)" />
          </marker>
          <marker id="hero-arrow-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-accent-light)" />
          </marker>
          <filter id="hero-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Start arrow */}
        <line x1="30" y1="85" x2="52" y2="85" stroke="var(--color-info)" strokeWidth="2.5" markerEnd="url(#hero-arrow)" />

        {/* q0 -> q1 */}
        <path
          d="M 108,85 L 192,85"
          stroke={step === 1 ? 'var(--color-accent-light)' : 'var(--color-border)'}
          strokeWidth={step === 1 ? 2.5 : 1.5}
          fill="none"
          markerEnd={step === 1 ? 'url(#hero-arrow-active)' : 'url(#hero-arrow)'}
          className={step === 1 ? 'arrow-flow' : undefined}
        />
        <text x="150" y="76" textAnchor="middle" style={{ fontSize: '9.5px', fill: step === 1 ? 'var(--color-accent-light)' : 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          (, Z₀ → P Z₀
        </text>

        {/* q1 self-loop */}
        <path
          d="M 220,57 C 185,15 255,15 220,57"
          stroke={step >= 2 && step <= 4 ? 'var(--color-accent-light)' : 'var(--color-border)'}
          strokeWidth={step >= 2 && step <= 4 ? 2.5 : 1.5}
          fill="none"
          markerEnd={step >= 2 && step <= 4 ? 'url(#hero-arrow-active)' : 'url(#hero-arrow)'}
          className={step >= 2 && step <= 4 ? 'arrow-flow' : undefined}
        />
        <text x="220" y="16" textAnchor="middle" style={{ fontSize: '9.5px', fill: step >= 2 && step <= 4 ? 'var(--color-accent-light)' : 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          (, P → PP  |  ), P → ε
        </text>

        {/* q1 -> dead */}
        <path d="M 248,85 L 332,85" stroke="var(--color-border-subtle)" strokeWidth="1.5" fill="none" markerEnd="url(#hero-arrow)" />
        <text x="290" y="76" textAnchor="middle" style={{ fontSize: '9.5px', fill: 'var(--color-error)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
          ), Z₀ → ⊥
        </text>

        {/* States */}
        {states.map((s) => {
          const isCurr = s.id === currentState;
          return (
            <g key={s.id}>
              {isCurr && (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="37"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="1.5"
                  opacity="0.6"
                  style={{ animation: 'pulse-ring 1.8s infinite' }}
                />
              )}
              {s.isAccepting && (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="33"
                  fill="none"
                  stroke={isCurr ? 'var(--color-accent-light)' : 'var(--color-success)'}
                  strokeWidth="1.5"
                />
              )}
              <circle
                cx={s.x}
                cy={s.y}
                r="28"
                fill={isCurr ? 'rgba(139, 141, 255, 0.25)' : 'rgba(21, 29, 46, 0.85)'}
                stroke={isCurr ? 'var(--color-accent-light)' : s.isAccepting ? 'var(--color-success)' : 'var(--color-border)'}
                strokeWidth={isCurr ? '2.5' : '1.5'}
                filter={isCurr ? 'url(#hero-glow)' : undefined}
              />
              <text
                x={s.x}
                y={s.y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  fill: isCurr ? '#FFFFFF' : 'var(--color-text)',
                }}
              >
                {s.label}
              </text>
            </g>
          );
        })}

        {/* Tape Preview at bottom */}
        {['(', '(', ')', ')'].map((ch, i) => {
          const activeIndex = Math.min(Math.floor(step / 1.5), 3);
          const isCurrentCell = i === activeIndex;
          const isConsumed = i < activeIndex;
          return (
            <g key={i}>
              <rect
                x={12 + i * 40}
                y={124}
                width={36}
                height={20}
                rx="4"
                fill={isCurrentCell ? 'rgba(139, 141, 255, 0.35)' : isConsumed ? 'rgba(13, 18, 32, 0.5)' : 'rgba(21, 29, 46, 0.8)'}
                stroke={isCurrentCell ? 'var(--color-accent-light)' : 'var(--color-border)'}
                strokeWidth={isCurrentCell ? 2 : 1}
              />
              <text
                x={30 + i * 40}
                y={137}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fill: isCurrentCell ? '#FFFFFF' : isConsumed ? 'var(--color-text-dim)' : 'var(--color-text)',
                }}
              >
                {ch}
              </text>
            </g>
          );
        })}
        <text x={185} y={137} dominantBaseline="middle" style={{ fontSize: '11px', fill: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
          ⊣ (end of string)
        </text>
      </svg>
    </div>
  );
}

export function HomePage() {
  const { setPage, selectPDA, setInputString } = useAppStore();
  const [quickInput, setQuickInput] = useState('aabb');

  function goToSimulator(pdaId?: string, customInput?: string) {
    if (pdaId) {
      const pda = BUILT_IN_EXAMPLES.find((e: PDADefinition) => e.id === pdaId);
      if (pda) selectPDA(pda);
    }
    if (customInput !== undefined) {
      setInputString(customInput);
    }
    setPage('simulator');
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3.5vw, 2.5rem)' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* ── Hero Section ── */}
        <section className="glass-panel" style={{
          padding: 'clamp(1.75rem, 4vw, 3rem)',
          borderRadius: 'var(--radius-2xl)',
          background: 'linear-gradient(135deg, rgba(21, 29, 46, 0.92) 0%, rgba(13, 18, 32, 0.95) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Ambient Lighting Gradient Blobs */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            left: '10%',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 141, 255, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-100px',
            right: '5%',
            width: '360px',
            height: '360px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(85, 199, 245, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Academic Lab Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(139, 141, 255, 0.12)',
              border: '1px solid rgba(139, 141, 255, 0.28)',
              boxShadow: 'var(--gloss-highlight-subtle)',
              marginBottom: '1.25rem',
            }}>
              <Sparkles size={13} color="var(--color-accent-light)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent-light)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Automata & Formal Language Laboratory
              </span>
            </div>

            {/* Title & Description */}
            <h1 style={{
              fontSize: 'clamp(1.85rem, 4.5vw, 2.85rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '1rem',
            }}>
              Interactive Deterministic <br />
              <span style={{
                background: 'linear-gradient(135deg, #8B8DFF 0%, #55C7F5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Pushdown Automaton
              </span> Simulation
            </h1>

            <p style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)',
              color: 'var(--color-text-muted)',
              maxWidth: '680px',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}>
              A high-precision visual environment for exploring context-free language recognition.
              Inspect synchronous input tape consumption, LIFO stack operations, state transition graphs, and comprehensive execution traces.
            </p>

            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '2.25rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => goToSimulator()}
                style={{ fontSize: '0.95rem', padding: '0.7rem 1.4rem' }}
              >
                <Play size={18} />
                <span>Start Simulation</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPage('theory')}
                style={{ fontSize: '0.95rem', padding: '0.7rem 1.4rem' }}
              >
                <BookOpen size={18} />
                <span>Learn Theory</span>
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setPage('examples')}
                style={{ fontSize: '0.95rem', padding: '0.7rem 1.2rem', color: 'var(--color-text-muted)' }}
              >
                <Layers size={18} />
                <span>Browse Examples →</span>
              </button>
            </div>

            {/* Live Interactive Preview */}
            <AnimatedAutomaton />
          </div>
        </section>

        {/* ── Quick Test Drive Bar ── */}
        <section className="glass-panel" style={{
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={16} color="var(--color-accent-light)" />
              <span>Quick Test Drive: Canonical aⁿbⁿ Automaton</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              Enter a test string or choose a sample to launch instantly into step-by-step animation.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {['ab', 'aabb', 'aaabbb', 'abb', 'ba'].map((sample) => (
              <button
                key={sample}
                className="btn btn-ghost"
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.3rem 0.6rem',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                }}
                onClick={() => {
                  setQuickInput(sample);
                  goToSimulator('anbn', sample);
                }}
              >
                "{sample}"
              </button>
            ))}
            <button
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
              onClick={() => goToSimulator('anbn', quickInput)}
            >
              Simulate "{quickInput}" →
            </button>
          </div>
        </section>

        {/* ── Core Concepts Grid ── */}
        <section>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.015em' }}>
              Pushdown Automata Architecture
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Core computational primitives extending finite state machines with infinite memory.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              {
                title: 'PDA = FA + LIFO Stack',
                icon: <Layers size={22} color="var(--color-accent-light)" />,
                desc: 'Finite memory is supplemented with an unbounded Last-In First-Out stack. This allows recognizing context-free patterns such as nested brackets and balanced counts.',
              },
              {
                title: 'Deterministic vs Non-det.',
                icon: <GitBranch size={22} color="var(--color-accent-secondary)" />,
                desc: 'A Deterministic PDA (DPDA) admits at most one valid transition per configuration, recognizing deterministic CFLs with linear O(n) parsing efficiency.',
              },
              {
                title: 'Transition Mapping δ',
                icon: <Zap size={22} color="var(--color-warning)" />,
                desc: 'δ(q, a, X) = (p, γ): upon reading symbol a in state q with stack top X, transition to state p and replace X with string γ (or ε to pop).',
              },
              {
                title: 'Acceptance Criteria',
                icon: <CheckCircle2 size={22} color="var(--color-success)" />,
                desc: 'PDAs can accept strings either by Final State (M reaches F after exhausting input) or by Empty Stack (the stack becomes empty after processing w).',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="glass-panel-interactive"
                style={{ padding: '1.25rem' }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: 'var(--gloss-highlight-subtle)',
                }}>
                  {card.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '0.45rem' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {card.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Built-In Automata Showcase ── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.015em' }}>
                Featured Automata Models
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Select a canonical language model to inspect its transition tables and state topology.
              </p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => setPage('examples')}
              style={{ fontSize: '0.82rem', color: 'var(--color-accent-light)' }}
            >
              View Full Gallery ({BUILT_IN_EXAMPLES.length}) →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {BUILT_IN_EXAMPLES.slice(0, 4).map((ex: PDADefinition) => (
              <div
                key={ex.id}
                className="glass-panel-interactive"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onClick={() => goToSimulator(ex.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && goToSimulator(ex.id)}
                aria-label={`Open ${ex.name} simulation`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF' }}>
                      {ex.name}
                    </div>
                    <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                      {ex.acceptanceCriterion === 'final-state' ? 'Final State' : 'Empty Stack'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {ex.description}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Σ: [{ex.inputAlphabet.join(', ')}]
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Γ: [{ex.stackAlphabet.join(', ')}]
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)' }}>
                      {ex.transitions.length} transitions
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.65rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-light)', fontWeight: 600 }}>
                      Open in Simulator
                    </span>
                    <ArrowRight size={14} color="var(--color-accent-light)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Formal 7-Tuple Card ── */}
        <section className="glass-panel" style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(18, 25, 41, 0.7)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <BookOpen size={16} color="var(--color-accent-light)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
              Mathematical 7-Tuple Definition
            </h3>
          </div>
          <div className="math-formula">
            M = (Q, Σ, Γ, δ, q₀, Z₀, F)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginTop: '1rem' }}>
            {[
              { sym: 'Q', name: 'States', desc: 'Finite non-empty set of internal states' },
              { sym: 'Σ', name: 'Input Alphabet', desc: 'Finite alphabet of input tape symbols' },
              { sym: 'Γ', name: 'Stack Alphabet', desc: 'Finite alphabet of allowable stack symbols' },
              { sym: 'δ', name: 'Transition Fn', desc: 'δ : Q × (Σ ∪ {ε}) × Γ → P(Q × Γ*)' },
              { sym: 'q₀', name: 'Start State', desc: 'Initial start state, q₀ ∈ Q' },
              { sym: 'Z₀', name: 'Bottom Marker', desc: 'Initial symbol pre-loaded onto the stack' },
              { sym: 'F', name: 'Final States', desc: 'Subset of accepting states, F ⊆ Q' },
            ].map((item) => (
              <div key={item.sym} style={{
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(13, 18, 32, 0.5)',
                border: '1px solid var(--color-border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginBottom: '0.15rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-accent-light)', fontSize: '0.9rem' }}>
                    {item.sym}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
