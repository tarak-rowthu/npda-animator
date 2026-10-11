import { useState } from 'react';
import { motion } from 'framer-motion';
import { BUILT_IN_EXAMPLES, EXAMPLE_TEST_STRINGS } from '../lib/examples/builtinExamples';
import { useAppStore } from '../hooks/useAppStore';
import { PDASimulator } from '../lib/simulation-engine/pdaEngine';
import type { PDADefinition, PDAState, PDATransition } from '../types/pda';

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
      {/* Sidebar */}
      <div style={{
        width: '220px', flexShrink: 0,
        borderRight: '1px solid var(--color-border)',
        overflowY: 'auto',
        padding: '0.75rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Examples
        </div>
        {BUILT_IN_EXAMPLES.map((ex: PDADefinition) => (
          <button
            key={ex.id}
            className={`nav-link ${selected.id === ex.id ? 'active' : ''}`}
            style={{ width: '100%', marginBottom: '0.125rem', textAlign: 'left' }}
            onClick={() => setSelected(ex)}
          >
            {ex.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                {selected.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '540px' }}>
                {selected.description}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => openInSimulator(selected)}>
              Open in Simulator →
            </button>
          </div>

          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'States', value: selected.states.map((s: PDAState) => s.name).join(', ') },
              { label: 'Input Alphabet', value: `{${selected.inputAlphabet.join(', ')}}` },
              { label: 'Stack Alphabet', value: `{${selected.stackAlphabet.join(', ')}}` },
              { label: 'Initial Stack', value: selected.initialStackSymbol },
              { label: 'Acceptance', value: selected.acceptanceCriterion === 'final-state' ? 'Final State' : 'Empty Stack' },
              { label: 'Transitions', value: `${selected.transitions.length} rules` },
            ].map((item) => (
              <div key={item.label} className="card" style={{ padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text)', marginTop: '0.2rem' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Transitions Table */}
          <div className="card" style={{ padding: 0, marginBottom: '1.5rem' }}>
            <div className="panel-header">Transition Rules</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="trace-table">
                <thead>
                  <tr>
                    <th>Current State</th>
                    <th>Input Symbol</th>
                    <th>Stack Top</th>
                    <th>Next State</th>
                    <th>Stack Push</th>
                    <th>Formal Notation</th>
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
                        <td>{fromName}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{inp}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{t.stackTopSymbol}</td>
                        <td>{toName}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{push}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent-light)' }}>
                          δ({fromName},{inp},{t.stackTopSymbol})=({toName},{push})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test strings */}
          {testStrings && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem' }}>Test Strings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Accepted Strings', strings: testStrings.accepted, color: 'var(--color-success)' },
                  { label: 'Rejected Strings', strings: testStrings.rejected, color: 'var(--color-error)' },
                ].map((group) => (
                  <div key={group.label} className="card" style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: group.color, marginBottom: '0.5rem' }}>
                      {group.label}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {group.strings.map((s: string) => {
                        const result = PDASimulator.runBatch(selected, s);
                        return (
                          <button
                            key={s}
                            className="tag"
                            style={{
                              cursor: 'pointer',
                              borderColor: result.accepted ? 'var(--color-success)' : 'var(--color-error)',
                              color: result.accepted ? 'var(--color-success)' : 'var(--color-error)',
                              background: result.accepted ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                            }}
                            onClick={() => openInSimulator(selected, s)}
                            title={`Run "${s === '' ? 'ε' : s}" in simulator`}
                          >
                            {s === '' ? 'ε' : s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* States info */}
          <div className="card" style={{ padding: '0.75rem' }}>
            <div className="panel-header" style={{ margin: '-0.75rem -0.75rem 0.75rem', padding: '0.5rem 0.75rem' }}>States</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selected.states.map((s: PDAState) => (
                <div key={s.id} style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  border: `2px solid ${s.id === selected.states.find((st: PDAState) => st.isInitial)?.id ? 'var(--color-info)' : s.isAccepting ? 'var(--color-success)' : 'var(--color-border)'}`,
                  background: s.isAccepting ? 'rgba(16,185,129,0.08)' : 'var(--color-surface-2)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}>
                  {s.name}
                  {s.isInitial && <span style={{ fontSize: '0.65rem', color: 'var(--color-info)', marginLeft: '0.25rem' }}>→</span>}
                  {s.isAccepting && <span style={{ fontSize: '0.65rem', color: 'var(--color-success)', marginLeft: '0.25rem' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
