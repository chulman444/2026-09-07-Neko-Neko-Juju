import { useCallback } from 'react';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { useComboStore } from '@/features/combo-system';
import { useHintStore } from '@/features/free-triggered-hint';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useSelectionStore } from '@/features/select-tiles';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useGameSessionStore } from '@/entities/game-session';
import { useRivalCatStore } from '@/features/rival-cats';

export interface GameOrchestratorOptions {
  enableCombos?: boolean;
  enableTimer?: boolean;
  enableFreeTriggeredHint?: boolean;
}

/**
 * Pure ECS System helper that coordinates match events across decoupled stores.
 */
export const createGameOrchestrator = (options: GameOrchestratorOptions = {}) => {
  const { enableCombos = true, enableTimer = true, enableFreeTriggeredHint = true } = options;

  const handleMatch = (tiles: TileCoord[], spanCount?: number, actualNonZeroCount?: number) => {
    const matrix = useBoardStore.getState().matrix;
    const calculatedCount = tiles.filter((t) => (matrix[t.row]?.[t.col] ?? 0) > 0).length;
    const nonZeroCount =
      actualNonZeroCount ?? (calculatedCount > 0 ? calculatedCount : tiles.length);
    const spanTileCount = spanCount ?? tiles.length;

    // 1. Combo progression
    let scoreMultiplier = 1;
    let addTimeBonus = 0;
    if (enableCombos) {
      const comboResult = useComboStore.getState().registerMatch(nonZeroCount, spanTileCount);
      scoreMultiplier = comboResult.scoreMultiplier;
      addTimeBonus = comboResult.addTime;
    }

    // 2. Score & Session points
    const isPhase1Over = usePhaseProgressionStore.getState().isPhase1Over;
    const isPhase1 = !isPhase1Over;
    const basePoints = spanTileCount;
    const points = Math.round(basePoints * Math.max(0, scoreMultiplier));

    useGameSessionStore.getState().addScore(points);
    useGameSessionStore.getState().addClearedTiles(nonZeroCount);
    usePhaseProgressionStore.getState().addScore(points, isPhase1);

    // 3. Timer bonus in Phase 1 (if timer enabled)
    if (enableTimer && isPhase1) {
      const timerStore = useSurvivalTimerStore.getState();
      const addedTime = nonZeroCount * timerStore.baseSecondsPerTile + Math.max(0, addTimeBonus);
      timerStore.addTime(addedTime);
    }

    // 4. Invalidate / update hints
    if (enableFreeTriggeredHint) {
      useHintStore.getState().removeClearedTiles(tiles);
    }

    // 5. Cascade solver
    useSolverStore.getState().cascadeTiles(tiles);

    // 6. Notify rival cats of player cleared tiles (counter-play & pushback)
    useRivalCatStore.getState().onPlayerClearedTiles(tiles);
  };

  const resetAllSessions = () => {
    useGameSessionStore.getState().resetSession();
    useSurvivalTimerStore.getState().resetTimer();
    usePhaseProgressionStore.getState().resetProgression();
    useComboStore.getState().resetCombo();
    useHintStore.getState().resetHintSession();
    useRivalCatStore.getState().resetCountdown();
    useSelectionStore.getState().clearSelection();
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

  return {
    handleMatch,
    resetAllSessions,
  };
};

/**
 * React hook wrapper for game orchestration.
 */
export const useGameOrchestrator = (options: GameOrchestratorOptions = {}) => {
  const { enableCombos = true, enableTimer = true, enableFreeTriggeredHint = true } = options;

  const handleMatch = useCallback(
    (tiles: TileCoord[], spanCount?: number, actualNonZeroCount?: number) => {
      createGameOrchestrator({ enableCombos, enableTimer, enableFreeTriggeredHint }).handleMatch(
        tiles,
        spanCount,
        actualNonZeroCount
      );
    },
    [enableCombos, enableTimer, enableFreeTriggeredHint]
  );

  const resetAllSessions = useCallback(() => {
    createGameOrchestrator().resetAllSessions();
  }, []);

  return {
    handleMatch,
    resetAllSessions,
  };
};
