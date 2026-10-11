import { useState } from 'react';
import { motion } from 'framer-motion';
import { BUILT_IN_EXAMPLES, EXAMPLE_TEST_STRINGS } from '../lib/examples/builtinExamples';
import { PDASimulator } from '../lib/simulation-engine/pdaEngine';
import { useAppStore } from '../hooks/useAppStore';
import { recordStringTest } from '../lib/storage/storage';
import { Play, Download, Plus, Trash2, CheckCircle2, XCircle, ArrowRight, Layers, Sparkles } from 'lucide-react';
import type { PDADefinition } from '../types/pda';

interface TestResult {
  input: string;
  accepted: boolean;
  status: string;
  stepCount: number;
}

export function PlaygroundPage() {
  const { selectPDA, setInputString, setPage } = useAppStore();
  const [selectedPDA, setSelectedPDA] = useState<PDADefinition>(BUILT_IN_EXAMPLES[0]);
  const [inputs, setInputs] = useState<string[]>(['', 'ab', 'aabb', 'aaabbb', 'abb', 'aab', 'abab', 'ba']);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  function addInput() {
    setInputs((arr) => [...arr, '']);
  }

  function removeInput(idx: number) {
    setInputs((arr) => arr.filter((_, i) => i !== idx));
  }

  function updateInput(idx: number, val: string) {
    setInputs((arr) => arr.map((v, i) => (i === idx ? val : v)));
  }

  function loadExampleSuite() {
    const suite = EXAMPLE_TEST_STRINGS[selectedPDA.id];
    if (suite) {
      setInputs([...suite.accepted, ...suite.rejected]);
      setResults([]);
    }
  }

  async function runAll() {
    setRunning(true);
    const res: TestResult[] = [];
    for (const inp of inputs) {
      const result = PDASimulator.runBatch(selectedPDA, inp);
      res.push({
        input: inp,
        accepted: result.accepted,
        status: result.status,
        stepCount: result.steps.length,
      });
      recordStringTest();
    }
    setResults(res);
    setRunning(false);
  }

  function runSingle(input: string) {
    const result = PDASimulator.runBatch(selectedPDA, input);
    setResults((arr) => {
      const existing = arr.findIndex((r) => r.input === input);
      const entry: TestResult = { input, accepted: result.accepted, status: result.status, stepCount: result.steps.length };
      if (existing >= 0) {
        const copy = [...arr];
        copy[existing] = entry;
        return copy;
      }
      return [...arr, entry];
    });
    recordStringTest();
  }

  function openInSimulator(input: string) {
    selectPDA(selectedPDA);
    setInputString(input);
    setPage('simulator');
  }

  function exportCSV() {
    const header = 'Input,Result,Status,Steps';
    const rows = results.map((r) => `"${r.input}",${r.accepted ? 'ACCEPTED' : 'REJECTED'},${r.status},${r.stepCount}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPDA.name.replace(/\s+/g, '_')}_batch_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const acceptedCount = results.filter((r) => r.accepted).length;
  const rejectedCount = results.length - acceptedCount;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Top Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.2rem' }}>
              Target Model
            </label>
            <select
              className="input"
              value={selectedPDA.id}
              onChange={(e) => {
                const pda = BUILT_IN_EXAMPLES.find((x: PDADefinition) => x.id === e.target.value);
                if (pda) {
                  setSelectedPDA(pda);
                  setResults([]);
                }
              }}
              style={{ padding: '0.35rem 0.65rem', height: '34px', cursor: 'pointer' }}
            >
              {BUILT_IN_EXAMPLES.map((ex: PDADefinition) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-secondary"
            onClick={loadExampleSuite}
            style={{ fontSize: '0.8rem', height: '34px', marginTop: '1.2rem' }}
            title="Load canonical test string suite for selected PDA"
          >
            <Sparkles size={13} color="var(--color-accent-light)" />
            <span>Load Preset Suite</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {results.length > 0 && (
            <>
              <span className="badge badge-success" style={{ padding: '0.3rem 0.65rem' }}>
                ✓ {acceptedCount} Accepted
              </span>
              <span className="badge badge-error" style={{ padding: '0.3rem 0.65rem' }}>
                ✗ {rejectedCount} Rejected
              </span>
              <button className="btn btn-secondary" onClick={exportCSV} style={{ fontSize: '0.8rem', height: '34px' }}>
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </>
          )}

          <button
            className="btn btn-primary"
            onClick={runAll}
            disabled={running || inputs.length === 0}
            style={{ fontSize: '0.82rem', height: '34px', padding: '0 1.15rem' }}
          >
            <Play size={14} />
            <span>{running ? 'Evaluating...' : 'Run All Strings'}</span>
          </button>
        </div>
      </div>

      {/* Two-Column Workspace */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.25fr)', gap: 0 }}>
        {/* Left Column: Inputs */}
        <div style={{
          borderRight: '1px solid var(--color-border)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(8, 11, 20, 0.4)',
        }}>
          <div className="panel-header" style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}>
            <span>Test String Queue ({inputs.length})</span>
            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }} onClick={addInput}>
              <Plus size={12} />
              <span>Add String</span>
            </button>
          </div>

          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {inputs.map((inp, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', width: '22px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {idx + 1}.
                </span>
                <input
                  className="input"
                  value={inp}
                  onChange={(e) => updateInput(idx, e.target.value)}
                  placeholder="empty string ε"
                  style={{ flex: 1, height: '34px', padding: '0.35rem 0.65rem' }}
                  aria-label={`Test string ${idx + 1}`}
                />
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem', height: '34px', width: '34px' }}
                  onClick={() => runSingle(inp)}
                  aria-label={`Test string ${idx + 1}`}
                  title="Test string"
                >
                  <Play size={12} />
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '0.4rem', color: 'var(--color-error)' }}
                  onClick={() => removeInput(idx)}
                  aria-label={`Remove string ${idx + 1}`}
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Results */}
        <div style={{ overflowY: 'auto', background: 'rgba(13, 18, 32, 0.4)' }}>
          <div className="panel-header" style={{ padding: '0.75rem 1.25rem' }}>
            <span>Evaluation Outcomes</span>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.88rem' }}>
              <Layers size={36} color="var(--color-text-dim)" style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <div>Click <strong>"Run All Strings"</strong> above to evaluate the queue simultaneously.</div>
            </div>
          ) : (
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.03 }}
                  className="glass-panel-interactive"
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    borderColor: r.accepted ? 'rgba(53, 214, 160, 0.35)' : 'rgba(255, 100, 124, 0.35)',
                    background: r.accepted ? 'rgba(53, 214, 160, 0.06)' : 'rgba(255, 100, 124, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => openInSimulator(r.input)}
                  title="Open this execution trace in interactive simulator"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openInSimulator(r.input)}
                >
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    minWidth: '5rem',
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                  }}>
                    {r.input === '' ? 'ε (empty)' : `"${r.input}"`}
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {r.accepted ? (
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        <CheckCircle2 size={12} style={{ marginRight: '0.25rem' }} />
                        ACCEPTED
                      </span>
                    ) : (
                      <span className="badge badge-error" style={{ fontSize: '0.72rem' }}>
                        <XCircle size={12} style={{ marginRight: '0.25rem' }} />
                        REJECTED
                      </span>
                    )}

                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                      {r.stepCount} computation steps
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Simulate <ArrowRight size={13} />
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
