import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, AlertCircle } from 'lucide-react';
import type { ExecutionStep, PDADefinition, PDAState } from '../../types/pda';

interface TransitionDetailsCardProps {
  step: ExecutionStep | null;
  pda: PDADefinition;
  isTerminal?: boolean;
  terminalReason?: string;
}

export function TransitionDetailsCard({
  step,
  pda,
  terminalReason,
}: TransitionDetailsCardProps) {
  const [explanationMode, setExplanationMode] = useState<'beginner' | 'technical'>('beginner');

  if (!step) {
    return (
      <div
        style={{
          padding: '1rem',
          color: 'var(--color-text-muted)',
          fontSize: '0.82rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <Info size={18} style={{ opacity: 0.6 }} />
        <span>No transitions executed yet. Press <strong>Start</strong> or <strong>Step</strong> to begin simulation.</span>
      </div>
    );
  }

  const currentStep = step;
  const t = currentStep.transitionApplied;

  function getStateName(id: string): string {
    return pda.states.find((s: PDAState) => s.id === id)?.name ?? id;
  }

  // Determine stack operation type
  function getStackOp(): { label: string; type: 'push' | 'pop' | 'none' | 'replace'; color: string; desc: string } {
    if (!t) return { label: 'HALTED', type: 'none', color: 'var(--color-error)', desc: 'No rule applies' };
    const beforeLen = currentStep.configBefore.stack.length;
    const afterLen = currentStep.configAfter.stack.length;
    if (afterLen > beforeLen) {
      const pushed = t.stackPush;
      return {
        label: `PUSH ${pushed}`,
        type: 'push',
        color: 'var(--color-success)',
        desc: `Pushed "${pushed}" onto stack`,
      };
    } else if (afterLen < beforeLen) {
      return {
        label: `POP ${t.stackTopSymbol}`,
        type: 'pop',
        color: '#f97316',
        desc: `Popped "${t.stackTopSymbol}" from stack`,
      };
    } else {
      if (t.stackPush === t.stackTopSymbol) {
        return {
          label: 'NO STACK CHANGE',
          type: 'none',
          color: 'var(--color-text-muted)',
          desc: `Top remains "${t.stackTopSymbol}"`,
        };
      } else {
        return {
          label: `REPLACE WITH ${t.stackPush}`,
          type: 'replace',
          color: 'var(--color-info)',
          desc: `Replaced "${t.stackTopSymbol}" with "${t.stackPush}"`,
        };
      }
    }
  }

  const op = getStackOp();
  const inputSym = t ? (t.inputSymbol === '' || t.inputSymbol === 'ε' ? 'ε (Epsilon / No Input)' : t.inputSymbol) : '—';
  const stackBeforeStr = [...step.configBefore.stack].reverse().join('') || 'ε';
  const stackAfterStr = [...step.configAfter.stack].reverse().join('') || 'ε';

  return (
    <motion.div
      key={step.stepNumber}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      {/* Title & Step Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-muted)',
            }}
          >
            {t ? 'TRANSITION EXECUTED' : 'SIMULATION HALTED'}
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Step #{step.stepNumber}
          </span>
        </div>

        {/* Operation badge */}
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: `${op.color}1a`,
            border: `1px solid ${op.color}44`,
            color: op.color,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {op.label}
        </span>
      </div>

      {/* Formal Transition Notation Banner */}
      {t ? (
        <div
          style={{
            padding: '0.45rem 0.75rem',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--color-accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            δ({getStateName(t.fromState)}, {t.inputSymbol === '' || t.inputSymbol === 'ε' ? 'ε' : t.inputSymbol}, {t.stackTopSymbol})
            {' = '}
            ({getStateName(t.toState)}, {t.stackPush === '' ? 'ε' : t.stackPush})
          </span>
        </div>
      ) : (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--color-error)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={15} />
          <span>{terminalReason || 'No applicable transition rule exists for this state and stack-top.'}</span>
        </div>
      )}

      {/* Breakdown Grid */}
      {t && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.4rem',
            fontSize: '0.75rem',
          }}
        >
          {/* Current State */}
          <div
            style={{
              padding: '0.35rem 0.5rem',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Current State</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {getStateName(t.fromState)}
            </div>
          </div>

          {/* Input Read */}
          <div
            style={{
              padding: '0.35rem 0.5rem',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Input Symbol</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-light)' }}>
              {inputSym}
            </div>
          </div>

          {/* Stack Top */}
          <div
            style={{
              padding: '0.35rem 0.5rem',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Stack Top Popped</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {t.stackTopSymbol}
            </div>
          </div>

          {/* Next State */}
          <div
            style={{
              padding: '0.35rem 0.5rem',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Next State</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {getStateName(t.toState)}
            </div>
          </div>

          {/* Stack Delta */}
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '0.35rem 0.5rem',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.68rem' }}>
              Stack Delta (Top → Bottom):
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>[{stackBeforeStr}]</span>
              <span style={{ margin: '0 0.4rem', color: 'var(--color-accent-light)' }}>→</span>
              <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>[{stackAfterStr}]</span>
            </div>
          </div>
        </div>
      )}

      {/* Explanation with Beginner / Technical Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Explanation
          </span>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--color-border)',
            }}
          >
            <button
              onClick={() => setExplanationMode('beginner')}
              style={{
                background: explanationMode === 'beginner' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: explanationMode === 'beginner' ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.15rem 0.45rem',
                fontSize: '0.68rem',
                cursor: 'pointer',
                fontWeight: explanationMode === 'beginner' ? 700 : 500,
              }}
            >
              Beginner
            </button>
            <button
              onClick={() => setExplanationMode('technical')}
              style={{
                background: explanationMode === 'technical' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: explanationMode === 'technical' ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.15rem 0.45rem',
                fontSize: '0.68rem',
                cursor: 'pointer',
                fontWeight: explanationMode === 'technical' ? 700 : 500,
              }}
            >
              Technical
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '0.55rem 0.75rem',
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.78rem',
            lineHeight: 1.55,
            color: 'var(--color-text)',
          }}
        >
          {explanationMode === 'technical' ? step.technicalExplanation : step.explanation}
        </div>
      </div>
    </motion.div>
  );
}
