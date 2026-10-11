import { useRef, useState, useCallback } from 'react';
import type { PDADefinition, SimulationConfig, ExecutionStep } from '../../types/pda';

interface AutomatonDiagramProps {
  pda: PDADefinition;
  currentConfig: SimulationConfig | null;
  selectedStep: ExecutionStep | null;
}

const NODE_RADIUS = 28;
const SELF_LOOP_OFFSET = 50;

/** Build a curved path between two states, handling self-loops and bidirectional arrows */
function buildEdgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  isSelf: boolean,
  curvature: number
): string {
  if (isSelf) {
    const { x, y } = from;
    return `M ${x},${y - NODE_RADIUS} C ${x - 35},${y - SELF_LOOP_OFFSET - 20} ${x + 35},${y - SELF_LOOP_OFFSET - 20} ${x},${y - NODE_RADIUS}`;
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  const startX = from.x + ux * NODE_RADIUS;
  const startY = from.y + uy * NODE_RADIUS;
  const endX = to.x - ux * (NODE_RADIUS + 6);
  const endY = to.y - uy * (NODE_RADIUS + 6);

  const mx = (startX + endX) / 2;
  const my = (startY + endY) / 2;
  const cpx = mx - uy * curvature;
  const cpy = my + ux * curvature;

  return `M ${startX},${startY} Q ${cpx},${cpy} ${endX},${endY}`;
}

function edgeLabelPosition(
  from: { x: number; y: number },
  to: { x: number; y: number },
  isSelf: boolean,
  curvature: number
): { x: number; y: number } {
  if (isSelf) {
    return { x: from.x, y: from.y - NODE_RADIUS - SELF_LOOP_OFFSET - 8 };
  }
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: mx - (dy / len) * curvature,
    y: my + (dx / len) * curvature,
  };
}

function transitionLabel(t: { inputSymbol: string; stackTopSymbol: string; stackPush: string }): string {
  const inp = t.inputSymbol === '' || t.inputSymbol === 'ε' ? 'ε' : t.inputSymbol;
  const push = t.stackPush === '' ? 'ε' : t.stackPush;
  return `${inp},${t.stackTopSymbol}→${push}`;
}

