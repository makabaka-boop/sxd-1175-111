import { create } from 'zustand';
import type {
  Card,
  CardType,
  CardTypeStat,
  DragState,
  EventType,
  EventTypeStat,
  GameEvent,
  GameResult,
  GameStatus,
  LevelConfig,
  Priority,
  ReviewAnalysis,
  Slot,
  TrainingLevelConfig,
} from '@/types/game';
import { CARD_TYPE_META, getLevel } from '@/data/levels';
import {
  buildSlotStats,
  buildReviewAnalysis,
  calcAccuracy,
  calcCorrectScore,
  calcEmptyPenalty,
  calcEventMissPenalty,
  calcStars,
  calcWrongPenalty,
  generateSuggestion,
} from '@/utils/score';
import { saveGameResult } from '@/utils/storage';

interface GameStore {
  status: GameStatus;
  levelId: number | null;
  level: LevelConfig | TrainingLevelConfig | null;
  isTrainingMode: boolean;

  startTime: number;
  pauseAccumulated: number;
  lastPauseStart: number;
  elapsedMs: number;

  slots: Slot[];
  pendingCards: Card[];
  maxPendingCards: number;

  score: number;
  scoreBreakdown: {
    baseCorrect: number;
    speedBonus: number;
    comboBonus: number;
    wrongPenalty: number;
    emptyPenalty: number;
    eventPenalty: number;
  };

  combo: number;
  maxCombo: number;
  totalCorrect: number;
  totalWrong: number;
  totalResponses: number;
  totalResponseTime: number;
  eventMissCount: number;

  cardTypeStats: Record<CardType, CardTypeStat>;
  eventTypeStats: Record<EventType, EventTypeStat>;

  activeEvents: GameEvent[];
  triggeredEventIds: Set<string>;
  eventMessages: { id: string; text: string; type: string; ts: number }[];

  lastResult: GameResult | null;
  lastReviewAnalysis: ReviewAnalysis | null;

  drag: DragState;

  initLevel: (levelId: number) => void;
  initTrainingLevel: (config: TrainingLevelConfig) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;

  tick: (now: number) => void;
  spawnCard: (now: number, forceFake?: boolean, fakeChance?: number) => void;
  triggerEvent: (event: GameEvent, now: number) => void;
  endEvent: (eventId: string, now: number) => void;

  placeCard: (cardId: string, slotId: string, now: number) => boolean;
  removeCard: (cardId: string, reason: 'user' | 'timeout' | 'event') => void;
  removeSlotCard: (slotId: string, reason: 'user' | 'event') => void;
  swapSlots: (slotIdA: string, slotIdB: string) => void;

  setDragStart: (card: Card, x: number, y: number, rect: DOMRect) => void;
  setDragMove: (x: number, y: number) => void;
  setDragEnd: () => void;

  addEventMessage: (text: string, type: string) => void;
}

let cardIdCounter = 0;
function makeCardId() {
  cardIdCounter += 1;
  return `card_${Date.now()}_${cardIdCounter}`;
}

function initCardTypeStats(): Record<CardType, CardTypeStat> {
  const allTypes: CardType[] = ['A', 'B', 'C', 'D', 'E', 'F'];
  const stats: Record<CardType, CardTypeStat> = {} as Record<CardType, CardTypeStat>;
  for (const type of allTypes) {
    stats[type] = {
      type,
      label: CARD_TYPE_META[type].label,
      correct: 0,
      wrong: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
    };
  }
  return stats;
}

function initEventTypeStats(): Record<EventType, EventTypeStat> {
  const allTypes: EventType[] = ['slot_close', 'fake_card', 'priority_change', 'rush_hour'];
  const stats: Record<EventType, EventTypeStat> = {} as Record<EventType, EventTypeStat>;
  for (const type of allTypes) {
    stats[type] = {
      type,
      count: 0,
      missCount: 0,
    };
  }
  return stats;
}

function buildSlots(level: LevelConfig): Slot[] {
  return level.slotLabels.map((label, idx) => {
    const typeLetter = label.charAt(0) as CardType;
    return {
      id: `slot_${idx}`,
      label,
      acceptTypes: [typeLetter],
      isClosed: false,
      closedUntil: 0,
      priorityOverride: null,
      currentCard: null,
      cardPlacedAt: 0,
      hasWrongFlash: false,
      emptyStartTime: 0,
      totalEmptyTime: 0,
      correctCount: 0,
      wrongCount: 0,
    };
  });
}

