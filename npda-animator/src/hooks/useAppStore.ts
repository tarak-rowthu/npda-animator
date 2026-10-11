/**
 * Global application state using Zustand.
 */

import { create } from 'zustand';
import type { PDADefinition, ExecutionStatus, SimulationConfig, ExecutionStep, TransitionAnimationEvent, StackOperationType } from '../types/pda';
import { PDASimulator, isEpsilon } from '../lib/simulation-engine/pdaEngine';
import { BUILT_IN_EXAMPLES } from '../lib/examples/builtinExamples';
import {
  loadProgress,
  recordSimulation,
} from '../lib/storage/storage';
import type { UserProgress } from '../types/pda';

export type AppPage =
  | 'home'
  | 'simulator'
  | 'builder'
  | 'examples'
  | 'theory'
  | 'playground'
  | 'quiz'
  | 'dashboard';

export type AppTheme = 'dark' | 'light';

interface SimulatorState {
  pda: PDADefinition;
  inputString: string;
  simulator: PDASimulator | null;
  status: ExecutionStatus;
  currentConfig: SimulationConfig | null;
  executionSteps: ExecutionStep[];
  selectedStepIndex: number | null;
  animationSpeed: number;   // ms per step
  isAutoRunning: boolean;
  autoRunInterval: ReturnType<typeof setInterval> | null;
  learningMode: boolean;
  explanationLevel: 'beginner' | 'technical';
  lastAnimationEvent: TransitionAnimationEvent | null;
}

interface AppState {
  // Navigation
  currentPage: AppPage;
  theme: AppTheme;

  // Simulator
  sim: SimulatorState;

  // Progress
  progress: UserProgress;

  // Actions
  setPage: (page: AppPage) => void;
  toggleTheme: () => void;

  // PDA selection
  selectPDA: (pda: PDADefinition) => void;
  setInputString: (s: string) => void;

  // Simulation controls
  initSimulator: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  resetSimulator: () => void;
  runToCompletion: () => void;
  startAutoRun: () => void;
  pauseAutoRun: () => void;
  setAnimationSpeed: (ms: number) => void;
  selectStep: (idx: number | null) => void;
  toggleLearningMode: () => void;
  setExplanationLevel: (level: 'beginner' | 'technical') => void;

  // Progress tracking
  refreshProgress: () => void;
}

const initialPDA = BUILT_IN_EXAMPLES[0];

