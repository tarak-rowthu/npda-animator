import { useState } from 'react';
import { Plus, Trash2, Save, Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { PDADefinition, PDAState, PDATransition, ValidationError } from '../types/pda';
import { validatePDA } from '../lib/automaton-validator/validator';
import { saveAutomaton } from '../lib/storage/storage';
import { useAppStore } from '../hooks/useAppStore';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_PDA: PDADefinition = {
  id: uid(),
  name: 'My Custom PDA',
  description: 'A custom pushdown automaton.',
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
    const newState: PDAState = { id, name: id, isInitial: false, isAccepting: false, position: { x: 100 + pda.states.length * 150, y: 200 } };
    updatePDA({ states: [...pda.states, newState] });
  }

  function updateState(stateId: string, patch: Partial<PDAState>) {
    updatePDA({ states: pda.states.map((s: PDAState) => s.id === stateId ? { ...s, ...patch } : s) });
  }

  function deleteState(stateId: string) {
    updatePDA({
      states: pda.states.filter((s: PDAState) => s.id !== stateId),
      transitions: pda.transitions.filter((t: PDATransition) => t.fromState !== stateId && t.toState !== stateId),
    });
  }

  function setInitialState(stateId: string) {
    updatePDA({ states: pda.states.map((s: PDAState) => ({ ...s, isInitial: s.id === stateId })) });
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
    updatePDA({ transitions: pda.transitions.map((t: PDATransition) => t.id === id ? { ...t, ...patch } : t) });
  }

  function deleteTransition(id: string) {
    updatePDA({ transitions: pda.transitions.filter((t: PDATransition) => t.id !== id) });
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
      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            className="input"
            value={pda.name}
            onChange={(e) => updatePDA({ name: e.target.value })}
            style={{ fontWeight: 700, fontSize: '1rem' }}
            aria-label="Automaton name"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleValidate}>
            Validate
          </button>
          <button className="btn btn-secondary" onClick={handleSave}>
            <Save size={14} /> {saved ? 'Saved!' : 'Save'}
          </button>
          <button className="btn btn-primary" onClick={handleOpenInSimulator} disabled={validation !== null && !validation.valid}>
            <Play size={14} /> Open in Simulator
          </button>
        </div>
      </div>

      {/* Validation result */}
      {validation && (
        <div style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          background: validation.valid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: validation.errors.length > 0 || validation.warnings.length > 0 ? '0.5rem' : 0 }}>
            {validation.valid
              ? <CheckCircle2 size={16} color="var(--color-success)" />
              : <XCircle size={16} color="var(--color-error)" />}
            <strong style={{ color: validation.valid ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.875rem' }}>
              {validation.valid ? 'Valid Deterministic PDA' : `${validation.errors.length} validation error(s)`}
            </strong>
          </div>
          {validation.errors.map((err: ValidationError, i: number) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-error)', marginBottom: '0.2rem' }}>
              <XCircle size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
              {err.message}
            </div>
          ))}
          {validation.warnings.map((w: string, i: number) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginBottom: '0.2rem' }}>
              <AlertTriangle size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', padding: '1rem', alignContent: 'start' }}>

        {/* ── Automaton Metadata ── */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Automaton Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Description
              <textarea
                value={pda.description}
                onChange={(e) => updatePDA({ description: e.target.value })}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: '0.2rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.5rem', color: 'var(--color-text)', fontSize: '0.82rem', resize: 'vertical' }}
              />
            </label>

            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Input Alphabet (comma-separated)
              <input
                className="input"
                style={{ marginTop: '0.2rem' }}
                value={pda.inputAlphabet.join(', ')}
                onChange={(e) => updatePDA({ inputAlphabet: parseAlphabet(e.target.value) })}
                placeholder="e.g. a, b"
              />
            </label>

            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Stack Alphabet (comma-separated)
              <input
                className="input"
                style={{ marginTop: '0.2rem' }}
                value={pda.stackAlphabet.join(', ')}
                onChange={(e) => updatePDA({ stackAlphabet: parseAlphabet(e.target.value) })}
                placeholder="e.g. B, A"
              />
            </label>

            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Initial Stack Symbol
              <input
                className="input"
                style={{ marginTop: '0.2rem' }}
                value={pda.initialStackSymbol}
                onChange={(e) => updatePDA({ initialStackSymbol: e.target.value.trim() })}
                placeholder="e.g. B"
              />
            </label>

            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Acceptance Criterion
              <select
                value={pda.acceptanceCriterion}
                onChange={(e) => updatePDA({ acceptanceCriterion: e.target.value as any })}
                style={{ display: 'block', width: '100%', marginTop: '0.2rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.5rem', color: 'var(--color-text)', fontSize: '0.85rem' }}
              >
                <option value="final-state">Final State</option>
                <option value="empty-stack">Empty Stack</option>
              </select>
            </label>
          </div>
        </div>

        {/* ── States ── */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>States ({pda.states.length})</div>
            <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={addState}>
              <Plus size={13} /> Add State
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {pda.states.map((state: PDAState) => (
              <div key={state.id} style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                alignItems: 'center',
                border: state.isInitial ? '1px solid var(--color-info)' : state.isAccepting ? '1px solid var(--color-success)' : '1px solid transparent',
              }}>
                <input
                  value={state.name}
                  onChange={(e) => updateState(state.id, { name: e.target.value })}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text)', width: '60px', fontSize: '0.9rem' }}
                  aria-label={`State name for ${state.id}`}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--color-info)' }}>
                  <input type="radio" name="initial-state" checked={state.isInitial} onChange={() => setInitialState(state.id)} style={{ accentColor: 'var(--color-info)' }} />
                  Initial
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--color-success)' }}>
                  <input type="checkbox" checked={state.isAccepting} onChange={(e) => updateState(state.id, { isAccepting: e.target.checked })} style={{ accentColor: 'var(--color-success)' }} />
                  Accepting
                </label>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '0.15rem 0.3rem', marginLeft: 'auto', color: 'var(--color-error)' }}
                  onClick={() => deleteState(state.id)}
                  aria-label={`Delete state ${state.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transitions ── */}
        <div className="card" style={{ padding: '1rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Transitions ({pda.transitions.length})</div>
            <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={addTransition} disabled={pda.states.length === 0}>
              <Plus size={13} /> Add Transition
            </button>
          </div>

          {pda.transitions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1.5rem', fontSize: '0.85rem' }}>
              No transitions defined yet. Click "Add Transition" to create one.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)' }}>
                    {['From State', 'Input Symbol', 'Stack Top', 'To State', 'Stack Push', ''].map((h) => (
                      <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pda.transitions.map((t: PDATransition) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {/* From State */}
                      <td style={{ padding: '0.35rem 0.5rem' }}>
                        <select
                          value={t.fromState}
                          onChange={(e) => updateTransition(t.id, { fromState: e.target.value })}
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', color: 'var(--color-text)', fontSize: '0.82rem' }}
                          aria-label="From state"
                        >
                          {pda.states.map((s: PDAState) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      {/* Input Symbol */}
                      <td style={{ padding: '0.35rem 0.5rem' }}>
                        <input
                          value={t.inputSymbol}
                          onChange={(e) => updateTransition(t.id, { inputSymbol: e.target.value })}
                          placeholder="ε or symbol"
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.4rem', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', width: '70px' }}
                          aria-label="Input symbol"
                        />
                      </td>
                      {/* Stack Top */}
                      <td style={{ padding: '0.35rem 0.5rem' }}>
                        <input
                          value={t.stackTopSymbol}
                          onChange={(e) => updateTransition(t.id, { stackTopSymbol: e.target.value })}
                          placeholder="symbol"
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.4rem', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', width: '60px' }}
                          aria-label="Stack top symbol"
                        />
                      </td>
                      {/* To State */}
                      <td style={{ padding: '0.35rem 0.5rem' }}>
                        <select
                          value={t.toState}
                          onChange={(e) => updateTransition(t.id, { toState: e.target.value })}
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', color: 'var(--color-text)', fontSize: '0.82rem' }}
                          aria-label="To state"
                        >
                          {pda.states.map((s: PDAState) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      {/* Stack Push */}
                      <td style={{ padding: '0.35rem 0.5rem' }}>
                        <input
                          value={t.stackPush}
                          onChange={(e) => updateTransition(t.id, { stackPush: e.target.value })}
                          placeholder="ε or string"
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.4rem', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', width: '80px' }}
                          aria-label="Stack push string"
                        />
                      </td>
                      <td style={{ padding: '0.35rem 0.5rem' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '0.2rem', color: 'var(--color-error)' }}
                          onClick={() => deleteTransition(t.id)}
                          aria-label="Delete transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            <strong>Stack convention:</strong> In "Stack Push", enter the replacement string where the <strong>leftmost character ends on top</strong>. Leave empty ("") to POP the stack top. Enter "ε" to POP as well. To leave the stack unchanged, enter the same symbol as Stack Top.
          </div>
        </div>
      </div>
    </div>
  );
}
