import { Star, Trophy, Target, Clock, Flame, XCircle, AlertCircle, Lightbulb, RotateCcw, Home, ChevronRight, Zap, Layers, Activity, BarChart3, Dumbbell, ArrowRight, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { GameResult, SlotStat, TrainingFocus } from '@/types/game';
import { LEVELS } from '@/data/levels';
import { formatDuration, getEventTypeLabel } from '@/utils/score';
import { generateTrainingLevel, getTrainingFocuses, markTrainingStarted } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';
import type { TrainingLevelConfig } from '@/types/game';

interface ResultPanelProps {
  result: GameResult;
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={36}
          className={`transition-all ${i <= count ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pop' : 'text-slate-600'}`}
          style={{ animationDelay: `${i * 120}ms` }}
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

export function ResultPanel({ result }: ResultPanelProps) {
  const navigate = useNavigate();
  const initTrainingLevel = useGameStore((s) => s.initTrainingLevel);
  const currentLevel = useGameStore((s) => s.level);
  const level = result.isTraining
    ? (currentLevel as TrainingLevelConfig | null)
    : LEVELS.find((l) => l.id === result.levelId);
  const nextLevel = LEVELS.find((l) => l.id === result.levelId + 1);

  const [showReview, setShowReview] = useState(false);

  const trainingFocuses = result.isTraining ? [] : getTrainingFocuses(result);

  const onReplay = () => {
    navigate(`/game/${result.levelId}`);
  };
  const onNext = () => {
    if (nextLevel) navigate(`/game/${nextLevel.id}`);
    else navigate('/levels');
  };
  const onHome = () => navigate('/levels');

  const startTraining = (focus: TrainingFocus) => {
    const trainingLevel = generateTrainingLevel(result, focus);
    if (trainingLevel) {
      markTrainingStarted();
      initTrainingLevel(trainingLevel);
      navigate(`/training/${trainingLevel.id}`);
    }
  };

  const returnToSourceLevel = () => {
    if (result.sourceLevelId) {
      navigate(`/game/${result.sourceLevelId}`);
    } else {
      navigate('/levels');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div
          className="relative rounded-3xl p-8 border border-slate-700/50 overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 0%, #4338cacc 0%, #1e1b4bdd 60%, #020617ee 100%)',
          }}
        >
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-30 blur-3xl"
            style={{ background: '#f59e0b' }} />
          <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: '#0ea5e9' }} />

          <div className="relative text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              {result.isTraining && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                  <Dumbbell size={10} />
                  专项训练
                </span>
              )}
              <div className="text-xs uppercase tracking-[0.3em] text-indigo-300/70 font-bold">
                {level?.name ?? (result.isTraining ? '专项训练' : `第${result.levelId}关`)} 结算
              </div>
            </div>
            <Stars count={result.stars} />
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400">最终得分</div>
              <div className="text-6xl font-black text-white tabular-nums"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                {result.totalScore.toLocaleString()}
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBar
            label="正确率"
            icon={Target}
            value={(result.accuracy * 100).toFixed(0)}
            suffix="%"
            percent={result.accuracy}
            color="text-emerald-400"
          />
          <StatBar
            label="平均响应"
            icon={Clock}
            value={formatDuration(result.avgResponseTime)}
            percent={Math.max(0, 1 - result.avgResponseTime / 8000)}
            color="text-sky-400"
          />
          <StatBar
            label="最高连击"
            icon={Flame}
            value={result.maxCombo}
            suffix="x"
            percent={Math.min(1, result.maxCombo / 20)}
            color="text-orange-400"
          />
          <StatBar
            label="错放次数"
            icon={XCircle}
            value={result.wrongCount}
            suffix="次"
            percent={Math.max(0, 1 - result.wrongCount / 15)}
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
                  {result.slotStats.map((s, i) => (
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
              {result.penalties.length === 0 ? (
                <div className="text-sm text-emerald-400 py-2">🎉 无任何扣分，完美发挥！</div>
              ) : (
                <ul className="space-y-2">
                  {result.penalties.map((p, i) => (
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
                {result.suggestion}
              </p>
            </div>
          </div>
        </div>

        {result.reviewAnalysis && !result.isTraining && (
          <div className="space-y-4">
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 transition-all group"
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-amber-400" />
                <span className="font-bold text-amber-200 text-sm">查看本局关键失误点分析</span>
              </div>
              <ChevronRight
                size={18}
                className={`text-amber-400 transition-transform ${showReview ? 'rotate-90' : ''}`}
              />
            </button>

            {showReview && (
              <div className="space-y-4 animate-fade-in">
                {result.reviewAnalysis.worstSlots.length > 0 && (
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                      <Layers size={14} className="text-rose-400" />
                      错放最多的卡槽
                    </h3>
                    <div className="space-y-2">
                      {result.reviewAnalysis.worstSlots.map((slot, i) => {
                        const total = slot.correct + slot.wrong;
                        const acc = total > 0 ? slot.correct / total : 0;
                        return (
                          <div key={i} className="flex items-center justify-between bg-slate-900/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-200">{slot.slotLabel}</span>
                              <span className="text-xs text-rose-400">错放 {slot.wrong} 次</span>
                            </div>
                            <span className={`text-xs font-bold ${acc >= 0.7 ? 'text-emerald-400' : acc >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                              正确率 {(acc * 100).toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {result.reviewAnalysis.slowCardTypes.length > 0 && (
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                      <Clock size={14} className="text-sky-400" />
                      平均响应较慢的卡片类型
                    </h3>
                    <div className="space-y-2">
                      {result.reviewAnalysis.slowCardTypes.map((cardType, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-900/40 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-slate-200">{cardType.label}</span>
                          <span className="text-xs text-sky-400 font-bold">
                            平均 {formatDuration(cardType.avgResponseTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.reviewAnalysis.eventMisses.length > 0 && (
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                      <Activity size={14} className="text-purple-400" />
                      事件处理失误
                    </h3>
                    <div className="space-y-2">
                      {result.reviewAnalysis.eventMisses.map((event, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-900/40 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-slate-200">
                            {getEventTypeLabel(event.type)}
                          </span>
                          <span className="text-xs text-purple-400 font-bold">
                            失误 {event.missCount} 次
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {trainingFocuses.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <h3 className="text-sm font-bold text-emerald-200 mb-4 flex items-center gap-1.5">
              <Zap size={16} className="text-emerald-400" />
              针对性训练模式
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

        {result.isTraining ? (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onHome}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                  bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:-translate-y-0.5"
              >
                <Home size={16} />
                关卡列表
              </button>
              <button
                onClick={returnToSourceLevel}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                  bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
              >
                <ArrowRight size={16} />
                再次挑战
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/records')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-xs transition-all
                  bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 hover:-translate-y-0.5"
              >
                <History size={14} />
                战绩中心
              </button>
              <button
                onClick={() => navigate(`/record/training/${result.levelId}?ts=${result.playedAt}`)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-xs transition-all
                  bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 hover:-translate-y-0.5"
              >
                <BarChart3 size={14} />
                查看详情
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={onHome}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                  bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:-translate-y-0.5"
              >
                <Home size={16} />
                关卡列表
              </button>
              <button
                onClick={onReplay}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                  bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-100 shadow-md hover:-translate-y-0.5"
              >
                <RotateCcw size={16} />
                重玩本关
              </button>
              <button
                onClick={onNext}
                disabled={!nextLevel}
                className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                  ${nextLevel
                    ? 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5'
                    : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
              >
                {nextLevel ? '下一关' : '已通关'}
                {nextLevel && <ChevronRight size={16} />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/records')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-xs transition-all
                  bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 hover:-translate-y-0.5"
              >
                <History size={14} />
                战绩中心
              </button>
              <button
                onClick={() => navigate(`/record/level/${result.levelId}?ts=${result.playedAt}`)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-xs transition-all
                  bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 hover:-translate-y-0.5"
              >
                <BarChart3 size={14} />
                查看本局详情
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-600">
          {result.isTraining
            ? '训练完成 · 点击「再次挑战」返回原关卡巩固成果'
            : '通关即解锁下一关 · 成绩保存在本机 localStorage'}
        </div>
      </div>
    </div>
  );
}
