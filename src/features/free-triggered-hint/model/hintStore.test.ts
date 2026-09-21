import { describe, it, expect, beforeEach } from 'vitest';
import { useHintStore, setClearableHintsResolver, isHintComboValid } from '../index';
import { useBoardStore, OMNITILE_VALUE, type TileCoord } from '@/entities/board';

describe('hintStore & hintMath', () => {
  beforeEach(() => {
    useHintStore.getState().resetHintSession();
    useHintStore.getState().setMaxFreeHints(3);
    useHintStore.getState().setFreeHintInterval(4);
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
      const result = useHintStore.getState().triggerHint();
      expect(result).toBe(false);
      expect(useHintStore.getState().noHintsAvailableMsg).toBe('No more hints available.');
    });

    it('triggers hint and updates highlightedTiles and activeHintCombos', () => {
      const combo: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      const result = useHintStore.getState().triggerHint([combo]);
      expect(result).toBe(true);
      expect(useHintStore.getState().activeHintCombos).toEqual([combo]);
      expect(useHintStore.getState().highlightedTiles).toEqual(combo);
      expect(useHintStore.getState().noHintsAvailableMsg).toBeNull();
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

      useHintStore.getState().triggerHint([combo1]);
      expect(useHintStore.getState().activeHintCombos).toEqual([combo1]);

      useHintStore.getState().triggerHint([combo1, combo2]);
      expect(useHintStore.getState().activeHintCombos).toEqual([combo1, combo2]);
      expect(useHintStore.getState().highlightedTiles.length).toBe(4);
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

      useHintStore.setState({
        activeHintCombos: [hint1, hint2],
        highlightedTiles: [...hint1, ...hint2],
      });

      // Clear part of hint1
      useHintStore.getState().removeClearedTiles([{ row: 0, col: 0 }]);
      expect(useHintStore.getState().activeHintCombos).toEqual([hint2]);
      expect(useHintStore.getState().highlightedTiles).toEqual(hint2);
    });
  });

  describe('tick hint progression', () => {
    it('triggers Hint #1 immediately when survival timer is depleted', () => {
      const combo: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      setClearableHintsResolver(() => [combo]);

      // Before depletion (isSurvivalDepleted = false)
      useHintStore.getState().tick(1.0, false);
      expect(useHintStore.getState().hintPhaseStarted).toBe(false);
      expect(useHintStore.getState().hintsRemaining).toBe(3);

      // Depleted transition frame (isSurvivalDepleted = true)
      useHintStore.getState().tick(0.016, true);
      const state = useHintStore.getState();
      expect(state.hintPhaseStarted).toBe(true);
      expect(state.hintsRemaining).toBe(2);
      expect(state.hintCountdown).toBe(4);
      expect(state.isPhase1Over).toBe(false);
      expect(state.highlightedTiles).toEqual(combo);
    });

    it('ticks countdown and triggers subsequent hints until final hint strictly ends Phase 1', () => {
      const combo: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      setClearableHintsResolver(() => [combo]);
      useHintStore.getState().setMaxFreeHints(2);

      // Trigger Hint #1 on depletion
      useHintStore.getState().tick(0.016, true);
      expect(useHintStore.getState().hintsRemaining).toBe(1);
      expect(useHintStore.getState().isPhase1Over).toBe(false);

      // Tick intermediate 2 seconds
      useHintStore.getState().tick(2.0, true);
      expect(useHintStore.getState().hintCountdown).toBe(2);
      expect(useHintStore.getState().hintsRemaining).toBe(1);
      expect(useHintStore.getState().isPhase1Over).toBe(false);

      // Tick remaining 2 seconds -> triggers final hint (Hint #2), ending Phase 1
      useHintStore.getState().tick(2.0, true);
      const finalState = useHintStore.getState();
      expect(finalState.hintsRemaining).toBe(0);
      expect(finalState.hintCountdown).toBe(0);
      expect(finalState.isPhase1Over).toBe(true);
    });

    it('pauses countdown when isTimerPaused is true', () => {
      const combo: TileCoord[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      setClearableHintsResolver(() => [combo]);

      useHintStore.getState().tick(0.016, true);
      const initialCountdown = useHintStore.getState().hintCountdown;

      // Tick while paused
      useHintStore.getState().tick(1.5, true, true);
      expect(useHintStore.getState().hintCountdown).toBe(initialCountdown);

      // Resume
      useHintStore.getState().tick(1.0, true, false);
      expect(useHintStore.getState().hintCountdown).toBe(initialCountdown - 1.0);
    });
  });
});