export function AutomatonDiagram({ pda, currentConfig, selectedStep }: AutomatonDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Auto-layout states if no position defined
  const statePositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const states = pda.states;
    states.forEach((s, i) => {
      if (s.position) {
        positions[s.id] = s.position;
      } else {
        const angle = (i / states.length) * 2 * Math.PI - Math.PI / 2;
        const r = Math.min(120, 60 * states.length / 2);
        positions[s.id] = {
          x: 350 + r * Math.cos(angle),
          y: 200 + r * Math.sin(angle),
        };
      }
    });
    return positions;
  }, [pda.states]);

  const positions = statePositions();

  // Determine active state and active transition
  const currentStateId = currentConfig?.state ?? null;
  const activeTransitionId = selectedStep?.transitionApplied?.id ?? null;

  // Group transitions by (from, to) pair to detect bidirectional and stagger
  const edgeGroups: Record<string, typeof pda.transitions> = {};
  for (const t of pda.transitions) {
    const key = [t.fromState, t.toState].sort().join('|');
    if (!edgeGroups[key]) edgeGroups[key] = [];
    edgeGroups[key].push(t);
  }

  // Compute curvature for each edge
  function getCurvature(t: typeof pda.transitions[0]): number {
    if (t.fromState === t.toState) return 0;
    const key = [t.fromState, t.toState].sort().join('|');
    const group = edgeGroups[key];
    const isBidir = group.some((g) => g.fromState === t.toState && g.toState === t.fromState);
    return isBidir ? 40 : 0;
  }

  // Group labels by same (from, to, curvature) to merge into one path + multi-line label
  type EdgeGroup = {
    fromId: string;
    toId: string;
    curvature: number;
    isSelf: boolean;
    labels: string[];
    isActive: boolean;
    transitionIds: string[];
  };

  const mergedEdges: EdgeGroup[] = [];
  const seen = new Set<string>();

  for (const t of pda.transitions) {
    const isSelf = t.fromState === t.toState;
    const curvature = getCurvature(t);
    const key = `${t.fromState}|${t.toState}|${curvature}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const peers = pda.transitions.filter((t2) =>
      t2.fromState === t.fromState && t2.toState === t.toState && getCurvature(t2) === curvature
    );
    mergedEdges.push({
      fromId: t.fromState,
      toId: t.toState,
      curvature,
      isSelf,
      labels: peers.map(transitionLabel),
      isActive: peers.some((p) => p.id === activeTransitionId),
      transitionIds: peers.map((p) => p.id),
    });
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.3, Math.min(3, s - e.deltaY * 0.001)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  function getStateClass(stateId: string): string {
    const state = pda.states.find((s) => s.id === stateId);
    if (!state) return 'state-circle';
    if (stateId === currentStateId) return 'state-circle current';
    if (state.isAccepting) return 'state-circle accepting';
    if (state.isInitial) return 'state-circle initial';
    return 'state-circle';
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '280px',
        position: 'relative',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="automaton-svg"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="img"
        aria-label={`Automaton diagram for ${pda.name}`}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-text-muted)" />
          </marker>
          <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-accent-light)" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          {/* Edges */}
          {mergedEdges.map((edge, i) => {
            const fromPos = positions[edge.fromId];
            const toPos = positions[edge.toId];
            if (!fromPos || !toPos) return null;

            const path = buildEdgePath(fromPos, toPos, edge.isSelf, edge.curvature);
            const labelPos = edgeLabelPosition(fromPos, toPos, edge.isSelf, edge.curvature);

            return (
              <g key={`edge-${i}`}>
                <path
                  d={path}
                  className={`arrow-line ${edge.isActive ? 'active' : ''}`}
                  markerEnd={edge.isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                  filter={edge.isActive ? 'url(#glow)' : undefined}
                />
                {edge.labels.map((lbl, li) => (
                  <text
                    key={li}
                    x={labelPos.x}
                    y={labelPos.y + li * 13}
                    className="edge-label"
                    textAnchor="middle"
                    dy="0.35em"
                    style={{
                      fill: edge.isActive ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {lbl}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Initial state arrow */}
          {pda.states.filter((s) => s.isInitial).map((s) => {
            const pos = positions[s.id];
            if (!pos) return null;
            return (
              <g key={`init-${s.id}`}>
                <line
                  x1={pos.x - NODE_RADIUS - 30}
                  y1={pos.y}
                  x2={pos.x - NODE_RADIUS - 2}
                  y2={pos.y}
                  stroke="var(--color-info)"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}

          {/* State nodes */}
          {pda.states.map((state) => {
            const pos = positions[state.id];
            if (!pos) return null;
            const isCurrent = state.id === currentStateId;

            return (
              <g key={state.id}>
                {/* Pulse ring for current state */}
                {isCurrent && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 8}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="1.5"
                    opacity="0.5"
                    style={{ animation: 'pulse-ring 1.5s ease-out infinite' }}
                  />
                )}

                {/* Outer double circle for accepting states */}
                {state.isAccepting && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 5}
                    fill="none"
                    stroke={isCurrent ? 'var(--color-accent)' : 'var(--color-success)'}
                    strokeWidth="1.5"
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS}
                  className={getStateClass(state.id)}
                  filter={isCurrent ? 'url(#glow)' : undefined}
                />

                {/* State label */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    fill: isCurrent ? 'var(--color-accent-light)' : 'var(--color-text)',
                  }}
                >
                  {state.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          aria-label="Zoom in"
        >+</button>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
          onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
          aria-label="Reset zoom"
        >⊡</button>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
          onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}
          aria-label="Zoom out"
        >−</button>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', top: '0.5rem', left: '0.5rem',
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
      }}>
        {[
          { color: 'var(--color-info)',         label: 'Initial' },
          { color: 'var(--color-success)',       label: 'Accepting' },
          { color: 'var(--color-accent-light)',  label: 'Current' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
