import type {
  CardType,
  EventType,
  GameResult,
  LevelConfig,
  ReviewSummary,
  TrainingFocus,
  TrainingLevelConfig,
} from '@/types/game';
import { CARD_TYPE_META, getLevel } from '@/data/levels';
import { getEventTypeLabel } from '@/utils/score';

const UNLOCKED_KEY = 'csg_unlocked_levels';
const BEST_KEY = 'csg_best_scores';
const HISTORY_KEY = 'csg_history';
const LAST_REVIEW_KEY = 'csg_last_review';
const TRAINING_HISTORY_KEY = 'csg_training_history';

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
    if (Array.isArray(parsed)) return parsed.filter((item) => !item?.isTraining);
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
  if (result.isTraining) {
    addToTrainingHistory(result);
    return;
  }

  saveBestScore(result);
  addToHistory(result);
  if (result.stars >= 1) {
    unlockLevel(result.levelId + 1);
  }
  if (result.reviewAnalysis) {
    saveReviewSummary(result);
  }
}

export function saveReviewSummary(result: GameResult): void {
  if (!result.reviewAnalysis) return;

  const worstSlot = result.reviewAnalysis.worstSlots[0];
  const slowCardType = result.reviewAnalysis.slowCardTypes[0];
  const totalEventMissCount = result.reviewAnalysis.eventMisses.reduce(
    (sum, ev) => sum + ev.missCount,
    0,
  );

  const level = getLevel(result.levelId);

  const summary: ReviewSummary = {
    levelId: result.levelId,
    levelName: level?.name || `第${result.levelId}关`,
    totalScore: result.totalScore,
    stars: result.stars,
    accuracy: result.accuracy,
    worstSlotLabel: worstSlot?.slotLabel || '无',
    slowestCardTypeLabel: slowCardType?.label || '无',
    eventMissCount: totalEventMissCount,
    playedAt: result.playedAt,
    hasTraining: false,
  };

  localStorage.setItem(LAST_REVIEW_KEY, JSON.stringify(summary));
}

