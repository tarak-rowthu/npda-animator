import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Minus, AlertTriangle, Layers, Zap } from 'lucide-react';
import type { TransitionAnimationEvent } from '../../types/pda';

interface StackVisualizationProps {
  stack: string[]; // stack[length-1] is the TOP
  previousStack?: string[];
  isError?: boolean;
  errorMessage?: string;
  isAccepted?: boolean;
  animationEvent?: TransitionAnimationEvent | null;
}

export function StackVisualization({
  stack,
  previousStack,
  isError,
  errorMessage,
  isAccepted,
  animationEvent,
}: StackVisualizationProps) {
  const maxVisible = 10;
  const displayStack = useMemo(() => [...stack].reverse(), [stack]); // top first for rendering

  // Determine current stack operation (driven by simulation animation events or previousStack comparison)
  const operation = useMemo(() => {
    if (animationEvent) {
      if (animationEvent.operationType === 'push') {
        const pushed = animationEvent.pushedSymbols || stack[stack.length - 1] || '';
        return {
          type: 'push' as const,
          label: `PUSH "${pushed}"`,
          pushedSymbols: pushed,
          color: 'var(--color-success)',
          icon: <ArrowDown size={13} />,
        };
      }
      if (animationEvent.operationType === 'pop') {
        const popped = animationEvent.poppedSymbol || '';
        return {
          type: 'pop' as const,
          label: `POP "${popped}"`,
          poppedSymbol: popped,
          color: '#f97316',
          icon: <ArrowUp size={13} />,
        };
      }
      if (animationEvent.operationType === 'replace') {
        return {
          type: 'replace' as const,
          label: `REPLACE → "${animationEvent.pushedSymbols || ''}"`,
          color: 'var(--color-info)',
          icon: <Layers size={13} />,
        };
      }
      if (animationEvent.isEpsilon) {
        return {
          type: 'none' as const,
          label: 'ε-TRANSITION (NO TAPE CONSUMED)',
          color: 'var(--color-accent-light)',
          icon: <Zap size={13} />,
        };
      }
      return {
        type: 'none' as const,
        label: 'NO STACK CHANGE',
        color: 'var(--color-text-muted)',
        icon: <Minus size={13} />,
      };
    }

    if (!previousStack) return null;
    if (stack.length > previousStack.length) {
      const diff = stack.length - previousStack.length;
      const pushedSymbols = stack.slice(stack.length - diff).join('');
      return {
        type: 'push' as const,
        label: `PUSH "${pushedSymbols}"`,
        pushedSymbols,
        color: 'var(--color-success)',
        icon: <ArrowDown size={13} />,
      };
    }
    if (stack.length < previousStack.length) {
      const poppedSymbol = previousStack[previousStack.length - 1];
      return {
        type: 'pop' as const,
        label: `POP "${poppedSymbol}"`,
        poppedSymbol,
        color: '#f97316',
        icon: <ArrowUp size={13} />,
      };
    }
    if (stack.length > 0 && previousStack.length > 0) {
      if (stack[stack.length - 1] !== previousStack[previousStack.length - 1]) {
        return {
          type: 'replace' as const,
          label: `REPLACE → "${stack[stack.length - 1]}"`,
          color: 'var(--color-info)',
          icon: <Layers size={13} />,
        };
      }
    }
    return {
      type: 'none' as const,
      label: 'NO STACK CHANGE',
      color: 'var(--color-text-muted)',
      icon: <Minus size={13} />,
    };
  }, [stack, previousStack, animationEvent]);

  const topSymbol = stack.length > 0 ? stack[stack.length - 1] : undefined;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        width: '100%',
      }}
    >
      {/* Header and Operation Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 0.25rem',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          PUSHDOWN STACK
        </span>

        {/* Dynamic Operation Badge */}
        {operation && (
          <motion.div
            key={operation.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: `${operation.color}18`,
              border: `1px solid ${operation.color}44`,
              color: operation.color,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {operation.icon}
            {operation.label}
          </motion.div>
        )}
      </div>

      {/* Stack Error Banner if applicable */}
      {isError && (
        <div
          style={{
            width: '100%',
            padding: '0.4rem 0.6rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            color: 'var(--color-error)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          <span>{errorMessage || `Stack top symbol "${topSymbol ?? '(empty)'}" has no matching transition rule.`}</span>
        </div>
      )}

      {/* TOP Indicator Arrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.68rem',
          color: isAccepted ? 'var(--color-success)' : 'var(--color-accent-light)',
          fontWeight: 700,
          opacity: stack.length > 0 ? 1 : 0.4,
          transition: 'all 0.2s ease',
        }}
      >
        <span>↓ READ / WRITE HEAD (TOP)</span>
      </div>

      {/* Physical Stack Vessel Container */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          minHeight: '175px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0.4rem 0.5rem',
          background: 'rgba(15, 17, 23, 0.45)',
          borderLeft: '3px solid var(--color-border)',
          borderRight: '3px solid var(--color-border)',
          borderBottom: isAccepted ? '4px solid var(--color-success)' : '4px solid var(--color-accent)',
          borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
          boxShadow: isAccepted
            ? '0 6px 20px rgba(16, 185, 129, 0.15)'
            : '0 6px 16px rgba(0, 0, 0, 0.25)',
        }}
        role="list"
        aria-label="Pushdown stack elements"
      >
        {stack.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              fontStyle: 'italic',
              gap: '0.3rem',
            }}
          >
            <span>[ Empty Stack ]</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>0 symbols</span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              width: '100%',
              alignItems: 'center',
            }}
          >
            <AnimatePresence mode="popLayout">
              {displayStack.slice(0, maxVisible).map((sym, idx) => {
                const isTop = idx === 0;
                const stackIndex = stack.length - 1 - idx;

                return (
                  <motion.div
                    key={`${sym}-${stackIndex}`}
                    role="listitem"
                    aria-label={`Stack position ${stackIndex}: ${sym}${isTop ? ' (top)' : ''}`}
                    initial={{ opacity: 0, y: -48, scale: 0.7 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isTop ? 1.04 : 1,
                      borderColor: isError && isTop
                        ? 'var(--color-error)'
                        : isAccepted && isTop
                        ? 'var(--color-success)'
                        : isTop && operation?.type === 'push'
                        ? 'var(--color-success)'
                        : isTop
                        ? 'var(--color-accent)'
                        : 'var(--color-border)',
                    }}
                    exit={{ opacity: 0, y: -45, scale: 0.7 }}
                    transition={{ duration: 0.28, type: 'spring', stiffness: 420, damping: 24 }}
                    style={{
                      width: '100%',
                      height: '2.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-sm)',
                      background: isError && isTop
                        ? 'rgba(239, 68, 68, 0.2)'
                        : isAccepted
                        ? 'rgba(16, 185, 129, 0.15)'
                        : isTop
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'var(--color-surface-2)',
                      border: '2px solid',
                      borderColor: isError && isTop
                        ? 'var(--color-error)'
                        : isAccepted
                        ? 'var(--color-success)'
                        : isTop
                        ? 'var(--color-accent)'
                        : 'var(--color-border)',
                      boxShadow: isTop
                        ? isAccepted
                          ? '0 0 12px rgba(16, 185, 129, 0.4)'
                          : '0 0 10px rgba(99, 102, 241, 0.35)'
                        : 'none',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: isError && isTop
                        ? 'var(--color-error)'
                        : isAccepted
                        ? 'var(--color-success)'
                        : isTop
                        ? 'var(--color-accent-light)'
                        : 'var(--color-text)',
                    }}
                  >
                    <span>{sym}</span>
                    {isTop && (
                      <span
                        style={{
                          position: 'absolute',
                          right: '6px',
                          fontSize: '0.6rem',
                          color: isAccepted ? 'var(--color-success)' : 'var(--color-accent-light)',
                          fontWeight: 600,
                        }}
                      >
                        TOP
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {displayStack.length > maxVisible && (
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                +{displayStack.length - maxVisible} more hidden...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stack Bottom Plate */}
      <div
        style={{
          fontSize: '0.65rem',
          color: 'var(--color-text-muted)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginTop: '0.1rem',
        }}
      >
        <span>⊥ STACK BASE</span>
        <span>•</span>
        <span>Depth: {stack.length}</span>
      </div>

      {/* Summary Tape Representation */}
      <div
        style={{
          fontSize: '0.72rem',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.2rem 0.55rem',
          maxWidth: '100%',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          border: '1px solid var(--color-border)',
          wordBreak: 'break-all',
        }}
      >
        Contents: [{stack.join(', ')}]
      </div>
    </div>
  );
}
