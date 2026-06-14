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
import { getLevel } from '@/data/levels';
import { ArrowLeft, Play } from 'lucide-react';

export function GamePage() {
  const { levelId = '1' } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const id = parseInt(levelId, 10);

  const initLevel = useGameStore((s) => s.initLevel);
  const startGame = useGameStore((s) => s.startGame);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const status = useGameStore((s) => s.status);
  const level = useGameStore((s) => s.level);
  const slots = useGameStore((s) => s.slots);
  const pendingCards = useGameStore((s) => s.pendingCards);
  const lastResult = useGameStore((s) => s.lastResult);
  const drag = useGameStore((s) => s.drag);

  useGameLoop();

  useEffect(() => {
    initLevel(id);
  }, [id, initLevel]);

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

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <p>关卡不存在</p>
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

  const lvCfg = getLevel(id);

  return (
    <div className="min-h-screen pb-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-40 left-0 w-96 h-96 rounded-full blur-3xl" style={{ background: '#4f46e555' }} />
        <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] rounded-full blur-3xl" style={{ background: '#0ea5e533' }} />
      </div>

      <div className="relative">
        <GameHUD />
        <EventBar />

        <div className="max-w-6xl mx-auto px-4 mt-2">
          {status === 'idle' && (
            <div className="mb-6 rounded-2xl p-6 bg-gradient-to-br from-indigo-500/20 via-slate-900/70 to-sky-500/15 border border-indigo-500/30 text-center space-y-4 animate-fade-in">
              <button
                onClick={() => navigate('/levels')}
                className="flex items-center gap-1.5 mx-auto text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft size={14} />
                返回关卡列表
              </button>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-indigo-300 tracking-[0.3em] uppercase">
                  LEVEL {String(id).padStart(2, '0')}
                </div>
                <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                  {lvCfg?.name}
                </h2>
                <p className="text-sm text-slate-300 max-w-lg mx-auto">{lvCfg?.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-xs">
                <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                  <div className="text-slate-500">时长</div>
                  <div className="text-sky-300 font-bold text-lg">{lvCfg?.duration}s</div>
                </div>
                <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                  <div className="text-slate-500">卡槽</div>
                  <div className="text-amber-300 font-bold text-lg">{lvCfg?.slotCount}</div>
                </div>
                <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
                  <div className="text-slate-500">事件数</div>
                  <div className="text-rose-300 font-bold text-lg">{lvCfg?.events.length}</div>
                </div>
              </div>
              <button
                onClick={startGame}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-lg text-white
                  bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400
                  shadow-[0_10px_40px_-8px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 transition-all"
              >
                <Play size={20} className="fill-white" />
                开始游戏
              </button>
              <p className="text-[11px] text-slate-500">按空格键也可开始 · 游戏中按空格暂停</p>
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
