import { Play, BookOpen, Grid3X3, History, Trophy, Sparkles, Dumbbell, BarChart3, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEVELS } from '@/data/levels';
import { getBestScores, getUnlockedLevels, getLastReviewSummary, getHistory } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';
import { generateTrainingLevel, getTrainingFocuses, markTrainingStarted } from '@/utils/storage';

export function MenuPage() {
  const navigate = useNavigate();
  const initTrainingLevel = useGameStore((s) => s.initTrainingLevel);
  const unlocked = getUnlockedLevels();
  const scores = getBestScores();
  const lastReview = getLastReviewSummary();
  const history = getHistory();

  const maxUnlocked = unlocked.length > 0 ? Math.max(...unlocked) : 1;
  const totalStars = Object.values(scores).reduce((a, b) => a + b.stars, 0);
  const totalPossible = LEVELS.length * 3;

  const quickStartId = maxUnlocked;

  const lastResult = history.find((r) => r.levelId === lastReview?.levelId && !r.isTraining);

  const startQuickTraining = () => {
    if (!lastResult) {
      navigate('/levels');
      return;
    }
    const focuses = getTrainingFocuses(lastResult);
    if (focuses.length > 0) {
      const trainingLevel = generateTrainingLevel(lastResult, focuses[0]);
      if (trainingLevel) {
        markTrainingStarted();
        initTrainingLevel(trainingLevel);
        navigate(`/training/${trainingLevel.id}`);
      }
    } else {
      navigate('/levels');
    }
  };

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

        {lastReview && (
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-200">最近复盘摘要</span>
              </div>
              {!lastReview.hasTraining && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">待训练</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-slate-500">关卡</div>
                <div className="text-slate-200 font-bold">{lastReview.levelName}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500">得分</div>
                <div className="text-amber-300 font-bold tabular-nums">{lastReview.totalScore.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500">正确率</div>
                <div className={`font-bold ${lastReview.accuracy >= 0.8 ? 'text-emerald-400' : lastReview.accuracy >= 0.6 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {(lastReview.accuracy * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
              <div className="text-center">
                <div className="text-rose-400/80">易错卡槽</div>
                <div className="text-slate-300">{lastReview.worstSlotLabel}</div>
              </div>
              <div className="text-center">
                <div className="text-sky-400/80">慢响应</div>
                <div className="text-slate-300">{lastReview.slowestCardTypeLabel}</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400/80">事件失误</div>
                <div className="text-slate-300">{lastReview.eventMissCount}次</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={i <= lastReview.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
                />
              ))}
            </div>
            {!lastReview.hasTraining && lastResult && (
              <button
                onClick={startQuickTraining}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm
                  bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                  text-white shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Dumbbell size={16} />
                开始针对性训练
                <ArrowRight size={16} />
              </button>
            )}
            {lastReview.hasTraining && (
              <button
                onClick={() => navigate(`/game/${lastReview.levelId}`)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm
                  bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-100 shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Play size={16} className="fill-white" />
                再次挑战 {lastReview.levelName}
              </button>
            )}
          </div>
        )}

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
              onClick={() => navigate('/records')}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl transition-all
                bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60
                text-slate-200 hover:-translate-y-0.5"
            >
              <History size={20} className="text-amber-400" />
              <span className="text-xs font-bold">战绩中心</span>
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
