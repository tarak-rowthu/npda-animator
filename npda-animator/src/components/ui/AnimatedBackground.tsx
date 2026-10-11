import React, { useMemo } from 'react';

// List of decorative mathematical symbols
const symbols = [
  'q₀', 'q₁', 'q₂', 'q₃', 'δ', 'ε', 'Σ', 'Γ', 'Z₀', '0', '1', '(', ')', '\u2192', '\u2190', '\u2194',
];

// Helper to generate random float between min and max
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export const AnimatedBackground: React.FC = () => {
  // Generate particles and symbols only once per mount
  const particles = useMemo(() => {
    const count = 30;
    return Array.from({ length: count }).map((_, i) => {
      const size = rand(2, 6);
      const left = rand(0, 100);
      const top = rand(0, 100);
      const delay = rand(0, 6);
      const duration = rand(8, 20);
      const opacity = rand(0.1, 0.4);
      const dx = rand(-10, 10);
      const dy = rand(-10, 10);
      return (
        <div
          key={i}
          className="particle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            top: `${top}%`,
            opacity,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            transform: `translate(${dx}px, ${dy}px)`,
          }}
        />
      );
    });
  }, []);

  const renderedSymbols = useMemo(() => {
    // Render a smaller number of symbols to avoid clutter
    const count = 12;
    return Array.from({ length: count }).map((_, i) => {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const left = rand(0, 100);
      const top = rand(0, 100);
      const delay = rand(0, 8);
      const duration = rand(12, 30);
      const scale = rand(0.8, 1.2);
      const color = `hsla(${rand(220, 260)}, 80%, 70%, 0.12)`;
      return (
        <span
          key={i}
          className="decor-symbol"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            fontSize: `${rand(12, 24)}px`,
            transform: `scale(${scale})`,
            color,
          }}
        >
          {sym}
        </span>
      );
    });
  }, []);

  return (
    <div className="animated-background" aria-hidden="true">
      {/* Gradient orbs */}
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />
      {/* Floating particles */}
      {particles}
      {/* Decorative symbols */}
      {renderedSymbols}
    </div>
  );
};
