import { create } from 'zustand';
import type {
  Card,
  CardType,
  DragState,
  GameEvent,
  GameResult,
  GameStatus,
  LevelConfig,
  Priority,
  Slot,
} from '@/types/game';
import { CARD_TYPE_META, getLevel } from '@/data/levels';
import {
  buildSlotStats,
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
  level: LevelConfig | null;

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

  activeEvents: GameEvent[];
  triggeredEventIds: Set<string>;
  eventMessages: { id: string; text: string; type: string; ts: number }[];

  lastResult: GameResult | null;

  drag: DragState;

  initLevel: (levelId: number) => void;
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

  activeEvents: [],
  triggeredEventIds: new Set(),
  eventMessages: [],

  lastResult: null,

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
      activeEvents: [],
      triggeredEventIds: new Set(),
      eventMessages: [],
      lastResult: null,
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

    const activeEvents = [...state.activeEvents];
    const newTriggered = new Set(state.triggeredEventIds);
    const newMessages = [...state.eventMessages];
    let eventPenaltyAdd = 0;
    let eventMissAdd = 0;

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
        if (ev.type === 'priority_change') {
          const idx = (ev.payload as { slotIndex: number }).slotIndex;
          if (state.slots[idx]) {
            state.slots[idx].priorityOverride = (ev.payload as { priority: Priority }).priority;
          }
        }
        if (ev.type === 'slot_close') {
          const idx = (ev.payload as { slotIndex: number }).slotIndex;
          if (state.slots[idx]) {
            state.slots[idx].isClosed = true;
            state.slots[idx].closedUntil = now + ev.duration;
            if (state.slots[idx].currentCard) {
              eventMissAdd += 1;
              eventPenaltyAdd += calcEventMissPenalty();
            }
          }
        }
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
          if (state.slots[idx]) {
            state.slots[idx].priorityOverride = null;
          }
        }
        if (ev.type === 'slot_close') {
          const idx = (ev.payload as { slotIndex: number }).slotIndex;
          if (state.slots[idx]) {
            state.slots[idx].isClosed = false;
            state.slots[idx].closedUntil = 0;
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
      score: Math.max(0, state.score - eventPenaltyAdd),
      scoreBreakdown: {
        ...state.scoreBreakdown,
        eventPenalty: state.scoreBreakdown.eventPenalty + eventPenaltyAdd,
      },
      eventMissCount: state.eventMissCount + eventMissAdd,
      slots: state.slots.map((s) => ({ ...s })),
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
      newSlots[slotIdx].correctCount += 1;
      if (newSlots[slotIdx].emptyStartTime > 0) {
        newSlots[slotIdx].totalEmptyTime += now - newSlots[slotIdx].emptyStartTime;
        newSlots[slotIdx].emptyStartTime = 0;
      }
      setTimeout(() => {
        const s = get();
        if (s.status === 'playing') {
          const curSlots = s.slots.map((x) => ({ ...x }));
          const target = curSlots[slotIdx];
          if (target && target.currentCard && target.currentCard.id === card.id) {
            target.currentCard = null;
            target.emptyStartTime = performance.now();
            set({ slots: curSlots });
          }
        }
      }, 1500);
    } else {
      newCombo = 0;
      newWrong += 1;
      addWrongPenalty = calcWrongPenalty();
      newSlots[slotIdx].wrongCount += 1;
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

  swapSlots: (slotIdA, slotIdB) => {
    const state = get();
    const a = state.slots.findIndex((s) => s.id === slotIdA);
    const b = state.slots.findIndex((s) => s.id === slotIdB);
    if (a < 0 || b < 0 || a === b) return;
    if (state.slots[a].isClosed || state.slots[b].isClosed) return;

    const newSlots = state.slots.map((s) => ({ ...s }));
    const cardA = newSlots[a].currentCard;
    const cardB = newSlots[b].currentCard;
    newSlots[a].currentCard = cardB;
    newSlots[b].currentCard = cardA;

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