function makeInitialSimState(): SimulatorState {
  return {
    pda: initialPDA,
    inputString: '(())',
    simulator: null,
    status: 'idle',
    currentConfig: null,
    executionSteps: [],
    selectedStepIndex: null,
    animationSpeed: 600,
    isAutoRunning: false,
    autoRunInterval: null,
    learningMode: false,
    explanationLevel: 'beginner',
    lastAnimationEvent: null,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'home',
  theme: 'dark',
  sim: makeInitialSimState(),
  progress: loadProgress(),

  setPage: (page) => {
    set({ currentPage: page });
    get().refreshProgress();
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    document.documentElement.classList.toggle('light', next === 'light');
  },

  selectPDA: (pda) => {
    get().pauseAutoRun();
    set((s) => ({
      sim: {
        ...s.sim,
        pda,
        simulator: null,
        status: 'idle',
        currentConfig: null,
        executionSteps: [],
        selectedStepIndex: null,
        isAutoRunning: false,
        lastAnimationEvent: null,
      },
    }));
  },

  setInputString: (inputString) => {
    get().pauseAutoRun();
    set((s) => ({
      sim: {
        ...s.sim,
        inputString,
        simulator: null,
        status: 'idle',
        currentConfig: null,
        executionSteps: [],
        selectedStepIndex: null,
        isAutoRunning: false,
        lastAnimationEvent: null,
      },
    }));
  },

  initSimulator: () => {
    get().pauseAutoRun();
    const { pda, inputString } = get().sim;
    const sim = new PDASimulator(pda, inputString);
    const initCfg = sim.currentConfig;
    set((s) => ({
      sim: {
        ...s.sim,
        simulator: sim,
        status: 'idle',
        currentConfig: initCfg,
        executionSteps: [],
        selectedStepIndex: null,
        isAutoRunning: false,
        lastAnimationEvent: null,
      },
    }));
  },

  stepForward: () => {
    const { simulator } = get().sim;
    if (!simulator) {
      get().initSimulator();
      return;
    }
    const advanced = simulator.stepForward();
    const newStatus = simulator.currentStatus;
    const newCfg = simulator.currentConfig;
    const steps = simulator.executionSteps;

    const latestStep = steps[steps.length - 1];
    let animEvent: TransitionAnimationEvent | null = null;
    if (latestStep) {
      const beforeStack = latestStep.configBefore.stack;
      const afterStack = latestStep.configAfter.stack;
      let opType: StackOperationType = 'none';
      if (afterStack.length > beforeStack.length) {
        opType = 'push';
      } else if (afterStack.length < beforeStack.length) {
        opType = 'pop';
      } else if (
        latestStep.transitionApplied &&
        latestStep.transitionApplied.stackPush !== latestStep.transitionApplied.stackTopSymbol
      ) {
        opType = 'replace';
      }

      const t = latestStep.transitionApplied;
      animEvent = {
        id: `${latestStep.stepNumber}-${Date.now()}`,
        stepNumber: latestStep.stepNumber,
        fromState: latestStep.configBefore.state,
        toState: latestStep.configAfter.state,
        inputSymbolConsumed: t && !isEpsilon(t.inputSymbol) ? t.inputSymbol : null,
        isEpsilon: t ? isEpsilon(t.inputSymbol) : false,
        stackBefore: beforeStack,
        stackAfter: afterStack,
        transitionRule: t,
        operationType: opType,
        pushedSymbols: t?.stackPush || undefined,
        poppedSymbol: t?.stackTopSymbol || undefined,
        status: newStatus,
        isAccepted: newStatus === 'accepted',
        isRejected: newStatus === 'rejected',
        isStuck: newStatus === 'stuck',
        timestamp: Date.now(),
      };
    }

    set((s) => ({
      sim: {
        ...s.sim,
        status: newStatus,
        currentConfig: newCfg,
        executionSteps: [...steps],
        lastAnimationEvent: animEvent,
      },
    }));

    if (!advanced && newStatus !== 'running') {
      get().pauseAutoRun();
      const { pda, inputString } = get().sim;
      recordSimulation({
        id: Date.now().toString(),
        pdaId: pda.id,
        pdaName: pda.name,
        inputString,
        result: newStatus,
        stepCount: steps.length,
        timestamp: Date.now(),
      });
      get().refreshProgress();
    }
  },

  stepBackward: () => {
    const { simulator } = get().sim;
    if (!simulator) return;
    simulator.stepBackward();
    set((s) => ({
      sim: {
        ...s.sim,
        status: simulator.currentStatus,
        currentConfig: simulator.currentConfig,
        executionSteps: [...simulator.executionSteps],
        lastAnimationEvent: null,
      },
    }));
  },

  resetSimulator: () => {
    get().pauseAutoRun();
    const { pda, inputString } = get().sim;
    const sim = new PDASimulator(pda, inputString);
    set((s) => ({
      sim: {
        ...s.sim,
        simulator: sim,
        status: 'idle',
        currentConfig: sim.currentConfig,
        executionSteps: [],
        selectedStepIndex: null,
        isAutoRunning: false,
        lastAnimationEvent: null,
      },
    }));
  },

  runToCompletion: () => {
    get().pauseAutoRun();
    const { simulator, pda, inputString } = get().sim;
    const sim = simulator ?? new PDASimulator(pda, inputString);
    if (!simulator) {
      set((s) => ({ sim: { ...s.sim, simulator: sim } }));
    }
    const result = sim.runToCompletion();
    const latestStep = result.steps[result.steps.length - 1];
    let animEvent: TransitionAnimationEvent | null = null;
    if (latestStep) {
      const beforeStack = latestStep.configBefore.stack;
      const afterStack = latestStep.configAfter.stack;
      let opType: StackOperationType = 'none';
      if (afterStack.length > beforeStack.length) {
        opType = 'push';
      } else if (afterStack.length < beforeStack.length) {
        opType = 'pop';
      }

      const t = latestStep.transitionApplied;
      animEvent = {
        id: `${latestStep.stepNumber}-${Date.now()}`,
        stepNumber: latestStep.stepNumber,
        fromState: latestStep.configBefore.state,
        toState: latestStep.configAfter.state,
        inputSymbolConsumed: t && !isEpsilon(t.inputSymbol) ? t.inputSymbol : null,
        isEpsilon: t ? isEpsilon(t.inputSymbol) : false,
        stackBefore: beforeStack,
        stackAfter: afterStack,
        transitionRule: t,
        operationType: opType,
        status: result.status,
        isAccepted: result.status === 'accepted',
        isRejected: result.status === 'rejected',
        isStuck: result.status === 'stuck',
        timestamp: Date.now(),
      };
    }

    set((s) => ({
      sim: {
        ...s.sim,
        simulator: sim,
        status: result.status,
        currentConfig: result.finalConfig,
        executionSteps: [...result.steps],
        lastAnimationEvent: animEvent,
      },
    }));
    recordSimulation({
      id: Date.now().toString(),
      pdaId: pda.id,
      pdaName: pda.name,
      inputString,
      result: result.status,
      stepCount: result.steps.length,
      timestamp: Date.now(),
    });
    get().refreshProgress();
  },

  startAutoRun: () => {
    const existing = get().sim.autoRunInterval;
    if (existing) clearInterval(existing);

    if (!get().sim.simulator) {
      get().initSimulator();
    }

    const interval = setInterval(() => {
      const state = get();
      if (state.sim.simulator?.isFinished || state.sim.status !== 'running' && state.sim.status !== 'idle') {
        get().pauseAutoRun();
        return;
      }
      get().stepForward();
    }, get().sim.animationSpeed);

    set((s) => ({ sim: { ...s.sim, isAutoRunning: true, autoRunInterval: interval, status: s.sim.status === 'idle' ? 'running' : s.sim.status } }));
  },

  pauseAutoRun: () => {
    const { autoRunInterval } = get().sim;
    if (autoRunInterval) clearInterval(autoRunInterval);
    set((s) => ({ sim: { ...s.sim, isAutoRunning: false, autoRunInterval: null } }));
  },

  setAnimationSpeed: (ms) => {
    set((s) => ({ sim: { ...s.sim, animationSpeed: ms } }));
    // Restart auto-run if running
    if (get().sim.isAutoRunning) {
      get().pauseAutoRun();
      get().startAutoRun();
    }
  },

  selectStep: (idx) => {
    set((s) => ({ sim: { ...s.sim, selectedStepIndex: idx } }));
  },

  toggleLearningMode: () => {
    set((s) => ({ sim: { ...s.sim, learningMode: !s.sim.learningMode } }));
  },

  setExplanationLevel: (level) => {
    set((s) => ({ sim: { ...s.sim, explanationLevel: level } }));
  },

  refreshProgress: () => {
    set({ progress: loadProgress() });
  },
}));
