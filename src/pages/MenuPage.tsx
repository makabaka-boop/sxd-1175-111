import { Play, BookOpen, Grid3X3, History, Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEVELS } from '@/data/levels';
import { getBestScores, getUnlockedLevels } from '@/utils/storage';

export function MenuPage() {
  const navigate = useNavigate();
  const unlocked = getUnlockedLevels();
  const scores = getBestScores();

  const maxUnlocked = unlocked.length > 0 ? Math.max(...unlocked) : 1;
  const totalStars = Object.values(scores).reduce((a, b) => a + b.stars, 0);
  const totalPossible = LEVELS.length * 3;

  const quickStartId = maxUnlocked;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full opacity-40 blur-3xl"
          style={{ background: '#6366f1' }} />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full opacity-30 blur-3xl"
          style={{ background: '#0ea5e9' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: '#ec4899' }} />
      </div>

      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
            <Sparkles size={12} />
            节奏归位挑战
          </div>
          <h1
            className="text-6xl font-black text-white tracking-tight leading-none"
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              textShadow: '0 0 40px rgba(99, 102, 241, 0.4)',
            }}
          >
            CARD SORT
          </h1>
          <h2 className="text-2xl font-bold text-slate-100/90 tracking-wide"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            引 · 导 · 卡 · 归 · 位
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
            在连续来客高峰中，把引导卡拖拽到正确位置。
            处理插队、撤卡、位置替换与各种突发状况，维持整体秩序！
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Trophy size={14} className="fill-amber-400 text-amber-400" />
            <span className="font-bold tabular-nums">
              {totalStars}<span className="text-slate-500">/{totalPossible}</span>
            </span>
            <span className="text-slate-500 text-xs">星星</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Grid3X3 size={14} />
            <span className="font-bold">第{maxUnlocked}关</span>
            <span className="text-slate-500 text-xs">已解锁</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(`/game/${quickStartId}`)}
            className="group relative w-full py-4 rounded-2xl font-bold text-lg transition-all
              bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500
              hover:from-indigo-400 hover:via-violet-400 hover:to-sky-400
              text-white shadow-[0_10px_40px_-10px_rgba(99,102,241,0.8)]
              hover:shadow-[0_14px_50px_-8px_rgba(99,102,241,0.95)]
              hover:-translate-y-1 active:translate-y-0"
          >
            <span className="flex items-center justify-center gap-2">
              <Play size={22} className="fill-white" />
              {maxUnlocked === 1 ? '开始游戏' : `继续：第${maxUnlocked}关 ${LEVELS[maxUnlocked - 1]?.name ?? ''}`}
            </span>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate('/levels')}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl transition-all
                bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60
                text-slate-200 hover:-translate-y-0.5"
            >
              <Grid3X3 size={20} className="text-sky-400" />
              <span className="text-xs font-bold">关卡选择</span>
            </button>
            <button
              onClick={() => navigate('/tutorial')}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl transition-all
                bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60
                text-slate-200 hover:-translate-y-0.5"
            >
              <BookOpen size={20} className="text-emerald-400" />
              <span className="text-xs font-bold">游戏教程</span>
            </button>
            <button
              onClick={() => {
                const scores = getBestScores();
                alert(
                  Object.values(scores).length === 0
                    ? '还没有任何战绩，快去挑战吧！'
                    : Object.values(scores)
                        .sort((a, b) => a.levelId - b.levelId)
                        .map((r) => {
                          const lv = LEVELS.find(l => l.id === r.levelId);
                          return `第${r.levelId}关 ${lv?.name ?? ''}: ${r.totalScore}分 ${'★'.repeat(r.stars)}`;
                        })
                        .join('\n'),
                );
              }}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl transition-all
                bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60
                text-slate-200 hover:-translate-y-0.5"
            >
              <History size={20} className="text-amber-400" />
              <span className="text-xs font-bold">历史战绩</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-600 space-y-0.5">
          <p>提示：拖拽卡片到对应颜色位置 · 点击卡片右上角叉号可撤卡</p>
          <p>空格键快速暂停/继续</p>
        </div>
      </div>
    </div>
  );
}
