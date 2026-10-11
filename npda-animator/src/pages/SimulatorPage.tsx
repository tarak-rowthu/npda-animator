import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward,
  ChevronDown, ChevronUp, BookOpen, Info, CheckCircle2, XCircle, AlertTriangle, Clock
} from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { AutomatonDiagram } from '../components/automaton/AutomatonDiagram';
import { StackVisualization } from '../components/stack/StackVisualization';
import { InputTape } from '../components/input-tape/InputTape';
import { ExecutionTrace } from '../components/execution-trace/ExecutionTrace';
import { BUILT_IN_EXAMPLES, EXAMPLE_TEST_STRINGS } from '../lib/examples/builtinExamples';
import type { ExecutionStatus, PDAState } from '../types/pda';

const SPEED_OPTIONS = [
  { label: 'Slow', ms: 1200 },
  { label: 'Normal', ms: 600 },
  { label: 'Fast', ms: 250 },
  { label: 'Very Fast', ms: 80 },
];

function StatusBadge({ status }: { status: ExecutionStatus }) {
  const configs: Record<ExecutionStatus, { label: string; color: string; icon: React.ReactNode }> = {
    idle: { label: 'Ready', color: 'var(--color-text-muted)', icon: <Clock size={14} /> },
    running: { label: 'Running', color: 'var(--color-info)', icon: <Play size={14} /> },
    paused: { label: 'Paused', color: 'var(--color-warning)', icon: <Pause size={14} /> },
    accepted: { label: 'ACCEPTED', color: 'var(--color-success)', icon: <CheckCircle2 size={14} /> },
    rejected: { label: 'REJECTED', color: 'var(--color-error)', icon: <XCircle size={14} /> },
    stuck: { label: 'STUCK', color: 'var(--color-warning)', icon: <AlertTriangle size={14} /> },
    'invalid-input': { label: 'INVALID INPUT', color: 'var(--color-error)', icon: <XCircle size={14} /> },
    'step-limit-reached': { label: 'LIMIT REACHED', color: 'var(--color-warning)', icon: <AlertTriangle size={14} /> },
  };

  const cfg = configs[status];

  return (
    <motion.div
      key={status}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '9999px',
        background: `${cfg.color}22`,
        border: `1px solid ${cfg.color}44`,
        color: cfg.color,
        fontSize: '0.8rem',
        fontWeight: 700,
      }}
    >
      {cfg.icon} {cfg.label}
    </motion.div>
  );
}

function TransitionPanel() {
  const { sim } = useAppStore();
  const [showTechnical, setShowTechnical] = useState(false);

  const latestStep = sim.executionSteps[sim.executionSteps.length - 1];
  if (!latestStep) {
    return (
      <div style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        No transitions executed yet. Press <strong>Start</strong> or <strong>Step Forward</strong> to begin.
      </div>
    );
  }

  const t = latestStep.transitionApplied;

  return (
    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Transition notation */}
      {t ? (
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Applied Transition
          </div>
          <div className="transition-notation">
            δ({sim.pda.states.find((s: PDAState) => s.id === t.fromState)?.name ?? t.fromState},{' '}
            {t.inputSymbol === '' || t.inputSymbol === 'ε' ? 'ε' : t.inputSymbol},{' '}
            {t.stackTopSymbol}) = ({sim.pda.states.find((s: PDAState) => s.id === t.toState)?.name ?? t.toState},{' '}
            {t.stackPush === '' ? 'ε' : t.stackPush})
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--color-warning)', fontSize: '0.85rem' }}>
          ⚠ No applicable transition — simulation terminal.
        </div>
      )}

      {/* Explanation toggle */}
      <div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
          onClick={() => setShowTechnical((v) => !v)}
        >
          <Info size={13} />
          {showTechnical ? 'Beginner explanation' : 'Technical explanation'}
        </button>

        <div style={{
          marginTop: '0.4rem',
          padding: '0.6rem 0.75rem',
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.82rem',
          lineHeight: '1.6',
          color: 'var(--color-text)',
        }}>
          {showTechnical ? latestStep.technicalExplanation : latestStep.explanation}
        </div>
      </div>

      {/* Stack change */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Stack:</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
          [{latestStep.configBefore.stack.join(', ')}]
        </span>
        <span style={{ color: 'var(--color-accent-light)' }}>→</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
          [{latestStep.configAfter.stack.join(', ')}]
        </span>
      </div>
    </div>
  );
}

