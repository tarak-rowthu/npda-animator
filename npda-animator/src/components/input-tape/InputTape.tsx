import { motion } from 'framer-motion';
import { ArrowDown, Check } from 'lucide-react';
import type { TransitionAnimationEvent } from '../../types/pda';

interface InputTapeProps {
  input: string;
  inputPos: number;
  isAccepted?: boolean;
  isEpsilonTransition?: boolean;
  pdaId?: string;
  animationEvent?: TransitionAnimationEvent | null;
}

export function InputTape({
  input,
  inputPos,
  isAccepted,
  isEpsilonTransition,
  pdaId,
  animationEvent,
}: InputTapeProps) {
  const isMarkedPalindrome = pdaId === 'marked-palindrome';
  const isCompleted = input.length > 0 && inputPos >= input.length;
  const isEps = isEpsilonTransition || (animationEvent?.isEpsilon ?? false);

  if (input.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            INPUT TAPE
          </span>
          {isAccepted && (
            <span style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontWeight: 700 }}>
              ✓ Empty String Accepted
            </span>
          )}
        </div>
        <div
          style={{
            padding: '0.6rem 1.25rem',
            border: isAccepted ? '2px solid var(--color-success)' : '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: isAccepted ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface-2)',
            color: isAccepted ? 'var(--color-success)' : 'var(--color-text-muted)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>ε</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(empty string input)</span>
        </div>
      </div>
    );
  }

  const chars = input.split('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
      {/* Tape Title & Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          INPUT TAPE
        </span>

        {isCompleted ? (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--color-success)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.1rem 0.4rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <Check size={11} /> 100% Consumed
          </span>
        ) : isEps ? (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--color-accent-light)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.1rem 0.4rem',
            }}
          >
            ε-move (Head stationary)
          </span>
        ) : (
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Reading [{inputPos < chars.length ? `"${chars[inputPos]}"` : 'End'}]
          </span>
        )}
      </div>

      {/* Tape Scroll Container with Animated Cells */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          display: 'flex',
          justifyContent: 'center',
          padding: '0.5rem 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
          role="group"
          aria-label={`Input tape: ${input}, head at position ${inputPos}`}
        >
          {chars.map((ch, idx) => {
            const isConsumed = idx < inputPos;
            const isCurrent = idx === inputPos;
            const isCenterMarker = isMarkedPalindrome && ch === 'c';

            return (
              <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Pointer arrow directly above the active cell */}
                {isCurrent && (
                  <motion.div
                    layoutId="tape-pointer"
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                      position: 'absolute',
                      top: '-18px',
                      color: isCenterMarker ? '#c084fc' : 'var(--color-accent-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <ArrowDown size={14} strokeWidth={3} />
                  </motion.div>
                )}

                {/* Tape Cell */}
                <motion.div
                  className={`tape-cell ${isConsumed ? 'consumed' : isCurrent ? 'current' : 'remaining'}`}
                  animate={
                    isCurrent
                      ? { scale: 1.1, y: -2 }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ duration: 0.18 }}
                  aria-label={`Position ${idx}: "${ch}" — ${isConsumed ? 'consumed' : isCurrent ? 'current read head' : 'unconsumed'}`}
                  style={{
                    borderLeft: idx === 0 ? '2px solid var(--color-border)' : undefined,
                    borderRadius: idx === 0 ? '6px 0 0 6px' : undefined,
                    opacity: isConsumed ? 0.45 : 1,
                    backgroundColor: isCenterMarker
                      ? isCurrent
                        ? 'rgba(168, 85, 247, 0.25)'
                        : 'rgba(168, 85, 247, 0.12)'
                      : undefined,
                    borderColor: isCenterMarker
                      ? '#a855f7'
                      : isCurrent
                      ? 'var(--color-accent)'
                      : undefined,
                    color: isCenterMarker
                      ? '#d8b4fe'
                      : undefined,
                    boxShadow: isCenterMarker && isCurrent
                      ? '0 0 12px rgba(168, 85, 247, 0.5)'
                      : undefined,
                  }}
                  title={isCenterMarker ? `Center marker "c" at pos ${idx}` : `Symbol "${ch}" at pos ${idx}`}
                >
                  {ch}
                </motion.div>

                {/* Sub-label for index */}
                <span
                  style={{
                    fontSize: '0.6rem',
                    color: isCurrent ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '2px',
                    fontWeight: isCurrent ? 700 : 400,
                  }}
                >
                  {idx}
                </span>
              </div>
            );
          })}

          {/* End-of-Tape Sentinel ⊣ */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {inputPos >= chars.length && (
              <motion.div
                layoutId="tape-pointer"
                style={{
                  position: 'absolute',
                  top: '-18px',
                  color: isAccepted ? 'var(--color-success)' : 'var(--color-accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowDown size={14} strokeWidth={3} />
              </motion.div>
            )}

            <div
              className="tape-cell"
              style={{
                color: isCompleted ? (isAccepted ? 'var(--color-success)' : 'var(--color-text)') : 'var(--color-text-muted)',
                fontSize: '0.85rem',
                borderLeft: 'none',
                borderRadius: '0 6px 6px 0',
                minWidth: '2.4rem',
                background: isCompleted ? (isAccepted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)') : 'transparent',
                borderColor: isCompleted ? (isAccepted ? 'var(--color-success)' : 'var(--color-accent)') : undefined,
                boxShadow: isCompleted && isAccepted ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none',
              }}
              aria-label={`End of input marker ⊣${inputPos >= chars.length ? ' (reached)' : ''}`}
              title="End of input tape (⊣)"
            >
              ⊣
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>END</span>
          </div>
        </div>
      </div>

      {/* Tape Position and Remaining Input Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.74rem',
          color: 'var(--color-text-muted)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span>Pos:</span>
        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-light)' }}>
          {inputPos >= chars.length ? 'END (⊣)' : inputPos}
        </strong>
        <span>•</span>
        <span>Remaining:</span>
        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
          {input.slice(inputPos) ? `"${input.slice(inputPos)}"` : 'ε (none)'}
        </strong>
      </div>
    </div>
  );
}
