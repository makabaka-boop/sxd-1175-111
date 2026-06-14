import { ArrowLeft, Star, Lock, Dumbbell, BarChart3, Play, ArrowRight, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEVELS } from '@/data/levels';
import { getBestScores, isLevelUnlocked, getHistory, getTrainingFocuses, generateTrainingLevel, markTrainingStarted, getLastReviewSummary } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';

export function LevelsPage() {
  const navigate = useNavigate();
  const initTrainingLevel = useGameStore((s) => s.initTrainingLevel);
  const scores = getBestScores();
  const history = getHistory();
  const lastReview = getLastReviewSummary();

  const startTrainingForLevel = (levelId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const levelResult = history.find((r) => r.levelId === levelId && !r.isTraining);
    if (!levelResult) {
      navigate(`/game/${levelId}`);
      return;
    }
    const focuses = getTrainingFocuses(levelResult);
    if (focuses.length > 0) {
      const trainingLevel = generateTrainingLevel(levelResult, focuses[0]);
      if (trainingLevel) {
        markTrainingStarted();
        initTrainingLevel(trainingLevel);
        navigate(`/training/${trainingLevel.id}`);
      }
    } else {
      navigate(`/game/${levelId}`);
    }
  };

  const hasTrainingAvailable = (levelId: number) => {
    const levelResult = history.find((r) => r.levelId === levelId && !r.isTraining);
    if (!levelResult) return false;
    const focuses = getTrainingFocuses(levelResult);
    return focuses.length > 0;
  };

  const lastResult = history.find((r) => r.levelId === lastReview?.levelId && !r.isTraining);

  const startQuickTraining = () => {
    if (!lastResult) return;
    const focuses = getTrainingFocuses(lastResult);
    if (focuses.length > 0) {
      const trainingLevel = generateTrainingLevel(lastResult, focuses[0]);
      if (trainingLevel) {
        markTrainingStarted();
        initTrainingLevel(trainingLevel);
        navigate(`/training/${trainingLevel.id}`);
      }
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: '#0ea5e9' }} />

      <div className="max-w-5xl mx-auto relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-all"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">返回</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                关卡选择
              </h1>
              <p className="text-xs text-slate-400">通关后自动解锁下一关</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/records')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-all"
          >
            <History size={16} className="text-amber-400" />
            <span className="text-sm font-bold">战绩中心</span>
          </button>
        </div>

        {lastReview && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-200">最近复盘摘要</span>
              </div>
              {!lastReview.hasTraining && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">待训练</span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <div className="text-slate-500 mb-1">关卡</div>
                <div className="text-slate-200 font-bold">{lastReview.levelName}</div>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <div className="text-slate-500 mb-1">得分</div>
                <div className="text-amber-300 font-bold tabular-nums">{lastReview.totalScore.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <div className="text-slate-500 mb-1">正确率</div>
                <div className={`font-bold ${lastReview.accuracy >= 0.8 ? 'text-emerald-400' : lastReview.accuracy >= 0.6 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {(lastReview.accuracy * 100).toFixed(0)}%
                </div>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <div className="text-slate-500 mb-1">星级</div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i <= lastReview.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <div className="text-slate-500 mb-1">事件失误</div>
                <div className={`font-bold ${lastReview.eventMissCount > 0 ? 'text-purple-400' : 'text-emerald-400'}`}>
                  {lastReview.eventMissCount}次
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px] text-slate-400 mt-3">
              <div className="text-center">
                <div className="text-rose-400/80 mb-0.5">易错卡槽</div>
                <div className="text-slate-300 font-medium">{lastReview.worstSlotLabel}</div>
              </div>
              <div className="text-center">
                <div className="text-sky-400/80 mb-0.5">慢响应类型</div>
                <div className="text-slate-300 font-medium">{lastReview.slowestCardTypeLabel}</div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 md:mt-0">
                {!lastReview.hasTraining && lastResult ? (
                  <button
                    onClick={startQuickTraining}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                      bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                      text-white text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <Dumbbell size={12} />
                    开始训练
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/game/${lastReview.levelId}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                      bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-100 text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <Play size={12} />
                    再次挑战
                  </button>
                )}
                <button
                  onClick={() => navigate(`/game/${lastReview.levelId}`)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg
                    bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 transition-all"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEVELS.map((lv) => {
            const unlocked = isLevelUnlocked(lv.id);
            const best = scores[lv.id];

            return (
              <button
                key={lv.id}
                disabled={!unlocked}
                onClick={() => navigate(`/game/${lv.id}`)}
                className={`
                  group relative text-left rounded-2xl p-5 border overflow-hidden transition-all
                  ${unlocked
                    ? 'bg-slate-900/70 hover:bg-slate-800/70 border-slate-700/60 hover:border-indigo-500/50 hover:-translate-y-1 hover:shadow-[0_14px_40px_-10px_rgba(99,102,241,0.5)]'
                    : 'bg-slate-900/40 border-slate-800/60 cursor-not-allowed opacity-60'
                  }
                `}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl group-hover:opacity-50 transition-opacity"
                  style={{ background: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'][(lv.id - 1) % 6] }} />

                <div className="relative space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-400 tracking-widest">
                        LEVEL {String(lv.id).padStart(2, '0')}
                      </div>
                      <div className="text-xl font-bold text-white mt-0.5">{lv.name}</div>
                    </div>
                    {unlocked ? (
                      <div className="flex">
                        {[1, 2, 3].map((i) => (
                          <Star
                            key={i}
                            size={18}
                            className={best && i <= best.stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <Lock size={20} className="text-slate-600" />
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed min-h-[2.5rem]">
                    {lv.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-800/60">
                    <div>
                      <div className="text-slate-500">时长</div>
                      <div className="text-slate-200 font-bold">{lv.duration}s</div>
                    </div>
                    <div>
                      <div className="text-slate-500">卡槽</div>
                      <div className="text-slate-200 font-bold">{lv.slotCount}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">目标分</div>
                      <div className="text-emerald-400 font-bold">{lv.targetScore.toLocaleString()}</div>
                    </div>
                  </div>

                  {best ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs bg-slate-950/60 rounded-lg px-3 py-2 border border-slate-800/60">
                        <span className="text-slate-400">最佳</span>
                        <span className="text-amber-300 font-bold tabular-nums">
                          {best.totalScore.toLocaleString()}
                        </span>
                      </div>
                      {hasTrainingAvailable(lv.id) && (
                        <button
                          onClick={(e) => startTrainingForLevel(lv.id, e)}
                          className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg
                            bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30
                            text-amber-300 font-medium transition-all group"
                        >
                          <Dumbbell size={12} />
                          针对性训练
                        </button>
                      )}
                    </div>
                  ) : unlocked ? (
                    <div className="text-center text-xs text-indigo-300 bg-indigo-500/10 rounded-lg py-2 border border-indigo-500/30 font-medium">
                      点击开始挑战
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-500 bg-slate-900/60 rounded-lg py-2">
                      完成上一关解锁
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
