import { Lock, Crown, Zap, X } from 'lucide-react';
import type { Slot } from '@/types/game';
import { CARD_TYPE_META } from '@/data/levels';
import { useGameStore } from '@/store/gameStore';

interface GameSlotProps {
  slot: Slot;
  isHighlighted?: boolean;
}

export function GameSlot({ slot, isHighlighted = false }: GameSlotProps) {
  const typeLetter = slot.acceptTypes[0];
  const meta = CARD_TYPE_META[typeLetter];
  const removeSlotCard = useGameStore((s) => s.removeSlotCard);
  const status = useGameStore((s) => s.status);

  const hasCard = !!slot.currentCard;
  const cardColor = slot.currentCard?.color ?? meta?.color ?? '#888';
  const canRemove = hasCard && !slot.isClosed && status === 'playing';

  return (
    <div
      data-slot-id={slot.id}
      className={`
        group relative rounded-2xl w-full h-36 md:h-40 flex flex-col items-center justify-center
        transition-all duration-200 overflow-hidden
        ${slot.isClosed ? 'opacity-50 grayscale' : ''}
        ${isHighlighted ? 'ring-4 ring-white/80 scale-105' : ''}
        ${slot.hasWrongFlash ? 'animate-shake' : ''}
      `}
      style={{
        background: `radial-gradient(circle at 50% 30%, ${meta?.color ?? '#555'}33 0%, #0f172a80 70%, #020617cc 100%)`,
        border: `2px solid ${slot.hasWrongFlash ? '#ef4444' : `${meta?.color ?? '#555'}80`}`,
        boxShadow: slot.hasWrongFlash
          ? '0 0 30px rgba(239,68,68,0.6), inset 0 0 24px rgba(239,68,68,0.35)'
          : `inset 0 0 24px ${meta?.color ?? '#555'}40, 0 0 16px ${meta?.color ?? '#555'}30`,
      }}
    >
      <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap z-10">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{ background: `${meta?.color}99` }}
        >
          {typeLetter}
        </span>
        {slot.priorityOverride === 3 && (
          <span className="text-[10px] font-bold bg-rose-500/90 text-white rounded px-1.5 py-0.5 flex items-center gap-0.5">
            <Crown size={10} /> VIP
          </span>
        )}
        {slot.priorityOverride === 2 && (
          <span className="text-[10px] font-bold bg-amber-500/90 text-white rounded px-1.5 py-0.5 flex items-center gap-0.5">
            <Zap size={10} /> 加急
          </span>
        )}
      </div>

      <div className="absolute top-2 right-2 flex flex-col items-end gap-0.5 z-10">
        <span className="text-[10px] text-emerald-400">✓ {slot.correctCount}</span>
        <span className="text-[10px] text-rose-400">✗ {slot.wrongCount}</span>
      </div>

      <div className="text-[11px] text-slate-300/80 mt-6 px-2 text-center z-10">
        {slot.label.replace(/^[A-F]-/, '')}
      </div>

      <div
        className={`
          absolute inset-4 rounded-lg flex items-center justify-center
          transition-all duration-300
          ${hasCard ? 'scale-100 opacity-100' : 'scale-95 opacity-40 border-2 border-dashed border-white/20'}
          ${slot.hasWrongFlash ? 'bg-rose-600/70' : ''}
        `}
        style={hasCard && !slot.hasWrongFlash ? {
          background: `linear-gradient(135deg, ${cardColor}dd, ${cardColor}88)`,
          boxShadow: `0 0 20px ${cardColor}aa`,
        } : {}}
      >
        {hasCard ? (
          <div className="flex items-center gap-1 px-2">
            <span className="text-white font-bold text-sm drop-shadow truncate">
              {slot.currentCard!.label}
            </span>
            {slot.hasWrongFlash && (
              <span className="text-white text-xs font-bold">✗</span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 text-xs">空</span>
        )}
      </div>

      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeSlotCard(slot.id, 'user');
          }}
          className="absolute top-8 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity
            bg-rose-500/90 hover:bg-rose-500 text-white rounded-full p-1 shadow-lg"
          title="撤卡（扣半分）"
        >
          <X size={12} />
        </button>
      )}

      {slot.isClosed && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1 text-rose-300">
            <Lock size={28} className="animate-pulse" />
            <span className="text-xs font-bold">临时关闭</span>
          </div>
        </div>
      )}
    </div>
  );
}