export function getLastReviewSummary(): ReviewSummary | null {
  try {
    const raw = localStorage.getItem(LAST_REVIEW_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function markTrainingStarted(): void {
  const summary = getLastReviewSummary();
  if (summary) {
    summary.hasTraining = true;
    localStorage.setItem(LAST_REVIEW_KEY, JSON.stringify(summary));
  }
}

export function addToTrainingHistory(result: GameResult): void {
  try {
    const raw = localStorage.getItem(TRAINING_HISTORY_KEY);
    const history: GameResult[] = raw ? JSON.parse(raw) : [];
    history.unshift(result);
    const trimmed = history.slice(0, 20);
    localStorage.setItem(TRAINING_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function getTrainingHistory(): GameResult[] {
  try {
    const raw = localStorage.getItem(TRAINING_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((item) => item?.isTraining);
    return [];
  } catch {
    return [];
  }
}

export function generateTrainingLevel(
  sourceResult: GameResult,
  focus: TrainingFocus,
): TrainingLevelConfig | null {
  const sourceLevel = getLevel(sourceResult.levelId);
  if (!sourceLevel) return null;

  const trainingId = 1000 + sourceLevel.id * 10 + Math.floor(Math.random() * 10);

  let cardTypes: CardType[] = sourceLevel.cardTypes;
  let slotLabels: string[] = sourceLevel.slotLabels;
  let events: LevelConfig['events'] = [];
  let duration = 45;
  let cardInterval: [number, number] = [2000, 3000];

  if (focus.type === 'slot') {
    const slotIndex = sourceLevel.slotLabels.findIndex((s) => s === focus.target);
    if (slotIndex >= 0) {
      const typeLetter = focus.target.charAt(0) as CardType;
      cardTypes = [typeLetter];
      slotLabels = [focus.target];
      duration = 30;
      cardInterval = [1500, 2500];
    }
  } else if (focus.type === 'cardType') {
    const typeLetter = focus.target as CardType;
    cardTypes = [typeLetter];
    const matchingSlot = sourceLevel.slotLabels.find((s) => s.startsWith(typeLetter));
    if (matchingSlot) {
      slotLabels = [matchingSlot];
    } else {
      slotLabels = [`${typeLetter}-${CARD_TYPE_META[typeLetter].label}`];
    }
    duration = 30;
    cardInterval = [1200, 2200];
  } else if (focus.type === 'event') {
    cardTypes = sourceLevel.cardTypes.slice(0, Math.min(3, sourceLevel.cardTypes.length));
    slotLabels = sourceLevel.slotLabels.slice(0, Math.min(3, sourceLevel.slotLabels.length));
    const eventType = focus.target as EventType;

    const baseEvents = sourceLevel.events.filter((e) => e.type === eventType);
    if (baseEvents.length > 0) {
      events = baseEvents.map((e, i) => ({
        ...e,
        id: `training_${e.id}_${i}`,
        triggerAt: 10000 + i * 15000,
      }));
    } else {
      events = [
        {
          id: `training_ev_${trainingId}_1`,
          type: eventType,
          triggerAt: 10000,
          duration: 15000,
          payload:
            eventType === 'slot_close'
              ? { slotIndex: 0 }
              : eventType === 'priority_change'
                ? { slotIndex: 0, priority: 3 as const }
                : eventType === 'fake_card'
                  ? { chance: 0.3 }
                  : { multiplier: 1.5 },
          message: `【训练】${getEventTypeLabel(eventType)}事件练习`,
        },
      ];
    }
    duration = 45;
    cardInterval = [1800, 2800];
  }

  return {
    id: trainingId,
    name: `专项训练：${focus.label}`,
    description: `针对「${focus.label}」的强化训练，时长${duration}秒。`,
    duration,
    slotCount: slotLabels.length,
    slotLabels,
    cardTypes,
    cardInterval,
    rushHourMultiplier: sourceLevel.rushHourMultiplier,
    events,
    targetScore: Math.round(sourceLevel.targetScore * 0.4),
    twoStarScore: Math.round(sourceLevel.twoStarScore * 0.4),
    threeStarScore: Math.round(sourceLevel.threeStarScore * 0.4),
    isTraining: true,
    sourceLevelId: sourceLevel.id,
    focus,
  };
}

export function getRecordByTimestamp(levelId: number, timestamp: number, isTraining: boolean): GameResult | null {
  const history = isTraining ? getTrainingHistory() : getHistory();
  const record = history.find(r => r.levelId === levelId && r.playedAt === timestamp);
  return record || null;
}

export function getRecordsForLevel(levelId: number): GameResult[] {
  const history = getHistory();
  return history.filter(r => r.levelId === levelId).sort((a, b) => b.playedAt - a.playedAt);
}

export function getTrainingRecordsForSourceLevel(sourceLevelId: number): GameResult[] {
  const history = getTrainingHistory();
  return history.filter(r => r.sourceLevelId === sourceLevelId).sort((a, b) => b.playedAt - a.playedAt);
}

export function getTrainingFocuses(result: GameResult): TrainingFocus[] {
  const focuses: TrainingFocus[] = [];

  if (!result.reviewAnalysis) return focuses;

  for (const slot of result.reviewAnalysis.worstSlots.slice(0, 1)) {
    if (slot.wrong >= 2) {
      focuses.push({
        type: 'slot',
        target: slot.slotLabel,
        label: `${slot.slotLabel} 卡槽强化`,
      });
    }
  }

  for (const cardType of result.reviewAnalysis.slowCardTypes.slice(0, 1)) {
    if (cardType.avgResponseTime > 3000) {
      focuses.push({
        type: 'cardType',
        target: cardType.type,
        label: `${cardType.label} 响应提速`,
      });
    }
  }

  for (const event of result.reviewAnalysis.eventMisses.slice(0, 1)) {
    if (event.missCount >= 1) {
      focuses.push({
        type: 'event',
        target: event.type,
        label: `${getEventTypeLabel(event.type)} 应对练习`,
      });
    }
  }

  return focuses;
}
