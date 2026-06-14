import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { GameHUD } from '@/components/GameHUD';
import { EventBar } from '@/components/EventBar';
import { GameSlot } from '@/components/GameSlot';
import { GameCard, DraggableCardGhost } from '@/components/GameCard';
import { QuickActions } from '@/components/QuickActions';
import { PauseOverlay } from '@/components/PauseOverlay';
import { ArrowLeft, Play, Dumbbell, Zap, Layers, Activity } from 'lucide-react';
import type { TrainingLevelConfig } from '@/types/game';

export function TrainingPage() {
  const { levelId } = useParams<{ levelId: string }>();
  void levelId;
  const navigate = useNavigate();

  const startGame = useGameStore((s) => s.startGame);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const status = useGameStore((s) => s.status);
  const level = useGameStore((s) => s.level);
  const isTrainingMode = useGameStore((s) => s.isTrainingMode);
  const slots = useGameStore((s) => s.slots);
  const pendingCards = useGameStore((s) => s.pendingCards);
  const lastResult = useGameStore((s) => s.lastResult);
  const drag = useGameStore((s) => s.drag);

  useGameLoop();

  useEffect(() => {
    if (!isTrainingMode || !level) {
      navigate('/levels');
    }
  }, [isTrainingMode, level, navigate]);

  useEffect(() => {
    if (status === 'finished' && lastResult) {
      navigate(`/result/${lastResult.levelId}`);
    }
  }, [status, lastResult, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (status === 'playing') pauseGame();
        else if (status === 'paused') resumeGame();
        else if (status === 'idle' && level) startGame();
      } else if (e.code === 'Escape') {
        if (status === 'playing') pauseGame();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, level, pauseGame, resumeGame, startGame]);

  if (!level || !isTrainingMode) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <p>训练关卡不存在</p>
          <button
            onClick={() => navigate('/levels')}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700"
          >
            返回关卡选择
          </button>
        </div>
      </div>
    );
  }

  const trainingLevel = level as TrainingLevelConfig;

  const getFocusIcon = () => {
    if (trainingLevel.focus.type === 'slot') return <Layers size={20} className="text-amber-400" />;
    if (trainingLevel.focus.type === 'cardType') return <Zap size={20} className="text-sky-400" />;
    return <Activity size={20} className="text-purple-400" />;
  };

  const getFocusDescription = () => {
    if (trainingLevel.focus.type === 'slot') {
      return '专注于正确识别卡槽类型，避免错放';
    }
    if (trainingLevel.focus.type === 'cardType') {
      return '提升对该类型卡片的响应速度';
    }
    return '熟悉该事件的应对策略，减少失误';
  };

  return (
    <div className="min-h-screen pb-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-40 left-0 w-96 h-96 rounded-full blur-3xl" style={{ background: '#f59e0b55' }} />
        <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] rounded-full blur-3xl" style={{ background: '#f59e0b33' }} />
      </div>

      <div className="relative">
        <GameHUD />
        <EventBar />

        <div className="max-w-6xl mx-auto px-4 mt-2">
          {status === 'idle' && (
            <div className="mb-6 rounded-2xl p-6 bg-gradient-to-br from-amber-500/20 via-slate-900/70 to-orange-500/15 border border-amber-500/30 text-center space-y-4 animate-fade-in">
              <button
                onClick={() => navigate('/levels')}
                className="flex items-center gap-1.5 mx-auto text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft size={14} />
                返回关卡列表
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                <Dumbbell size={14} />
                专项训练模式
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  {getFocusIcon()}
                  <h2 className="text-2xl font-black text-amber-200" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                    {trainingLevel.name}
                  </h2>
                </div>
                <p className="text-sm text-slate-300 max-w-lg mx-auto">{trainingLevel.description}</p>
                <p className="text-xs text-amber-400/80 mt-2">{getFocusDescription()}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-xs">
                <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                  <div className="text-slate-500">时长</div>
                  <div className="text-amber-300 font-bold text-lg">{trainingLevel.duration}s</div>
                </div>
                <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                  <div className="text-slate-500">卡槽</div>
                  <div className="text-amber-300 font-bold text-lg">{trainingLevel.slotCount}</div>
                </div>
                <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                  <div className="text-slate-500">目标分</div>
                  <div className="text-emerald-300 font-bold text-lg">{trainingLevel.targetScore}</div>
                </div>
              </div>
              <button
                onClick={startGame}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-lg text-white
                  bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                  shadow-[0_10px_40px_-8px_rgba(245,158,11,0.6)] hover:-translate-y-0.5 transition-all"
              >
                <Play size={20} className="fill-white" />
                开始训练
              </button>
              <p className="text-[11px] text-slate-500">按空格键也可开始 · 训练完成后可返回原关卡</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
            <div className="lg:sticky lg:top-28 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  待处理卡池
                </h3>
                <span className="text-[11px] font-bold tabular-nums text-slate-500">
                  {pendingCards.length} / 8
                </span>
              </div>
              <div className="bg-slate-950/50 rounded-2xl p-3 border border-slate-800/60 min-h-[360px] flex flex-col gap-2.5">
                {pendingCards.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
                    等待生成卡片...
                  </div>
                )}
                {pendingCards.map((card) => (
                  <div key={card.id} className="flex justify-center">
                    <GameCard card={card} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed text-center">
                ★ 标记 = 疑似同名干扰卡，请谨慎归位
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  卡槽区（拖入正确位置）
                </h3>
                <div
                  className={`grid gap-3 ${
                    slots.length <= 3
                      ? 'grid-cols-3'
                      : slots.length <= 4
                        ? 'grid-cols-2 md:grid-cols-4'
                        : 'grid-cols-2 md:grid-cols-3'
                  }`}
                >
                  {slots.map((slot) => (
                    <GameSlot
                      key={slot.id}
                      slot={slot}
                      isHighlighted={
                        drag.isDragging &&
                        drag.card != null &&
                        slot.acceptTypes.includes(drag.card.type) &&
                        !slot.isClosed
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <QuickActions />
        </div>
      </div>

      {drag.isDragging && drag.card && (
        <DraggableCardGhost card={drag.card} />
      )}

      <PauseOverlay />
    </div>
  );
}
