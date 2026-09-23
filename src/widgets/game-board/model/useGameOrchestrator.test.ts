import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameOrchestrator } from './useGameOrchestrator';
import { useGameSessionStore } from '@/entities/game-session';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useComboStore } from '@/features/combo-system';
import { useFreeTriggeredHintStore } from '@/features/free-triggered-hint';
import { useBoardHintsStore } from '@/features/board-hints';
import { useBoardStore } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useSelectionStore } from '@/features/select-tiles';
import { useRivalCatStore, registerRivalStealListener } from '@/features/rival-cats';

describe('useGameOrchestrator / createGameOrchestrator', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession();
    useSurvivalTimerStore.getState().resetTimer();
    usePhaseProgressionStore.getState().resetProgression();
    useComboStore.getState().resetCombo();
    useFreeTriggeredHintStore.getState().resetHintSession();
    useBoardHintsStore.getState().resetBoardHints();
    useSelectionStore.getState().clearSelection();
    useSolverStore.getState().reset();
    registerRivalStealListener(null);
  });

  it('dispatches match events across combo, session, hint, and solver stores', () => {
    const matrix = [
      [5, 5, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(matrix);

    const orchestrator = createGameOrchestrator();

    orchestrator.executePlayerMatch([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);

    // Board tiles cleared
    expect(useBoardStore.getState().matrix[0]?.[0]).toBe(0);
    expect(useBoardStore.getState().matrix[0]?.[1]).toBe(0);

    // Combo store was updated
    expect(useComboStore.getState().comboCount).toBe(1);

    // Game session store received score and cleared tiles
    expect(useGameSessionStore.getState().score).toBeGreaterThanOrEqual(2);
    expect(useGameSessionStore.getState().clearedTiles).toBe(2);
    expect(usePhaseProgressionStore.getState().phase1Score).toBeGreaterThanOrEqual(2);

    // No more hints available message triggered since board is now empty
    expect(useBoardHintsStore.getState().noHintsAvailableMsg).toBe('No more hints available.');
  });

  it('resets all decoupled stores on resetAllSessions', () => {
    useGameSessionStore.setState({ score: 100 });
    useSurvivalTimerStore.setState({ countdown: 1, isDepleted: true });
    usePhaseProgressionStore.setState({ phase1Score: 50, currentPhase: 2, isPhase1Over: true });
    useComboStore.setState({ comboCount: 5 });
    useFreeTriggeredHintStore.setState({ hintsRemaining: 0, isPhase1Over: true });
    useBoardHintsStore.setState({ highlightedTiles: [{ row: 0, col: 0 }] });
    useSelectionStore.setState({ selectedSum: 10 });
    useRivalCatStore.setState({ rivalCatCountdown: 1.0 });

    const orchestrator = createGameOrchestrator();
    orchestrator.resetAllSessions();

    expect(useGameSessionStore.getState().score).toBe(0);
    expect(useSurvivalTimerStore.getState().countdown).toBe(6);
    expect(useSurvivalTimerStore.getState().isDepleted).toBe(false);
    expect(usePhaseProgressionStore.getState().phase1Score).toBe(0);
    expect(usePhaseProgressionStore.getState().isPhase1Over).toBe(false);
    expect(useComboStore.getState().comboCount).toBe(0);
    expect(useFreeTriggeredHintStore.getState().isPhase1Over).toBe(false);
    expect(useBoardHintsStore.getState().highlightedTiles).toHaveLength(0);
    expect(useRivalCatStore.getState().rivalCatCountdown).toBe(5);
    expect(useSelectionStore.getState().selectedSum).toBe(0);
  });

  it('skips combo multiplier when enableCombos is false', () => {
    const orchestrator = createGameOrchestrator({ enableCombos: false });

    orchestrator.handleMatch([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);

    // Combo store not incremented
    expect(useComboStore.getState().comboCount).toBe(0);
    // Base score awarded
    expect(useGameSessionStore.getState().score).toBe(2);
  });

  it('skips hint tile clearing when enableFreeTriggeredHint is false', () => {
    useBoardHintsStore.setState({
      highlightedTiles: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
    });

    const orchestrator = createGameOrchestrator({ enableFreeTriggeredHint: false });
    orchestrator.handleMatch([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);

    // Hint store highlighted tiles should remain untouched
    expect(useBoardHintsStore.getState().highlightedTiles).toHaveLength(2);

    const orchestratorWithHints = createGameOrchestrator({ enableFreeTriggeredHint: true });
    orchestratorWithHints.handleMatch([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);

    // Hint store highlighted tiles should be cleared
    expect(useBoardHintsStore.getState().highlightedTiles).toHaveLength(0);
  });

  it('executes rival steal by clearing tiles and notifying listeners without awarding points', () => {
    const matrix = [
      [3, 7, 2],
      [8, 0, 0],
    ];
    useBoardStore.getState().setMatrix(matrix);
    useSolverStore.getState().recalculate(matrix);

    const stealSpy = vi.fn();
    registerRivalStealListener(stealSpy);

    const orchestrator = createGameOrchestrator();
    const stolenCombo = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];

    const result = orchestrator.executeRivalSteal(stolenCombo);
    expect(result).toBe(true);

    // Tiles cleared on board
    expect(useBoardStore.getState().matrix[0]?.[0]).toBe(0);
    expect(useBoardStore.getState().matrix[0]?.[1]).toBe(0);

    // Listener notified
    expect(stealSpy).toHaveBeenCalledWith(stolenCombo);

    // No score or combo awarded to player
    expect(useGameSessionStore.getState().score).toBe(0);
    expect(useComboStore.getState().comboCount).toBe(0);
  });

  it('executes highlight hint by finding a combination from the solver and updating hints store', () => {
    const matrix = [
      [4, 6, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(matrix);
    useSolverStore.getState().recalculate(matrix);

    const orchestrator = createGameOrchestrator();
    const success = orchestrator.executeHighlightHint();

    expect(success).toBe(true);
    expect(useBoardHintsStore.getState().activeHintCombos).toHaveLength(1);
    expect(useBoardHintsStore.getState().highlightedTiles).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ]);
    expect(useBoardHintsStore.getState().noHintsAvailableMsg).toBeNull();
  });

  it('sets noHintsAvailableMsg when executeHighlightHint is called on an unsolvable board', () => {
    const matrix = [
      [1, 1, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(matrix);
    useSolverStore.getState().recalculate(matrix);

    const orchestrator = createGameOrchestrator();
    const success = orchestrator.executeHighlightHint();

    expect(success).toBe(false);
    expect(useBoardHintsStore.getState().noHintsAvailableMsg).toBe('No more hints available.');
  });
});