function AcceptanceResult() {
  const { sim } = useAppStore();
  const { status, pda } = sim;

  if (status === 'idle' || status === 'running' || status === 'paused') return null;

  const messages: Record<string, { title: string; subtitle: string; color: string }> = {
    accepted: {
      title: '✓ ACCEPTED',
      subtitle: pda.acceptanceCriterion === 'final-state'
        ? `The input was fully consumed in an accepting state (final-state acceptance).`
        : `The input was fully consumed with an empty stack (empty-stack acceptance).`,
      color: 'var(--color-success)',
    },
    rejected: {
      title: '✗ REJECTED',
      subtitle: `The input was fully consumed but the acceptance criterion was not satisfied.`,
      color: 'var(--color-error)',
    },
    stuck: {
      title: '⚠ STUCK',
      subtitle: `No applicable transition exists. The string is rejected (dead configuration).`,
      color: 'var(--color-warning)',
    },
    'invalid-input': {
      title: '✗ INVALID INPUT',
      subtitle: `The input string contains symbols not in the input alphabet.`,
      color: 'var(--color-error)',
    },
    'step-limit-reached': {
      title: '⏱ EXECUTION INCOMPLETE',
      subtitle: `The step limit was reached. The PDA may be in an infinite loop. Increase the step limit to continue.`,
      color: 'var(--color-warning)',
    },
  };

  const msg = messages[status];
  if (!msg) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        background: `${msg.color}11`,
        border: `2px solid ${msg.color}44`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: msg.color, marginBottom: '0.25rem' }}>
        {msg.title}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{msg.subtitle}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
        Criterion: <strong>{pda.acceptanceCriterion === 'final-state' ? 'Final State' : 'Empty Stack'}</strong>
        {' · '}Steps: <strong>{sim.executionSteps.length}</strong>
      </div>
    </motion.div>
  );
}

