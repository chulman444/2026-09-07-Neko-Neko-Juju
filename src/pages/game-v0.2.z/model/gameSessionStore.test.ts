import { describe, it, expect, beforeEach } from 'vitest';
import { useGameSessionStore } from './gameSessionStore';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useBoardStore } from '@/entities/board';

describe('gameSessionStore - Pause All Timers When Clearable Hints Exhausted', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession();
    useSolverStore.getState().reset();
    useSolverStore.getState().setHintMode('default');
  });

  it('pauses survival countdown timer when clearable hints are 0 and resumes when moves appear', () => {
    // Empty board (no hints)
    const emptyBoard = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(emptyBoard);
    useSolverStore.getState().recalculate(emptyBoard);

    const initialCountdown = useGameSessionStore.getState().countdown;
    useGameSessionStore.getState().tick(2.0);

    const state = useGameSessionStore.getState();
    expect(state.countdown).toBe(initialCountdown);
    expect(state.isDepleted).toBe(false);
    expect(state.noHintsAvailableMsg).toBe('No more hints available.');

    // Introduce a match
    const boardWithMatch = [
      [5, 5, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(boardWithMatch);
    useSolverStore.getState().recalculate(boardWithMatch);

    useGameSessionStore.getState().tick(1.0);
    const stateAfterResume = useGameSessionStore.getState();
    expect(stateAfterResume.countdown).toBe(initialCountdown - 1.0);
    expect(stateAfterResume.noHintsAvailableMsg).toBeNull();
  });

  it('pauses combo drain timer when clearable hints are 0 and resumes when moves appear', () => {
    // Empty board (no hints)
    const emptyBoard = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(emptyBoard);
    useSolverStore.getState().recalculate(emptyBoard);

    useGameSessionStore.setState({ comboCount: 3, comboPct: 80 });

    useGameSessionStore.getState().tick(2.0);
    expect(useGameSessionStore.getState().comboCount).toBe(3);
    expect(useGameSessionStore.getState().comboPct).toBe(80);

    // Introduce a match
    const boardWithMatch = [
      [5, 5, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(boardWithMatch);
    useSolverStore.getState().recalculate(boardWithMatch);

    useGameSessionStore.getState().tick(0.5);
    const stateAfterResume = useGameSessionStore.getState();
    expect(stateAfterResume.comboCount).toBe(3);
    expect(stateAfterResume.comboPct).toBeLessThan(80);
  });

  it('pauses hint revealer timer and keeps Phase 1 active when clearable hints are 0', () => {
    // Board with match to allow normal transition into Phase 1
    const boardWithMatch = [
      [5, 5, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(boardWithMatch);
    useSolverStore.getState().recalculate(boardWithMatch);

    // Deplete main timer to trigger Phase 1
    const store = useGameSessionStore.getState();
    store.tick(store.maxCountdown + 1);

    const stateAfterDepletion = useGameSessionStore.getState();
    expect(stateAfterDepletion.isDepleted).toBe(true);
    expect(stateAfterDepletion.hintPhaseStarted).toBe(true);
    expect(stateAfterDepletion.hintsRemaining).toBe(2); // Hint #1 consumed immediately
    expect(stateAfterDepletion.isPhase1Over).toBe(false);

    // Now empty the board
    const emptyBoard = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(emptyBoard);
    useSolverStore.getState().recalculate(emptyBoard);

    const pausedCountdown = stateAfterDepletion.hintCountdown;

    // Tick again - hint timer should remain paused at the exact same value
    useGameSessionStore.getState().tick(1.0);
    const stateAfterTick = useGameSessionStore.getState();
    expect(stateAfterTick.hintCountdown).toBe(pausedCountdown);
    expect(stateAfterTick.isPhase1Over).toBe(false);
    expect(stateAfterTick.isPaused).toBe(false); // Board is NOT paused!
    expect(stateAfterTick.noHintsAvailableMsg).toBe('No more hints available.');
  });

  it('resumes hint revealer timer when clearable moves become available in Phase 1', () => {
    // Transition to Phase 1 with matches
    const boardWithMatch = [
      [5, 5, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(boardWithMatch);
    useSolverStore.getState().recalculate(boardWithMatch);

    useGameSessionStore.getState().tick(10);
    expect(useGameSessionStore.getState().isDepleted).toBe(true);

    // Empty board -> pauses
    const emptyBoard = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(emptyBoard);
    useSolverStore.getState().recalculate(emptyBoard);

    useGameSessionStore.getState().tick(1.0);
    expect(useGameSessionStore.getState().noHintsAvailableMsg).toBe('No more hints available.');

    // Now re-introduce a clearable match to the board
    useBoardStore.getState().setMatrix(boardWithMatch);
    useSolverStore.getState().recalculate(boardWithMatch);

    // Tick - timer should resume and noHintsAvailableMsg should be cleared
    const countdownBefore = useGameSessionStore.getState().hintCountdown;
    useGameSessionStore.getState().tick(0.5);

    const stateAfterResume = useGameSessionStore.getState();
    expect(stateAfterResume.noHintsAvailableMsg).toBeNull();
    expect(stateAfterResume.hintCountdown).toBeLessThan(countdownBefore);
    expect(stateAfterResume.isPhase1Over).toBe(false);
  });

  it('strictly marks Phase 1 over only when final hint is consumed', () => {
    // Board with clearable matches
    const board = [
      [5, 5, 0],
      [3, 7, 0],
      [4, 6, 0],
    ];
    useBoardStore.getState().setMatrix(board);
    useSolverStore.getState().recalculate(board);

    // Set hints remaining to 1
    useGameSessionStore.getState().setMaxFreeHints(1);
    expect(useGameSessionStore.getState().hintsRemaining).toBe(1);

    // Deplete main timer -> triggers the 1 and only hint
    useGameSessionStore.getState().tick(10);

    const finalState = useGameSessionStore.getState();
    expect(finalState.hintsRemaining).toBe(0);
    expect(finalState.isPhase1Over).toBe(true);
    expect(finalState.hintCountdown).toBe(0);
  });

  it('awards exactly 1 point per cleared tile without inflation', () => {
    expect(useGameSessionStore.getState().score).toBe(0);

    // Clear 2 tiles (e.g. 5+5)
    useGameSessionStore.getState().registerMatch(2);
    expect(useGameSessionStore.getState().score).toBe(2);

    // Clear 4 tiles (e.g. 1+2+3+4)
    useGameSessionStore.getState().registerMatch(4);
    expect(useGameSessionStore.getState().score).toBe(6);
  });
});
