import { describe, it, expect, beforeEach } from 'vitest';
import {
  useGameSessionStore,
  evaluateFormula,
  getMatchingComboRule,
  DEFAULT_COMBO_RULES,
  type ComboRule,
} from './gameSessionStore';
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

  describe('Combo Rules & Unified Progression System', () => {
    it('has sensible default combo rules defined', () => {
      expect(DEFAULT_COMBO_RULES.length).toBeGreaterThanOrEqual(3);
      expect(DEFAULT_COMBO_RULES[0]?.upToCombo).toBe(4);
      expect(DEFAULT_COMBO_RULES[DEFAULT_COMBO_RULES.length - 1]?.upToCombo).toBeNull();
    });

    describe('evaluateFormula', () => {
      it('evaluates raw numbers and numerical strings', () => {
        expect(evaluateFormula(5, { x: 1 })).toBe(5);
        expect(evaluateFormula('3.5', { x: 1 })).toBe(3.5);
      });

      it('evaluates dynamic equations with x and c', () => {
        expect(evaluateFormula('x * 0.5', { x: 4 })).toBe(2);
        expect(evaluateFormula('1 + x * 0.1', { x: 10 })).toBe(2);
        expect(evaluateFormula('c', { x: 3, c: 4.5 })).toBe(4.5);
        expect(evaluateFormula('c * 0.5', { x: 2, c: 6 })).toBe(3);
      });

      it('evaluates standard math functions', () => {
        expect(evaluateFormula('atan(x)', { x: 0 })).toBe(0);
        expect(evaluateFormula('min(10, x * 3)', { x: 5 })).toBe(10);
        expect(evaluateFormula('max(2, x)', { x: 1 })).toBe(2);
        expect(evaluateFormula('sqrt(x)', { x: 16 })).toBe(4);
      });

      it('safely handles invalid syntax or empty input', () => {
        expect(evaluateFormula('', { x: 1 }, 0)).toBe(0);
        expect(evaluateFormula(null, { x: 1 }, 5)).toBe(5);
        expect(evaluateFormula('x * +', { x: 1 }, 2)).toBe(2);
        expect(evaluateFormula('console.log(1)', { x: 1 }, 0)).toBe(0);
      });
    });

    describe('getMatchingComboRule', () => {
      const sampleRules: ComboRule[] = [
        {
          id: 'tier1',
          upToCombo: 4,
          addTimeValue: 1,
          timerFlowMode: 'normal',
          pauseDuration: 'c',
          comboDuration: 5,
          scoreMultiplier: 1,
        },
        {
          id: 'tier2',
          upToCombo: 7,
          addTimeValue: 3,
          timerFlowMode: 'normal',
          pauseDuration: 'c',
          comboDuration: 4,
          scoreMultiplier: 1.5,
        },
        {
          id: 'tier3',
          upToCombo: null,
          addTimeValue: 5,
          timerFlowMode: 'pause',
          pauseDuration: 'c',
          comboDuration: 3,
          scoreMultiplier: 2,
        },
      ];

      it('matches correct rule by combo thresholds', () => {
        expect(getMatchingComboRule(sampleRules, 1).id).toBe('tier1');
        expect(getMatchingComboRule(sampleRules, 4).id).toBe('tier1');
        expect(getMatchingComboRule(sampleRules, 5).id).toBe('tier2');
        expect(getMatchingComboRule(sampleRules, 7).id).toBe('tier2');
        expect(getMatchingComboRule(sampleRules, 8).id).toBe('tier3');
        expect(getMatchingComboRule(sampleRules, 25).id).toBe('tier3');
      });

      it('handles unordered rules correctly', () => {
        const unordered = [sampleRules[2]!, sampleRules[0]!, sampleRules[1]!];
        expect(getMatchingComboRule(unordered, 3).id).toBe('tier1');
        expect(getMatchingComboRule(unordered, 6).id).toBe('tier2');
        expect(getMatchingComboRule(unordered, 10).id).toBe('tier3');
      });
    });

    describe('registerMatch with combo rules', () => {
      it('awards score multiplier and added time from matched rule', () => {
        const store = useGameSessionStore.getState();
        store.setComboRules([
          {
            id: 'rule-test',
            upToCombo: null,
            addTimeValue: 'x * 2',
            timerFlowMode: 'normal',
            pauseDuration: 'c',
            comboDuration: 5,
            scoreMultiplier: '1.5',
          },
        ]);
        useGameSessionStore.setState({ comboCount: 0, score: 0, countdown: 5, maxCountdown: 20 });

        // Match 1: comboCount becomes 1, score = round(2 * 1.5) = 3, addTime = 1 * 2 = 2s
        store.registerMatch(2);
        const state = useGameSessionStore.getState();
        expect(state.comboCount).toBe(1);
        expect(state.score).toBe(3);
        expect(state.countdown).toBe(7);
      });
    });

    describe('timerFlowMode pause on combo', () => {
      it('pauses the survival timer during active combo when timerFlowMode is pause', () => {
        const boardWithMatch = [
          [5, 5, 0],
          [0, 0, 0],
        ];
        useBoardStore.getState().setMatrix(boardWithMatch);
        useSolverStore.getState().recalculate(boardWithMatch);

        const store = useGameSessionStore.getState();
        store.setComboRules([
          {
            id: 'pause-rule',
            upToCombo: null,
            addTimeValue: 0,
            timerFlowMode: 'pause',
            pauseDuration: 'c',
            comboDuration: 5,
            scoreMultiplier: 1,
          },
        ]);
        useGameSessionStore.setState({ comboCount: 2, comboPct: 100, countdown: 5 });

        // Tick 1 second: survival timer countdown should remain 5 because combo is active with pause
        useGameSessionStore.getState().tick(1.0);
        expect(useGameSessionStore.getState().countdown).toBe(5);

        // Once combo count drops to 0, countdown resumes
        useGameSessionStore.setState({ comboCount: 0 });
        useGameSessionStore.getState().tick(1.0);
        expect(useGameSessionStore.getState().countdown).toBe(4);
      });

      it('pauses the free hint countdown timer during active combo when timerFlowMode is pause', () => {
        const boardWithMatch = [
          [5, 5, 0],
          [0, 0, 0],
        ];
        useBoardStore.getState().setMatrix(boardWithMatch);
        useSolverStore.getState().recalculate(boardWithMatch);

        const store = useGameSessionStore.getState();
        store.setMaxFreeHints(3);
        store.setFreeHintInterval(4);
        store.setComboRules([
          {
            id: 'pause-rule',
            upToCombo: null,
            addTimeValue: 0,
            timerFlowMode: 'pause',
            pauseDuration: 'c',
            comboDuration: 5,
            scoreMultiplier: 1,
          },
        ]);

        // Deplete main survival timer to start hint phase
        store.tick(store.maxCountdown + 1);
        expect(useGameSessionStore.getState().isDepleted).toBe(true);
        expect(useGameSessionStore.getState().hintPhaseStarted).toBe(true);
        expect(useGameSessionStore.getState().hintsRemaining).toBe(2);

        const initialHintCountdown = useGameSessionStore.getState().hintCountdown;
        expect(initialHintCountdown).toBe(4);

        // Set active combo
        useGameSessionStore.setState({ comboCount: 1, comboPct: 100 });

        // Tick 1s: hint countdown should remain paused
        useGameSessionStore.getState().tick(1.0);
        expect(useGameSessionStore.getState().hintCountdown).toBe(initialHintCountdown);

        // End combo
        useGameSessionStore.setState({ comboCount: 0 });
        useGameSessionStore.getState().tick(1.0);
        expect(useGameSessionStore.getState().hintCountdown).toBe(initialHintCountdown - 1.0);
      });
    });
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
