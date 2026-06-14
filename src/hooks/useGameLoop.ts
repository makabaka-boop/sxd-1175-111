import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

export function useGameLoop() {
  const status = useGameStore((s) => s.status);
  const level = useGameStore((s) => s.level);
  const tick = useGameStore((s) => s.tick);
  const spawnCard = useGameStore((s) => s.spawnCard);
  const activeEvents = useGameStore((s) => s.activeEvents);

  const lastSpawnRef = useRef<number>(0);
  const nextSpawnDelayRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (status === 'playing' && level) {
      lastSpawnRef.current = performance.now();
      const [minI, maxI] = level.cardInterval;
      nextSpawnDelayRef.current = minI + Math.random() * (maxI - minI);
      lastTickRef.current = performance.now();
    }
  }, [status, level]);

  useEffect(() => {
    if (status !== 'playing' || !level) return;

    const rushEvent = activeEvents.find((e) => e.type === 'rush_hour');
    const fakeEvent = activeEvents.find((e) => e.type === 'fake_card');
    const multiplier = rushEvent
      ? (rushEvent.payload as { multiplier: number }).multiplier
      : 1;
    const fakeChance = fakeEvent
      ? (fakeEvent.payload as { chance: number }).chance
      : 0;

    const loop = (now: number) => {
      const delta = now - lastTickRef.current;
      if (delta >= 100) {
        tick(now);
        lastTickRef.current = now;
      }

      const elapsedSinceLast = now - lastSpawnRef.current;
      const effectiveDelay = nextSpawnDelayRef.current / multiplier;
      if (elapsedSinceLast >= effectiveDelay) {
        spawnCard(now, false, fakeChance);
        lastSpawnRef.current = now;
        const [minI, maxI] = level.cardInterval;
        nextSpawnDelayRef.current = minI + Math.random() * (maxI - minI);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [status, level, activeEvents, tick, spawnCard]);
}
