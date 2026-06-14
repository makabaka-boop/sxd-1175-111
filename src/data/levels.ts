import type { CardType, LevelConfig } from '@/types/game';

export const CARD_TYPE_META: Record<
  CardType,
  { label: string; color: string }
> = {
  A: { label: '普通访客', color: '#0ea5e9' },
  B: { label: 'VIP会员', color: '#f59e0b' },
  C: { label: '预约客户', color: '#10b981' },
  D: { label: '快递员', color: '#ef4444' },
  E: { label: '维修人员', color: '#8b5cf6' },
  F: { label: '外卖员', color: '#ec4899' },
};

function eventId(prefix: string, lvl: number, i: number): string {
  return `${prefix}_l${lvl}_${i}`;
}

const LEVEL_1_EVENTS = [
  {
    id: eventId('ev', 1, 1),
    type: 'priority_change' as const,
    triggerAt: 25000,
    duration: 15000,
    payload: { slotIndex: 0, priority: 3 as const },
    message: '【重要】普通访客位置临时升级为VIP优先',
  },
  {
    id: eventId('ev', 1, 2),
    type: 'rush_hour' as const,
    triggerAt: 45000,
    duration: 20000,
    payload: { multiplier: 1.5 },
    message: '【高峰】来客增多，卡片生成加速！',
  },
];

const LEVEL_2_EVENTS = [
  {
    id: eventId('ev', 2, 1),
    type: 'slot_close' as const,
    triggerAt: 20000,
    duration: 12000,
    payload: { slotIndex: 1 },
    message: '【关闭】VIP会员通道临时关闭12秒',
  },
  {
    id: eventId('ev', 2, 2),
    type: 'fake_card' as const,
    triggerAt: 35000,
    duration: 20000,
    payload: { chance: 0.25 },
    message: '【干扰】出现同名卡片，请仔细核对！',
  },
  {
    id: eventId('ev', 2, 3),
    type: 'rush_hour' as const,
    triggerAt: 55000,
    duration: 25000,
    payload: { multiplier: 1.6 },
    message: '【高峰】客流叠加，考验你的手速！',
  },
];

const LEVEL_3_EVENTS = [
  {
    id: eventId('ev', 3, 1),
    type: 'priority_change' as const,
    triggerAt: 15000,
    duration: 20000,
    payload: { slotIndex: 2, priority: 2 as const },
    message: '【优先级】预约客户位置升级为加急处理',
  },
  {
    id: eventId('ev', 3, 2),
    type: 'slot_close' as const,
    triggerAt: 40000,
    duration: 15000,
    payload: { slotIndex: 0 },
    message: '【关闭】普通访客通道临时维护15秒',
  },
  {
    id: eventId('ev', 3, 3),
    type: 'fake_card' as const,
    triggerAt: 60000,
    duration: 25000,
    payload: { chance: 0.3 },
    message: '【干扰】混入干扰卡，注意区分颜色和标识！',
  },
  {
    id: eventId('ev', 3, 4),
    type: 'rush_hour' as const,
    triggerAt: 80000,
    duration: 30000,
    payload: { multiplier: 1.7 },
    message: '【大高峰】多事件叠加，稳住节奏！',
  },
];

const LEVEL_4_EVENTS = [
  {
    id: eventId('ev', 4, 1),
    type: 'slot_close' as const,
    triggerAt: 10000,
    duration: 10000,
    payload: { slotIndex: 3 },
    message: '【关闭】快递员通道临时关闭',
  },
  {
    id: eventId('ev', 4, 2),
    type: 'priority_change' as const,
    triggerAt: 25000,
    duration: 20000,
    payload: { slotIndex: 1, priority: 3 as const },
    message: '【重要】VIP通道升级为最高优先级',
  },
  {
    id: eventId('ev', 4, 3),
    type: 'fake_card' as const,
    triggerAt: 40000,
    duration: 30000,
    payload: { chance: 0.35 },
    message: '【干扰】大量干扰卡混入，擦亮眼睛！',
  },
  {
    id: eventId('ev', 4, 4),
    type: 'slot_close' as const,
    triggerAt: 55000,
    duration: 15000,
    payload: { slotIndex: 2 },
    message: '【关闭】预约客户通道临时关闭',
  },
  {
    id: eventId('ev', 4, 5),
    type: 'rush_hour' as const,
    triggerAt: 75000,
    duration: 35000,
    payload: { multiplier: 1.8 },
    message: '【超级高峰】多事件叠加，全力应对！',
  },
];

