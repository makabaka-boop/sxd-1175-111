import { Pause, Play, Clock, Flame, Trophy, Target } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { formatTime } from '@/utils/score';

export function GameHUD() {
  const level = useGameStore((s) => s.level);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const status = useGameStore((s) => s.status);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const activeEvents = useGameStore((s) => s.activeEvents);

  if (!level) return null;

  const totalMs = level.duration * 1000;
  const remainingMs = totalMs - elapsedMs;
  const urgency = remainingMs < 15000;
  const progress = Math.max(0, Math.min(1, elapsedMs / totalMs));

  const rushActive = activeEvents.some((e) => e.type === 'rush_hour');
  const targetPct = Math.min(1, score / level.targetScore);

  return (
    <div className="sticky top-0 z-30 w-full bg-gradient-to-b from-indigo-950/95 via-indigo-950/80 to-transparent pb-3 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 pt-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-900/80 rounded-full px-4 py-2 border border-slate-700/60 shadow-lg">
              <Trophy size={16} className="text-amber-400" />
              <span className="text-amber-300 font-bold text-lg tabular-nums min-w-[4ch] text-right">
                {score.toLocaleString()}
              </span>
              <Target size={14} className="text-slate-500 ml-2" />
              <span className="text-slate-400 text-xs">
                目标 {level.targetScore.toLocaleString()}
              </span>
            </div>

            {combo > 1 && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-rose-600 rounded-full px-3 py-1.5 shadow-lg animate-pulse">
                <Flame size={14} className="text-yellow-200" />
                <span className="text-white font-bold text-sm">
                  连击 x{combo}
                </span>
              </div>
            )}

            {rushActive && (
              <div className="flex items-center gap-1 bg-rose-600/80 rounded-full px-3 py-1.5 animate-pulse">
                <span className="text-white text-xs font-bold">⚡ 高峰客流</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 shadow-lg border transition-colors
                ${urgency ? 'bg-rose-950/80 border-rose-500/60 animate-pulse' : 'bg-slate-900/80 border-slate-700/60'}
              `}
            >
              <Clock
                size={16}
                className={urgency ? 'text-rose-400' : 'text-sky-400'}
              />
              <span
                className={`font-bold text-lg tabular-nums ${urgency ? 'text-rose-300' : 'text-sky-300'}`}
              >
                {formatTime(remainingMs)}
              </span>
            </div>

            <button
              onClick={() => (status === 'playing' ? pauseGame() : resumeGame())}
              className="rounded-full p-2.5 bg-slate-900/80 border border-slate-700/60 shadow-lg hover:bg-slate-800 transition-colors"
              title={status === 'playing' ? '暂停 (空格)' : '继续 (空格)'}
            >
              {status === 'playing' ? (
                <Pause size={18} className="text-slate-300" />
              ) : (
                <Play size={18} className="text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 h-1.5 bg-slate-800/70 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress * 100}%`,
              background: urgency
                ? 'linear-gradient(90deg,#f43f5e,#ef4444)'
                : 'linear-gradient(90deg,#6366f1,#0ea5e9)',
            }}
          />
        </div>

        <div className="mt-1.5 h-1 bg-slate-800/50 rounded-full overflow-hidden max-w-xs">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
            style={{ width: `${targetPct * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
