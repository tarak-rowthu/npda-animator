import { motion, AnimatePresence } from 'framer-motion';

interface StackVisualizationProps {
  stack: string[];  // stack[length-1] is the TOP
  previousStack?: string[];
}

export function StackVisualization({ stack }: StackVisualizationProps) {
  const maxVisible = 12;
  const displayStack = [...stack].reverse(); // top first for visual rendering

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      {/* Label */}
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        STACK
      </div>

      {/* TOP label */}
      <div style={{ fontSize: '0.65rem', color: 'var(--color-accent-light)', fontWeight: 600, opacity: stack.length > 0 ? 1 : 0 }}>
        ↑ TOP
      </div>

      {/* Stack cells */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          minHeight: '160px',
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: '100%',
        }}
        role="list"
        aria-label="Stack contents"
      >
        {stack.length === 0 ? (
          <div style={{
            width: '3rem', height: '2.5rem', border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)', fontSize: '0.75rem',
          }}>
            empty
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayStack.slice(0, maxVisible).map((sym, idx) => {
              const isTop = idx === 0;
              const stackIndex = stack.length - 1 - idx;

              return (
                <motion.div
                  key={`${sym}-${stackIndex}`}
                  role="listitem"
                  aria-label={`Stack position ${stackIndex}: ${sym}${isTop ? ' (top)' : ''}`}
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
                  className={`stack-cell ${isTop ? 'is-top' : ''}`}
                  style={{ width: '3rem', height: '2.5rem' }}
                >
                  {sym}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {displayStack.length > maxVisible && (
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            +{displayStack.length - maxVisible} more...
          </div>
        )}
      </div>

      {/* BOTTOM label */}
      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
        ↓ BOTTOM
      </div>

      {/* Stack summary */}
      <div style={{
        fontSize: '0.7rem', color: 'var(--color-text-muted)',
        background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)',
        padding: '0.25rem 0.5rem', maxWidth: '100%', textAlign: 'center',
        fontFamily: 'var(--font-mono)', marginTop: '0.25rem',
        wordBreak: 'break-all',
      }}>
        [{stack.join(', ')}]
      </div>
    </div>
  );
}
