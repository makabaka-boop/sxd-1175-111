import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Trophy, Target, Clock, Flame, XCircle, AlertCircle, Lightbulb, RotateCcw, Home, ChevronRight, Zap, Layers, Activity, BarChart3, Dumbbell, Gamepad2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import type { GameResult, SlotStat, TrainingFocus } from '@/types/game';
import { LEVELS, getLevel } from '@/data/levels';
import { formatDuration, getEventTypeLabel } from '@/utils/score';
import { getRecordByTimestamp, getRecordsForLevel, getTrainingRecordsForSourceLevel, generateTrainingLevel, markTrainingStarted, getTrainingFocuses } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';
import type { TrainingLevelConfig } from '@/types/game';

type TabType = 'overview' | 'analysis' | 'trend';

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3].map(i => (
        <Star
          key={i}
          size={32}
          className={`transition-all ${i <= count ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-slate-600'}`}
        />
      ))}
    </div>
  );
}

function StatBar({
  label,
  icon: Icon,
  value,
  suffix,
  percent,
  color,
}: {
  label: string;
  icon: typeof Trophy;
  value: number | string;
  suffix?: string;
  percent: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Icon size={13} className={color} />
          <span>{label}</span>
        </div>
        <span className={`font-bold tabular-nums ${color}`}>
          {value}
          {suffix && <span className="ml-0.5 text-slate-500 text-[10px]">{suffix}</span>}
        </span>
      </div>
      <div className="h-2 bg-slate-800/70 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(2, percent * 100))}%`,
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          }}
        />
      </div>
    </div>
  );
}

function SlotRow({ stat, index }: { stat: SlotStat; index: number }) {
  const total = stat.correct + stat.wrong;
  const acc = total > 0 ? stat.correct / total : 0;
  const emptySec = Math.round(stat.emptyTime / 1000);

  return (
    <tr className={`border-b border-slate-800/60 ${index % 2 ? 'bg-slate-900/30' : ''}`}>
      <td className="px-3 py-2 text-sm font-medium text-slate-200">{stat.slotLabel}</td>
      <td className="px-3 py-2 text-sm text-emerald-400 tabular-nums">{stat.correct}</td>
      <td className="px-3 py-2 text-sm text-rose-400 tabular-nums">{stat.wrong}</td>
      <td className="px-3 py-2 text-sm tabular-nums">
        <span className={acc >= 0.8 ? 'text-emerald-400' : acc >= 0.5 ? 'text-amber-400' : 'text-rose-400'}>
          {(acc * 100).toFixed(0)}%
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-slate-400 tabular-nums">{emptySec}s</td>
      <td className="px-3 py-2 text-sm font-bold tabular-nums">
        <span className={stat.score >= 300 ? 'text-amber-400' : 'text-slate-300'}>
          {stat.score}
        </span>
      </td>
    </tr>
  );
}

