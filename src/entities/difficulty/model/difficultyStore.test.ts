import { describe, it, expect, beforeEach } from 'vitest';
import { useDifficultyStore } from './difficultyStore';
import { DEFAULT_DIFFICULTY_TILT_RANGES } from './types';

describe('difficultyStore', () => {
  beforeEach(() => {
    useDifficultyStore.setState({
      selectedDifficultyTier: 'medium',
      difficultyTiltRanges: { ...DEFAULT_DIFFICULTY_TILT_RANGES },
      difficultyNoiseSpread: 0.015,
      timerMultiplier: 20 / 170,
    });
  });

  it('updates selectedDifficultyTier, difficultyTiltRanges, and difficultyNoiseSpread', () => {
    // Default tier is medium
    expect(useDifficultyStore.getState().selectedDifficultyTier).toBe('medium');

    // Switch tier to easy
    useDifficultyStore.getState().setSelectedDifficultyTier('easy');
    expect(useDifficultyStore.getState().selectedDifficultyTier).toBe('easy');

    // Update easy tilt range
    useDifficultyStore.getState().setDifficultyTiltRange('easy', 0, 2.5);
    useDifficultyStore.getState().setDifficultyTiltRange('easy', 1, 6.0);
    expect(useDifficultyStore.getState().difficultyTiltRanges.easy).toEqual([2.5, 6.0]);

    // Update noise spread
    useDifficultyStore.getState().setDifficultyNoiseSpread(0.025);
    expect(useDifficultyStore.getState().difficultyNoiseSpread).toBe(0.025);

    // Negative noise spread is sanitized to 0
    useDifficultyStore.getState().setDifficultyNoiseSpread(-0.01);
    expect(useDifficultyStore.getState().difficultyNoiseSpread).toBe(0);
  });

  it('updates timerMultiplier and clamps negative values to 0', () => {
    useDifficultyStore.getState().setTimerMultiplier(0.2);
    expect(useDifficultyStore.getState().timerMultiplier).toBe(0.2);

    useDifficultyStore.getState().setTimerMultiplier(-1);
    expect(useDifficultyStore.getState().timerMultiplier).toBe(0);
  });
});
