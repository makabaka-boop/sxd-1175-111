export type CardType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type Priority = 1 | 2 | 3;

export type EventType =
  | 'slot_close'
  | 'fake_card'
  | 'priority_change'
  | 'rush_hour';

export type GameStatus =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'finished';

export interface Card {
  id: string;
  type: CardType;
  label: string;
  color: string;
  priority: Priority;
  spawnTime: number;
  isFake?: boolean;
}

export interface Slot {
  id: string;
  label: string;
  acceptTypes: CardType[];
  isClosed: boolean;
  closedUntil: number;
  priorityOverride: Priority | null;
  currentCard: Card | null;
  cardPlacedAt: number;
  hasWrongFlash: boolean;
  emptyStartTime: number;
  totalEmptyTime: number;
  correctCount: number;
  wrongCount: number;
}

export interface GameEvent {
  id: string;
  type: EventType;
  triggerAt: number;
  duration: number;
  payload: Record<string, unknown>;
  message: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  duration: number;
  slotCount: number;
  slotLabels: string[];
  cardTypes: CardType[];
  cardInterval: [number, number];
  rushHourMultiplier: number;
  events: GameEvent[];
  targetScore: number;
  twoStarScore: number;
  threeStarScore: number;
}

export interface ScoreBreakdown {
  baseCorrect: number;
  speedBonus: number;
  comboBonus: number;
  wrongPenalty: number;
  emptyPenalty: number;
  eventPenalty: number;
}

export interface SlotStat {
  slotId: string;
  slotLabel: string;
  correct: number;
  wrong: number;
  emptyTime: number;
  score: number;
}

export interface GameResult {
  levelId: number;
  totalScore: number;
  stars: 0 | 1 | 2 | 3;
  accuracy: number;
  avgResponseTime: number;
  wrongCount: number;
  maxCombo: number;
  slotStats: SlotStat[];
  penalties: { label: string; amount: number }[];
  suggestion: string;
  playedAt: number;
}

export interface DragState {
  isDragging: boolean;
  card: Card | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
}