export function SimulatorPage() {
  const store = useAppStore();
  const { sim, setInputString, initSimulator, stepForward, stepBackward, resetSimulator,
    runToCompletion, startAutoRun, pauseAutoRun, setAnimationSpeed, selectStep, selectPDA } = store;

  const [showTrace, setShowTrace] = useState(true);
  const [inputError, setInputError] = useState('');

  const currentDisplayConfig = sim.selectedStepIndex !== null
    ? sim.executionSteps[sim.selectedStepIndex]?.configAfter ?? sim.currentConfig
    : sim.currentConfig;

  const selectedStepData = sim.selectedStepIndex !== null
    ? sim.executionSteps[sim.selectedStepIndex]
    : null;

  const prevStack = sim.executionSteps.length > 0
    ? sim.executionSteps[sim.executionSteps.length - 1]?.configBefore.stack
    : undefined;

  function handleStart() {
    if (!sim.simulator) {
      initSimulator();
    }
    startAutoRun();
  }

  function handleInputChange(val: string) {
    setInputString(val);
    const badChars = val.split('').filter(ch => !sim.pda.inputAlphabet.includes(ch) && ch !== '');
    if (badChars.length > 0) {
      setInputError(`Symbol(s) not in alphabet: ${[...new Set(badChars)].join(', ')}`);
    } else {
      setInputError('');
    }
  }

  const isFinished = ['accepted','rejected','stuck','invalid-input','step-limit-reached'].includes(sim.status);
  const canStepForward = !isFinished;
  const canStepBackward = sim.executionSteps.length > 0;

  const exampleStrings = EXAMPLE_TEST_STRINGS[sim.pda.id];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0', overflow: 'hidden' }}>

      {/* ── TOP BAR: PDA selector + input ── */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        background: 'var(--color-surface)',
      }}>
        {/* PDA selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Automaton
          </label>
          <select
            value={sim.pda.id}
            onChange={(e) => {
              const found = BUILT_IN_EXAMPLES.find((x) => x.id === e.target.value);
              if (found) selectPDA(found);
            }}
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.6rem',
              color: 'var(--color-text)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
            aria-label="Select automaton"
          >
            {BUILT_IN_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        {/* Input string */}
        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label htmlFor="input-string" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Input String
          </label>
          <input
            id="input-string"
            className="input"
            value={sim.inputString}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter input string (leave empty for ε)"
            aria-describedby={inputError ? 'input-error' : undefined}
            aria-invalid={!!inputError}
            disabled={sim.isAutoRunning}
          />
          {inputError && (
            <div id="input-error" style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}>{inputError}</div>
          )}
        </div>

        {/* Example strings */}
        {exampleStrings && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Examples
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {[...exampleStrings.accepted.slice(0,3), ...exampleStrings.rejected.slice(0,2)].map((s) => (
                <button
                  key={s}
                  className="tag"
                  style={{ cursor: 'pointer', border: '1px solid var(--color-border)' }}
                  onClick={() => { handleInputChange(s); }}
                  title={`Load "${s}"`}
                >
                  {s === '' ? 'ε' : s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end', marginLeft: 'auto' }}>
          <StatusBadge status={sim.status} />
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Step {sim.currentConfig?.stepNumber ?? 0} • Alphabet: [{sim.pda.inputAlphabet.join(',')}]
          </div>
        </div>
      </div>

      {/* ── SIMULATION CONTROLS ── */}
      <div style={{
        padding: '0.5rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        background: 'var(--color-surface-2)',
      }}>
        <button className="btn btn-secondary" onClick={resetSimulator} aria-label="Reset simulation" title="Reset">
          <RotateCcw size={15} />
          <span className="hide-xs">Reset</span>
        </button>

        <button className="btn btn-secondary" onClick={stepBackward} disabled={!canStepBackward || sim.isAutoRunning} aria-label="Step backward" title="Step Back">
          <SkipBack size={15} />
          <span className="hide-xs">Back</span>
        </button>

        {sim.isAutoRunning ? (
          <button className="btn btn-primary" onClick={pauseAutoRun} aria-label="Pause simulation">
            <Pause size={15} /> Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleStart} disabled={isFinished} aria-label="Start auto-run">
            <Play size={15} /> {sim.status === 'idle' ? 'Start' : 'Resume'}
          </button>
        )}

        <button className="btn btn-secondary" onClick={stepForward} disabled={!canStepForward || sim.isAutoRunning} aria-label="Step forward" title="Step Forward">
          <SkipForward size={15} />
          <span className="hide-xs">Step</span>
        </button>

        <button className="btn btn-secondary" onClick={runToCompletion} disabled={isFinished || sim.isAutoRunning} aria-label="Run to completion" title="Run to End">
          <FastForward size={15} />
          <span className="hide-xs">Run All</span>
        </button>

        {/* Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Speed:</span>
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              className={`btn btn-ghost ${sim.animationSpeed === opt.ms ? 'active' : ''}`}
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.72rem',
                background: sim.animationSpeed === opt.ms ? 'rgba(99,102,241,0.2)' : undefined,
                color: sim.animationSpeed === opt.ms ? 'var(--color-accent-light)' : undefined,
              }}
              onClick={() => setAnimationSpeed(opt.ms)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Learning Mode toggle */}
        <button
          className={`btn btn-ghost ${sim.learningMode ? 'active' : ''}`}
          style={{
            marginLeft: 'auto',
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            background: sim.learningMode ? 'rgba(99,102,241,0.15)' : undefined,
            color: sim.learningMode ? 'var(--color-accent-light)' : undefined,
          }}
          onClick={store.toggleLearningMode}
          aria-pressed={sim.learningMode}
        >
          <BookOpen size={14} />
          {sim.learningMode ? 'Learning ON' : 'Learning Mode'}
        </button>
      </div>

      {/* ── MAIN THREE-PANEL LAYOUT ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1fr) minmax(200px, 340px) minmax(280px, 1fr)',
        gridTemplateRows: '1fr',
        gap: 0,
        flex: 1,
        overflow: 'hidden',
        minHeight: 0,
      }} className="simulator-grid">

        {/* LEFT: Automaton Diagram */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <div className="panel-header">
            <span>State Diagram</span>
          </div>
          <div style={{ flex: 1, padding: '0.5rem', overflow: 'hidden' }}>
            <AutomatonDiagram
              pda={sim.pda}
              currentConfig={currentDisplayConfig}
              selectedStep={selectedStepData}
            />
          </div>

          {/* Transition info */}
          <div style={{ borderTop: '1px solid var(--color-border)', maxHeight: '180px', overflowY: 'auto' }}>
            <div className="panel-header">
              <span>Transition Details</span>
            </div>
            <TransitionPanel />
          </div>
        </div>

        {/* CENTER: Stack + Tape + Result */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <div className="panel-header"><span>Input & Stack</span></div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.75rem' }}>
            {/* Tape */}
            <div className="card" style={{ padding: '0.75rem' }}>
              <InputTape
                input={currentDisplayConfig?.input ?? sim.inputString}
                inputPos={currentDisplayConfig?.inputPos ?? 0}
              />
            </div>

            {/* Stack */}
            <div className="card" style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <StackVisualization
                stack={currentDisplayConfig?.stack ?? [sim.pda.initialStackSymbol]}
                previousStack={prevStack}
              />
            </div>

            {/* Acceptance result */}
            <AcceptanceResult />
          </div>
        </div>

        {/* RIGHT: Execution Trace */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="panel-header" style={{ justifyContent: 'space-between' }}>
            <span>Execution Trace ({sim.executionSteps.length} steps)</span>
            <button
              className="btn btn-ghost"
              style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem' }}
              onClick={() => setShowTrace((v) => !v)}
              aria-label={showTrace ? 'Collapse trace' : 'Expand trace'}
            >
              {showTrace ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showTrace && (
            <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.8rem' }}>
              <ExecutionTrace
                steps={sim.executionSteps}
                pda={sim.pda}
                selectedStepIndex={sim.selectedStepIndex}
                onSelectStep={selectStep}
              />
            </div>
          )}

          {/* Selected step explanation */}
          {selectedStepData && (
            <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-accent-light)' }}>
                Step {selectedStepData.stepNumber} Explanation:
              </div>
              {sim.explanationLevel === 'technical'
                ? selectedStepData.technicalExplanation
                : selectedStepData.explanation}
            </div>
          )}

          {/* Automaton info */}
          <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <div><strong>{sim.pda.name}</strong></div>
            <div style={{ marginTop: '0.25rem' }}>{sim.pda.description}</div>
            <div style={{ marginTop: '0.4rem' }}>
              Criterion: <span style={{ color: 'var(--color-accent-light)' }}>
                {sim.pda.acceptanceCriterion === 'final-state' ? 'Final State' : 'Empty Stack'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
