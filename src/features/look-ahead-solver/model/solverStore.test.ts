import { describe, it, expect, beforeEach } from 'vitest';
import { useSolverStore } from './solverStore';
import { useBoardStore } from '@/entities/board';

describe('solverStore - hintMode & baseline caching', () => {
  beforeEach(() => {
    useSolverStore.getState().reset();
    useSolverStore.getState().setHintMode('default');
  });

  it('initializes with default hintMode', () => {
    expect(useSolverStore.getState().hintMode).toBe('default');
  });

  it('recalculates in default mode on-the-fly', () => {
    const board = [
      [5, 5, 0],
      [0, 0, 0],
      [3, 0, 7],
    ];
    useSolverStore.getState().recalculate(board, 'test-seed-1');

    const state = useSolverStore.getState();
    expect(state.isCalculated).toBe(true);
    expect(state.combinations.length).toBeGreaterThan(0);
    // In default mode, all combinations are clearable (0 blockers)
    state.combinations.forEach((c) => {
      expect(c.blockers).toHaveLength(0);
      expect(c.isActive).toBe(true);
    });
  });

  it('toggles hintMode to all_combinations and evaluates all combinations', () => {
    const seed = 'test-seed-all-combos';
    useBoardStore.getState().setSeed(seed);

    useSolverStore.getState().setHintMode('all_combinations');
    expect(useSolverStore.getState().hintMode).toBe('all_combinations');

    const state = useSolverStore.getState();
    expect(state.isCalculated).toBe(true);
    expect(state.combinations.length).toBeGreaterThan(0);
    // In all_combinations mode on a fresh board, there should be blocked combinations
    const blocked = state.combinations.filter((c) => c.blockers.length > 0);
    expect(blocked.length).toBeGreaterThan(0);

    // Toggling back to default mode
    useSolverStore.getState().setHintMode('default');
    expect(useSolverStore.getState().hintMode).toBe('default');
    const defaultState = useSolverStore.getState();
    const defaultBlocked = defaultState.combinations.filter((c) => c.blockers.length > 0);
    expect(defaultBlocked).toHaveLength(0);
  });

  it('cascades tiles in default mode by re-evaluating board on the fly', () => {
    // Initial board with a match at (0,0)-(0,1)
    const board = [
      [5, 5, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(board);
    useSolverStore.getState().recalculate(board);

    expect(useSolverStore.getState().combinations.length).toBeGreaterThan(0);

    // Simulate clearing (0,0) and (0,1)
    const updatedBoard = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    useBoardStore.getState().setMatrix(updatedBoard);
    useSolverStore.getState().cascadeTiles([{ row: 0, col: 0 }, { row: 0, col: 1 }]);

    // No matches remain on all-zero board
    expect(useSolverStore.getState().combinations).toHaveLength(0);
  });

  it('reuses cached baseline for the same seed on retry in all_combinations mode', () => {
    const seed = 'test-seed-cache-retry';
    useBoardStore.getState().setSeed(seed);
    useSolverStore.getState().setHintMode('all_combinations');

    const firstRunTotal = useSolverStore.getState().combinations.length;
    expect(firstRunTotal).toBeGreaterThan(0);

    // Simulate clearing tiles
    useSolverStore.getState().cascadeTiles([{ row: 0, col: 0 }]);
    const afterCascadeTotal = useSolverStore.getState().combinations.length;
    expect(afterCascadeTotal).toBeLessThanOrEqual(firstRunTotal);

    // Now trigger Retry (recalculate with the same seed on fresh matrix)
    const freshMatrix = useBoardStore.getState().matrix;
    useSolverStore.getState().recalculate(freshMatrix, seed);

    // Should restore all combinations from the baseline cache
    expect(useSolverStore.getState().combinations.length).toBe(firstRunTotal);
  });
});

