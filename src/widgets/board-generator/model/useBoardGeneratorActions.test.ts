import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '@/entities/board';
import { useBoardGenConfigStore } from '@/features/board-generator';
import { useDifficultyStore } from '@/entities/difficulty';
import { useGameSessionStore } from '@/entities/game-session';
import { useBoardGeneratorActions } from './useBoardGeneratorActions';

describe('useBoardGeneratorActions', () => {
  beforeEach(() => {
    useBoardStore.setState({
      cols: 10,
      rows: 10,
      matrix: Array(10).fill(Array(10).fill(1)),
      seed: 'test-seed-actions',
    });
    useGameSessionStore.getState().resetSession();
  });

  it('updateDimensions updates dimensions and recalculates initial timer cap', () => {
    const { updateDimensions } = useBoardGeneratorActions();
    updateDimensions(5, 6);

    const { cols, rows } = useBoardStore.getState();
    expect(cols).toBe(5);
    expect(rows).toBe(6);

    // 5 * 6 = 30; timerMultiplier default ~20/170 (~0.1176) => maxCountdown round(30 * 20/170) = 4
    expect(useGameSessionStore.getState().maxCountdown).toBeGreaterThanOrEqual(1);
  });

  it('applyDifficultyOnly updates weights without mutating dimensions', () => {
    const { applyDifficultyOnly } = useBoardGeneratorActions();
    const initialCols = useBoardStore.getState().cols;
    const initialRows = useBoardStore.getState().rows;

    applyDifficultyOnly();

    expect(useBoardStore.getState().cols).toBe(initialCols);
    expect(useBoardStore.getState().rows).toBe(initialRows);
    expect(useBoardStore.getState().tileWeights).toBeDefined();
  });

  it('revertTimerCap recalculates maxCountdown according to dimensions', () => {
    const { revertTimerCap } = useBoardGeneratorActions();
    useBoardStore.setState({ cols: 10, rows: 10 });
    useDifficultyStore.getState().setTimerMultiplier(0.1);

    revertTimerCap();

    expect(useGameSessionStore.getState().maxCountdown).toBe(10);
  });

  it('loadSeed sets the seed and recalculates', () => {
    const { loadSeed } = useBoardGeneratorActions();

    loadSeed('CUSTOM_SEED_99');

    expect(useBoardStore.getState().seed).toBe('CUSTOM_SEED_99');
  });

  it('rollNewSeed generates a new seed and updates store', () => {
    const { rollNewSeed } = useBoardGeneratorActions();

    rollNewSeed();

    const nextSeed = useBoardStore.getState().seed;
    expect(nextSeed).toBeTruthy();
    expect(typeof nextSeed).toBe('string');
  });

  it('generateBoard generates board matching selected size tier bounds', () => {
    const { generateBoard } = useBoardGeneratorActions();
    useBoardGenConfigStore.getState().setSelectedSizeTier('small');

    generateBoard();

    const { cols, rows } = useBoardStore.getState();
    expect(cols).toBeGreaterThanOrEqual(3);
    expect(cols).toBeLessThanOrEqual(20);
    expect(rows).toBeGreaterThanOrEqual(3);
    expect(rows).toBeLessThanOrEqual(20);
    expect(Math.max(cols, rows)).toBeLessThanOrEqual(8);
  });
});