function TrendBar({
  label,
  beforeValue,
  afterValue,
  formatValue,
  isBetterHigher,
  suffix,
}: {
  label: string;
  beforeValue: number;
  afterValue: number;
  formatValue?: (v: number) => string;
  isBetterHigher: boolean;
  suffix?: string;
}) {
  const diff = afterValue - beforeValue;
  const diffPercent = beforeValue > 0 ? (diff / beforeValue) * 100 : 0;
  const isBetter = isBetterHigher ? diff > 0 : diff < 0;

  const format = (v: number) => formatValue ? formatValue(v) : v.toFixed(0);

  return (
    <div className="bg-slate-900/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <div className={`flex items-center gap-1 text-xs font-bold ${isBetter ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isBetter ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{diff > 0 ? '+' : ''}{diffPercent.toFixed(1)}%</span>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="text-[10px] text-slate-500 mb-1">训练前</div>
          <div className="text-lg font-bold text-slate-400 tabular-nums">
            {format(beforeValue)}
            {suffix && <span className="text-xs font-normal text-slate-500 ml-0.5">{suffix}</span>}
          </div>
        </div>
        <ArrowRight size={18} className="text-slate-600 mb-1" />
        <div className="flex-1 text-right">
          <div className="text-[10px] text-slate-500 mb-1">训练后</div>
          <div className={`text-lg font-bold tabular-nums ${isBetter ? 'text-emerald-400' : 'text-rose-400'}`}>
            {format(afterValue)}
            {suffix && <span className="text-xs font-normal text-slate-500 ml-0.5">{suffix}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-slate-600"
          style={{ width: `${Math.min(100, Math.max(5, (beforeValue / Math.max(beforeValue, afterValue)) * 100))}%` }}
        />
        <div
          className={`h-full ${isBetter ? 'bg-emerald-500' : 'bg-rose-500'}`}
          style={{ width: `${Math.min(100, Math.max(5, (afterValue / Math.max(beforeValue, afterValue)) * 100))}%` }}
        />
      </div>
    </div>
  );
}

function getEventMissTotal(result: GameResult): number {
  return result.reviewAnalysis?.eventMisses.reduce((sum, item) => sum + item.missCount, 0) ?? 0;
}

export function RecordDetailPage() {
  const { levelId = '1' } = useParams<{ levelId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initTrainingLevel = useGameStore(s => s.initTrainingLevel);
  const initLevel = useGameStore(s => s.initLevel);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [record, setRecord] = useState<GameResult | null>(null);
  const [trendRecords, setTrendRecords] = useState<{ before: GameResult | null; after: GameResult | null }>({ before: null, after: null });

  const isTraining = location.pathname.includes('/record/training/');
  const id = parseInt(levelId, 10);
  const timestamp = parseInt(searchParams.get('ts') || '0', 10);

  useEffect(() => {
    const foundRecord = getRecordByTimestamp(id, timestamp, isTraining);
    setRecord(foundRecord);

    if (!isTraining && foundRecord) {
      const levelRecords = getRecordsForLevel(id);
      const trainingRecords = getTrainingRecordsForSourceLevel(id);

      const recordIndex = levelRecords.findIndex(r => r.playedAt === timestamp);
      if (recordIndex >= 0) {
        const beforeRecord = levelRecords[recordIndex + 1] || null;
        const hasTrainingBefore = trainingRecords.some(t => {
          if (!beforeRecord) return t.playedAt < timestamp;
          return t.playedAt > beforeRecord.playedAt && t.playedAt < timestamp;
        });

        if (beforeRecord && hasTrainingBefore) {
          setTrendRecords({ before: beforeRecord, after: foundRecord });
        } else {
          setTrendRecords({ before: null, after: null });
        }
      }
    }
  }, [id, timestamp, isTraining]);

  const level = isTraining
    ? null
    : getLevel(id);

  const trainingFocuses = record && !isTraining ? getTrainingFocuses(record) : [];

  const startTraining = (focus: TrainingFocus) => {
    if (!record) return;
    const trainingLevel = generateTrainingLevel(record, focus);
    if (trainingLevel) {
      markTrainingStarted();
      initTrainingLevel(trainingLevel);
      navigate(`/training/${trainingLevel.id}`);
    }
  };

  const onReplay = () => {
    if (!record) return;
    if (isTraining && record.sourceLevelId) {
      initLevel(record.sourceLevelId);
      navigate(`/game/${record.sourceLevelId}`);
    } else if (!isTraining) {
      initLevel(id);
      navigate(`/game/${id}`);
    }
  };

  const onContinueTraining = () => {
    if (!record || trainingFocuses.length === 0) return;
    startTraining(trainingFocuses[0]);
  };

  const onRepeatTraining = () => {
    if (!record?.trainingFocus || !record.sourceLevelId) return;

    const trainingLevel = generateTrainingLevel(
      { ...record, levelId: record.sourceLevelId },
      record.trainingFocus,
    );

    if (trainingLevel) {
      initTrainingLevel(trainingLevel);
      navigate(`/training/${trainingLevel.id}`);
    }
  };

  const getLevelName = () => {
    if (!record) return '';
    if (isTraining) {
      const sourceLevel = LEVELS.find(l => l.id === record.sourceLevelId);
      return sourceLevel ? `专项训练 · ${sourceLevel.name}` : '专项训练';
    }
    return level?.name || `第${id}关`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <p>未找到该战绩记录</p>
          <button
            onClick={() => navigate('/records')}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
          >
            返回战绩中心
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: '#0ea5e9' }} />

      <div className="max-w-3xl mx-auto relative">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/records')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-all"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">战绩中心</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              战绩详情
            </h1>
            <p className="text-xs text-slate-400">{formatDate(record.playedAt)}</p>
          </div>
        </div>

        <div
          className="relative rounded-3xl p-6 border border-slate-700/50 overflow-hidden mb-6"
          style={{
            background: isTraining
              ? 'radial-gradient(circle at 50% 0%, #b45309cc 0%, #78350fdd 60%, #020617ee 100%)'
              : 'radial-gradient(circle at 50% 0%, #4338cacc 0%, #1e1b4bdd 60%, #020617ee 100%)',
          }}
        >
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-30 blur-3xl"
            style={{ background: isTraining ? '#f59e0b' : '#818cf8' }} />
          <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: isTraining ? '#ea580c' : '#0ea5e9' }} />

          <div className="relative text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isTraining
                  ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                  : 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300'
              }`}>
                {isTraining ? <Dumbbell size={10} /> : <Gamepad2 size={10} />}
                {isTraining ? '专项训练' : '正式闯关'}
              </span>
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400/70 font-bold">
              {getLevelName()}
            </div>
            <Stars count={record.stars} />
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400">最终得分</div>
              <div className="text-5xl font-black text-white tabular-nums"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                {record.totalScore.toLocaleString()}
              </div>
              {level && (
                <div className="text-xs text-slate-400">
                  过关线 {level.targetScore.toLocaleString()} ·
                  三星线 {level.threeStarScore.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 p-1 bg-slate-900/50 rounded-xl border border-slate-800/60">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy size={14} />
            总览
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analysis'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={14} />
            失误分析
          </button>
          {!isTraining && trendRecords.before && trendRecords.after && (
            <button
              onClick={() => setActiveTab('trend')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'trend'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp size={14} />
              训练效果
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBar
                label="正确率"
                icon={Target}
                value={(record.accuracy * 100).toFixed(0)}
                suffix="%"
                percent={record.accuracy}
                color="text-emerald-400"
              />
              <StatBar
                label="平均响应"
                icon={Clock}
                value={formatDuration(record.avgResponseTime)}
                percent={Math.max(0, 1 - record.avgResponseTime / 8000)}
                color="text-sky-400"
              />
              <StatBar
                label="最高连击"
                icon={Flame}
                value={record.maxCombo}
                suffix="x"
                percent={Math.min(1, record.maxCombo / 20)}
                color="text-orange-400"
              />
              <StatBar
                label="错放次数"
                icon={XCircle}
                value={record.wrongCount}
                suffix="次"
                percent={Math.max(0, 1 - record.wrongCount / 15)}
                color="text-rose-400"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-400" />
                  各位置完成情况
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                        <th className="px-3 py-2 font-bold">位置</th>
                        <th className="px-3 py-2 font-bold">✓</th>
                        <th className="px-3 py-2 font-bold">✗</th>
                        <th className="px-3 py-2 font-bold">正确率</th>
                        <th className="px-3 py-2 font-bold">空槽</th>
                        <th className="px-3 py-2 font-bold">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.slotStats.map((s, i) => (
                        <SlotRow key={s.slotId} stat={s} index={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-400" />
                    扣分来源
                  </h3>
                  {record.penalties.length === 0 ? (
                    <div className="text-sm text-emerald-400 py-2">🎉 无任何扣分，完美发挥！</div>
                  ) : (
                    <ul className="space-y-2">
                      {record.penalties.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between text-sm bg-slate-900/40 rounded-lg px-3 py-2"
                        >
                          <span className="text-slate-300">{p.label}</span>
                          <span className="text-rose-400 font-bold tabular-nums">
                            -{p.amount.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div
                  className="rounded-2xl border p-5 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e922 0%, #8b5cf622 100%)',
                    borderColor: 'rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <h3 className="text-sm font-bold text-sky-200 mb-2 flex items-center gap-1.5">
                    <Lightbulb size={14} />
                    复盘建议
                  </h3>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {record.suggestion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && record.reviewAnalysis && (
          <div className="space-y-4">
            {record.reviewAnalysis.worstSlots.length > 0 && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5">
                  <Layers size={16} className="text-rose-400" />
                  错放最多的卡槽
                </h3>
                <div className="space-y-3">
                  {record.reviewAnalysis.worstSlots.map((slot, i) => {
                    const total = slot.correct + slot.wrong;
                    const acc = total > 0 ? slot.correct / total : 0;
                    return (
                      <div key={i} className="bg-slate-900/40 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-200">{slot.slotLabel}</span>
                          <span className="text-xs text-rose-400 font-medium">错放 {slot.wrong} 次</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                                style={{ width: `${(slot.wrong / Math.max(slot.wrong, slot.correct)) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className={`text-xs font-bold tabular-nums min-w-[50px] text-right ${
                            acc >= 0.7 ? 'text-emerald-400' : acc >= 0.5 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            正确率 {(acc * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {record.reviewAnalysis.slowCardTypes.length > 0 && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5">
                  <Clock size={16} className="text-sky-400" />
                  平均响应较慢的卡片类型
                </h3>
                <div className="space-y-3">
                  {record.reviewAnalysis.slowCardTypes.map((cardType, i) => (
                    <div key={i} className="bg-slate-900/40 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-200">{cardType.label}</span>
                        <span className="text-xs text-sky-400 font-bold">
                          平均 {formatDuration(cardType.avgResponseTime)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        正确 {cardType.correct} 次 · 错误 {cardType.wrong} 次
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {record.reviewAnalysis.eventMisses.length > 0 && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5">
                  <Activity size={16} className="text-purple-400" />
                  事件处理失误
                </h3>
                <div className="space-y-3">
                  {record.reviewAnalysis.eventMisses.map((event, i) => (
                    <div key={i} className="bg-slate-900/40 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-200">
                          {getEventTypeLabel(event.type)}
                        </span>
                        <span className="text-xs text-purple-400 font-bold">
                          失误 {event.missCount} 次 / 共 {event.count} 次
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {record.reviewAnalysis.worstSlots.length === 0 &&
              record.reviewAnalysis.slowCardTypes.length === 0 &&
              record.reviewAnalysis.eventMisses.length === 0 && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <div className="text-emerald-300 font-bold">完美表现！</div>
                <p className="text-sm text-slate-400 mt-1">本局没有明显的失误点</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trend' && trendRecords.before && trendRecords.after && (
          <div className="space-y-6">
            <div
              className="rounded-2xl border p-5"
              style={{
                background: 'linear-gradient(135deg, #10b98122 0%, #0ea5e922 100%)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
              }}
            >
              <h3 className="text-sm font-bold text-emerald-200 mb-2 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-emerald-400" />
                训练效果对比
              </h3>
              <p className="text-xs text-slate-400">
                展示同一关卡在专项训练前后的核心指标变化趋势
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrendBar
                label="得分"
                beforeValue={trendRecords.before.totalScore}
                afterValue={trendRecords.after.totalScore}
                formatValue={v => v.toLocaleString()}
                isBetterHigher={true}
              />
              <TrendBar
                label="正确率"
                beforeValue={trendRecords.before.accuracy * 100}
                afterValue={trendRecords.after.accuracy * 100}
                isBetterHigher={true}
                suffix="%"
              />
              <TrendBar
                label="平均响应时间"
                beforeValue={trendRecords.before.avgResponseTime}
                afterValue={trendRecords.after.avgResponseTime}
                formatValue={v => formatDuration(v)}
                isBetterHigher={false}
              />
              <TrendBar
                label="最高连击"
                beforeValue={trendRecords.before.maxCombo}
                afterValue={trendRecords.after.maxCombo}
                isBetterHigher={true}
                suffix="x"
              />
              <TrendBar
                label="错放次数"
                beforeValue={trendRecords.before.wrongCount}
                afterValue={trendRecords.after.wrongCount}
                isBetterHigher={false}
                suffix="次"
              />
              <TrendBar
                label="事件失误"
                beforeValue={getEventMissTotal(trendRecords.before)}
                afterValue={getEventMissTotal(trendRecords.after)}
                isBetterHigher={false}
                suffix="次"
              />
              <TrendBar
                label="星级"
                beforeValue={trendRecords.before.stars}
                afterValue={trendRecords.after.stars}
                isBetterHigher={true}
                suffix="星"
              />
            </div>

            {trendRecords.after.reviewAnalysis && trendRecords.before.reviewAnalysis && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">关键失误点变化</h3>
                <div className="space-y-4">
                  {trendRecords.before.reviewAnalysis.worstSlots.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-2">错放最多卡槽</div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-rose-400">
                          训练前: {trendRecords.before.reviewAnalysis.worstSlots[0]?.slotLabel}
                          （{trendRecords.before.reviewAnalysis.worstSlots[0]?.wrong}次错放）
                        </span>
                        <ArrowRight size={14} className="text-slate-600" />
                        <span className="text-sm text-emerald-400">
                          训练后: {trendRecords.after.reviewAnalysis.worstSlots[0]?.slotLabel || '无'}
                          （{trendRecords.after.reviewAnalysis.worstSlots[0]?.wrong || 0}次错放）
                        </span>
                      </div>
                    </div>
                  )}
                  {(getEventMissTotal(trendRecords.before) > 0 || getEventMissTotal(trendRecords.after) > 0) && (
                    <div>
                      <div className="text-xs text-slate-500 mb-2">事件失误总数</div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-rose-400">
                          训练前: {getEventMissTotal(trendRecords.before)}次
                        </span>
                        <ArrowRight size={14} className="text-slate-600" />
                        <span className={`text-sm ${
                          getEventMissTotal(trendRecords.after) <= getEventMissTotal(trendRecords.before)
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}>
                          训练后: {getEventMissTotal(trendRecords.after)}次
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!isTraining && trainingFocuses.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 mt-6">
            <h3 className="text-sm font-bold text-emerald-200 mb-4 flex items-center gap-1.5">
              <Zap size={16} className="text-emerald-400" />
              针对性训练推荐
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              根据本局表现，系统为你推荐以下专项训练，点击即可开始强化练习：
            </p>
            <div className="space-y-2">
              {trainingFocuses.map((focus, i) => (
                <button
                  key={i}
                  onClick={() => startTraining(focus)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                      {focus.type === 'slot' && <Layers size={16} className="text-emerald-300" />}
                      {focus.type === 'cardType' && <Zap size={16} className="text-emerald-300" />}
                      {focus.type === 'event' && <Activity size={16} className="text-emerald-300" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-emerald-200">{focus.label}</div>
                      <div className="text-[11px] text-emerald-400/70">
                        {focus.type === 'slot' && '强化卡槽识别与正确归位'}
                        {focus.type === 'cardType' && '提升卡片响应速度'}
                        {focus.type === 'event' && '熟悉事件应对策略'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-6">
          <button
            onClick={() => navigate('/records')}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
              bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:-translate-y-0.5"
          >
            <Home size={16} />
            战绩中心
          </button>
          {!isTraining ? (
            <>
              <button
                onClick={onReplay}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                  bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-100 shadow-md hover:-translate-y-0.5"
              >
                <RotateCcw size={16} />
                再次挑战
              </button>
              {trainingFocuses.length > 0 && (
                <button
                  onClick={onContinueTraining}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                    bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                    text-white shadow-lg shadow-amber-500/20 hover:-translate-y-0.5"
                >
                  <Dumbbell size={16} />
                  开始训练
                </button>
              )}
            </>
          ) : (
            <>
              {record.trainingFocus && (
                <button
                  onClick={onRepeatTraining}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                    bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                    text-white shadow-lg shadow-amber-500/20 hover:-translate-y-0.5"
                >
                  <Dumbbell size={16} />
                  继续训练
                </button>
              )}
              <button
                onClick={onReplay}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all col-span-1 md:col-span-1
                  bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
              >
                <ArrowRight size={16} />
                返回原关卡挑战
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
