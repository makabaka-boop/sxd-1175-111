import type {
  Card,
  GameResult,
  LevelConfig,
  Slot,
  SlotStat,
  Priority,
} from '@/types/game';

const SCORE_BASE_CORRECT = 100;
const SCORE_SPEED_THRESHOLD_MS = 3000;
const SCORE_SPEED_MAX_BONUS = 50;
const SCORE_COMBO_STEP = 20;
const SCORE_COMBO_MAX = 200;
const SCORE_WRONG_PENALTY = 80;
const SCORE_EMPTY_PER_SEC = 2;
const SCORE_EVENT_MISS = 60;

export function calcCorrectScore(
  card: Card,
  placedAt: number,
  comboCount: number,
  priority: Priority,
): { base: number; speed: number; combo: number } {
  const responseTime = placedAt - card.spawnTime;
  const priorityMul = priority === 3 ? 1.5 : priority === 2 ? 1.2 : 1;

  const base = Math.round(SCORE_BASE_CORRECT * priorityMul);

  let speed = 0;
  if (responseTime < SCORE_SPEED_THRESHOLD_MS) {
    speed = Math.round(
      SCORE_SPEED_MAX_BONUS * (1 - responseTime / SCORE_SPEED_THRESHOLD_MS),
    );
  }

  const combo = Math.min(comboCount * SCORE_COMBO_STEP, SCORE_COMBO_MAX);

  return { base, speed, combo };
}

export function calcWrongPenalty(): number {
  return SCORE_WRONG_PENALTY;
}

export function calcEmptyPenalty(emptyMs: number): number {
  return Math.round((emptyMs / 1000) * SCORE_EMPTY_PER_SEC);
}

export function calcEventMissPenalty(): number {
  return SCORE_EVENT_MISS;
}

export function calcStars(
  score: number,
  level: LevelConfig,
): 1 | 2 | 3 {
  if (score >= level.threeStarScore) return 3;
  if (score >= level.twoStarScore) return 2;
  if (score >= level.targetScore) return 1;
  return 1;
}

export function calcAccuracy(
  totalCorrect: number,
  totalWrong: number,
): number {
  const total = totalCorrect + totalWrong;
  if (total === 0) return 1;
  return totalCorrect / total;
}

export function buildSlotStats(
  slots: Slot[],
  levelDurationMs: number,
): SlotStat[] {
  return slots.map((slot) => {
    const correct = slot.correctCount;
    const wrong = slot.wrongCount;
    const emptyTime = slot.totalEmptyTime;
    const emptyPct = levelDurationMs > 0 ? emptyTime / levelDurationMs : 0;
    const score =
      correct * SCORE_BASE_CORRECT -
      wrong * SCORE_WRONG_PENALTY -
      Math.round(emptyPct * 200);
    return {
      slotId: slot.id,
      slotLabel: slot.label,
      correct,
      wrong,
      emptyTime,
      score: Math.max(0, score),
    };
  });
}

const SUGGESTIONS_POOL = [
  '适当优先处理高优先级(VIP/加急)卡片，可显著提升基础得分。',
  '响应速度越快速度加成越高，尽量缩短卡片在队列中的等待时间。',
  '避免错放，一次错放的扣分远大于一次正确的得分。',
  '注意事件通知条，提前做好位置关闭和优先级变更的应对准备。',
  '保持连击，连续正确可获得高额连击加成。',
  '同名干扰卡出现时，仔细核对类型再归位。',
  '空槽持续时间越长扣分越多，尽量让每个位置都有合适的卡片。',
  '高峰客流时卡片生成加速，提前规划好各个卡槽的预期。',
];

export function generateSuggestion(
  result: Omit<GameResult, 'suggestion'>,
): string {
  const worstSlot = [...result.slotStats].sort((a, b) => a.score - b.score)[0];
  const accuracy = result.accuracy;
  const avgResp = result.avgResponseTime;
  const wrongCount = result.wrongCount;

  if (wrongCount >= 5) {
    return `错放次数较多（${wrongCount}次），${SUGGESTIONS_POOL[2]}`;
  }
  if (accuracy < 0.7) {
    return `正确率偏低（${(accuracy * 100).toFixed(0)}%），${SUGGESTIONS_POOL[0]}`;
  }
  if (avgResp > 4000) {
    return `平均响应较慢（${(avgResp / 1000).toFixed(1)}s），${SUGGESTIONS_POOL[1]}`;
  }
  if (worstSlot && worstSlot.wrong > 2) {
    return `【${worstSlot.slotLabel}】位置错放${worstSlot.wrong}次较多，注意核对目标类型再归位。`;
  }
  if (worstSlot && worstSlot.emptyTime > 10000) {
    return `【${worstSlot.slotLabel}】空槽时间过长，${SUGGESTIONS_POOL[6]}`;
  }
  if (result.maxCombo < 5) {
    return SUGGESTIONS_POOL[4];
  }
  const idx = Math.floor(Math.random() * SUGGESTIONS_POOL.length);
  return SUGGESTIONS_POOL[idx];
}

export function formatTime(ms: number): string {
  if (ms < 0) ms = 0;
  const seconds = Math.ceil(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
