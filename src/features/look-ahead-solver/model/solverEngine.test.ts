import { describe, it, expect } from 'vitest';
import {
  findClearableCombinationsOnly,
  buildBlockerLookup,
  cascadeClearTiles,
  runSolverEngine,
} from './solverEngine';
import type { SolverCombination } from './types';

describe('solverEngine - findClearableCombinationsOnly', () => {
  it('returns empty array for empty board', () => {
    expect(findClearableCombinationsOnly([])).toEqual([]);
    expect(findClearableCombinationsOnly([[]])).toEqual([]);
  });

  it('finds horizontal and vertical clearable rectangles summing to 10', () => {
    // 3 rows, 3 cols
    const board = [
      [5, 5, 0],
      [0, 0, 0],
      [3, 0, 7],
    ];

    const results = findClearableCombinationsOnly(board);
    expect(results.length).toBeGreaterThanOrEqual(2);

    // Should find (0,0)-(0,1) with sum 10
    const match1 = results.find(
      (c) =>
        c.required.length === 2 &&
        c.required.some((t) => t.row === 0 && t.col === 0) &&
        c.required.some((t) => t.row === 0 && t.col === 1)
    );
    expect(match1).toBeDefined();
    expect(match1?.family).toBe('5-Family');
    expect(match1?.blockers).toHaveLength(0);
    expect(match1?.isActive).toBe(true);

    // Should find (2,0) and (2,2) with (2,1)=0 in between
    const match2 = results.find(
      (c) =>
        c.required.length === 2 &&
        c.required.some((t) => t.row === 2 && t.col === 0) &&
        c.required.some((t) => t.row === 2 && t.col === 2)
    );
    expect(match2).toBeDefined();
    expect(match2?.family).toBe('7-3-Family');
    expect(match2?.blockers).toHaveLength(0);
  });

  it('finds diagonal matches summing to 10', () => {
    const board = [
      [4, 0, 6],
      [0, 6, 0],
      [4, 0, 0],
    ];

    const results = findClearableCombinationsOnly(board);

    // Down-Right diagonal: (0,0)=4 and (1,1)=6
    const diagDR = results.find(
      (c) =>
        c.shape === 'Diagonal Down-Right' &&
        c.required.some((t) => t.row === 0 && t.col === 0) &&
        c.required.some((t) => t.row === 1 && t.col === 1)
    );
    expect(diagDR).toBeDefined();
    expect(diagDR?.family).toBe('6-4-Family');

    // Down-Left diagonal: (1,1)=6 and (2,0)=4
    const diagDL = results.find(
      (c) =>
        c.shape === 'Diagonal Down-Left' &&
        c.required.some((t) => t.row === 1 && t.col === 1) &&
        c.required.some((t) => t.row === 2 && t.col === 0)
    );
    expect(diagDL).toBeDefined();
    expect(diagDL?.family).toBe('6-4-Family');
  });

  it('does not return 1x1 cells as combinations', () => {
    const board = [
      [9, 1],
      [0, 0],
    ];
    const results = findClearableCombinationsOnly(board);
    results.forEach((r) => {
      expect(r.required.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('solverEngine - cascadeClearTiles & buildBlockerLookup', () => {
  it('correctly updates blockers and required tiles in O(1)', () => {
    const testCombos: SolverCombination[] = [
      {
        id: 1,
        family: '7-3-Family',
        shape: 'Rectangle/Line',
        required: [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
        ],
        blockers: [{ row: 0, col: 1 }],
        isActive: true,
      },
      {
        id: 2,
        family: '5-5-Family',
        shape: 'Rectangle/Line',
        required: [
          { row: 0, col: 1 },
          { row: 1, col: 1 },
        ],
        blockers: [],
        isActive: true,
      },
    ];

    const lookup = buildBlockerLookup(testCombos);

    // Clear (0, 1):
    // 1. Combo 2 requires (0, 1), so Combo 2 must become inactive.
    // 2. Combo 1 is blocked by (0, 1), so (0, 1) should be removed from Combo 1 blockers!
    const remaining = cascadeClearTiles(
      [{ row: 0, col: 1 }],
      testCombos,
      undefined,
      lookup
    );

    // Combo 2 should be filtered out because it is inactive
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(1);
    // Combo 1 should now have 0 blockers (ready to clear!)
    expect(remaining[0]?.blockers).toHaveLength(0);
  });

  it('cascadeClearTiles works using dependencyGraph fallback', () => {
    const board = [
      [5, 5, 5],
      [5, 5, 5],
    ];
    const { combinations, dependencyGraph } = runSolverEngine(board);
    expect(combinations.length).toBeGreaterThan(0);

    const activeBefore = combinations.filter((c) => c.isActive).length;
    const remaining = cascadeClearTiles([{ row: 0, col: 0 }], combinations, dependencyGraph);
    expect(remaining.length).toBeLessThan(activeBefore);
  });
});
