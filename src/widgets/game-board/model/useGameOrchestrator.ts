import { useCallback, useEffect } from 'react';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { useComboStore } from '@/features/combo-system';
import { useFreeTriggeredHintStore } from '@/features/free-triggered-hint';
import { useBoardHintsStore, isHintComboValid } from '@/features/board-hints';
import { useSolverStore, findClearableCombinationsOnly } from '@/features/look-ahead-solver';
import { useSelectionStore } from '@/features/select-tiles';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useGameSessionStore } from '@/entities/game-session';
import { useRivalCatStore, notifyRivalSteal } from '@/features/rival-cats';
import { useGameConfigStore } from '@/entities/game-config';
import {
  setGameOrchestrator,
  type GameOrchestrator,
  type TileCoordinate,
} from '@/shared/lib/orchestrator';

export interface GameOrchestratorOptions {
  enableCombos?: boolean;
  enableTimer?: boolean;
  enableFreeTriggeredHint?: boolean;
}

export const getClearableCombinations = (): TileCoord[][] => {
  const solverStore = useSolverStore.getState();
  if (solverStore.hintMode === 'default' && solverStore.isCalculated) {
    return solverStore.combinations.map((c) => c.required.map((t) => ({ col: t.col, row: t.row })));
  }
  if (solverStore.isCalculated) {
    return solverStore.combinations
      .filter((c) => c.isActive && c.blockers.length === 0)
      .map((c) => c.required.map((t) => ({ col: t.col, row: t.row })));
  }
  const matrix = useBoardStore.getState().matrix;
  return findClearableCombinationsOnly(matrix).map((c) =>
    c.required.map((t) => ({ col: t.col, row: t.row }))
  );
};

/**
 * Pure ECS System helper that coordinates match events across decoupled stores.
 */
