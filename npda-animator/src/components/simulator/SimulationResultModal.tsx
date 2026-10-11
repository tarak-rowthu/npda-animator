import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, RotateCcw, ListFilter, X, ShieldAlert } from 'lucide-react';
import type { ExecutionStatus, PDADefinition, SimulationConfig, ExecutionStep } from '../../types/pda';

interface SimulationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ExecutionStatus;
  pda: PDADefinition;
  inputString: string;
  steps: ExecutionStep[];
  finalConfig: SimulationConfig | null;
  onViewTrace: () => void;
  onReset: () => void;
}

export function SimulationResultModal({
  isOpen,
  onClose,
  status,
  pda,
  inputString,
  steps,
  finalConfig,
  onViewTrace,
  onReset,
}: SimulationResultModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAccepted = status === 'accepted';
  const isStuck = status === 'stuck';
  const isInvalid = status === 'invalid-input';
  const isLimit = status === 'step-limit-reached';

  // Final state info
  const finalStateObj = pda.states.find((s) => s.id === finalConfig?.state);
  const finalStateName = finalStateObj?.name ?? finalConfig?.state ?? 'Unknown';

  // Tape consumed percentage
  const totalLength = inputString.length;
  const consumedChars = finalConfig ? Math.min(finalConfig.inputPos, totalLength) : 0;
  const consumedPct = totalLength === 0 ? 100 : Math.round((consumedChars / totalLength) * 100);

  // Rejection explanation
  function getRejectionDetails(): { title: string; subtitle: string; reason: string; badge: string } {
    if (isInvalid) {
      const badChars = inputString.split('').filter((ch) => !pda.inputAlphabet.includes(ch));
      return {
        title: 'INVALID INPUT ALPHABET',
        subtitle: 'The input string contains characters not in Σ.',
        reason: `Disallowed symbol(s) detected: [${[...new Set(badChars)].join(', ')}]. Expected alphabet Σ = {${pda.inputAlphabet.join(', ')}}.`,
        badge: 'Invalid Alphabet',
      };
    }
    if (isLimit) {
      return {
        title: 'EXECUTION LIMIT REACHED',
        subtitle: 'Simulation stopped after maximum step limit.',
        reason: 'The PDA may contain an infinite loop of epsilon transitions. Execution was halted for safety.',
        badge: 'Limit Exceeded',
      };
    }
    if (isStuck) {
      const stoppedState = finalStateName;
      const nextChar = finalConfig && finalConfig.inputPos < inputString.length ? `"${inputString[finalConfig.inputPos]}"` : 'end of tape (⊣)';
      const stackTop = finalConfig && finalConfig.stack.length > 0 ? `"${finalConfig.stack[finalConfig.stack.length - 1]}"` : '(empty stack)';
      return {
        title: 'NO VALID TRANSITION (STUCK)',
        subtitle: 'The automaton encountered a dead configuration.',
        reason: `No applicable transition rule exists from state ${stoppedState} reading ${nextChar} with stack-top ${stackTop}.`,
        badge: 'Dead Configuration',
      };
    }
    // Rejected: consumed all input but criterion not met
    if (pda.acceptanceCriterion === 'final-state') {
      return {
        title: 'STRING REJECTED',
        subtitle: 'All input was consumed, but the final state is non-accepting.',
        reason: `Execution halted in state "${finalStateName}", which is not designated as an accepting state (F).`,
        badge: 'Non-Accepting State',
      };
    } else {
      return {
        title: 'STRING REJECTED',
        subtitle: 'All input was consumed, but the stack is not empty.',
        reason: `Empty-stack criterion required, but stack still contains: [${finalConfig?.stack.join(', ') || ''}].`,
        badge: 'Stack Not Empty',
      };
    }
  }

  const rej = getRejectionDetails();

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(6px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="simulation-result-title"
          initial={{ opacity: 0, scale: 0.88, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'var(--color-surface)',
            border: isAccepted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: isAccepted
              ? '0 20px 50px -10px rgba(16, 185, 129, 0.25), 0 0 25px rgba(16, 185, 129, 0.15)'
              : '0 20px 50px -10px rgba(239, 68, 68, 0.25), 0 0 25px rgba(239, 68, 68, 0.15)',
            overflow: 'hidden',
            position: 'relative',
            outline: 'none',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={18} />
          </button>

          {/* Header Banner */}
          <div
            style={{
              padding: '2rem 1.5rem 1.25rem',
              textAlign: 'center',
              background: isAccepted
                ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {/* Animated Icon Badge */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
              {isAccepted ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.05) 70%)',
                      border: '2px solid var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-success)',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                  </motion.div>
                  {/* Subtle celebratory floating particle sparks */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.3, 0.4],
                        x: Math.cos((angle * Math.PI) / 180) * 48,
                        y: Math.sin((angle * Math.PI) / 180) * 48,
                      }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.14, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#34d399',
                        boxShadow: '0 0 10px #10b981',
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                  <div
                    style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: '50%',
                      border: '1.5px dashed rgba(16, 185, 129, 0.5)',
                      animation: 'pulse-ring 2s infinite',
                      pointerEvents: 'none',
                    }}
                  />
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.15, 1] }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.05) 70%)',
                    border: '2px solid var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-error)',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.35)',
                  }}
                >
                  {isStuck ? <AlertTriangle size={36} strokeWidth={2.5} /> : <XCircle size={36} strokeWidth={2.5} />}
                </motion.div>
              )}
            </div>

            <h2
              id="simulation-result-title"
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: isAccepted ? 'var(--color-success)' : 'var(--color-error)',
                marginBottom: '0.25rem',
              }}
            >
              {isAccepted ? 'STRING ACCEPTED' : rej.title}
            </h2>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              {isAccepted ? 'Your pushdown automaton recognized and accepted the string.' : rej.subtitle}
            </p>
          </div>

          {/* Details Body */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Reason block for rejection */}
            {!isAccepted && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  lineHeight: '1.5',
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <ShieldAlert size={18} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--color-error)', display: 'block', marginBottom: '0.15rem' }}>
                    Reason for Failure:
                  </strong>
                  <span>{rej.reason}</span>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
              }}
            >
              {/* Input String */}
              <div
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 0.8rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Input String
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.2rem' }}>
                  {inputString === '' ? 'ε (empty)' : `"${inputString}"`}
                </div>
              </div>

              {/* Transitions */}
              <div
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 0.8rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Transitions Executed
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-accent-light)', marginTop: '0.2rem' }}>
                  {steps.length} {steps.length === 1 ? 'step' : 'steps'}
                </div>
              </div>

              {/* Final State */}
              <div
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 0.8rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {isAccepted ? 'Final State' : 'Halted State'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isAccepted ? 'var(--color-success)' : 'var(--color-error)', marginTop: '0.2rem' }}>
                  {finalStateName} {finalStateObj?.isAccepting ? '(Accepting)' : '(Non-Accepting)'}
                </div>
              </div>

              {/* Criterion */}
              <div
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 0.8rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Acceptance Mode
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.2rem' }}>
                  {pda.acceptanceCriterion === 'final-state' ? 'Final State (q ∈ F)' : 'Empty Stack (N)'}
                </div>
              </div>
            </div>

            {/* Input Consumed Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Input Consumed:</span>
                <span style={{ fontWeight: 700, color: consumedPct === 100 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {consumedPct}% ({consumedChars}/{totalLength} chars)
                </span>
              </div>
              <div className="progress-bar" style={{ height: '6px' }}>
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${consumedPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    backgroundColor: isAccepted ? 'var(--color-success)' : consumedPct === 100 ? 'var(--color-info)' : 'var(--color-error)',
                  }}
                />
              </div>
            </div>

            {/* Final Stack State */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
              }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>Stack at Completion:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text)' }}>
                {finalConfig && finalConfig.stack.length > 0 ? `[${finalConfig.stack.join(', ')}] (top: ${finalConfig.stack[finalConfig.stack.length - 1]})` : '[] (Empty Stack)'}
              </span>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              background: 'var(--color-surface-2)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onViewTrace();
              }}
              style={{ flex: '1 1 auto', justifyContent: 'center' }}
            >
              <ListFilter size={15} />
              {isAccepted ? 'View Execution Trace' : 'Inspect Failed Step'}
            </button>

            <button
              className={isAccepted ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => {
                onClose();
                onReset();
              }}
              style={{
                flex: '1 1 auto',
                justifyContent: 'center',
                background: isAccepted ? 'var(--color-success)' : undefined,
                borderColor: isAccepted ? 'var(--color-success)' : undefined,
              }}
            >
              <RotateCcw size={15} />
              Try Another Input
            </button>

            <button
              className="btn btn-ghost"
              onClick={onClose}
              style={{ flex: '0 0 auto', justifyContent: 'center' }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
