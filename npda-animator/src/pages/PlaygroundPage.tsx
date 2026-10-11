import { useState } from 'react';
import { motion } from 'framer-motion';
import { BUILT_IN_EXAMPLES } from '../lib/examples/builtinExamples';
import { PDASimulator } from '../lib/simulation-engine/pdaEngine';
import { useAppStore } from '../hooks/useAppStore';
import { recordStringTest } from '../lib/storage/storage';
import { Play, Download, Plus, Trash2 } from 'lucide-react';
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
  const [inputs, setInputs] = useState<string[]>(['', '()', '(())', '(', ')']);
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
    a.download = `${selectedPDA.name.replace(/\s+/g, '_')}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const acceptedCount = results.filter((r) => r.accepted).length;
  const rejectedCount = results.length - acceptedCount;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', flexDirection: 'column' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
            Automaton
          </label>
          <select
            value={selectedPDA.id}
            onChange={(e) => {
              const pda = BUILT_IN_EXAMPLES.find((x: PDADefinition) => x.id === e.target.value);
              if (pda) setSelectedPDA(pda);
            }}
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.6rem', color: 'var(--color-text)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {BUILT_IN_EXAMPLES.map((ex: PDADefinition) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {results.length > 0 && (
            <>
              <span className="badge badge-success">✓ {acceptedCount} Accepted</span>
              <span className="badge badge-error">✗ {rejectedCount} Rejected</span>
              <button className="btn btn-secondary" onClick={exportCSV} style={{ fontSize: '0.8rem' }}>
                <Download size={14} /> CSV
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={runAll} disabled={running || inputs.length === 0}>
            <Play size={14} /> Run All
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Input panel */}
        <div style={{ borderRight: '1px solid var(--color-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header" style={{ justifyContent: 'space-between' }}>
            <span>Input Strings ({inputs.length})</span>
            <button className="btn btn-ghost" style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem' }} onClick={addInput}>
              <Plus size={13} /> Add
            </button>
          </div>
          <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {inputs.map((inp, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  className="input"
                  value={inp}
                  onChange={(e) => updateInput(idx, e.target.value)}
                  placeholder={`String ${idx + 1} (empty = ε)`}
                  style={{ flex: 1 }}
                  aria-label={`Test string ${idx + 1}`}
                />
                <button
                  className="btn btn-ghost"
                  style={{ padding: '0.3rem' }}
                  onClick={() => runSingle(inp)}
                  aria-label={`Test string ${idx + 1}`}
                  title="Test this string"
                >
                  <Play size={13} />
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '0.3rem' }}
                  onClick={() => removeInput(idx)}
                  aria-label={`Remove string ${idx + 1}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Results panel */}
        <div style={{ overflowY: 'auto' }}>
          <div className="panel-header">Results</div>
          {results.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Run strings to see results here.
            </div>
          ) : (
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${r.accepted ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    background: r.accepted ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => openInSimulator(r.input)}
                  title="Open in simulator"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openInSimulator(r.input)}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)', minWidth: '3rem' }}>
                    {r.input === '' ? 'ε' : r.input}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      color: r.accepted ? 'var(--color-success)' : 'var(--color-error)',
                    }}>
                      {r.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                      {r.stepCount} steps
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>→ Simulate</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
