import { Lock, Crown, Zap } from 'lucide-react';
import type { Slot } from '@/types/game';
import { CARD_TYPE_META } from '@/data/levels';

interface GameSlotProps {
  slot: Slot;
  isHighlighted?: boolean;
}

export function GameSlot({ slot, isHighlighted = false }: GameSlotProps) {
  const typeLetter = slot.acceptTypes[0];
  const meta = CARD_TYPE_META[typeLetter];

  const hasCard = !!slot.currentCard;
  const cardColor = slot.currentCard?.color ?? meta?.color ?? '#888';

  return (
    <div
      data-slot-id={slot.id}
      className={`
        relative rounded-2xl w-full h-36 md:h-40 flex flex-col items-center justify-center
        transition-all duration-200 overflow-hidden
        ${slot.isClosed ? 'opacity-50 grayscale' : ''}
        ${isHighlighted ? 'ring-4 ring-white/80 scale-105' : ''}
      `}
      style={{
        background: `radial-gradient(circle at 50% 30%, ${meta?.color ?? '#555'}33 0%, #0f172a80 70%, #020617cc 100%)`,
        border: `2px solid ${meta?.color ?? '#555'}80`,
        boxShadow: `inset 0 0 24px ${meta?.color ?? '#555'}40, 0 0 16px ${meta?.color ?? '#555'}30`,
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
        `}
        style={hasCard ? {
          background: `linear-gradient(135deg, ${cardColor}dd, ${cardColor}88)`,
          boxShadow: `0 0 20px ${cardColor}aa`,
        } : {}}
      >
        {hasCard ? (
          <span className="text-white font-bold text-sm drop-shadow truncate px-2">
            {slot.currentCard!.label}
          </span>
        ) : (
          <span className="text-slate-500 text-xs">空</span>
        )}
      </div>

      {slot.isClosed && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1 text-rose-300">
            <Lock size={28} className="animate-pulse" />
            <span className="text-xs font-bold">临时关闭</span>
          </div>
        </div>
      )}
    </div>
  );
}
