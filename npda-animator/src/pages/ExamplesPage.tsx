import { useState } from 'react';
import { motion } from 'framer-motion';
import { BUILT_IN_EXAMPLES, EXAMPLE_TEST_STRINGS } from '../lib/examples/builtinExamples';
import { useAppStore } from '../hooks/useAppStore';
import type { PDADefinition, PDAState, PDATransition } from '../types/pda';
import { Play, CheckCircle2, XCircle, ArrowRight, Layers, ShieldCheck } from 'lucide-react';

export function ExamplesPage() {
  const { selectPDA, setPage, setInputString } = useAppStore();
  const [selected, setSelected] = useState<PDADefinition>(BUILT_IN_EXAMPLES[0]);

  function openInSimulator(pda: PDADefinition, input?: string) {
    selectPDA(pda);
    if (input !== undefined) setInputString(input);
    setPage('simulator');
  }

  const testStrings = EXAMPLE_TEST_STRINGS[selected.id];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Glossy Sub-Navigation Sidebar */}
      <div style={{
        width: '260px',
        flexShrink: 0,
        borderRight: '1px solid var(--color-border)',
        background: 'rgba(13, 18, 32, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflowY: 'auto',
        padding: '1rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--color-text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 0.5rem 0.4rem',
        }}>
          Canonical Automata
        </div>
        {BUILT_IN_EXAMPLES.map((ex: PDADefinition) => {
          const isSelected = selected.id === ex.id;
          return (
            <button
              key={ex.id}
              className={`nav-link ${isSelected ? 'active' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
              }}
              onClick={() => setSelected(ex)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                <span style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.85rem', color: isSelected ? '#FFFFFF' : 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                  {ex.name}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>
                  {ex.states.length} states • {ex.transitions.length} rules
                </span>
              </div>
              {isSelected && <ArrowRight size={13} color="var(--color-accent-light)" />}
            </button>
          );
        })}
      </div>

      {/* Main Content Pane */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Header Card */}
          <div className="glass-panel" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(21, 29, 46, 0.95) 0%, rgba(13, 18, 32, 0.9) 100%)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    {selected.name}
                  </h2>
                  <span className="badge badge-accent">
                    {selected.acceptanceCriterion === 'final-state' ? 'Final State' : 'Empty Stack'}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', maxWidth: '650px', lineHeight: 1.6 }}>
                  {selected.description}
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => openInSimulator(selected)}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
              >
                <Play size={15} />
                <span>Open in Simulator →</span>
              </button>
            </div>

            {/* Quick Metadata Tokens */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.65rem',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-border-subtle)',
            }}>
              {[
                { label: 'States Q', value: selected.states.map((s: PDAState) => s.name).join(', ') },
                { label: 'Input Σ', value: `{${selected.inputAlphabet.join(', ')}}` },
                { label: 'Stack Γ', value: `{${selected.stackAlphabet.join(', ')}}` },
                { label: 'Bottom Marker Z₀', value: selected.initialStackSymbol },
                { label: 'Start State q₀', value: selected.states.find((s) => s.isInitial)?.name ?? 'q0' },
                { label: 'Transitions δ', value: `${selected.transitions.length} rules` },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(13, 18, 32, 0.6)',
                  border: '1px solid var(--color-border-subtle)',
                }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Strings Section */}
          {testStrings && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.85rem', fontSize: '0.95rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={16} color="var(--color-accent-light)" />
                <span>Verification Test Strings (Click to Simulate)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* Accepted Group */}
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(53, 214, 160, 0.05)',
                  border: '1px solid rgba(53, 214, 160, 0.2)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-success)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={14} />
                    <span>Accepted Strings w ∈ L(M)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {testStrings.accepted.map((s: string) => (
                      <button
                        key={s}
                        className="btn btn-secondary"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.82rem',
                          padding: '0.35rem 0.75rem',
                          borderColor: 'rgba(53, 214, 160, 0.4)',
                          color: 'var(--color-success)',
                          background: 'rgba(53, 214, 160, 0.1)',
                        }}
                        onClick={() => openInSimulator(selected, s)}
                        title={`Load "${s === '' ? 'ε' : s}" in simulator`}
                      >
                        {s === '' ? 'ε (empty)' : `"${s}"`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rejected Group */}
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 100, 124, 0.05)',
                  border: '1px solid rgba(255, 100, 124, 0.2)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-error)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <XCircle size={14} />
                    <span>Rejected Strings w ∉ L(M)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {testStrings.rejected.map((s: string) => (
                      <button
                        key={s}
                        className="btn btn-secondary"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.82rem',
                          padding: '0.35rem 0.75rem',
                          borderColor: 'rgba(255, 100, 124, 0.4)',
                          color: 'var(--color-error)',
                          background: 'rgba(255, 100, 124, 0.1)',
                        }}
                        onClick={() => openInSimulator(selected, s)}
                        title={`Load "${s === '' ? 'ε' : s}" in simulator`}
                      >
                        {s === '' ? 'ε (empty)' : `"${s}"`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transition Rules Table */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="panel-header" style={{ padding: '0.85rem 1.25rem' }}>
              <Layers size={14} color="var(--color-accent-light)" />
              <span>Deterministic Transition Table δ</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="trace-table">
                <thead>
                  <tr>
                    <th>Current State</th>
                    <th>Input Symbol</th>
                    <th>Stack Top</th>
                    <th>Next State</th>
                    <th>Stack Push</th>
                    <th>Formal Mathematical Expression</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.transitions.map((t: PDATransition) => {
                    const fromName = selected.states.find((s: PDAState) => s.id === t.fromState)?.name ?? t.fromState;
                    const toName = selected.states.find((s: PDAState) => s.id === t.toState)?.name ?? t.toState;
                    const inp = !t.inputSymbol || t.inputSymbol === 'ε' ? 'ε' : t.inputSymbol;
                    const push = t.stackPush === '' ? 'ε' : t.stackPush;
                    return (
                      <tr key={t.id}>
                        <td>
                          <span className="badge badge-muted">{fromName}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{inp}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent-light)' }}>{t.stackTopSymbol}</td>
                        <td>
                          <span className="badge badge-accent">{toName}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{push}</td>
                        <td>
                          <span className="transition-notation" style={{ fontSize: '0.78rem' }}>
                            δ({fromName}, {inp}, {t.stackTopSymbol}) = ({toName}, {push})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
