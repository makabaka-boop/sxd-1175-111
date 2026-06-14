import { useMemo } from 'react';
import { X, Zap, Crown, AlertTriangle } from 'lucide-react';
import type { Card } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useDragDrop } from '@/hooks/useDragDrop';

interface GameCardProps {
  card: Card;
}

const priorityConfig = {
  1: { label: '普通', icon: null, ring: 'ring-slate-500/30' },
  2: { label: '加急', icon: Zap, ring: 'ring-amber-400/60' },
  3: { label: 'VIP', icon: Crown, ring: 'ring-rose-400/70' },
};

export function GameCard({ card }: GameCardProps) {
  const removeCard = useGameStore((s) => s.removeCard);
  const { ref, isDragging, handlers, dragPos } = useDragDrop({ card });

  const pCfg = priorityConfig[card.priority];
  const PriorityIcon = pCfg.icon;

  const style = useMemo(() => {
    if (!isDragging || !dragPos) return undefined;
    return {
      position: 'fixed' as const,
      left: dragPos.x - dragPos.ox,
      top: dragPos.y - dragPos.oy,
      zIndex: 100,
      width: 160,
      transform: 'scale(1.08) rotate(-1deg)',
      pointerEvents: 'none' as const,
    };
  }, [isDragging, dragPos]);

  return (
    <div
      ref={ref}
      {...handlers}
      style={style}
      className={`
        group relative w-40 h-24 rounded-xl cursor-grab active:cursor-grabbing
        select-none transition-all duration-150
        ring-2 ${pCfg.ring}
        ${isDragging ? 'opacity-0 shadow-2xl' : 'shadow-lg hover:shadow-xl hover:-translate-y-0.5'}
      `}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-90"
        style={{
          background: `linear-gradient(135deg, ${card.color}cc 0%, ${card.color}88 60%, ${card.color}55 100%)`,
        }}
      />
      <div
        className="absolute -inset-[1px] rounded-xl opacity-60 pointer-events-none"
        style={{
          boxShadow: `0 0 16px ${card.color}aa, inset 0 0 12px ${card.color}66`,
        }}
      />

      <div className="relative h-full flex flex-col justify-between p-2.5 text-white">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1">
            {PriorityIcon && (
              <PriorityIcon size={12} className="text-white drop-shadow" />
            )}
            <span className="text-[10px] font-bold tracking-wider bg-black/30 rounded px-1.5 py-0.5">
              {pCfg.label}
            </span>
            <span className="text-[10px] font-bold bg-white/20 rounded px-1.5 py-0.5">
              {card.type}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCard(card.id, 'user');
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 hover:bg-red-500 rounded-full p-0.5"
            title="撤卡"
          >
            <X size={12} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold drop-shadow-sm truncate">
            {card.label}
          </span>
          {card.isFake && (
            <span title="疑似同名干扰">
              <AlertTriangle
                size={12}
                className="text-yellow-200 animate-pulse"
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DraggableCardGhost({ card }: { card: Card }) {
  const drag = useGameStore((s) => s.drag);
  if (!drag.isDragging || !drag.card || drag.card.id !== card.id) return null;

  const pCfg = priorityConfig[card.priority];

  return (
    <div
      className="pointer-events-none fixed z-[100] shadow-2xl rounded-xl"
      style={{
        left: drag.currentX - drag.offsetX,
        top: drag.currentY - drag.offsetY,
        width: 160,
        transform: 'scale(1.08) rotate(-1deg)',
      }}
    >
      <div
        className="absolute inset-0 rounded-xl ring-2 opacity-95"
        style={{
          background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color}aa 60%, ${card.color}77 100%)`,
          boxShadow: `0 0 24px ${card.color}cc, inset 0 0 16px ${card.color}88`,
        }}
      />
      <div className={`relative h-24 rounded-xl ring-2 ${pCfg.ring} p-2.5 flex flex-col justify-between text-white`}>
        <div className="flex items-center gap-1 flex-wrap">
          {pCfg.icon && <pCfg.icon size={12} />}
          <span className="text-[10px] font-bold tracking-wider bg-black/30 rounded px-1.5 py-0.5">
            {pCfg.label}
          </span>
          <span className="text-[10px] font-bold bg-white/20 rounded px-1.5 py-0.5">
            {card.type}
          </span>
        </div>
        <span className="text-sm font-bold drop-shadow truncate">{card.label}</span>
      </div>
    </div>
  );
}