export const createGameOrchestrator = (options?: GameOrchestratorOptions): GameOrchestrator => {
  const getOptions = (): Required<GameOrchestratorOptions> => {
    const config = useGameConfigStore.getState();
    return {
      enableCombos: options?.enableCombos ?? config.enableCombos ?? true,
      enableTimer: options?.enableTimer ?? config.enableTimer ?? true,
      enableFreeTriggeredHint:
        options?.enableFreeTriggeredHint ??
        ((options?.enableTimer ?? config.enableTimer ?? true) &&
          (config.enableFreeTriggeredHint ?? true)),
    };
  };

  const executePlayerMatch = (
    tiles: TileCoordinate[],
    spanCount?: number,
    actualNonZeroCount?: number
  ): boolean => {
    if (!tiles || tiles.length === 0) return false;

    const { enableCombos, enableTimer } = getOptions();
    const matrix = useBoardStore.getState().matrix;
    const calculatedCount = tiles.filter((t) => (matrix[t.row]?.[t.col] ?? 0) > 0).length;
    const nonZeroCount =
      actualNonZeroCount ?? (calculatedCount > 0 ? calculatedCount : tiles.length);
    const spanTileCount = spanCount ?? tiles.length;

    // 1. Clear tiles from board
    useBoardStore.getState().clearTiles(tiles);

    // 2. Combo progression
    let scoreMultiplier = 1;
    let addTimeBonus = 0;
    if (enableCombos) {
      const comboResult = useComboStore.getState().registerMatch(nonZeroCount, spanTileCount);
      scoreMultiplier = comboResult.scoreMultiplier;
      addTimeBonus = comboResult.addTime;
    }

    // 3. Score & Session points
    const isPhase1Over = usePhaseProgressionStore.getState().isPhase1Over;
    const isPhase1 = !isPhase1Over;
    const basePoints = spanTileCount;
    const points = Math.round(basePoints * Math.max(0, scoreMultiplier));

    useGameSessionStore.getState().addScore(points);
    useGameSessionStore.getState().addClearedTiles(nonZeroCount);
    usePhaseProgressionStore.getState().addScore(points, isPhase1);

    // 4. Timer bonus in Phase 1 (if timer enabled)
    if (enableTimer && isPhase1) {
      const timerStore = useSurvivalTimerStore.getState();
      const addedTime = nonZeroCount * timerStore.baseSecondsPerTile + Math.max(0, addTimeBonus);
      timerStore.addTime(addedTime);
    }

    // 5. Invalidate / update hints
    useBoardHintsStore.getState().removeClearedTiles(tiles);

    // 6. Cascade solver
    useSolverStore.getState().cascadeTiles(tiles);

    // 7. Notify rival cats of player cleared tiles (counter-play & pushback)
    useRivalCatStore.getState().onPlayerClearedTiles(tiles);

    // 8. Check for zero remaining hints to reliably trigger 'No more hints available'
    const remaining = getClearableCombinations();
    if (remaining.length === 0) {
      useBoardHintsStore.getState().setNoHintsAvailableMsg('No more hints available.');
    } else if (useBoardHintsStore.getState().noHintsAvailableMsg) {
      useBoardHintsStore.getState().setNoHintsAvailableMsg(null);
    }

    return true;
  };

  const executeRivalSteal = (tiles: TileCoordinate[]): boolean => {
    if (!tiles || tiles.length === 0) return false;

    // 0. Trigger clearing animations for stolen tiles
    const now = performance.now();
    const boardStore = useBoardStore.getState();
    const matrix = boardStore.matrix;
    tiles.forEach((t) => {
      const val = matrix[t.row]?.[t.col] ?? 0;
      if (val > 0) {
        boardStore.addClearingAnimation({
          id: `rival-steal-${t.col}-${t.row}-${now}`,
          col: t.col,
          row: t.row,
          val,
          type: 'rival-steal',
          emoji: '😼',
          startTime: now,
          duration: 600,
          bounceSpeed: 80,
        });
      }
    });

    // 1. Clear board tiles
    boardStore.clearTiles(tiles);

    // 2. Cascade solver
    useSolverStore.getState().cascadeTiles(tiles);

    // 3. Remove cleared tiles from active hint highlights
    useBoardHintsStore.getState().removeClearedTiles(tiles);

    // 4. Trigger steal notification for listeners/animations
    notifyRivalSteal(tiles);

    // 5. Check for zero remaining hints
    const remaining = getClearableCombinations();
    if (remaining.length === 0) {
      useBoardHintsStore.getState().setNoHintsAvailableMsg('No more hints available.');
    } else if (useBoardHintsStore.getState().noHintsAvailableMsg) {
      useBoardHintsStore.getState().setNoHintsAvailableMsg(null);
    }

    return true;
  };

  const executeHighlightHint = (_isFree = false): boolean => {
    const clearables = getClearableCombinations();

    if (clearables.length === 0) {
      useBoardHintsStore.getState().setNoHintsAvailableMsg('No more hints available.');
      return false;
    }

    const hintsStore = useBoardHintsStore.getState();
    const highlighted = hintsStore.highlightedTiles;

    // Find clearable combinations whose tiles are not yet fully highlighted
    const unhighlightedCombos = clearables.filter((combo) =>
      combo.some((req) => !highlighted.some((p) => p.row === req.row && p.col === req.col))
    );

    const candidates = unhighlightedCombos.length > 0 ? unhighlightedCombos : clearables;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const targetCombo = candidates[randomIndex];
    if (!targetCombo) {
      hintsStore.setNoHintsAvailableMsg('No more hints available.');
      return false;
    }

    hintsStore.triggerHint([targetCombo]);
    return true;
  };

  const resetAllSessions = () => {
    useGameSessionStore.getState().resetSession();
    useSurvivalTimerStore.getState().resetTimer();
    usePhaseProgressionStore.getState().resetProgression();
    useComboStore.getState().resetCombo();
    useFreeTriggeredHintStore.getState().resetHintSession();
    useBoardHintsStore.getState().resetBoardHints();
    useRivalCatStore.getState().resetCountdown();
    useSelectionStore.getState().clearSelection();
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

  const onBoardMutated = () => {
    const matrix = useBoardStore.getState().matrix;
    const seed = useBoardStore.getState().seed;
    useSolverStore.getState().recalculate(matrix, seed);
  };

  const isBoardUnsolvable = (): boolean => {
    return getClearableCombinations().length === 0;
  };

  const isComboValid = (tiles: TileCoordinate[]): boolean => {
    return isHintComboValid(tiles, useBoardStore.getState().matrix);
  };

  return {
    executePlayerMatch,
    handleMatch: executePlayerMatch,
    executeRivalSteal,
    executeHighlightHint,
    getClearableHints: getClearableCombinations,
    isBoardUnsolvable,
    isComboValid,
    onBoardMutated,
    resetAllSessions,
  };
};

export const defaultOrchestrator: GameOrchestrator = createGameOrchestrator();
setGameOrchestrator(defaultOrchestrator);

/**
 * React hook wrapper for game orchestration.
 */
export const useGameOrchestrator = (options?: GameOrchestratorOptions) => {
  const orchestratorInstance = createGameOrchestrator(options);

  useEffect(() => {
    setGameOrchestrator(orchestratorInstance);
    return () => {
      setGameOrchestrator(defaultOrchestrator);
    };
  }, [orchestratorInstance]);

  const handleMatch = useCallback(
    (tiles: TileCoordinate[], spanCount?: number, actualNonZeroCount?: number) => {
      return orchestratorInstance.executePlayerMatch(tiles, spanCount, actualNonZeroCount);
    },
    [orchestratorInstance]
  );

  const executePlayerMatch = handleMatch;

  const executeRivalSteal = useCallback(
    (tiles: TileCoordinate[]) => {
      return orchestratorInstance.executeRivalSteal(tiles);
    },
    [orchestratorInstance]
  );

  const executeHighlightHint = useCallback(
    (isFree = false) => {
      return orchestratorInstance.executeHighlightHint(isFree);
    },
    [orchestratorInstance]
  );

  const resetAllSessions = useCallback(() => {
    orchestratorInstance.resetAllSessions();
  }, [orchestratorInstance]);

  return {
    handleMatch,
    executePlayerMatch,
    executeRivalSteal,
    executeHighlightHint,
    resetAllSessions,
    getClearableHints: orchestratorInstance.getClearableHints,
    isBoardUnsolvable: orchestratorInstance.isBoardUnsolvable,
    isComboValid: orchestratorInstance.isComboValid,
    onBoardMutated: orchestratorInstance.onBoardMutated,
  };
};
