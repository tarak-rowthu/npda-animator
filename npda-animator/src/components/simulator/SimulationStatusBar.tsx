import { motion } from 'framer-motion';
import {
  Clock,
  Pause,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  ExternalLink,
} from 'lucide-react';
import type { ExecutionStatus, SimulationConfig, PDADefinition } from '../../types/pda';

interface SimulationStatusBarProps {
  status: ExecutionStatus;
  currentConfig: SimulationConfig | null;
  pda: PDADefinition;
  inputString: string;
  stepCount: number;
  onOpenResultCard?: () => void;
  isInspectingHistory?: boolean;
  selectedStepNumber?: number;
  onExitHistoryInspection?: () => void;
}

export function SimulationStatusBar({
  status,
  currentConfig,
  pda,
  inputString,
  stepCount,
  onOpenResultCard,
  isInspectingHistory,
  selectedStepNumber,
  onExitHistoryInspection,
}: SimulationStatusBarProps) {
  const configs: Record<
    ExecutionStatus,
    { label: string; bg: string; border: string; color: string; icon: React.ReactNode; glow?: string }
  > = {
    idle: {
      label: 'READY',
      bg: 'rgba(148, 163, 184, 0.1)',
      border: 'rgba(148, 163, 184, 0.25)',
      color: '#94a3b8',
      icon: <Clock size={14} />,
    },
    running: {
      label: 'RUNNING',
      bg: 'rgba(59, 130, 246, 0.15)',
      border: 'rgba(59, 130, 246, 0.4)',
      color: '#60a5fa',
      icon: (
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Activity size={14} />
        </motion.div>
      ),
      glow: '0 0 10px rgba(59, 130, 246, 0.4)',
    },
    paused: {
      label: 'PAUSED',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.4)',
      color: '#fbbf24',
      icon: <Pause size={14} />,
    },
    accepted: {
      label: 'ACCEPTED',
      bg: 'rgba(16, 185, 129, 0.18)',
      border: 'rgba(16, 185, 129, 0.45)',
      color: '#34d399',
      icon: <CheckCircle2 size={14} />,
      glow: '0 0 12px rgba(16, 185, 129, 0.45)',
    },
    rejected: {
      label: 'REJECTED',
      bg: 'rgba(239, 68, 68, 0.18)',
      border: 'rgba(239, 68, 68, 0.45)',
      color: '#f87171',
      icon: <XCircle size={14} />,
      glow: '0 0 12px rgba(239, 68, 68, 0.4)',
    },
    stuck: {
      label: 'STUCK (DEAD CONFIG)',
      bg: 'rgba(245, 158, 11, 0.18)',
      border: 'rgba(245, 158, 11, 0.45)',
      color: '#fbbf24',
      icon: <AlertTriangle size={14} />,
    },
    'invalid-input': {
      label: 'INVALID INPUT',
      bg: 'rgba(239, 68, 68, 0.18)',
      border: 'rgba(239, 68, 68, 0.45)',
      color: '#f87171',
      icon: <XCircle size={14} />,
    },
    'step-limit-reached': {
      label: 'EXECUTION INCOMPLETE',
      bg: 'rgba(245, 158, 11, 0.18)',
      border: 'rgba(245, 158, 11, 0.45)',
      color: '#fbbf24',
      icon: <AlertTriangle size={14} />,
    },
  };

  const cfg = configs[status] ?? configs.idle;

  const totalLength = inputString.length;
  const currentPos = currentConfig ? Math.min(currentConfig.inputPos, totalLength) : 0;
  const inputPct = totalLength === 0 ? 100 : Math.round((currentPos / totalLength) * 100);
  const stackDepth = currentConfig?.stack.length ?? 1;
  const stackTop = currentConfig && currentConfig.stack.length > 0 ? currentConfig.stack[currentConfig.stack.length - 1] : '⊥';

  const isTerminal = ['accepted', 'rejected', 'stuck', 'invalid-input', 'step-limit-reached'].includes(status);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.4rem 1rem',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: '0.78rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      {/* Left: Status Badge + Live / History Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <motion.div
          key={status}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.color,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            boxShadow: cfg.glow ?? 'none',
          }}
        >
          {cfg.icon}
          <span>{cfg.label}</span>
        </motion.div>

        {isInspectingHistory && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: 'var(--color-accent-light)',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            <span>Inspecting Step #{selectedStepNumber}</span>
            <button
              onClick={onExitHistoryInspection}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text)',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.7rem',
                marginLeft: '0.25rem',
              }}
            >
              (Live State)
            </button>
          </div>
        )}
      </div>

      {/* Center: Live Execution Metrics */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: 'var(--color-text-muted)',
          fontSize: '0.74rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span>Step: </span>
          <strong style={{ color: 'var(--color-text)' }}>{currentConfig?.stepNumber ?? 0}</strong>
          <span style={{ opacity: 0.7 }}> / {stepCount}</span>
        </div>

        <div>
          <span>Tape: </span>
          <strong style={{ color: 'var(--color-text)' }}>
            {currentPos}/{totalLength}
          </strong>
          <span style={{ opacity: 0.7 }}> ({inputPct}%)</span>
        </div>

        <div>
          <span>Stack Depth: </span>
          <strong style={{ color: 'var(--color-text)' }}>{stackDepth}</strong>
          <span style={{ opacity: 0.7 }}> (Top: <code style={{ color: 'var(--color-accent-light)' }}>{stackTop}</code>)</span>
        </div>

        <div>
          <span>Criterion: </span>
          <strong style={{ color: 'var(--color-text)' }}>
            {pda.acceptanceCriterion === 'final-state' ? 'Final State (F)' : 'Empty Stack (N)'}
          </strong>
        </div>
      </div>

      {/* Right: Quick action if terminal */}
      {isTerminal && onOpenResultCard && (
        <button
          className="btn btn-ghost"
          onClick={onOpenResultCard}
          style={{
            padding: '0.2rem 0.5rem',
            fontSize: '0.72rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
          }}
          title="Open complete simulation result summary modal"
        >
          <ExternalLink size={12} />
          View Result Summary
        </button>
      )}
    </div>
  );
}
