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

  it('awards exactly 1 point per cleared tile without inflation and tracks clearedTiles', () => {
    expect(useGameSessionStore.getState().score).toBe(0);
    expect(useGameSessionStore.getState().clearedTiles).toBe(0);

    // Clear 2 tiles (e.g. 5+5)
    useGameSessionStore.getState().registerMatch(2);
    expect(useGameSessionStore.getState().score).toBe(2);
    expect(useGameSessionStore.getState().clearedTiles).toBe(2);

    // Clear 4 tiles (e.g. 1+2+3+4)
    useGameSessionStore.getState().registerMatch(4);
    expect(useGameSessionStore.getState().score).toBe(6);
    expect(useGameSessionStore.getState().clearedTiles).toBe(6);

    // Clear 2 tiles with a larger span of 10
    useGameSessionStore.getState().registerMatch(2, 10);
    expect(useGameSessionStore.getState().score).toBe(16); // 6 + 10
    expect(useGameSessionStore.getState().clearedTiles).toBe(8); // 6 + 2
  });
});

describe('gameSessionStore - Hint Highlight Invalidation', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession();
    useSolverStore.getState().reset();
  });

  it('removes entire hint highlight when a tile belonging to the hint is cleared (e.g. 7-3 clears 7 from 1-1-1-7)', () => {
    // Board: [1, 1, 1, 7, 3]
    const matrix = [[1, 1, 1, 7, 3]];
    useBoardStore.getState().setMatrix(matrix);

    const hintCombo1 = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ];

    useGameSessionStore.setState({
      activeHintCombos: [hintCombo1],
      highlightedTiles: [...hintCombo1],
    });

    expect(useGameSessionStore.getState().highlightedTiles.length).toBe(4);

    // Now player clears the 7-3 pair: { col: 3, row: 0 } and { col: 4, row: 0 }
    useBoardStore.getState().clearTiles([
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ]);
    useGameSessionStore.getState().removeClearedTiles([
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ]);

    // The remaining 1-1-1 must NOT linger highlighted!
    expect(useGameSessionStore.getState().highlightedTiles).toEqual([]);
    expect(useGameSessionStore.getState().activeHintCombos).toEqual([]);
  });

  it('preserves an independent second hint when only the first hint is broken', () => {
    // Board: [1, 1, 1, 7, 3] on row 0, [5, 5, 0, 0, 0] on row 1
    const matrix = [
      [1, 1, 1, 7, 3],
      [5, 5, 0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(matrix);

    const hint1 = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ];
    const hint2 = [
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ];

    useGameSessionStore.setState({
      activeHintCombos: [hint1, hint2],
      highlightedTiles: [...hint1, ...hint2],
    });

    expect(useGameSessionStore.getState().highlightedTiles.length).toBe(6);

    // Clear 7-3 on row 0
    useBoardStore.getState().clearTiles([
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ]);
    useGameSessionStore.getState().removeClearedTiles([
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ]);

    // Hint 1 is gone, but Hint 2 (5-5) remains highlighted!
    expect(useGameSessionStore.getState().activeHintCombos).toEqual([hint2]);
    expect(useGameSessionStore.getState().highlightedTiles).toEqual(hint2);
  });

  it('preserves hint when a hinted tile is replaced with an Omnitile that still sums to 10', () => {
    const matrix = [[1, 1, 1, 7]];
    useBoardStore.getState().setMatrix(matrix);

    const hint = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ];

    useGameSessionStore.setState({
      activeHintCombos: [hint],
      highlightedTiles: [...hint],
    });

    // Replace 7 at (row 0, col 3) with Omnitile (10)
    useBoardStore.getState().setTileValue(3, 0, 10);

    // 1 + 1 + 1 + * still sums to 10 with Omnitile rules
    expect(useGameSessionStore.getState().activeHintCombos).toEqual([hint]);
    expect(useGameSessionStore.getState().highlightedTiles).toEqual(hint);
  });

  it('removes hint when a hinted tile is replaced with an incompatible number', () => {
    const matrix = [[1, 1, 1, 7]];
    useBoardStore.getState().setMatrix(matrix);

    const hint = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ];

    useGameSessionStore.setState({
      activeHintCombos: [hint],
      highlightedTiles: [...hint],
    });

    // Change 7 to 4: 1 + 1 + 1 + 4 = 7 != 10
    useBoardStore.getState().setTileValue(3, 0, 4);

    expect(useGameSessionStore.getState().activeHintCombos).toEqual([]);
    expect(useGameSessionStore.getState().highlightedTiles).toEqual([]);
  });

  describe('phase1Score and phase2Score tracking', () => {
    it('tracks points in phase1Score during Phase 1 and freezes it during Phase 2', () => {
      const store = useGameSessionStore.getState();
      expect(store.phase1Score).toBe(0);
      expect(store.phase2Score).toBe(0);
      expect(store.score).toBe(0);

      // Match during Phase 1
      store.registerMatch(2);
      expect(useGameSessionStore.getState().score).toBe(2);
      expect(useGameSessionStore.getState().phase1Score).toBe(2);
      expect(useGameSessionStore.getState().phase2Score).toBe(0);

      // Another match during Phase 1
      store.registerMatch(3);
      const phase1Total = useGameSessionStore.getState().phase1Score;
      expect(phase1Total).toBeGreaterThanOrEqual(5);
      expect(useGameSessionStore.getState().phase2Score).toBe(0);

      // Transition to Phase 2 (isPhase1Over = true)
      useGameSessionStore.setState({ isPhase1Over: true });

      // Match during Phase 2
      store.registerMatch(2);
      const afterPhase2State = useGameSessionStore.getState();
      expect(afterPhase2State.phase1Score).toBe(phase1Total); // Frozen!
      expect(afterPhase2State.phase2Score).toBeGreaterThan(0);
      expect(afterPhase2State.score).toBe(phase1Total + afterPhase2State.phase2Score);

      // Reset
      useGameSessionStore.getState().resetSession();
      expect(useGameSessionStore.getState().phase1Score).toBe(0);
      expect(useGameSessionStore.getState().phase2Score).toBe(0);
      expect(useGameSessionStore.getState().score).toBe(0);
    });
  });
});
