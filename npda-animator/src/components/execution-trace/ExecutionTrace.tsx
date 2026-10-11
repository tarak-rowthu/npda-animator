import { useRef, useEffect } from 'react';
import type { ExecutionStep, PDADefinition } from '../../types/pda';

interface ExecutionTraceProps {
  steps: ExecutionStep[];
  pda: PDADefinition;
  selectedStepIndex: number | null;
  onSelectStep: (idx: number | null) => void;
}

function isEpsilon(sym: string): boolean {
  return sym === '' || sym === 'ε';
}

export function ExecutionTrace({ steps, pda, selectedStepIndex, onSelectStep }: ExecutionTraceProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  // Auto-scroll to latest step
  useEffect(() => {
    if (tbodyRef.current && selectedStepIndex === null) {
      const rows = tbodyRef.current.querySelectorAll('tr');
      const lastRow = rows[rows.length - 1];
      if (lastRow) lastRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [steps.length, selectedStepIndex]);

  function getStateName(id: string): string {
    return pda.states.find((s) => s.id === id)?.name ?? id;
  }

  function formatTransition(step: ExecutionStep): string {
    const t = step.transitionApplied;
    if (!t) return '—';
    const inp = isEpsilon(t.inputSymbol) ? 'ε' : t.inputSymbol;
    const push = t.stackPush === '' ? 'ε' : t.stackPush;
    return `δ(${getStateName(t.fromState)}, ${inp}, ${t.stackTopSymbol}) = (${getStateName(t.toState)}, ${push})`;
  }

  if (steps.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        No transitions executed yet. Start the simulation to see the execution trace.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '100%' }}>
      <table className="trace-table" aria-label="Execution trace table">
        <thead>
          <tr>
            <th>#</th>
            <th>State</th>
            <th>Input</th>
            <th>Stack Before</th>
            <th>Transition</th>
            <th>Next State</th>
            <th>Stack After</th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {steps.map((step, idx) => {
            const isSelected = selectedStepIndex === idx;
            const stackBefore = [...step.configBefore.stack].reverse().join('') || 'ε';
            const stackAfter = [...step.configAfter.stack].reverse().join('') || 'ε';
            const remaining = step.configBefore.input.slice(step.configBefore.inputPos) || 'ε';

            return (
              <tr
                key={idx}
                className={isSelected ? 'selected' : ''}
                onClick={() => onSelectStep(isSelected ? null : idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectStep(isSelected ? null : idx)}
                aria-selected={isSelected}
              >
                <td style={{ color: 'var(--color-text-muted)', minWidth: '2rem' }}>{step.stepNumber}</td>
                <td style={{ fontWeight: 600, color: 'var(--color-text)', minWidth: '3rem' }}>
                  {getStateName(step.configBefore.state)}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', minWidth: '3rem', maxWidth: '5rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {remaining}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', minWidth: '4rem' }}>{stackBefore}</td>
                <td style={{ minWidth: '12rem', color: step.transitionApplied ? 'var(--color-accent-light)' : 'var(--color-error)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  {formatTransition(step)}
                </td>
                <td style={{ fontWeight: 600, minWidth: '3rem' }}>
                  {getStateName(step.configAfter.state)}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', minWidth: '4rem' }}>{stackAfter}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
