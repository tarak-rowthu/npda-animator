import { useRef, useState, useCallback, useMemo } from 'react';
import type { PDADefinition, SimulationConfig, ExecutionStep, ExecutionStatus, TransitionAnimationEvent } from '../../types/pda';

interface AutomatonDiagramProps {
  pda: PDADefinition;
  currentConfig: SimulationConfig | null;
  selectedStep: ExecutionStep | null;
  status?: ExecutionStatus;
  latestStep?: ExecutionStep | null;
  animationEvent?: TransitionAnimationEvent | null;
}

const NODE_RADIUS = 30;
const SELF_LOOP_OFFSET = 52;

/** Build a curved path between two states, handling self-loops and bidirectional arrows */
function buildEdgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  isSelf: boolean,
  curvature: number
): string {
  if (isSelf) {
    const { x, y } = from;
    return `M ${x},${y - NODE_RADIUS} C ${x - 38},${y - SELF_LOOP_OFFSET - 22} ${x + 38},${y - SELF_LOOP_OFFSET - 22} ${x},${y - NODE_RADIUS}`;
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  const startX = from.x + ux * NODE_RADIUS;
  const startY = from.y + uy * NODE_RADIUS;
  const endX = to.x - ux * (NODE_RADIUS + 7);
  const endY = to.y - uy * (NODE_RADIUS + 7);

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
    return { x: from.x, y: from.y - NODE_RADIUS - SELF_LOOP_OFFSET - 10 };
  }
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: mx - (dy / len) * (curvature * 0.75),
    y: my + (dx / len) * (curvature * 0.75),
  };
}

function transitionLabel(t: { inputSymbol: string; stackTopSymbol: string; stackPush: string }): string {
  const inp = t.inputSymbol === '' || t.inputSymbol === 'ε' ? 'ε' : t.inputSymbol;
  const push = t.stackPush === '' ? 'ε' : t.stackPush;
  return `${inp}, ${t.stackTopSymbol} → ${push}`;
}

