import { ArrowLeft, Star, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEVELS } from '@/data/levels';
import { getBestScores, isLevelUnlocked } from '@/utils/storage';

export function LevelsPage() {
  const navigate = useNavigate();
  const scores = getBestScores();

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: '#0ea5e9' }} />

      <div className="max-w-5xl mx-auto relative">
        <div className="flex items-center gap-3 mb-8">
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
                    <div className="flex items-center justify-between text-xs bg-slate-950/60 rounded-lg px-3 py-2 border border-slate-800/60">
                      <span className="text-slate-400">最佳</span>
                      <span className="text-amber-300 font-bold tabular-nums">
                        {best.totalScore.toLocaleString()}
                      </span>
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
