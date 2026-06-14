import { useEffect, useRef, useState } from 'react';
import type { Card } from '@/types/game';
import { useGameStore } from '@/store/gameStore';

interface UseDragDropOptions {
  card: Card;
  onComplete?: (slotId: string | null, correct: boolean | null) => void;
}

export function useDragDrop({ card, onComplete }: UseDragDropOptions) {
  const setDragStart = useGameStore((s) => s.setDragStart);
  const setDragMove = useGameStore((s) => s.setDragMove);
  const setDragEnd = useGameStore((s) => s.setDragEnd);
  const placeCard = useGameStore((s) => s.placeCard);
  const drag = useGameStore((s) => s.drag);

  const ref = useRef<HTMLDivElement | null>(null);
  const [localDragging, setLocalDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    e.preventDefault();
    const rect = ref.current.getBoundingClientRect();
    ref.current.setPointerCapture(e.pointerId);
    setLocalDragging(true);
    setDragStart(card, e.clientX, e.clientY, rect);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!localDragging) return;
    setDragMove(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!localDragging) return;
    e.preventDefault();

    const clientX = e.clientX;
    const clientY = e.clientY;

    const slots = document.querySelectorAll<HTMLElement>('[data-slot-id]');
    let matchedSlotId: string | null = null;
    for (const slotEl of slots) {
      const r = slotEl.getBoundingClientRect();
      if (
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom
      ) {
        matchedSlotId = slotEl.getAttribute('data-slot-id');
        break;
      }
    }

    let correctResult: boolean | null = null;
    if (matchedSlotId) {
      correctResult = placeCard(card.id, matchedSlotId, performance.now());
    }

    setLocalDragging(false);
    setDragEnd();
    onComplete?.(matchedSlotId, correctResult);
  };

  useEffect(() => {
    return () => {
      if (localDragging) {
        setDragEnd();
      }
    };
  }, [localDragging, setDragEnd]);

  const isThisDragging = drag.isDragging && drag.card?.id === card.id;

  return {
    ref,
    isDragging: isThisDragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    dragPos: isThisDragging
      ? { x: drag.currentX, y: drag.currentY, ox: drag.offsetX, oy: drag.offsetY }
      : null,
  };
}