function randomCardType(level: LevelConfig): CardType {
  const types = level.cardTypes;
  return types[Math.floor(Math.random() * types.length)];
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: 'idle',
  levelId: null,
  level: null,
  isTrainingMode: false,

  startTime: 0,
  pauseAccumulated: 0,
  lastPauseStart: 0,
  elapsedMs: 0,

  slots: [],
  pendingCards: [],
  maxPendingCards: 8,

  score: 0,
  scoreBreakdown: {
    baseCorrect: 0,
    speedBonus: 0,
    comboBonus: 0,
    wrongPenalty: 0,
    emptyPenalty: 0,
    eventPenalty: 0,
  },

  combo: 0,
  maxCombo: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalResponses: 0,
  totalResponseTime: 0,
  eventMissCount: 0,

  cardTypeStats: initCardTypeStats(),
  eventTypeStats: initEventTypeStats(),

  activeEvents: [],
  triggeredEventIds: new Set(),
  eventMessages: [],

  lastResult: null,
  lastReviewAnalysis: null,

  drag: {
    isDragging: false,
    card: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
  },

  initLevel: (levelId: number) => {
    const level = getLevel(levelId);
    if (!level) return;
    set({
      status: 'idle',
      levelId,
      level,
      isTrainingMode: false,
      startTime: 0,
      pauseAccumulated: 0,
      lastPauseStart: 0,
      elapsedMs: 0,
      slots: buildSlots(level),
      pendingCards: [],
      score: 0,
      scoreBreakdown: {
        baseCorrect: 0,
        speedBonus: 0,
        comboBonus: 0,
        wrongPenalty: 0,
        emptyPenalty: 0,
        eventPenalty: 0,
      },
      combo: 0,
      maxCombo: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalResponses: 0,
      totalResponseTime: 0,
      eventMissCount: 0,
      cardTypeStats: initCardTypeStats(),
      eventTypeStats: initEventTypeStats(),
      activeEvents: [],
      triggeredEventIds: new Set(),
      eventMessages: [],
      lastResult: null,
      lastReviewAnalysis: null,
      drag: {
        isDragging: false,
        card: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        offsetX: 0,
        offsetY: 0,
      },
    });
  },

  initTrainingLevel: (config: TrainingLevelConfig) => {
    set({
      status: 'idle',
      levelId: config.id,
      level: config,
      isTrainingMode: true,
      startTime: 0,
      pauseAccumulated: 0,
      lastPauseStart: 0,
      elapsedMs: 0,
      slots: buildSlots(config),
      pendingCards: [],
      score: 0,
      scoreBreakdown: {
        baseCorrect: 0,
        speedBonus: 0,
        comboBonus: 0,
        wrongPenalty: 0,
        emptyPenalty: 0,
        eventPenalty: 0,
      },
      combo: 0,
      maxCombo: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalResponses: 0,
      totalResponseTime: 0,
      eventMissCount: 0,
      cardTypeStats: initCardTypeStats(),
      eventTypeStats: initEventTypeStats(),
      activeEvents: [],
      triggeredEventIds: new Set(),
      eventMessages: [],
      lastResult: null,
      lastReviewAnalysis: null,
      drag: {
        isDragging: false,
        card: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        offsetX: 0,
        offsetY: 0,
      },
    });
  },

  startGame: () => {
    const now = performance.now();
    const { slots } = get();
    const newSlots = slots.map((s) => ({ ...s, emptyStartTime: now }));
    set({
      status: 'playing',
      startTime: now,
      pauseAccumulated: 0,
      lastPauseStart: 0,
      elapsedMs: 0,
      slots: newSlots,
      pendingCards: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
    });
  },

  pauseGame: () => {
    const { status } = get();
    if (status !== 'playing') return;
    const now = performance.now();
    set({
      status: 'paused',
      lastPauseStart: now,
    });
  },

  resumeGame: () => {
    const { status, lastPauseStart, pauseAccumulated } = get();
    if (status !== 'paused') return;
    const now = performance.now();
    const pauseDelta = now - lastPauseStart;
    set({
      status: 'playing',
      pauseAccumulated: pauseAccumulated + pauseDelta,
    });
  },

  endGame: () => {
    const state = get();
    const level = state.level;
    if (!level) return;

    const levelDurationMs = level.duration * 1000;

    let totalEmptyPenalty = 0;
    const finalSlots = state.slots.map((slot) => {
      let emptyMs = slot.totalEmptyTime;
      if (!slot.currentCard && slot.emptyStartTime > 0) {
        emptyMs += performance.now() - slot.emptyStartTime;
      }
      totalEmptyPenalty += calcEmptyPenalty(emptyMs);
      return { ...slot, totalEmptyTime: emptyMs };
    });

    const breakdown = {
      ...state.scoreBreakdown,
      emptyPenalty: state.scoreBreakdown.emptyPenalty + totalEmptyPenalty,
    };

    const totalScore =
      breakdown.baseCorrect +
      breakdown.speedBonus +
      breakdown.comboBonus -
      breakdown.wrongPenalty -
      breakdown.emptyPenalty -
      breakdown.eventPenalty;

    const finalScore = Math.max(0, totalScore);
    const stars = calcStars(finalScore, level);
    const accuracy = calcAccuracy(state.totalCorrect, state.totalWrong);
    const avgResp =
      state.totalResponses > 0
        ? state.totalResponseTime / state.totalResponses
        : 0;

    const slotStats = buildSlotStats(finalSlots, levelDurationMs);

    const penalties: { label: string; amount: number }[] = [];
    if (breakdown.wrongPenalty > 0)
      penalties.push({ label: `错放扣分(${state.totalWrong}次)`, amount: breakdown.wrongPenalty });
    if (breakdown.emptyPenalty > 0)
      penalties.push({ label: '空槽持续扣分', amount: breakdown.emptyPenalty });
    if (breakdown.eventPenalty > 0)
      penalties.push({ label: `事件未处理扣分(${state.eventMissCount}次)`, amount: breakdown.eventPenalty });

    const cardTypeStatsArray = Object.values(state.cardTypeStats).filter(
      (s) => s.correct + s.wrong > 0,
    );
    const eventTypeStatsArray = Object.values(state.eventTypeStats).filter(
      (s) => s.count > 0,
    );

    const reviewAnalysis = buildReviewAnalysis(
      slotStats,
      cardTypeStatsArray,
      eventTypeStatsArray,
    );

    const isTraining = 'isTraining' in level && level.isTraining;
    const sourceLevelId = isTraining && 'sourceLevelId' in level ? level.sourceLevelId : undefined;

    const partialResult = {
      levelId: level.id,
      totalScore: finalScore,
      stars,
      accuracy,
      avgResponseTime: avgResp,
      wrongCount: state.totalWrong,
      maxCombo: state.maxCombo,
      slotStats,
      penalties,
      playedAt: Date.now(),
      reviewAnalysis,
      isTraining,
      sourceLevelId,
    };
    const suggestion = generateSuggestion(partialResult);
    const result: GameResult = { ...partialResult, suggestion };

    saveGameResult(result);

    set({
      status: 'finished',
      slots: finalSlots,
      score: finalScore,
      scoreBreakdown: breakdown,
      lastResult: result,
      lastReviewAnalysis: reviewAnalysis,
    });
  },

  resetGame: () => {
    const { levelId } = get();
    if (levelId) {
      get().initLevel(levelId);
    }
  },

  tick: (now: number) => {
    const state = get();
    if (state.status !== 'playing' || !state.level) return;

    const elapsed = now - state.startTime - state.pauseAccumulated;
    const levelDurationMs = state.level.duration * 1000;

    if (elapsed >= levelDurationMs) {
      get().endGame();
      return;
    }

    const newSlots = state.slots.map((s) => ({ ...s }));
    let slotChanged = false;
    const emptyPenaltyAdd = 0;

    for (let i = 0; i < newSlots.length; i++) {
      const s = newSlots[i];
      if (s.currentCard && s.cardPlacedAt > 0 && elapsed - s.cardPlacedAt >= 1500) {
        s.currentCard = null;
        s.cardPlacedAt = 0;
        s.hasWrongFlash = false;
        s.emptyStartTime = now;
        slotChanged = true;
      }
    }

    const activeEvents = [...state.activeEvents];
    const newTriggered = new Set(state.triggeredEventIds);
    const newMessages = [...state.eventMessages];
    let eventPenaltyAdd = 0;
    let eventMissAdd = 0;

    const newEventTypeStats = { ...state.eventTypeStats };

    const remaining = state.level.events.filter((ev) => !newTriggered.has(ev.id));
    for (const ev of remaining) {
      if (elapsed >= ev.triggerAt) {
        activeEvents.push({ ...ev });
        newTriggered.add(ev.id);
        newMessages.unshift({
          id: `msg_${ev.id}`,
          text: ev.message,
          type: ev.type,
          ts: now,
        });

        const evStat = { ...newEventTypeStats[ev.type] };
        evStat.count += 1;

        if (ev.type === 'priority_change') {
          const idx = (ev.payload as { slotIndex: number }).slotIndex;
          if (newSlots[idx]) {
            newSlots[idx].priorityOverride = (ev.payload as { priority: Priority }).priority;
            slotChanged = true;
          }
        }
        if (ev.type === 'slot_close') {
          const idx = (ev.payload as { slotIndex: number }).slotIndex;
          if (newSlots[idx]) {
            newSlots[idx].isClosed = true;
            newSlots[idx].closedUntil = now + ev.duration;
            if (newSlots[idx].currentCard) {
              newSlots[idx].currentCard = null;
              newSlots[idx].cardPlacedAt = 0;
              newSlots[idx].hasWrongFlash = false;
              newSlots[idx].emptyStartTime = now;
              eventMissAdd += 1;
              eventPenaltyAdd += calcEventMissPenalty();
              evStat.missCount += 1;
            }
            slotChanged = true;
          }
        }

        newEventTypeStats[ev.type] = evStat;
      }
    }

    const stillActive: GameEvent[] = [];
    for (const ev of activeEvents) {
      const eventEnd = ev.triggerAt + ev.duration;
      if (elapsed < eventEnd) {
        stillActive.push(ev);
      } else {
        if (ev.type === 'priority_change') {
          const idx = (ev.payload as { slotIndex: number }).slotIndex;
          if (newSlots[idx]) {
            newSlots[idx].priorityOverride = null;
            slotChanged = true;
          }
        }
        if (ev.type === 'slot_close') {
          const idx = (ev.payload as { slotIndex: number }).slotIndex;
          if (newSlots[idx]) {
            newSlots[idx].isClosed = false;
            newSlots[idx].closedUntil = 0;
            slotChanged = true;
          }
        }
      }
    }

    const filteredMessages = newMessages.filter((m) => now - m.ts < 6000).slice(0, 5);

    set({
      elapsedMs: elapsed,
      activeEvents: stillActive,
      triggeredEventIds: newTriggered,
      eventMessages: filteredMessages,
      score: Math.max(0, state.score - eventPenaltyAdd - emptyPenaltyAdd),
      scoreBreakdown: {
        ...state.scoreBreakdown,
        eventPenalty: state.scoreBreakdown.eventPenalty + eventPenaltyAdd,
        emptyPenalty: state.scoreBreakdown.emptyPenalty + emptyPenaltyAdd,
      },
      eventMissCount: state.eventMissCount + eventMissAdd,
      eventTypeStats: newEventTypeStats,
      slots: slotChanged ? newSlots : state.slots,
    });
  },

  spawnCard: (now, forceFake = false, fakeChance = 0) => {
    const state = get();
    if (state.status !== 'playing' || !state.level) return;
    if (state.pendingCards.length >= state.maxPendingCards) return;

    const type = randomCardType(state.level);
    const meta = CARD_TYPE_META[type];
    const isFake = forceFake || (fakeChance > 0 && Math.random() < fakeChance);

    const priorityRoll = Math.random();
    let priority: Priority = 1;
    if (priorityRoll < 0.08) priority = 3;
    else if (priorityRoll < 0.25) priority = 2;

    const card: Card = {
      id: makeCardId(),
      type,
      label: isFake ? `${meta.label}*` : meta.label,
      color: meta.color,
      priority,
      spawnTime: now,
      isFake,
    };
    set({ pendingCards: [...state.pendingCards, card] });
  },

  triggerEvent: () => {},
  endEvent: () => {},

  placeCard: (cardId, slotId, now) => {
    const state = get();
    if (state.status !== 'playing') return false;

    const cardIdx = state.pendingCards.findIndex((c) => c.id === cardId);
    if (cardIdx < 0) return false;
    const card = state.pendingCards[cardIdx];

    const slotIdx = state.slots.findIndex((s) => s.id === slotId);
    if (slotIdx < 0) return false;
    const slot = state.slots[slotIdx];

    if (slot.isClosed) return false;

    const effectivePriority = slot.priorityOverride ?? card.priority;
    const correct =
      !card.isFake && slot.acceptTypes.includes(card.type);

    const responseTime = now - card.spawnTime;
    const newPending = [...state.pendingCards];
    newPending.splice(cardIdx, 1);

    const newSlots = state.slots.map((s) => ({ ...s }));

    let addScore = 0;
    let addBase = 0;
    let addSpeed = 0;
    let addCombo = 0;
    let addWrongPenalty = 0;
    let newCombo = state.combo;
    let newMaxCombo = state.maxCombo;
    let newCorrect = state.totalCorrect;
    let newWrong = state.totalWrong;

    const placedAtGame = state.elapsedMs;

    const newCardTypeStats = { ...state.cardTypeStats };
    const cardTypeStat = { ...newCardTypeStats[card.type] };
    if (correct) {
      cardTypeStat.correct += 1;
    } else {
      cardTypeStat.wrong += 1;
    }
    cardTypeStat.totalResponseTime += responseTime;
    const totalForType = cardTypeStat.correct + cardTypeStat.wrong;
    cardTypeStat.avgResponseTime = totalForType > 0 ? cardTypeStat.totalResponseTime / totalForType : 0;
    newCardTypeStats[card.type] = cardTypeStat;

    if (correct) {
      newCombo += 1;
      newMaxCombo = Math.max(newMaxCombo, newCombo);
      newCorrect += 1;
      const { base, speed, combo } = calcCorrectScore(
        card,
        now,
        newCombo,
        effectivePriority,
      );
      addBase = base;
      addSpeed = speed;
      addCombo = combo;
      addScore = base + speed + combo;

      newSlots[slotIdx].currentCard = card;
      newSlots[slotIdx].cardPlacedAt = placedAtGame;
      newSlots[slotIdx].hasWrongFlash = false;
      newSlots[slotIdx].correctCount += 1;
      if (newSlots[slotIdx].emptyStartTime > 0) {
        newSlots[slotIdx].totalEmptyTime += now - newSlots[slotIdx].emptyStartTime;
        newSlots[slotIdx].emptyStartTime = 0;
      }
    } else {
      newCombo = 0;
      newWrong += 1;
      addWrongPenalty = calcWrongPenalty();
      newSlots[slotIdx].wrongCount += 1;
      newSlots[slotIdx].currentCard = card;
      newSlots[slotIdx].cardPlacedAt = placedAtGame;
      newSlots[slotIdx].hasWrongFlash = true;
    }

    set({
      pendingCards: newPending,
      slots: newSlots,
      score: Math.max(0, state.score + addScore - addWrongPenalty),
      scoreBreakdown: {
        ...state.scoreBreakdown,
        baseCorrect: state.scoreBreakdown.baseCorrect + addBase,
        speedBonus: state.scoreBreakdown.speedBonus + addSpeed,
        comboBonus: state.scoreBreakdown.comboBonus + addCombo,
        wrongPenalty: state.scoreBreakdown.wrongPenalty + addWrongPenalty,
      },
      combo: newCombo,
      maxCombo: newMaxCombo,
      totalCorrect: newCorrect,
      totalWrong: newWrong,
      totalResponses: state.totalResponses + 1,
      totalResponseTime: state.totalResponseTime + responseTime,
      cardTypeStats: newCardTypeStats,
    });

    return correct;
  },

  removeCard: (cardId, reason) => {
    const state = get();
    const idx = state.pendingCards.findIndex((c) => c.id === cardId);
    if (idx < 0) return;
    const card = state.pendingCards[idx];

    const newPending = [...state.pendingCards];
    newPending.splice(idx, 1);

    let penalty = 0;
    let newWrongPenalty = state.scoreBreakdown.wrongPenalty;
    let newWrong = state.totalWrong;

    if (reason === 'user') {
      if (!card.isFake) {
        penalty = calcWrongPenalty();
        newWrongPenalty += penalty;
        newWrong += 1;
      }
    } else if (reason === 'timeout') {
      penalty = calcWrongPenalty();
      newWrongPenalty += penalty;
      newWrong += 1;
    }

    set({
      pendingCards: newPending,
      combo: reason === 'user' && card.isFake ? state.combo : 0,
      score: Math.max(0, state.score - penalty),
      scoreBreakdown: {
        ...state.scoreBreakdown,
        wrongPenalty: newWrongPenalty,
      },
      totalWrong: newWrong,
      totalResponses: state.totalResponses + 1,
      totalResponseTime:
        state.totalResponseTime + (performance.now() - card.spawnTime),
    });
  },

  removeSlotCard: (slotId, reason) => {
    const state = get();
    const slotIdx = state.slots.findIndex((s) => s.id === slotId);
    if (slotIdx < 0) return;
    const slot = state.slots[slotIdx];
    if (!slot.currentCard || slot.isClosed) return;

    const card = slot.currentCard;
    const newSlots = state.slots.map((s) => ({ ...s }));
    newSlots[slotIdx].currentCard = null;
    newSlots[slotIdx].cardPlacedAt = 0;
    newSlots[slotIdx].hasWrongFlash = false;
    newSlots[slotIdx].emptyStartTime = performance.now();

    let penalty = 0;
    let newWrongPenalty = state.scoreBreakdown.wrongPenalty;
    let newWrong = state.totalWrong;
    let newCombo = state.combo;

    if (reason === 'user') {
      if (!card.isFake && !slot.hasWrongFlash) {
        penalty = Math.round(calcWrongPenalty() * 0.5);
        newWrongPenalty += penalty;
        newWrong += 1;
        newCombo = 0;
      } else if (slot.hasWrongFlash || card.isFake) {
        newCombo = state.combo;
      }
    } else if (reason === 'event') {
      penalty = 0;
    }

    set({
      slots: newSlots,
      combo: newCombo,
      score: Math.max(0, state.score - penalty),
      scoreBreakdown: {
        ...state.scoreBreakdown,
        wrongPenalty: newWrongPenalty,
      },
      totalWrong: newWrong,
      totalResponses: state.totalResponses + (reason === 'user' ? 1 : 0),
      totalResponseTime:
        state.totalResponseTime + (reason === 'user' ? (performance.now() - card.spawnTime) : 0),
    });
  },

  swapSlots: (slotIdA, slotIdB) => {
    const state = get();
    const a = state.slots.findIndex((s) => s.id === slotIdA);
    const b = state.slots.findIndex((s) => s.id === slotIdB);
    if (a < 0 || b < 0 || a === b) return;
    if (state.slots[a].isClosed || state.slots[b].isClosed) return;

    const newSlots = state.slots.map((s) => ({ ...s }));
    const cardA = newSlots[a].currentCard;
    const cardB = newSlots[b].currentCard;
    const placedAtA = newSlots[a].cardPlacedAt;
    const placedAtB = newSlots[b].cardPlacedAt;
    const wrongA = newSlots[a].hasWrongFlash;
    const wrongB = newSlots[b].hasWrongFlash;
    newSlots[a].currentCard = cardB;
    newSlots[a].cardPlacedAt = placedAtB;
    newSlots[a].hasWrongFlash = wrongB;
    newSlots[b].currentCard = cardA;
    newSlots[b].cardPlacedAt = placedAtA;
    newSlots[b].hasWrongFlash = wrongA;

    set({ slots: newSlots });
  },

  setDragStart: (card, x, y, rect) => {
    set({
      drag: {
        isDragging: true,
        card,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        offsetX: x - rect.left,
        offsetY: y - rect.top,
      },
    });
  },

  setDragMove: (x, y) => {
    const state = get();
    if (!state.drag.isDragging) return;
    set({
      drag: {
        ...state.drag,
        currentX: x,
        currentY: y,
      },
    });
  },

  setDragEnd: () => {
    const state = get();
    set({
      drag: {
        ...state.drag,
        isDragging: false,
        card: null,
      },
    });
  },

  addEventMessage: (text, type) => {
    const state = get();
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text,
      type,
      ts: performance.now(),
    };
    set({ eventMessages: [msg, ...state.eventMessages].slice(0, 5) });
  },
}));
