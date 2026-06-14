import { ArrowLeftRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export function QuickActions() {
  const slots = useGameStore((s) => s.slots);
  const pendingCards = useGameStore((s) => s.pendingCards);
  const removeCard = useGameStore((s) => s.removeCard);
  const swapSlots = useGameStore((s) => s.swapSlots);
  const status = useGameStore((s) => s.status);

  const [swapMode, setSwapMode] = useState(false);
  const [swapFirst, setSwapFirst] = useState<string | null>(null);

  const canPlay = status === 'playing';

  const fakeCards = pendingCards.filter((c) => c.isFake);
  const oldest = [...pendingCards]
    .sort((a, b) => a.spawnTime - b.spawnTime)
    .slice(-2);

  const handleSlotClick = (slotId: string) => {
    if (!swapMode || !canPlay) return;
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || slot.isClosed) return;
    if (!swapFirst) {
      setSwapFirst(slotId);
    } else if (swapFirst === slotId) {
      setSwapFirst(null);
    } else {
      swapSlots(swapFirst, slotId);
      setSwapFirst(null);
      setSwapMode(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            disabled={!canPlay || swapMode || slots.filter(s => !s.isClosed && s.currentCard).length < 2}
            onClick={() => {
              setSwapMode((v) => !v);
              setSwapFirst(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all
              ${swapMode
                ? 'bg-violet-600/90 border-violet-400 text-white shadow-lg shadow-violet-500/30'
                : canPlay
                  ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200 hover:-translate-y-0.5'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            title="点击两个卡槽，交换它们中的卡片"
          >
            <ArrowLeftRight size={14} />
            位置替换
            {swapMode && swapFirst && <span className="ml-1 text-xs opacity-80">（选第2个）</span>}
            {swapMode && !swapFirst && <span className="ml-1 text-xs opacity-80">（选第1个）</span>}
          </button>

          {swapMode && (
            <div className="flex gap-1.5 flex-wrap">
              {slots.map((s) => {
                const active = s.id === swapFirst;
                const disabled = s.isClosed || !s.currentCard;
                return (
                  <button
                    key={s.id}
                    disabled={disabled}
                    onClick={() => handleSlotClick(s.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all
                      ${active
                        ? 'bg-violet-500 border-violet-300 text-white scale-105'
                        : disabled
                          ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-slate-200'
                      }`}
                  >
                    {s.label.split('-')[0]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
            快速撤卡
          </span>
          {oldest.length === 0 && (
            <span className="text-xs text-slate-600">暂无可撤卡</span>
          )}
          {oldest.map((card) => (
            <button
              key={card.id}
              disabled={!canPlay}
              onClick={() => removeCard(card.id, 'user')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${canPlay
                  ? card.isFake
                    ? 'bg-emerald-900/70 hover:bg-emerald-800 border-emerald-600/60 text-emerald-200 hover:-translate-y-0.5'
                    : 'bg-slate-900/80 hover:bg-rose-900/70 border-slate-700 hover:border-rose-600/60 text-slate-200 hover:text-rose-200 hover:-translate-y-0.5'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              title={card.isFake ? '干扰卡，撤掉不扣分' : '撤掉这张卡（错误会扣分）'}
              style={!canPlay ? {} : { borderLeft: `3px solid ${card.color}` }}
            >
              <Trash2 size={12} />
              {card.type}
              {card.isFake && <span className="text-[10px]">★</span>}
            </button>
          ))}
          {fakeCards.length > 0 && (
            <span className="text-[11px] text-amber-400">
              疑似干扰: {fakeCards.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
