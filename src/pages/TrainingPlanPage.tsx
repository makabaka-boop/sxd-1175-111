import { useState, useEffect } from 'react';
import { ArrowLeft, Dumbbell, Target, CheckCircle2, Clock, Zap, Layers, Activity, Play, ChevronRight, Trash2, ArrowRight, Trophy, Star, BarChart3 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { TrainingPlan, TrainingPlanItem } from '@/types/game';
import { getTrainingPlan, abandonTrainingPlan, getActiveTrainingPlans, getTrainingPlans, generateTrainingLevel, markTrainingStarted } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';
import { LEVELS, getLevel } from '@/data/levels';

export function TrainingPlanPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const initTrainingLevel = useGameStore((s) => s.initTrainingLevel);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [allPlans, setAllPlans] = useState<TrainingPlan[]>([]);

  useEffect(() => {
    if (planId) {
      const found = getTrainingPlan(planId);
      setPlan(found);
    }
    setAllPlans(getTrainingPlans());
  }, [planId]);

  const refreshPlan = () => {
    if (planId) {
      setPlan(getTrainingPlan(planId));
    }
    setAllPlans(getTrainingPlans());
  };

  const startPlanTraining = (item: TrainingPlanItem) => {
    if (!plan) return;
    const sourceLevel = getLevel(plan.sourceLevelId);
    if (!sourceLevel) return;

    const trainingLevel = generateTrainingLevel(
      {
        levelId: plan.sourceLevelId,
        totalScore: plan.sourceScore,
        stars: 0,
        accuracy: plan.sourceAccuracy,
        avgResponseTime: 3000,
        wrongCount: 5,
        maxCombo: 3,
        slotStats: [],
        penalties: [],
        suggestion: '',
        playedAt: plan.sourceResultTimestamp,
        reviewAnalysis: {
          worstSlots: item.focus.type === 'slot' ? [{ slotId: 's0', slotLabel: item.focus.target, wrong: 3, correct: 2 }] : [],
          slowCardTypes: item.focus.type === 'cardType' ? [{ type: item.focus.target as 'A', label: item.focus.label, correct: 5, wrong: 2, totalResponseTime: 15000, avgResponseTime: 3000 }] : [],
          eventMisses: item.focus.type === 'event' ? [{ type: item.focus.target as 'slot_close', count: 3, missCount: 2 }] : [],
          cardTypeStats: [],
        },
      },
      item.focus,
    );

    if (trainingLevel) {
      markTrainingStarted();
      initTrainingLevel(trainingLevel, plan.id);
      navigate(`/training/${trainingLevel.id}`);
    }
  };

  const onAbandon = () => {
    if (!plan) return;
    abandonTrainingPlan(plan.id);
    navigate('/records');
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (planId && !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <p>训练计划不存在</p>
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

  if (plan) {
    const sourceLevel = getLevel(plan.sourceLevelId);
    const totalItems = plan.items.length;
    const completedItems = plan.items.filter((i) => i.completedRounds >= i.suggestedRounds).length;
    const overallProgress = totalItems > 0 ? completedItems / totalItems : 0;

    return (
      <div className="min-h-screen py-8 px-4 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#f59e0b' }} />
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
                训练计划
              </h1>
              <p className="text-xs text-slate-400">{formatDate(plan.createdAt)} 创建</p>
            </div>
          </div>

          <div
            className="relative rounded-3xl p-6 border border-slate-700/50 overflow-hidden mb-6"
            style={{
              background: 'radial-gradient(circle at 50% 0%, #b45309cc 0%, #78350fdd 60%, #020617ee 100%)',
            }}
          >
            <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-30 blur-3xl" style={{ background: '#f59e0b' }} />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: '#ea580c' }} />

            <div className="relative text-center space-y-3">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                <Dumbbell size={10} />
                {plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : '已放弃'}
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-amber-300/70 font-bold">
                针对「{plan.sourceLevelName}」的训练计划
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">原始得分</div>
                <div className="text-4xl font-black text-white tabular-nums" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                  {plan.sourceScore.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">
                  原始正确率 {(plan.sourceAccuracy * 100).toFixed(0)}%
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">计划进度</span>
                  <span className="text-amber-300 font-bold">{completedItems}/{totalItems} 项完成</span>
                </div>
                <div className="h-3 bg-slate-800/70 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${overallProgress * 100}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {plan.items.map((item, idx) => {
              const isItemCompleted = item.completedRounds >= item.suggestedRounds;
              const progress = item.suggestedRounds > 0 ? item.completedRounds / item.suggestedRounds : 0;

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 transition-all ${
                    isItemCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-slate-700/50 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isItemCompleted
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : item.focus.type === 'slot'
                            ? 'bg-rose-500/20 border border-rose-500/30'
                            : item.focus.type === 'cardType'
                              ? 'bg-sky-500/20 border border-sky-500/30'
                              : 'bg-purple-500/20 border border-purple-500/30'
                      }`}>
                        {isItemCompleted ? (
                          <CheckCircle2 size={20} className="text-emerald-400" />
                        ) : item.focus.type === 'slot' ? (
                          <Layers size={20} className="text-rose-400" />
                        ) : item.focus.type === 'cardType' ? (
                          <Zap size={20} className="text-sky-400" />
                        ) : (
                          <Activity size={20} className="text-purple-400" />
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${isItemCompleted ? 'text-emerald-200' : 'text-slate-200'}`}>
                          {item.focus.label}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.improvementDirection}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-slate-900/40 rounded-lg px-3 py-2 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">目标分</div>
                      <div className="text-sm font-bold text-amber-400 tabular-nums">{item.targetScore}</div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg px-3 py-2 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">建议次数</div>
                      <div className="text-sm font-bold text-sky-400 tabular-nums">{item.suggestedRounds}次</div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg px-3 py-2 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">最佳成绩</div>
                      <div className="text-sm font-bold text-emerald-400 tabular-nums">
                        {item.bestScore > 0 ? item.bestScore : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">完成进度</span>
                        <span className={`font-bold tabular-nums ${isItemCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {item.completedRounds}/{item.suggestedRounds}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isItemCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>

                    {!isItemCompleted && plan.status === 'active' && (
                      <button
                        onClick={() => startPlanTraining(item)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
                          bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                          text-white shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 transition-all"
                      >
                        <Play size={14} className="fill-white" />
                        训练
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {plan.status === 'active' && sourceLevel && (
            <div
              className="rounded-2xl border p-5 mb-6"
              style={{
                background: 'linear-gradient(135deg, #10b98122 0%, #0ea5e922 100%)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
              }}
            >
              <h3 className="text-sm font-bold text-emerald-200 mb-2 flex items-center gap-1.5">
                <Trophy size={16} className="text-emerald-400" />
                训练完成后
              </h3>
              <p className="text-sm text-slate-300 mb-3">
                完成训练计划后，建议返回「{sourceLevel.name}」再次挑战，验证整体提升效果。
              </p>
              <button
                onClick={() => {
                  useGameStore.getState().initLevel(plan.sourceLevelId);
                  navigate(`/game/${plan.sourceLevelId}`);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold
                  bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400
                  text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
              >
                <ArrowRight size={16} />
                返回挑战「{sourceLevel.name}」
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/records')}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
                bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:-translate-y-0.5"
            >
              战绩中心
            </button>
            {plan.status === 'active' && (
              <button
                onClick={onAbandon}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-sm transition-all
                  bg-slate-900/80 hover:bg-slate-800 border border-rose-700/50 text-rose-400 hover:-translate-y-0.5"
              >
                <Trash2 size={14} />
                放弃计划
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: '#0ea5e9' }} />

      <div className="max-w-4xl mx-auto relative">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/records')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-all"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">返回</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              训练计划
            </h1>
            <p className="text-xs text-slate-400">查看和管理你的训练计划</p>
          </div>
        </div>

        {allPlans.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-12 text-center">
            <Dumbbell size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">暂无训练计划</p>
            <p className="text-xs text-slate-500 mb-6">完成关卡后可根据失误分析一键生成训练计划</p>
            <button
              onClick={() => navigate('/levels')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-bold hover:from-indigo-400 hover:to-violet-400 transition-all"
            >
              开始挑战
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {allPlans.map((p) => {
              const completedItems = p.items.filter((i) => i.completedRounds >= i.suggestedRounds).length;
              const totalItems = p.items.length;
              const progress = totalItems > 0 ? completedItems / totalItems : 0;
              const statusColor = p.status === 'active' ? 'amber' : p.status === 'completed' ? 'emerald' : 'slate';

              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/training-plan/${p.id}`)}
                  className="w-full text-left rounded-2xl border border-slate-700/50 bg-slate-950/60 p-4 hover:bg-slate-900/70 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        p.status === 'active'
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : p.status === 'completed'
                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-slate-700/30 border border-slate-600/30'
                      }`}>
                        <Dumbbell size={20} className={
                          p.status === 'active' ? 'text-amber-400' : p.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                        } />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.sourceLevelName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            p.status === 'active'
                              ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                              : p.status === 'completed'
                                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                                : 'bg-slate-700/30 border-slate-600/30 text-slate-400'
                          }`}>
                            {p.status === 'active' ? '进行中' : p.status === 'completed' ? '已完成' : '已放弃'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatDate(p.createdAt)} · 原始得分 {p.sourceScore}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">{completedItems}/{totalItems} 项完成</span>
                        <span className={`font-bold tabular-nums text-${statusColor}-400`}>
                          {Math.round(progress * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p.status === 'completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {p.items.map((item, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            item.completedRounds >= item.suggestedRounds ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
