import { Play, RotateCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';

export function PauseOverlay() {
  const navigate = useNavigate();
  const status = useGameStore((s) => s.status);
  const levelId = useGameStore((s) => s.levelId);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const initLevel = useGameStore((s) => s.initLevel);
  const startGame = useGameStore((s) => s.startGame);

  if (status !== 'paused') return null;

  const handleRestart = () => {
    if (levelId) {
      initLevel(levelId);
      setTimeout(() => startGame(), 30);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-[92%] max-w-md rounded-2xl p-8 border border-slate-700/60 shadow-2xl overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #312e81cc 0%, #0f172aee 70%)',
        }}
      >
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: '#a855f7' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full opacity-20 blur-3xl"
          style={{ background: '#0ea5e9' }}
        />

        <div className="relative text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              暂停中
            </h2>
            <p className="text-slate-400 text-sm">倒计时与事件已全部停止</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={resumeGame}
              className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-base transition-all
                bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400
                text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <Play size={18} />
              继续游戏
            </button>
            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-base transition-all
                bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50
                text-slate-200 shadow-md hover:-translate-y-0.5"
            >
              <RotateCcw size={18} />
              重新开始
            </button>
            <button
              onClick={() => navigate('/levels')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-base transition-all
                bg-slate-900/60 hover:bg-slate-800/60 border border-slate-700/50
                text-slate-300 hover:-translate-y-0.5"
            >
              <Home size={18} />
              返回关卡选择
            </button>
          </div>

          <p className="text-xs text-slate-500">按空格键可快速继续</p>
        </div>
      </div>
    </div>
  );
}