export function AutomatonDiagram({
  pda,
  currentConfig,
  selectedStep,
  status = 'idle',
  latestStep = null,
  animationEvent = null,
}: AutomatonDiagramProps) {
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
        const r = Math.min(130, (70 * states.length) / 2);
        positions[s.id] = {
          x: 360 + r * Math.cos(angle),
          y: 200 + r * Math.sin(angle),
        };
      }
    });
    return positions;
  }, [pda.states]);

  const positions = statePositions();

  // Active state
  const currentStateId = currentConfig?.state ?? null;

  // Active transition determination
  const isRunning = status === 'running';
  const isAccepted = status === 'accepted';
  const stepToUse = selectedStep ?? (isRunning || isAccepted ? latestStep : null);
  const activeTransition = selectedStep?.transitionApplied ?? animationEvent?.transitionRule ?? stepToUse?.transitionApplied ?? null;
  const activeTransitionId = activeTransition?.id ?? null;

  // Final accepting state condition (Only when engine confirmed acceptance!)
  const acceptedFinalStateId = useMemo(() => {
    if (!isAccepted || !currentStateId) return null;
    const curr = pda.states.find((s) => s.id === currentStateId);
    return curr?.isAccepting ? currentStateId : null;
  }, [isAccepted, currentStateId, pda.states]);

  // Group transitions by pair
  const edgeGroups: Record<string, typeof pda.transitions> = {};
  for (const t of pda.transitions) {
    const key = [t.fromState, t.toState].sort().join('|');
    if (!edgeGroups[key]) edgeGroups[key] = [];
    edgeGroups[key].push(t);
  }

  function getCurvature(t: typeof pda.transitions[0]): number {
    if (t.fromState === t.toState) return 0;
    const key = [t.fromState, t.toState].sort().join('|');
    const group = edgeGroups[key];
    const isBidir = group.some((g) => g.fromState === t.toState && g.toState === t.fromState);
    return isBidir ? 42 : 0;
  }

  type EdgeGroup = {
    fromId: string;
    toId: string;
    curvature: number;
    isSelf: boolean;
    labels: string[];
    isActive: boolean;
    isAcceptingLead: boolean;
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

    const peers = pda.transitions.filter(
      (t2) => t2.fromState === t.fromState && t2.toState === t.toState && getCurvature(t2) === curvature
    );
    const isActive = peers.some((p) => p.id === activeTransitionId);
    const isAcceptingLead = isActive && isAccepted && t.toState === acceptedFinalStateId;

    mergedEdges.push({
      fromId: t.fromState,
      toId: t.toState,
      curvature,
      isSelf,
      labels: peers.map(transitionLabel),
      isActive,
      isAcceptingLead,
      transitionIds: peers.map((p) => p.id),
    });
  }

  // Dragging handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.4, Math.min(2.5, s - e.deltaY * 0.001)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '290px',
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
        aria-label={`Automaton state diagram for ${pda.name}`}
      >
        <defs>
          {/* Normal arrowhead */}
          <marker id="arrowhead" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 9 3.5, 0 7" fill="var(--color-text-muted)" opacity="0.8" />
          </marker>
          {/* Active arrowhead */}
          <marker id="arrowhead-active" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="var(--color-accent-light)" />
          </marker>
          {/* Accepting lead arrowhead */}
          <marker id="arrowhead-accepting" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="var(--color-success)" />
          </marker>

          {/* Glow filter */}
          <filter id="glow-accent" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="greenBlur" />
            <feMerge>
              <feMergeNode in="greenBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="redBlur" />
            <feMerge>
              <feMergeNode in="redBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          {/* ── EDGES / TRANSITION ARROWS ── */}
          {mergedEdges.map((edge, i) => {
            const fromPos = positions[edge.fromId];
            const toPos = positions[edge.toId];
            if (!fromPos || !toPos) return null;

            const pathId = `edge-path-${i}`;
            const pathD = buildEdgePath(fromPos, toPos, edge.isSelf, edge.curvature);
            const labelPos = edgeLabelPosition(fromPos, toPos, edge.isSelf, edge.curvature);

            const strokeColor = edge.isAcceptingLead
              ? 'var(--color-success)'
              : edge.isActive
              ? 'var(--color-accent-light)'
              : 'var(--color-text-muted)';
            const strokeWidth = edge.isAcceptingLead ? 3 : edge.isActive ? 2.5 : 1.5;
            const markerEnd = edge.isAcceptingLead
              ? 'url(#arrowhead-accepting)'
              : edge.isActive
              ? 'url(#arrowhead-active)'
              : 'url(#arrowhead)';

            return (
              <g key={`edge-${i}`}>
                {/* Background path for hit testing / smooth glow */}
                {edge.isActive && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={edge.isAcceptingLead ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}
                    strokeWidth={edge.isAcceptingLead ? 7 : 6}
                  />
                )}

                {/* Primary Transition Path */}
                <path
                  id={pathId}
                  d={pathD}
                  className={edge.isActive ? 'arrow-flow' : undefined}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={markerEnd}
                  filter={edge.isAcceptingLead ? 'url(#glow-green)' : edge.isActive ? 'url(#glow-accent)' : undefined}
                  style={{
                    transition: 'stroke 0.25s ease, stroke-width 0.25s ease',
                  }}
                />

                {/* Particle moving along the active transition path! */}
                {edge.isActive && (
                  <>
                    {/* Primary bright leading particle */}
                    <circle
                      r={edge.isAcceptingLead ? 5 : 4.2}
                      fill={edge.isAcceptingLead ? '#34d399' : '#818cf8'}
                      filter={edge.isAcceptingLead ? 'url(#glow-green)' : 'url(#glow-accent)'}
                    >
                      <animateMotion
                        dur="0.85s"
                        repeatCount="indefinite"
                        rotate="auto"
                      >
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>

                    {/* Secondary trailing particle for glowing trail effect */}
                    <circle
                      r={edge.isAcceptingLead ? 3.2 : 2.6}
                      fill={edge.isAcceptingLead ? '#6ee7b7' : '#c7d2fe'}
                      opacity="0.75"
                    >
                      <animateMotion
                        dur="0.85s"
                        begin="0.12s"
                        repeatCount="indefinite"
                        rotate="auto"
                      >
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  </>
                )}

                {/* Transition Labels */}
                <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
                  {edge.labels.map((lbl, li) => {
                    const yOffset = (li - (edge.labels.length - 1) / 2) * 13;
                    return (
                      <g key={li} transform={`translate(0, ${yOffset})`}>
                        {/* Label background pill for crystal-clear readability */}
                        <rect
                          x={-(lbl.length * 3.3 + 6)}
                          y="-8"
                          width={lbl.length * 6.6 + 12}
                          height="16"
                          rx="4"
                          fill="var(--color-surface)"
                          stroke={edge.isActive ? (edge.isAcceptingLead ? 'var(--color-success)' : 'var(--color-accent)') : 'var(--color-border)'}
                          strokeWidth={edge.isActive ? '1.5' : '1'}
                          opacity="0.94"
                        />
                        <text
                          textAnchor="middle"
                          dy="0.32em"
                          style={{
                            fill: edge.isAcceptingLead
                              ? 'var(--color-success)'
                              : edge.isActive
                              ? 'var(--color-accent-light)'
                              : 'var(--color-text)',
                            fontSize: '10px',
                            fontWeight: edge.isActive ? 700 : 500,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {lbl}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            );
          })}

          {/* ── INITIAL STATE ARROW ── */}
          {pda.states
            .filter((s) => s.isInitial)
            .map((s) => {
              const pos = positions[s.id];
              if (!pos) return null;
              return (
                <g key={`init-${s.id}`}>
                  <line
                    x1={pos.x - NODE_RADIUS - 32}
                    y1={pos.y}
                    x2={pos.x - NODE_RADIUS - 4}
                    y2={pos.y}
                    stroke="var(--color-info)"
                    strokeWidth="2.5"
                    markerEnd="url(#arrowhead)"
                  />
                  <text
                    x={pos.x - NODE_RADIUS - 36}
                    y={pos.y - 8}
                    textAnchor="end"
                    fill="var(--color-info)"
                    fontSize="10px"
                    fontWeight="700"
                    fontFamily="var(--font-mono)"
                  >
                    START
                  </text>
                </g>
              );
            })}

          {/* ── STATE NODES ── */}
          {pda.states.map((state) => {
            const pos = positions[state.id];
            if (!pos) return null;

            const isCurrent = state.id === currentStateId;
            const isAcceptedFinal = state.id === acceptedFinalStateId;
            const isRejectedHalted = isCurrent && (status === 'rejected' || status === 'stuck' || status === 'invalid-input');
            const isFromState = activeTransition?.fromState === state.id;
            const isToState = activeTransition?.toState === state.id;
            const isDimmed = isRunning && !isCurrent && !isFromState && !isToState;

            return (
              <g
                key={state.id}
                style={{
                  opacity: isDimmed ? 0.38 : 1,
                  transition: 'opacity 0.25s ease',
                }}
              >
                {/* 1. Pulsing ring for FINAL ACCEPTED STATE */}
                {isAcceptedFinal && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NODE_RADIUS + 13}
                      fill="none"
                      stroke="var(--color-success)"
                      strokeWidth="2.2"
                      style={{ animation: 'pulse-ring-success 1.6s ease-out infinite' }}
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NODE_RADIUS + 7}
                      fill="none"
                      stroke="var(--color-success)"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                  </>
                )}

                {/* 2. Pulsing ring for REJECTED / STUCK HALTED STATE */}
                {isRejectedHalted && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 10}
                    fill="none"
                    stroke="var(--color-error)"
                    strokeWidth="2"
                    style={{ animation: 'pulse-ring-error 1.5s ease-out infinite' }}
                  />
                )}

                {/* 3. Pulsing ring for current state (when normal running/paused) */}
                {isCurrent && !isAcceptedFinal && !isRejectedHalted && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 9}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="1.8"
                    opacity="0.6"
                    style={{ animation: 'pulse-ring 1.5s ease-out infinite' }}
                  />
                )}

                {/* 4. Outer double circle for accepting states */}
                {state.isAccepting && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 5}
                    fill="none"
                    stroke={
                      isAcceptedFinal
                        ? 'var(--color-success)'
                        : isCurrent
                        ? isRejectedHalted
                          ? 'var(--color-error)'
                          : 'var(--color-accent)'
                        : 'var(--color-success)'
                    }
                    strokeWidth={isAcceptedFinal ? '2.5' : '1.8'}
                    filter={isAcceptedFinal ? 'url(#glow-green)' : undefined}
                  />
                )}

                {/* 5. Main State Circle with Animated Spring Scale when Accepted! */}
                <g
                  style={{
                    transformOrigin: `${pos.x}px ${pos.y}px`,
                    animation: isAcceptedFinal ? 'scale-settle 0.5s ease-out forwards' : undefined,
                  }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS}
                    fill={
                      isAcceptedFinal
                        ? 'rgba(16, 185, 129, 0.22)'
                        : isRejectedHalted
                        ? 'rgba(239, 68, 68, 0.2)'
                        : isCurrent
                        ? 'rgba(99, 102, 241, 0.22)'
                        : state.isAccepting
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'var(--color-surface-2)'
                    }
                    stroke={
                      isAcceptedFinal
                        ? 'var(--color-success)'
                        : isRejectedHalted
                        ? 'var(--color-error)'
                        : isCurrent
                        ? 'var(--color-accent)'
                        : state.isAccepting
                        ? 'var(--color-success)'
                        : 'var(--color-border)'
                    }
                    strokeWidth={isAcceptedFinal || isRejectedHalted ? '3' : isCurrent ? '2.5' : '2'}
                    filter={
                      isAcceptedFinal
                        ? 'url(#glow-green)'
                        : isRejectedHalted
                        ? 'url(#glow-red)'
                        : isCurrent
                        ? 'url(#glow-accent)'
                        : undefined
                    }
                    style={{ transition: 'all 0.25s ease' }}
                  />

                  {/* State Name */}
                  <text
                    x={pos.x}
                    y={pos.y - (isAcceptedFinal || isRejectedHalted ? 4 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      fill: isAcceptedFinal
                        ? 'var(--color-success)'
                        : isRejectedHalted
                        ? 'var(--color-error)'
                        : isCurrent
                        ? 'var(--color-accent-light)'
                        : 'var(--color-text)',
                    }}
                  >
                    {state.name}
                  </text>

                  {/* Checkmark indicator for accepted final state */}
                  {isAcceptedFinal && (
                    <g transform={`translate(${pos.x - 6}, ${pos.y + 6}) scale(0.65)`}>
                      <path
                        d="M3 10 L7 14 L17 4"
                        fill="none"
                        stroke="var(--color-success)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}

                  {/* Rejection X indicator for rejected halted state */}
                  {isRejectedHalted && (
                    <g transform={`translate(${pos.x - 5}, ${pos.y + 6}) scale(0.62)`}>
                      <path
                        d="M3 3 L13 13 M13 3 L3 13"
                        fill="none"
                        stroke="var(--color-error)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Zoom & Pan Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.6rem',
          right: '0.6rem',
          display: 'flex',
          gap: '0.3rem',
          background: 'var(--color-surface-2)',
          padding: '0.2rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}
      >
        <button
          className="btn btn-ghost"
          style={{ padding: '0.2rem 0.45rem', fontSize: '0.8rem', minHeight: 'unset' }}
          onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
          aria-label="Zoom in diagram"
          title="Zoom In"
        >
          +
        </button>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.2rem 0.45rem', fontSize: '0.8rem', minHeight: 'unset' }}
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          aria-label="Reset zoom and center diagram"
          title="Reset View"
        >
          ⊡
        </button>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.2rem 0.45rem', fontSize: '0.8rem', minHeight: 'unset' }}
          onClick={() => setScale((s) => Math.max(0.4, s - 0.2))}
          aria-label="Zoom out diagram"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* State Diagram Legend */}
      <div
        style={{
          position: 'absolute',
          top: '0.6rem',
          left: '0.6rem',
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          background: 'rgba(22, 27, 39, 0.85)',
          backdropFilter: 'blur(6px)',
          padding: '0.3rem 0.6rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        {[
          { color: 'var(--color-info)', label: 'Initial' },
          { color: 'var(--color-success)', label: 'Accepting' },
          { color: 'var(--color-accent-light)', label: 'Active State' },
          ...(isAccepted ? [{ color: '#34d399', label: 'Accepted State ✓' }] : []),
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.68rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
