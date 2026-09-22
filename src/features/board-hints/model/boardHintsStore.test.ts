import { describe, it, expect, beforeEach } from 'vitest';
import {
  useBoardHintsStore,
  setClearableHintsResolver,
  getResolvedClearableHints,
  isHintComboValid,
} from '../index';
import { useBoardStore, OMNITILE_VALUE, type TileCoord } from '@/entities/board';

describe('boardHintsStore & hintMath', () => {
  beforeEach(() => {
    useBoardHintsStore.getState().resetBoardHints();
    setClearableHintsResolver(null);
  });

  describe('isHintComboValid', () => {
    it('returns true for valid sum-to-10 combinations', () => {
      const matrix = [
        [3, 7, 0],
        [4, 4, 2],
      ];
      const combo1: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      const combo2: TileCoord[] = [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ];
      expect(isHintComboValid(combo1, matrix)).toBe(true);
      expect(isHintComboValid(combo2, matrix)).toBe(true);
    });

    it('returns false when sum is not 10 or tile is empty (0)', () => {
      const matrix = [
        [3, 6, 0],
        [0, 5, 5],
      ];
      const combo1: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      const comboEmpty: TileCoord[] = [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ];
      expect(isHintComboValid(combo1, matrix)).toBe(false);
      expect(isHintComboValid(comboEmpty, matrix)).toBe(false);
    });

    it('supports OMNITILE_VALUE as wildcard matching any remainder', () => {
      const matrix = [
        [OMNITILE_VALUE, 4, 0],
        [OMNITILE_VALUE, 11, 0],
      ];
      const validOmniCombo: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      const invalidOmniCombo: TileCoord[] = [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ];
      expect(isHintComboValid(validOmniCombo, matrix)).toBe(true);
      expect(isHintComboValid(invalidOmniCombo, matrix)).toBe(false);
    });
  });

  describe('triggerHint', () => {
    it('returns false and sets noHintsAvailableMsg when no clearables exist', () => {
      setClearableHintsResolver(() => []);
      const result = useBoardHintsStore.getState().triggerHint();
      expect(result).toBe(false);
      expect(useBoardHintsStore.getState().noHintsAvailableMsg).toBe('No more hints available.');
    });

    it('triggers hint and updates highlightedTiles and activeHintCombos', () => {
      const combo: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      const result = useBoardHintsStore.getState().triggerHint([combo]);
      expect(result).toBe(true);
      expect(useBoardHintsStore.getState().activeHintCombos).toEqual([combo]);
      expect(useBoardHintsStore.getState().highlightedTiles).toEqual(combo);
      expect(useBoardHintsStore.getState().noHintsAvailableMsg).toBeNull();
    });

    it('prefers unhighlighted combinations when available', () => {
      const combo1: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      const combo2: TileCoord[] = [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ];

      useBoardHintsStore.getState().triggerHint([combo1]);
      expect(useBoardHintsStore.getState().activeHintCombos).toEqual([combo1]);

      useBoardHintsStore.getState().triggerHint([combo1, combo2]);
      expect(useBoardHintsStore.getState().activeHintCombos).toEqual([combo1, combo2]);
      expect(useBoardHintsStore.getState().highlightedTiles.length).toBe(4);
    });
  });

  describe('removeClearedTiles', () => {
    it('removes broken hint combos and preserves independent hints', () => {
      const matrix = [
        [7, 3, 5],
        [5, 0, 0],
      ];
      useBoardStore.getState().setMatrix(matrix);

      const hint1: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      const hint2: TileCoord[] = [
        { row: 0, col: 2 },
        { row: 1, col: 0 },
      ];

      useBoardHintsStore.setState({
        activeHintCombos: [hint1, hint2],
        highlightedTiles: [...hint1, ...hint2],
      });

      // Clear part of hint1
      useBoardHintsStore.getState().removeClearedTiles([{ row: 0, col: 0 }]);
      expect(useBoardHintsStore.getState().activeHintCombos).toEqual([hint2]);
      expect(useBoardHintsStore.getState().highlightedTiles).toEqual(hint2);
    });
  });

  describe('setHighlightedTiles & resetBoardHints', () => {
    it('allows setting highlighted tiles directly or with function', () => {
      const tile: TileCoord = { row: 1, col: 1 };
      useBoardHintsStore.getState().setHighlightedTiles([tile]);
      expect(useBoardHintsStore.getState().highlightedTiles).toEqual([tile]);

      useBoardHintsStore.getState().setHighlightedTiles((prev) => [...prev, { row: 2, col: 2 }]);
      expect(useBoardHintsStore.getState().highlightedTiles).toHaveLength(2);
    });

    it('clears all hint state on resetBoardHints', () => {
      useBoardHintsStore.setState({
        activeHintCombos: [[{ row: 0, col: 0 }]],
        highlightedTiles: [{ row: 0, col: 0 }],
        noHintsAvailableMsg: 'No more hints available.',
      });

      useBoardHintsStore.getState().resetBoardHints();
      expect(useBoardHintsStore.getState().activeHintCombos).toHaveLength(0);
      expect(useBoardHintsStore.getState().highlightedTiles).toHaveLength(0);
      expect(useBoardHintsStore.getState().noHintsAvailableMsg).toBeNull();
    });

    it('returns clearable hints via getResolvedClearableHints', () => {
      expect(getResolvedClearableHints()).toEqual([]);
      const combo: TileCoord[] = [{ row: 0, col: 0 }];
      setClearableHintsResolver(() => [combo]);
      expect(getResolvedClearableHints()).toEqual([combo]);
    });
  });
});
