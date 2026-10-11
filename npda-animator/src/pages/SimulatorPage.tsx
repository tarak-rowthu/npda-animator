import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { AutomatonDiagram } from '../components/automaton/AutomatonDiagram';
import { StackVisualization } from '../components/stack/StackVisualization';
import { InputTape } from '../components/input-tape/InputTape';
import { ExecutionTrace } from '../components/execution-trace/ExecutionTrace';
import { SimulationResultModal } from '../components/simulator/SimulationResultModal';
import { SimulationStatusBar } from '../components/simulator/SimulationStatusBar';
import { TransitionDetailsCard } from '../components/simulator/TransitionDetailsCard';
import { BUILT_IN_EXAMPLES, EXAMPLE_TEST_STRINGS } from '../lib/examples/builtinExamples';

const SPEED_OPTIONS = [
  { label: 'Slow', ms: 1200 },
  { label: 'Normal', ms: 600 },
  { label: 'Fast', ms: 250 },
  { label: 'Ultra', ms: 80 },
];

function isEpsilon(sym: string): boolean {
  return sym === '' || sym === 'ε';
}

export function SimulatorPage() {
  const store = useAppStore();
  const {
    sim,
    setInputString,
    initSimulator,
    stepForward,
    stepBackward,
    resetSimulator,
    runToCompletion,
    startAutoRun,
    pauseAutoRun,
    setAnimationSpeed,
    selectStep,
    selectPDA,
  } = store;

  const [showTrace, setShowTrace] = useState(true);
  const [inputError, setInputError] = useState('');
  const [mobileTab, setMobileTab] = useState<'diagram' | 'tape-stack' | 'trace'>('diagram');
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const lastTerminalStatusRef = useRef<string | null>(null);

  const isFinished = ['accepted', 'rejected', 'stuck', 'invalid-input', 'step-limit-reached'].includes(sim.status);
  const canStepForward = !isFinished;
  const canStepBackward = sim.executionSteps.length > 0;

  // Open modal automatically when simulation enters terminal state
  useEffect(() => {
    if (isFinished && sim.status !== lastTerminalStatusRef.current) {
      lastTerminalStatusRef.current = sim.status;
      // Slight delay so the user sees the final transition and final state animate first!
      const timer = setTimeout(() => {
        setIsResultModalOpen(true);
      }, 450);
      return () => clearTimeout(timer);
    }
    if (!isFinished) {
      lastTerminalStatusRef.current = null;
    }
  }, [isFinished, sim.status]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      pauseAutoRun();
    };
  }, [pauseAutoRun]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when user is typing in form elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (sim.isAutoRunning) {
          pauseAutoRun();
        } else if (!isFinished) {
          if (!sim.simulator) initSimulator();
          startAutoRun();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (canStepForward && !sim.isAutoRunning) {
          stepForward();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canStepBackward && !sim.isAutoRunning) {
          stepBackward();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetSimulator();
        setIsResultModalOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    sim.isAutoRunning,
    isFinished,
    canStepForward,
    canStepBackward,
    sim.simulator,
    pauseAutoRun,
    initSimulator,
    startAutoRun,
    stepForward,
    stepBackward,
    resetSimulator,
  ]);

  const currentDisplayConfig =
    sim.selectedStepIndex !== null
      ? sim.executionSteps[sim.selectedStepIndex]?.configAfter ?? sim.currentConfig
      : sim.currentConfig;

  const selectedStepData =
    sim.selectedStepIndex !== null ? sim.executionSteps[sim.selectedStepIndex] : null;

  const latestStepData =
    sim.executionSteps.length > 0 ? sim.executionSteps[sim.executionSteps.length - 1] : null;

  const activeDisplayStep = selectedStepData ?? latestStepData;

  const prevStack =
    sim.selectedStepIndex !== null
      ? sim.executionSteps[sim.selectedStepIndex]?.configBefore.stack
      : sim.executionSteps.length > 0
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
    setIsResultModalOpen(false);
    const badChars = val.split('').filter((ch) => !sim.pda.inputAlphabet.includes(ch) && ch !== '');
    if (badChars.length > 0) {
      setInputError(`Disallowed symbol(s): ${[...new Set(badChars)].join(', ')}`);
    } else {
      setInputError('');
    }
  }

  const exampleStrings = EXAMPLE_TEST_STRINGS[sim.pda.id];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0', overflow: 'hidden' }}>
      {/* ── LIVE SIMULATION STATUS BAR ── */}
      <SimulationStatusBar
        status={sim.status}
        currentConfig={currentDisplayConfig}
        pda={sim.pda}
        inputString={sim.inputString}
        stepCount={sim.executionSteps.length}
        onOpenResultCard={() => setIsResultModalOpen(true)}
        isInspectingHistory={sim.selectedStepIndex !== null}
        selectedStepNumber={sim.selectedStepIndex !== null ? sim.selectedStepIndex + 1 : undefined}
        onExitHistoryInspection={() => selectStep(null)}
      />

      {/* ── TOP BAR: PDA selector + Input String + Example Quick Load ── */}
      <div
        style={{
          padding: '0.65rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          background: 'var(--color-surface)',
        }}
      >
        {/* PDA Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <label
            htmlFor="automaton-select"
            style={{
              fontSize: '0.68rem',
              color: 'var(--color-text-muted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Automaton Model
          </label>
          <select
            id="automaton-select"
            value={sim.pda.id}
            onChange={(e) => {
              const found = BUILT_IN_EXAMPLES.find((x) => x.id === e.target.value);
              if (found) {
                selectPDA(found);
                setIsResultModalOpen(false);
              }
            }}
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.65rem',
              color: 'var(--color-text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            aria-label="Select automaton model"
          >
            {BUILT_IN_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {/* Input String Field */}
        <div style={{ flex: 1, minWidth: '190px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              htmlFor="input-string"
              style={{
                fontSize: '0.68rem',
                color: 'var(--color-text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Input Tape String (w)
            </label>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
              Alphabet Σ: [{sim.pda.inputAlphabet.join(', ')}]
            </span>
          </div>

          <input
            id="input-string"
            className="input"
            value={sim.inputString}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type string to test (leave blank for ε empty string)"
            aria-describedby={inputError ? 'input-error' : undefined}
            aria-invalid={!!inputError}
            disabled={sim.isAutoRunning}
            style={{
              height: '34px',
              padding: '0.35rem 0.6rem',
            }}
          />
          {inputError && (
            <div id="input-error" style={{ fontSize: '0.7rem', color: 'var(--color-error)', fontWeight: 600 }}>
              {inputError}
            </div>
          )}
        </div>

        {/* Example Test Strings */}
        {exampleStrings && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div
              style={{
                fontSize: '0.68rem',
                color: 'var(--color-text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Preset Test Cases
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {[...exampleStrings.accepted.slice(0, 3), ...exampleStrings.rejected.slice(0, 2)].map((s) => (
                <button
                  key={s}
                  className="tag"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.2rem 0.45rem',
                    fontSize: '0.72rem',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => handleInputChange(s)}
                  title={`Load string "${s}" into simulator`}
                >
                  {s === '' ? 'ε (empty)' : `"${s}"`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SIMULATION CONTROLS TOOLBAR ── */}
      <div
        style={{
          padding: '0.45rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          flexWrap: 'wrap',
          background: 'var(--color-surface-2)',
        }}
      >
        {/* Reset */}
        <button
          className="btn btn-secondary"
          onClick={() => {
            resetSimulator();
            setIsResultModalOpen(false);
          }}
          aria-label="Reset simulation (Shortcut: R)"
          title="Reset Simulation (R)"
          style={{ padding: '0.35rem 0.65rem' }}
        >
          <RotateCcw size={14} />
          <span className="hide-xs">Reset</span>
        </button>

        {/* Step Backward */}
        <button
          className="btn btn-secondary"
          onClick={stepBackward}
          disabled={!canStepBackward || sim.isAutoRunning}
          aria-label="Step backward (Shortcut: Left Arrow)"
          title="Step Backward (Left Arrow)"
          style={{ padding: '0.35rem 0.65rem' }}
        >
          <SkipBack size={14} />
          <span className="hide-xs">Back</span>
        </button>

        {/* Play / Pause */}
        {sim.isAutoRunning ? (
          <button
            className="btn btn-primary"
            onClick={pauseAutoRun}
            aria-label="Pause auto-run (Shortcut: Space)"
            title="Pause (Space)"
            style={{ padding: '0.35rem 0.85rem' }}
          >
            <Pause size={14} /> Pause
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={isFinished}
            aria-label="Start / Resume auto-run (Shortcut: Space)"
            title="Start / Resume (Space)"
            style={{ padding: '0.35rem 0.85rem' }}
          >
            <Play size={14} /> {sim.status === 'idle' ? 'Start' : 'Resume'}
          </button>
        )}

        {/* Step Forward */}
        <button
          className="btn btn-secondary"
          onClick={stepForward}
          disabled={!canStepForward || sim.isAutoRunning}
          aria-label="Step forward one transition (Shortcut: Right Arrow)"
          title="Step Forward (Right Arrow)"
          style={{ padding: '0.35rem 0.65rem' }}
        >
          <SkipForward size={14} />
          <span className="hide-xs">Step</span>
        </button>

        {/* Run All / Run to Completion */}
        <button
          className="btn btn-secondary"
          onClick={runToCompletion}
          disabled={isFinished || sim.isAutoRunning}
          aria-label="Run to completion"
          title="Run All Transitions to End"
          style={{ padding: '0.35rem 0.65rem' }}
        >
          <FastForward size={14} />
          <span className="hide-xs">Run All</span>
        </button>

        {/* Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.4rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginRight: '2px' }}>Speed:</span>
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              className={`btn btn-ghost ${sim.animationSpeed === opt.ms ? 'active' : ''}`}
              style={{
                padding: '0.15rem 0.45rem',
                fontSize: '0.7rem',
                minHeight: 'unset',
                background: sim.animationSpeed === opt.ms ? 'rgba(99,102,241,0.22)' : undefined,
                color: sim.animationSpeed === opt.ms ? 'var(--color-accent-light)' : undefined,
                fontWeight: sim.animationSpeed === opt.ms ? 700 : 500,
              }}
              onClick={() => setAnimationSpeed(opt.ms)}
              title={`${opt.label} speed (${opt.ms}ms per step)`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Learning Mode Toggle */}
        <button
          className={`btn btn-ghost ${sim.learningMode ? 'active' : ''}`}
          style={{
            marginLeft: 'auto',
            padding: '0.2rem 0.5rem',
            fontSize: '0.72rem',
            background: sim.learningMode ? 'rgba(99,102,241,0.18)' : undefined,
            color: sim.learningMode ? 'var(--color-accent-light)' : undefined,
          }}
          onClick={store.toggleLearningMode}
          aria-pressed={sim.learningMode}
          title="Toggle beginner guidance hints"
        >
          <BookOpen size={13} />
          {sim.learningMode ? 'Learning Mode: ON' : 'Learning Mode'}
        </button>
      </div>

      {/* ── MOBILE TABS (visible only on narrow screens) ── */}
      <div className="show-mobile-tabs" style={{ background: 'var(--color-surface)' }}>
        <div className="tabs" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <button
            className={`tab-item ${mobileTab === 'diagram' ? 'active' : ''}`}
            onClick={() => setMobileTab('diagram')}
          >
            Diagram & Rules
          </button>
          <button
            className={`tab-item ${mobileTab === 'tape-stack' ? 'active' : ''}`}
            onClick={() => setMobileTab('tape-stack')}
          >
            Input & Stack
          </button>
          <button
            className={`tab-item ${mobileTab === 'trace' ? 'active' : ''}`}
            onClick={() => setMobileTab('trace')}
          >
            Trace ({sim.executionSteps.length})
          </button>
        </div>
      </div>

      {/* ── MAIN THREE-PANEL LAYOUT ── */}
      <div
        className={`simulator-grid mobile-tab-${mobileTab}`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.25fr) minmax(220px, 320px) minmax(280px, 1.15fr)',
          gridTemplateRows: '1fr',
          gap: 0,
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* ── PANEL 1 (LEFT): State Diagram + Transition Details ── */}
        <div
          className="simulator-panel-diagram"
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div className="panel-header" style={{ justifyContent: 'space-between' }}>
            <span>State Transition Diagram</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              {sim.pda.states.length} states • {sim.pda.transitions.length} transitions
            </span>
          </div>

          {/* Diagram Canvas */}
          <div style={{ flex: 1, padding: '0.4rem', overflow: 'hidden', minHeight: '260px' }}>
            <AutomatonDiagram
              pda={sim.pda}
              currentConfig={currentDisplayConfig}
              selectedStep={selectedStepData}
              status={sim.status}
              latestStep={latestStepData}
              animationEvent={sim.lastAnimationEvent}
            />
          </div>

          {/* Dynamic Transition Details Card */}
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              maxHeight: '230px',
              overflowY: 'auto',
              background: 'var(--color-surface)',
            }}
          >
            <TransitionDetailsCard
              step={activeDisplayStep}
              pda={sim.pda}
              isTerminal={isFinished}
              terminalReason={sim.simulator?.currentStatus === 'stuck' ? 'Dead configuration — no transition applies' : undefined}
            />
          </div>
        </div>

        {/* ── PANEL 2 (CENTER): Input Tape + Stack Vessel ── */}
        <div
          className="simulator-panel-tape-stack"
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--color-border)',
            overflow: 'hidden',
            background: 'var(--color-bg)',
          }}
        >
          <div className="panel-header">
            <span>Input Tape & Pushdown Stack</span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              padding: '0.75rem',
            }}
          >
            {/* Input Tape Card */}
            <div className="card" style={{ padding: '0.75rem' }}>
              <InputTape
                input={currentDisplayConfig?.input ?? sim.inputString}
                inputPos={currentDisplayConfig?.inputPos ?? 0}
                isAccepted={sim.status === 'accepted'}
                isEpsilonTransition={
                  activeDisplayStep?.transitionApplied ? isEpsilon(activeDisplayStep.transitionApplied.inputSymbol) : false
                }
                pdaId={sim.pda.id}
                animationEvent={sim.lastAnimationEvent}
              />
            </div>

            {/* Stack Vessel Card */}
            <div
              className="card"
              style={{
                padding: '0.75rem',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '230px',
              }}
            >
              <StackVisualization
                stack={currentDisplayConfig?.stack ?? [sim.pda.initialStackSymbol]}
                previousStack={prevStack}
                isError={sim.status === 'stuck'}
                isAccepted={sim.status === 'accepted'}
                animationEvent={sim.lastAnimationEvent}
              />
            </div>
          </div>
        </div>

        {/* ── PANEL 3 (RIGHT): Interactive Execution Trace ── */}
        <div
          className="simulator-panel-trace"
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div className="panel-header" style={{ justifyContent: 'space-between' }}>
            <span>Execution Trace ({sim.executionSteps.length} Steps)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {sim.selectedStepIndex !== null && (
                <button
                  className="btn btn-ghost"
                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem', color: 'var(--color-accent-light)' }}
                  onClick={() => selectStep(null)}
                  title="Clear selection and resume viewing latest live step"
                >
                  Exit Inspection
                </button>
              )}
              <button
                className="btn btn-ghost"
                style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem' }}
                onClick={() => setShowTrace((v) => !v)}
                aria-label={showTrace ? 'Collapse trace table' : 'Expand trace table'}
              >
                {showTrace ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
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

          {/* Selected step details banner */}
          {selectedStepData && (
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                padding: '0.65rem 0.85rem',
                background: 'rgba(99, 102, 241, 0.08)',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <strong style={{ color: 'var(--color-accent-light)' }}>
                  Inspecting Step #{selectedStepData.stepNumber}:
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  Synchronized with diagram & stack
                </span>
              </div>
              <div style={{ color: 'var(--color-text)', lineHeight: 1.5 }}>
                {sim.explanationLevel === 'technical'
                  ? selectedStepData.technicalExplanation
                  : selectedStepData.explanation}
              </div>
            </div>
          )}

          {/* Automaton Specs Footer */}
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: '0.65rem 0.85rem',
              fontSize: '0.74rem',
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface)',
            }}
          >
            <div>
              <strong style={{ color: 'var(--color-text)' }}>{sim.pda.name}</strong>
            </div>
            <div style={{ marginTop: '0.2rem', lineHeight: 1.45 }}>{sim.pda.description}</div>
            <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>
                Acceptance:{' '}
                <strong style={{ color: 'var(--color-accent-light)' }}>
                  {sim.pda.acceptanceCriterion === 'final-state' ? 'Final State (q ∈ F)' : 'Empty Stack (N)'}
                </strong>
              </span>
              <span>
                Stack Bottom: <code style={{ color: 'var(--color-accent-light)' }}>{sim.pda.initialStackSymbol}</code>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── POPUP: Polish Acceptance & Rejection Modals ── */}
      <SimulationResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        status={sim.status}
        pda={sim.pda}
        inputString={sim.inputString}
        steps={sim.executionSteps}
        finalConfig={sim.currentConfig}
        onViewTrace={() => {
          setIsResultModalOpen(false);
          setShowTrace(true);
          setMobileTab('trace');
        }}
        onReset={() => {
          resetSimulator();
          setIsResultModalOpen(false);
        }}
      />
    </div>
  );
}
