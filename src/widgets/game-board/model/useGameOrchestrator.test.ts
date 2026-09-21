import { describe, it, expect, beforeEach } from 'vitest';
import { createGameOrchestrator } from './useGameOrchestrator';
import { useGameSessionStore } from '@/entities/game-session';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useComboStore } from '@/features/combo-system';
import { useHintStore } from '@/features/free-triggered-hint';
import { useBoardStore } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useSelectionStore } from '@/features/select-tiles';
import { useRivalCatStore } from '@/features/rival-cats';

describe('useGameOrchestrator / createGameOrchestrator', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession();
    useSurvivalTimerStore.getState().resetTimer();
    usePhaseProgressionStore.getState().resetProgression();
    useComboStore.getState().resetCombo();
    useHintStore.getState().resetHintSession();
    useSelectionStore.getState().clearSelection();
    useSolverStore.getState().reset();
  });

  it('dispatches match events across combo, session, hint, and solver stores', () => {
    const matrix = [
      [5, 5, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(matrix);

    const orchestrator = createGameOrchestrator();

    orchestrator.handleMatch([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);

    // Combo store was updated
    expect(useComboStore.getState().comboCount).toBe(1);

    // Game session store received score and cleared tiles
    expect(useGameSessionStore.getState().score).toBeGreaterThanOrEqual(2);
    expect(useGameSessionStore.getState().clearedTiles).toBe(2);
    expect(usePhaseProgressionStore.getState().phase1Score).toBeGreaterThanOrEqual(2);
  });

  it('resets all decoupled stores on resetAllSessions', () => {
    useGameSessionStore.setState({ score: 100 });
    useSurvivalTimerStore.setState({ countdown: 1, isDepleted: true });
    usePhaseProgressionStore.setState({ phase1Score: 50, currentPhase: 2, isPhase1Over: true });
    useComboStore.setState({ comboCount: 5 });
    useHintStore.setState({ hintsRemaining: 0, isPhase1Over: true });
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
    expect(useHintStore.getState().isPhase1Over).toBe(false);
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
});
