import type { GameResult } from '@/types/game';

const UNLOCKED_KEY = 'csg_unlocked_levels';
const BEST_KEY = 'csg_best_scores';
const HISTORY_KEY = 'csg_history';

export function getUnlockedLevels(): number[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    if (!raw) return [1];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [1];
  } catch {
    return [1];
  }
}

export function unlockLevel(levelId: number): void {
  const current = getUnlockedLevels();
  if (!current.includes(levelId)) {
    current.push(levelId);
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(current));
  }
}

export function isLevelUnlocked(levelId: number): boolean {
  return getUnlockedLevels().includes(levelId);
}

export function getBestScores(): Record<number, GameResult> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getBestScore(levelId: number): GameResult | null {
  const all = getBestScores();
  return all[levelId] || null;
}

export function saveBestScore(result: GameResult): void {
  const all = getBestScores();
  const prev = all[result.levelId];
  if (!prev || result.totalScore > prev.totalScore) {
    all[result.levelId] = result;
    localStorage.setItem(BEST_KEY, JSON.stringify(all));
  }
}

export function getHistory(): GameResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function addToHistory(result: GameResult): void {
  const history = getHistory();
  history.unshift(result);
  const trimmed = history.slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function saveGameResult(result: GameResult): void {
  saveBestScore(result);
  addToHistory(result);
  if (result.stars >= 1) {
    unlockLevel(result.levelId + 1);
  }
}
