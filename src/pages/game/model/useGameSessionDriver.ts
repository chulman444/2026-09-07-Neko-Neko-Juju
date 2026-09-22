import { useEffect, useRef } from 'react';
import { useGameSessionStore } from '@/entities/game-session';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useComboStore } from '@/features/combo-system';
import { useHintStore, setClearableHintsResolver } from '@/features/free-triggered-hint';
import {
  useRivalCatStore,
  setRivalCatHintsResolver,
  registerRivalStealListener,
} from '@/features/rival-cats';
import { useBoardStore } from '@/entities/board';
import {
  registerHintTriggerHandler,
  setUnsolvableResolver,
  registerBoardMutationListener,
} from '@/features/core-items';
import { useSolverStore, findClearableCombinationsOnly } from '@/features/look-ahead-solver';
import { useGameConfigStore } from '@/entities/game-config';

/**
 * Lightweight RAF driver that ticks the unified game session store, combo store, and hint store.
 * Decouples continuous 60fps simulation from React component lifecycles.
 */
export const useGameSessionDriver = () => {
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    const getClearableCombinations = () => {
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
    };

    // Register cross-feature hint combination resolvers in the page orchestration layer
    setClearableHintsResolver(getClearableCombinations);
    setRivalCatHintsResolver(getClearableCombinations);

    registerRivalStealListener((tiles) => {
      useSolverStore.getState().cascadeTiles(tiles.map((t) => ({ row: t.row, col: t.col })));
      useHintStore.getState().removeClearedTiles(tiles);
    });

    registerHintTriggerHandler(() => {
      const { enableTimer, enableFreeTriggeredHint } = useGameConfigStore.getState();
      if (!enableTimer || !enableFreeTriggeredHint) {
        return false;
      }
      return useHintStore.getState().triggerHint();
    });

    setUnsolvableResolver(() => {
      const solverStore = useSolverStore.getState();
      const combinations = solverStore.combinations;
      const isCalculated = solverStore.isCalculated;
      const clearableCount = combinations.filter(
        (c) => c.isActive && c.blockers.length === 0
      ).length;
      return isCalculated && clearableCount === 0;
    });

    registerBoardMutationListener(() => {
      const matrix = useBoardStore.getState().matrix;
      const seed = useBoardStore.getState().seed;
      useSolverStore.getState().recalculate(matrix, seed);
    });

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        // Limit max delta to prevent huge jumps when switching tabs
        const clampedDelta = Math.min(deltaSeconds, 0.1);
        const isComboPaused = useComboStore.getState().isTimerPaused();
        const isSessionPaused = useGameSessionStore.getState().isPaused;
        const isTimerPaused = isComboPaused || isSessionPaused;
        const isSurvivalDepleted = useSurvivalTimerStore.getState().isDepleted;

        const { enableTimer, enableCombos, enableFreeTriggeredHint } =
          useGameConfigStore.getState();

        if (enableTimer) {
          useSurvivalTimerStore.getState().tick(clampedDelta, isTimerPaused);
        }
        if (enableCombos) {
          useComboStore.getState().tick(clampedDelta);
        }
        if (enableTimer && enableFreeTriggeredHint) {
          useHintStore.getState().tick(clampedDelta, isSurvivalDepleted, isTimerPaused);
        }
        useRivalCatStore.getState().tick(clampedDelta, isTimerPaused);

        // Orchestrate Phase Progression
        const isHintPhase1Over = useHintStore.getState().isPhase1Over;
        if (isHintPhase1Over && !usePhaseProgressionStore.getState().isPhase1Over) {
          usePhaseProgressionStore.getState().setPhase(2);
        }
      }
      lastTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      setClearableHintsResolver(null);
      setRivalCatHintsResolver(null);
      registerRivalStealListener(null);
      registerHintTriggerHandler(null);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);
};
