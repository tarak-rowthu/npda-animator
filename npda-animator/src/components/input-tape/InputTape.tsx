import { motion } from 'framer-motion';

interface InputTapeProps {
  input: string;
  inputPos: number;
}

export function InputTape({ input, inputPos }: InputTapeProps) {
  if (input.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>INPUT TAPE</div>
        <div style={{
          padding: '0.5rem 1rem',
          border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-muted)',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
        }}>
          ε (empty string)
        </div>
      </div>
    );
  }

  const chars = input.split('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>INPUT TAPE</div>

      {/* Read head indicator */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            overflowX: 'auto',
            display: 'flex',
            paddingBottom: '0.25rem',
            paddingTop: '0.25rem',
            maxWidth: '100%',
          }}
          role="group"
          aria-label={`Input tape: ${input}, current position ${inputPos}`}
        >
          {chars.map((ch, idx) => {
            const state = idx < inputPos ? 'consumed' : idx === inputPos ? 'current' : 'remaining';
            return (
              <motion.div
                key={idx}
                className={`tape-cell ${state}`}
                animate={state === 'current' ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                aria-label={`Position ${idx}: "${ch}" — ${state}`}
                style={{
                  borderLeft: idx === 0 ? '2px solid var(--color-border)' : undefined,
                  borderRadius: idx === 0
                    ? '4px 0 0 4px'
                    : idx === chars.length - 1
                    ? '0 4px 4px 0'
                    : undefined,
                }}
              >
                {ch}
              </motion.div>
            );
          })}

          {/* End marker */}
          <div
            className="tape-cell"
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              borderLeft: 'none',
              borderRadius: '0 4px 4px 0',
              minWidth: '2rem',
              background: inputPos >= chars.length ? 'rgba(99,102,241,0.1)' : 'transparent',
            }}
            aria-label={`End of input${inputPos >= chars.length ? ' (reached)' : ''}`}
          >
            ⊣
          </div>
        </div>
      </div>

      {/* Read head pointer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span>Position:</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-light)', fontWeight: 600 }}>
          {inputPos >= chars.length ? 'END' : inputPos}
        </span>
        <span>•</span>
        <span>Remaining:</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
          &quot;{input.slice(inputPos)}&quot;
        </span>
      </div>
    </div>
  );
}
