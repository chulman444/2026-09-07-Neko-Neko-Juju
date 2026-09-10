import { useEffect, useRef } from 'react';
import { useGameSessionStore } from './gameSessionStore';

/**
 * Lightweight RAF driver that ticks the unified game session store.
 * Decouples continuous 60fps simulation from React component lifecycles.
 */
export const useGameSessionDriver = () => {
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        // Limit max delta to prevent huge jumps when switching tabs
        const clampedDelta = Math.min(deltaSeconds, 0.1);
        useGameSessionStore.getState().tick(clampedDelta);
      }
      lastTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);
};
