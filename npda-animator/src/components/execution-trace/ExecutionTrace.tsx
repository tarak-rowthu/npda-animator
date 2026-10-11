import { useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
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

export function ExecutionTrace({
  steps,
  pda,
  selectedStepIndex,
  onSelectStep,
}: ExecutionTraceProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  // Auto-scroll to latest step when not inspecting past steps
  useEffect(() => {
    if (tbodyRef.current && selectedStepIndex === null) {
      const rows = tbodyRef.current.querySelectorAll('tr');
      const lastRow = rows[rows.length - 1];
      if (lastRow) {
        lastRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [steps.length, selectedStepIndex]);

  function getStateName(id: string): string {
    return pda.states.find((s) => s.id === id)?.name ?? id;
  }

  function formatTransition(step: ExecutionStep): string {
    const t = step.transitionApplied;
    if (!t) return '— (Terminal)';
    const inp = isEpsilon(t.inputSymbol) ? 'ε' : t.inputSymbol;
    const push = t.stackPush === '' ? 'ε' : t.stackPush;
    return `δ(${getStateName(t.fromState)}, ${inp}, ${t.stackTopSymbol}) → (${getStateName(t.toState)}, ${push})`;
  }

  function getStepBadge(step: ExecutionStep): { label: string; bg: string; color: string } {
    const t = step.transitionApplied;
    if (!t) {
      return { label: 'TERMINAL', bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-error)' };
    }
    const beforeLen = step.configBefore.stack.length;
    const afterLen = step.configAfter.stack.length;

    if (afterLen > beforeLen) {
      return { label: `PUSH ${t.stackPush}`, bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' };
    }
    if (afterLen < beforeLen) {
      return { label: `POP ${t.stackTopSymbol}`, bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' };
    }
    if (isEpsilon(t.inputSymbol)) {
      return { label: 'ε-MOVE', bg: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-accent-light)' };
    }
    if (t.stackPush !== t.stackTopSymbol) {
      return { label: `REPLACE`, bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
    }
    return { label: 'NO CHANGE', bg: 'var(--color-surface-2)', color: 'var(--color-text-muted)' };
  }

  if (steps.length === 0) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.82rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Info size={20} style={{ opacity: 0.5 }} />
        <span>No execution steps recorded. Start or step forward to generate a trace.</span>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '100%', width: '100%' }}>
      <table className="trace-table" aria-label="PDA execution trace table">
        <thead>
          <tr>
            <th title="Step sequence number">#</th>
            <th title="Automaton state before applying this transition">State</th>
            <th title="Remaining unread characters on input tape">Tape</th>
            <th title="Stack contents before transition (Top → Bottom)">Stack Before</th>
            <th title="Operation type (PUSH, POP, ε-MOVE)">Action</th>
            <th title="Transition rule δ(state, input, stack-top) applied">Rule Applied</th>
            <th title="Automaton state after transition">Next State</th>
            <th title="Stack contents after transition (Top → Bottom)">Stack After</th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {steps.map((step, idx) => {
            const isSelected = selectedStepIndex === idx;
            const isLatest = selectedStepIndex === null && idx === steps.length - 1;
            const isFailed = step.transitionApplied === null;
            const badge = getStepBadge(step);

            const stackBefore = [...step.configBefore.stack].reverse().join('') || 'ε';
            const stackAfter = [...step.configAfter.stack].reverse().join('') || 'ε';
            const remaining = step.configBefore.input.slice(step.configBefore.inputPos) || 'ε';

            return (
              <tr
                key={idx}
                className={isSelected ? 'selected' : isLatest ? 'active-row' : ''}
                onClick={() => onSelectStep(isSelected ? null : idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectStep(isSelected ? null : idx);
                  }
                }}
                aria-selected={isSelected}
                style={{
                  cursor: 'pointer',
                  backgroundColor: isSelected
                    ? 'rgba(99, 102, 241, 0.16)'
                    : isFailed
                    ? 'rgba(239, 68, 68, 0.08)'
                    : undefined,
                  borderLeft: isSelected
                    ? '3px solid var(--color-accent)'
                    : isLatest
                    ? '3px solid var(--color-accent-light)'
                    : '3px solid transparent',
                  transition: 'background-color 0.15s ease',
                }}
                title={`Click to inspect step #${step.stepNumber} across all simulator panels`}
              >
                {/* Step # */}
                <td style={{ color: 'var(--color-text-muted)', minWidth: '2.2rem', fontWeight: 600 }}>
                  {step.stepNumber}
                </td>

                {/* State Before */}
                <td style={{ fontWeight: 600, color: 'var(--color-text)', minWidth: '3rem' }}>
                  {getStateName(step.configBefore.state)}
                </td>

                {/* Remaining Input */}
                <td
                  style={{
                    fontFamily: 'var(--font-mono)',
                    minWidth: '3.2rem',
                    maxWidth: '5.5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: remaining === 'ε' ? 'var(--color-text-muted)' : 'var(--color-text)',
                  }}
                  title={`Remaining input: ${remaining}`}
                >
                  {remaining}
                </td>

                {/* Stack Before */}
                <td style={{ fontFamily: 'var(--font-mono)', minWidth: '4.2rem', color: 'var(--color-text)' }}>
                  [{stackBefore}]
                </td>

                {/* Action Badge */}
                <td style={{ minWidth: '5.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.12rem 0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      background: badge.bg,
                      color: badge.color,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {badge.label}
                  </span>
                </td>

                {/* Formal Rule */}
                <td
                  style={{
                    minWidth: '13rem',
                    color: step.transitionApplied ? 'var(--color-accent-light)' : 'var(--color-error)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  {formatTransition(step)}
                </td>

                {/* Next State */}
                <td style={{ fontWeight: 600, minWidth: '3rem', color: 'var(--color-text)' }}>
                  {getStateName(step.configAfter.state)}
                </td>

                {/* Stack After */}
                <td style={{ fontFamily: 'var(--font-mono)', minWidth: '4.2rem', color: 'var(--color-text)' }}>
                  [{stackAfter}]
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
