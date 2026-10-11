import { useState } from 'react';
import { Plus, Trash2, Save, Play, CheckCircle2, XCircle, AlertTriangle, Sparkles, Layers, Code } from 'lucide-react';
import type { PDADefinition, PDAState, PDATransition, ValidationError } from '../types/pda';
import { validatePDA } from '../lib/automaton-validator/validator';
import { saveAutomaton } from '../lib/storage/storage';
import { useAppStore } from '../hooks/useAppStore';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_PDA: PDADefinition = {
  id: uid(),
  name: 'Custom Deterministic PDA',
  description: 'A custom pushdown automaton engineered in the design suite.',
  states: [
    { id: 'q0', name: 'q0', isInitial: true, isAccepting: true, position: { x: 100, y: 200 } },
  ],
  inputAlphabet: ['a', 'b'],
  stackAlphabet: ['B', 'A'],
  initialStackSymbol: 'B',
  transitions: [],
  acceptanceCriterion: 'final-state',
};

export function BuilderPage() {
  const { selectPDA, setPage } = useAppStore();
  const [pda, setPDA] = useState<PDADefinition>(() => ({ ...DEFAULT_PDA, id: uid() }));
  const [validation, setValidation] = useState<ReturnType<typeof validatePDA> | null>(null);
  const [saved, setSaved] = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────
  function updatePDA(patch: Partial<PDADefinition>) {
    setPDA((p: PDADefinition) => ({ ...p, ...patch }));
    setValidation(null);
    setSaved(false);
  }

  // ── State ops ─────────────────────────────────────────────────────────────
  function addState() {
    const id = `q${pda.states.length}`;
    const newState: PDAState = {
      id,
      name: id,
      isInitial: false,
      isAccepting: false,
      position: { x: 100 + pda.states.length * 150, y: 200 },
    };
    updatePDA({ states: [...pda.states, newState] });
  }

  function updateState(stateId: string, patch: Partial<PDAState>) {
    updatePDA({
      states: pda.states.map((s: PDAState) => (s.id === stateId ? { ...s, ...patch } : s)),
    });
  }

  function deleteState(stateId: string) {
    updatePDA({
      states: pda.states.filter((s: PDAState) => s.id !== stateId),
      transitions: pda.transitions.filter((t: PDATransition) => t.fromState !== stateId && t.toState !== stateId),
    });
  }

  function setInitialState(stateId: string) {
    updatePDA({
      states: pda.states.map((s: PDAState) => ({ ...s, isInitial: s.id === stateId })),
    });
  }

  // ── Transition ops ────────────────────────────────────────────────────────
  function addTransition() {
    if (pda.states.length < 1) return;
    const t: PDATransition = {
      id: uid(),
      fromState: pda.states[0].id,
      toState: pda.states[0].id,
      inputSymbol: pda.inputAlphabet[0] ?? 'a',
      stackTopSymbol: pda.stackAlphabet[0] ?? 'B',
      stackPush: pda.stackAlphabet[0] ?? 'B',
    };
    updatePDA({ transitions: [...pda.transitions, t] });
  }

  function updateTransition(id: string, patch: Partial<PDATransition>) {
    updatePDA({
      transitions: pda.transitions.map((t: PDATransition) => (t.id === id ? { ...t, ...patch } : t)),
    });
  }

  function deleteTransition(id: string) {
    updatePDA({
      transitions: pda.transitions.filter((t: PDATransition) => t.id !== id),
    });
  }

  // ── Alphabet ops ──────────────────────────────────────────────────────────
  function parseAlphabet(raw: string): string[] {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleValidate() {
    const result = validatePDA(pda);
    setValidation(result);
  }

  function handleSave() {
    saveAutomaton(pda);
    setSaved(true);
  }

  function handleOpenInSimulator() {
    selectPDA(pda);
    setPage('simulator');
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Glossy Header Bar */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(13, 18, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: 'var(--gloss-highlight-subtle)',
        display: 'flex',
        gap: '0.85rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            background: 'var(--color-accent-dim)',
            border: '1px solid rgba(139, 141, 255, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-accent-light)',
          }}>
            <Code size={16} />
          </div>
          <input
            className="input"
            value={pda.name}
            onChange={(e) => updatePDA({ name: e.target.value })}
            style={{ fontWeight: 800, fontSize: '1rem', height: '38px', maxWidth: '380px' }}
            aria-label="Automaton name"
            placeholder="Name your automaton..."
          />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleValidate}>
            <Sparkles size={14} color="var(--color-accent-light)" />
            <span>Validate Determinism</span>
          </button>
          <button className="btn btn-secondary" onClick={handleSave}>
            <Save size={14} />
            <span>{saved ? 'Saved to Browser!' : 'Save Model'}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handleOpenInSimulator}
            disabled={validation !== null && !validation.valid}
          >
            <Play size={14} />
            <span>Open in Simulator →</span>
          </button>
        </div>
      </div>

      {/* Validation Banner */}
      {validation && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--color-border)',
          background: validation.valid ? 'rgba(53, 214, 160, 0.1)' : 'rgba(255, 100, 124, 0.1)',
          boxShadow: 'var(--gloss-highlight-subtle)',
        }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: validation.errors.length > 0 || validation.warnings.length > 0 ? '0.4rem' : 0 }}>
            {validation.valid ? (
              <CheckCircle2 size={18} color="var(--color-success)" />
            ) : (
              <XCircle size={18} color="var(--color-error)" />
            )}
            <strong style={{ color: validation.valid ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.9rem' }}>
              {validation.valid
                ? 'Valid Deterministic PDA — Ready for Step-by-Step Simulation'
                : `${validation.errors.length} validation error(s) must be resolved:`}
            </strong>
          </div>
          {validation.errors.map((err: ValidationError, i: number) => (
            <div key={i} style={{ fontSize: '0.82rem', color: 'var(--color-error)', marginLeft: '1.75rem', marginTop: '0.2rem' }}>
              • {err.message}
            </div>
          ))}
          {validation.warnings.map((w: string, i: number) => (
            <div key={i} style={{ fontSize: '0.82rem', color: 'var(--color-warning)', marginLeft: '1.75rem', marginTop: '0.2rem' }}>
              <AlertTriangle size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Main Form Content Grid */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
        padding: '1.25rem',
        alignContent: 'start',
      }}>
        {/* ── Automaton Configuration Panel ── */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '0.95rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} color="var(--color-accent-light)" />
            <span>Alphabet & Acceptance Settings</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Description & Language
              <textarea
                className="input"
                value={pda.description}
                onChange={(e) => updatePDA({ description: e.target.value })}
                rows={2}
                style={{ marginTop: '0.3rem', resize: 'vertical' }}
                placeholder="E.g. Recognizes language L = {aⁿbⁿ | n ≥ 0}"
              />
            </label>

            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Input Alphabet Σ (comma-separated)
              <input
                className="input"
                style={{ marginTop: '0.3rem' }}
                value={pda.inputAlphabet.join(', ')}
                onChange={(e) => updatePDA({ inputAlphabet: parseAlphabet(e.target.value) })}
                placeholder="e.g. a, b"
              />
            </label>

            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Stack Alphabet Γ (comma-separated)
              <input
                className="input"
                style={{ marginTop: '0.3rem' }}
                value={pda.stackAlphabet.join(', ')}
                onChange={(e) => updatePDA({ stackAlphabet: parseAlphabet(e.target.value) })}
                placeholder="e.g. B, A"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Initial Stack Symbol Z₀
                <input
                  className="input"
                  style={{ marginTop: '0.3rem' }}
                  value={pda.initialStackSymbol}
                  onChange={(e) => updatePDA({ initialStackSymbol: e.target.value.trim() })}
                  placeholder="e.g. B"
                />
              </label>

              <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Acceptance Criterion
                <select
                  className="input"
                  value={pda.acceptanceCriterion}
                  onChange={(e) => updatePDA({ acceptanceCriterion: e.target.value as any })}
                  style={{ marginTop: '0.3rem', cursor: 'pointer' }}
                >
                  <option value="final-state">Final State (F)</option>
                  <option value="empty-stack">Empty Stack (N)</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* ── States Configuration Panel ── */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF' }}>
              Automaton States ({pda.states.length})
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
              onClick={addState}
            >
              <Plus size={13} />
              <span>Add State</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '340px', overflowY: 'auto' }}>
            {pda.states.map((state: PDAState) => (
              <div
                key={state.id}
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.65rem',
                  alignItems: 'center',
                  border: state.isInitial
                    ? '1px solid var(--color-info)'
                    : state.isAccepting
                    ? '1px solid var(--color-success)'
                    : '1px solid var(--color-border)',
                  boxShadow: 'var(--gloss-highlight-subtle)',
                }}
              >
                <input
                  value={state.name}
                  onChange={(e) => updateState(state.id, { name: e.target.value })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    width: '64px',
                    fontSize: '0.95rem',
                  }}
                  aria-label={`State name for ${state.id}`}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-info)', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="initial-state"
                    checked={state.isInitial}
                    onChange={() => setInitialState(state.id)}
                    style={{ accentColor: 'var(--color-info)' }}
                  />
                  <span>Initial (q₀)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-success)', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={state.isAccepting}
                    onChange={(e) => updateState(state.id, { isAccepting: e.target.checked })}
                    style={{ accentColor: 'var(--color-success)' }}
                  />
                  <span>Accepting (F)</span>
                </label>

                <button
                  className="btn btn-ghost"
                  style={{ padding: '0.2rem 0.4rem', marginLeft: 'auto', color: 'var(--color-error)' }}
                  onClick={() => deleteState(state.id)}
                  aria-label={`Delete state ${state.name}`}
                  title="Remove state"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transition Rules Table Panel ── */}
        <div className="glass-panel" style={{ padding: '1.25rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF' }}>
                Transition Function δ ({pda.transitions.length} rules)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                δ(Current State, Input Symbol, Stack Top) → (Next State, Stack Push)
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              onClick={addTransition}
              disabled={pda.states.length === 0}
            >
              <Plus size={14} />
              <span>Add Transition Rule</span>
            </button>
          </div>

          {pda.transitions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              padding: '2rem',
              fontSize: '0.88rem',
              background: 'rgba(13, 18, 32, 0.4)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--color-border)',
            }}>
              No transitions defined yet. Click <strong>"Add Transition Rule"</strong> to formulate state transfers.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <table className="trace-table">
                <thead>
                  <tr>
                    <th>From State (q)</th>
                    <th>Input (a or ε)</th>
                    <th>Stack Top (X)</th>
                    <th>To State (q')</th>
                    <th>Stack Push (γ)</th>
                    <th>Formal Notation</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {pda.transitions.map((t: PDATransition) => {
                    const fromStateName = pda.states.find((s) => s.id === t.fromState)?.name ?? t.fromState;
                    const toStateName = pda.states.find((s) => s.id === t.toState)?.name ?? t.toState;
                    const inp = !t.inputSymbol || t.inputSymbol === 'ε' ? 'ε' : t.inputSymbol;
                    const push = t.stackPush === '' ? 'ε' : t.stackPush;
                    const notation = `δ(${fromStateName}, ${inp}, ${t.stackTopSymbol}) = (${toStateName}, ${push})`;

                    return (
                      <tr key={t.id}>
                        {/* From State */}
                        <td>
                          <select
                            className="input"
                            value={t.fromState}
                            onChange={(e) => updateTransition(t.id, { fromState: e.target.value })}
                            style={{ height: '32px', padding: '0.2rem 0.5rem', width: '90px' }}
                            aria-label="From state"
                          >
                            {pda.states.map((s: PDAState) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Input Symbol */}
                        <td>
                          <input
                            className="input"
                            value={t.inputSymbol}
                            onChange={(e) => updateTransition(t.id, { inputSymbol: e.target.value })}
                            placeholder="ε or char"
                            style={{ height: '32px', width: '80px', padding: '0.2rem 0.5rem' }}
                            aria-label="Input symbol"
                          />
                        </td>

                        {/* Stack Top */}
                        <td>
                          <input
                            className="input"
                            value={t.stackTopSymbol}
                            onChange={(e) => updateTransition(t.id, { stackTopSymbol: e.target.value })}
                            placeholder="symbol"
                            style={{ height: '32px', width: '70px', padding: '0.2rem 0.5rem' }}
                            aria-label="Stack top symbol"
                          />
                        </td>

                        {/* To State */}
                        <td>
                          <select
                            className="input"
                            value={t.toState}
                            onChange={(e) => updateTransition(t.id, { toState: e.target.value })}
                            style={{ height: '32px', padding: '0.2rem 0.5rem', width: '90px' }}
                            aria-label="To state"
                          >
                            {pda.states.map((s: PDAState) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Stack Push */}
                        <td>
                          <input
                            className="input"
                            value={t.stackPush}
                            onChange={(e) => updateTransition(t.id, { stackPush: e.target.value })}
                            placeholder="ε or string"
                            style={{ height: '32px', width: '90px', padding: '0.2rem 0.5rem' }}
                            aria-label="Stack push string"
                          />
                        </td>

                        {/* Formal Notation Badge */}
                        <td>
                          <span className="transition-notation" style={{ fontSize: '0.78rem' }}>
                            {notation}
                          </span>
                        </td>

                        {/* Delete action */}
                        <td>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem', color: 'var(--color-error)' }}
                            onClick={() => deleteTransition(t.id)}
                            aria-label="Delete transition rule"
                            title="Delete rule"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(139, 141, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--color-accent)',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--color-text)' }}>LIFO Convention:</strong> In "Stack Push", write replacement string γ with the <strong>leftmost character ending at the top of the stack</strong>.
            Leave empty ("") or enter "ε" to perform a pure <strong>POP</strong>. Enter the identical symbol as Stack Top to leave the stack unchanged.
          </div>
        </div>
      </div>
    </div>
  );
}
