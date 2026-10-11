/**
 * Global application state using Zustand.
 */

import { create } from 'zustand';
import type { PDADefinition, ExecutionStatus, SimulationConfig, ExecutionStep } from '../types/pda';
import { PDASimulator } from '../lib/simulation-engine/pdaEngine';
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
      },
    }));
  },

  setInputString: (inputString) => {
    set((s) => ({ sim: { ...s.sim, inputString } }));
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

    set((s) => ({ sim: { ...s.sim, status: newStatus, currentConfig: newCfg, executionSteps: [...steps] } }));

    if (!advanced && newStatus !== 'running') {
      get().pauseAutoRun();
      // Record in progress
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
      },
    }));
  },

  resetSimulator: () => {
    get().pauseAutoRun();
    const { simulator } = get().sim;
    if (simulator) {
      simulator.reset();
      set((s) => ({
        sim: {
          ...s.sim,
          simulator,
          status: 'idle',
          currentConfig: simulator.currentConfig,
          executionSteps: [],
          selectedStepIndex: null,
        },
      }));
    } else {
      get().initSimulator();
    }
  },

  runToCompletion: () => {
    get().pauseAutoRun();
    const { simulator, pda, inputString } = get().sim;
    const sim = simulator ?? new PDASimulator(pda, inputString);
    if (!simulator) {
      set((s) => ({ sim: { ...s.sim, simulator: sim } }));
    }
    const result = sim.runToCompletion();
    set((s) => ({
      sim: {
        ...s.sim,
        simulator: sim,
        status: result.status,
        currentConfig: result.finalConfig,
        executionSteps: [...result.steps],
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
