/**
 * LocalStorage persistence layer for user progress and saved automata.
 */

import type { UserProgress, SimulationRecord, PDADefinition } from '../../types/pda';

const STORAGE_KEYS = {
  PROGRESS: 'npda-animator:progress',
  SAVED_AUTOMATA: 'npda-animator:saved-automata',
} as const;

const DEFAULT_PROGRESS: UserProgress = {
  simulationsPerformed: 0,
  stringsTested: 0,
  quizScore: 0,
  quizQuestionsAnswered: 0,
  recentSimulations: [],
  savedAutomata: [],
  learningProgress: {},
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or unavailable — silently ignore
  }
}

export function loadProgress(): UserProgress {
  const stored = load<Partial<UserProgress>>(STORAGE_KEYS.PROGRESS, {});
  return { ...DEFAULT_PROGRESS, ...stored };
}

export function saveProgress(progress: UserProgress): void {
  save(STORAGE_KEYS.PROGRESS, progress);
}

export function recordSimulation(record: SimulationRecord): void {
  const progress = loadProgress();
  progress.simulationsPerformed += 1;
  progress.recentSimulations = [record, ...progress.recentSimulations].slice(0, 20);
  saveProgress(progress);
}

export function recordStringTest(): void {
  const progress = loadProgress();
  progress.stringsTested += 1;
  saveProgress(progress);
}

export function updateQuizScore(score: number, answered: number): void {
  const progress = loadProgress();
  progress.quizScore = score;
  progress.quizQuestionsAnswered = answered;
  saveProgress(progress);
}

export function markTopicCompleted(topicId: string): void {
  const progress = loadProgress();
  progress.learningProgress[topicId] = true;
  saveProgress(progress);
}

export function saveAutomaton(pda: PDADefinition): void {
  const automata = load<PDADefinition[]>(STORAGE_KEYS.SAVED_AUTOMATA, []);
  const idx = automata.findIndex((a) => a.id === pda.id);
  if (idx >= 0) {
    automata[idx] = pda;
  } else {
    automata.push(pda);
  }
  save(STORAGE_KEYS.SAVED_AUTOMATA, automata);
}

export function loadSavedAutomata(): PDADefinition[] {
  return load<PDADefinition[]>(STORAGE_KEYS.SAVED_AUTOMATA, []);
}

export function deleteAutomaton(id: string): void {
  const automata = load<PDADefinition[]>(STORAGE_KEYS.SAVED_AUTOMATA, []);
  save(
    STORAGE_KEYS.SAVED_AUTOMATA,
    automata.filter((a) => a.id !== id)
  );
}
