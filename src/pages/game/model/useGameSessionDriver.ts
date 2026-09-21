import { useEffect, useRef } from 'react';
import { useGameSessionStore } from '@/entities/game-session';
import { useComboStore } from '@/features/combo-system';
import { useHintStore, setClearableHintsResolver } from '@/features/free-triggered-hint';
import { useBoardStore } from '@/entities/board';
import { registerHintTriggerHandler } from '@/entities/item';
import { useSolverStore, findClearableCombinationsOnly } from '@/features/look-ahead-solver';

/**
 * Lightweight RAF driver that ticks the unified game session store, combo store, and hint store.
 * Decouples continuous 60fps simulation from React component lifecycles.
 */
export const useGameSessionDriver = () => {
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    // Register cross-feature hint combination resolver in the page orchestration layer
    setClearableHintsResolver(() => {
      const solverStore = useSolverStore.getState();
      if (solverStore.hintMode === 'default' && solverStore.isCalculated) {
        return solverStore.combinations.map((c) =>
          c.required.map((t) => ({ col: t.col, row: t.row }))
        );
      }
      const matrix = useBoardStore.getState().matrix;
      return findClearableCombinationsOnly(matrix).map((c) =>
        c.required.map((t) => ({ col: t.col, row: t.row }))
      );
    });

    registerHintTriggerHandler(() => useHintStore.getState().triggerHint());

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        // Limit max delta to prevent huge jumps when switching tabs
        const clampedDelta = Math.min(deltaSeconds, 0.1);
        const isComboPaused = useComboStore.getState().isTimerPaused();
        const isSurvivalDepleted = useGameSessionStore.getState().isDepleted;

        useGameSessionStore.getState().tick(clampedDelta, isComboPaused);
        useComboStore.getState().tick(clampedDelta);
        useHintStore.getState().tick(clampedDelta, isSurvivalDepleted, isComboPaused);
      }
      lastTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      setClearableHintsResolver(null);
      registerHintTriggerHandler(null);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);
};