const LEVEL_5_EVENTS = [
  {
    id: eventId('ev', 5, 1),
    type: 'priority_change' as const,
    triggerAt: 10000,
    duration: 25000,
    payload: { slotIndex: 4, priority: 3 as const },
    message: '【重要】维修人员通道升级为最高优先级',
  },
  {
    id: eventId('ev', 5, 2),
    type: 'slot_close' as const,
    triggerAt: 25000,
    duration: 12000,
    payload: { slotIndex: 1 },
    message: '【关闭】VIP通道临时关闭',
  },
  {
    id: eventId('ev', 5, 3),
    type: 'fake_card' as const,
    triggerAt: 35000,
    duration: 40000,
    payload: { chance: 0.4 },
    message: '【强干扰】同名卡大量混入，请仔细辨别！',
  },
  {
    id: eventId('ev', 5, 4),
    type: 'slot_close' as const,
    triggerAt: 55000,
    duration: 18000,
    payload: { slotIndex: 3 },
    message: '【关闭】快递员通道临时关闭',
  },
  {
    id: eventId('ev', 5, 5),
    type: 'priority_change' as const,
    triggerAt: 70000,
    duration: 30000,
    payload: { slotIndex: 5, priority: 2 as const },
    message: '【优先级】外卖员通道加急处理',
  },
  {
    id: eventId('ev', 5, 6),
    type: 'rush_hour' as const,
    triggerAt: 90000,
    duration: 45000,
    payload: { multiplier: 2.0 },
    message: '【终极高峰】所有压力叠加，终极挑战！',
  },
];

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '初入大厅',
    description: '熟悉基础操作：拖拽卡片到对应位置，处理简单的优先级变更和一次小高峰。',
    duration: 75,
    slotCount: 3,
    slotLabels: ['A-普通访客', 'B-VIP会员', 'C-预约客户'],
    cardTypes: ['A', 'B', 'C'],
    cardInterval: [2200, 3200],
    rushHourMultiplier: 1.5,
    events: LEVEL_1_EVENTS,
    targetScore: 1200,
    twoStarScore: 2000,
    threeStarScore: 3000,
  },
  {
    id: 2,
    name: '渐入佳境',
    description: '新增通道关闭和同名干扰卡事件，注意事件条的提示信息。',
    duration: 90,
    slotCount: 4,
    slotLabels: ['A-普通访客', 'B-VIP会员', 'C-预约客户', 'D-快递员'],
    cardTypes: ['A', 'B', 'C', 'D'],
    cardInterval: [1800, 2800],
    rushHourMultiplier: 1.6,
    events: LEVEL_2_EVENTS,
    targetScore: 2000,
    twoStarScore: 3200,
    threeStarScore: 4500,
  },
  {
    id: 3,
    name: '多线作战',
    description: '5个卡槽同时运作，多个事件叠加出现，合理分配注意力。',
    duration: 120,
    slotCount: 5,
    slotLabels: [
      'A-普通访客',
      'B-VIP会员',
      'C-预约客户',
      'D-快递员',
      'E-维修人员',
    ],
    cardTypes: ['A', 'B', 'C', 'D', 'E'],
    cardInterval: [1500, 2400],
    rushHourMultiplier: 1.7,
    events: LEVEL_3_EVENTS,
    targetScore: 3500,
    twoStarScore: 5200,
    threeStarScore: 7000,
  },
  {
    id: 4,
    name: '高压模式',
    description: '6个卡槽全开，通道频繁切换，高峰倍率提升。',
    duration: 120,
    slotCount: 6,
    slotLabels: [
      'A-普通访客',
      'B-VIP会员',
      'C-预约客户',
      'D-快递员',
      'E-维修人员',
      'F-外卖员',
    ],
    cardTypes: ['A', 'B', 'C', 'D', 'E', 'F'],
    cardInterval: [1300, 2100],
    rushHourMultiplier: 1.8,
    events: LEVEL_4_EVENTS,
    targetScore: 4500,
    twoStarScore: 6800,
    threeStarScore: 9000,
  },
  {
    id: 5,
    name: '终极挑战',
    description: '所有事件类型+超长高峰+高干扰率，考验你的极限处理能力。',
    duration: 150,
    slotCount: 6,
    slotLabels: [
      'A-普通访客',
      'B-VIP会员',
      'C-预约客户',
      'D-快递员',
      'E-维修人员',
      'F-外卖员',
    ],
    cardTypes: ['A', 'B', 'C', 'D', 'E', 'F'],
    cardInterval: [1000, 1800],
    rushHourMultiplier: 2.0,
    events: LEVEL_5_EVENTS,
    targetScore: 6500,
    twoStarScore: 9500,
    threeStarScore: 13000,
  },
];

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find((l) => l.id === id);
}
