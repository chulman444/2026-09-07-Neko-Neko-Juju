import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '@/entities/board';
import { useGameSessionStore } from '@/entities/game-session';
import { useBoardGeneratorActions } from './useBoardGeneratorActions';

describe('useBoardGeneratorActions', () => {
  beforeEach(() => {
    useBoardStore.setState({
      cols: 10,
      rows: 10,
      seed: 'test-seed-actions',
    });
    useGameSessionStore.getState().resetSession();
  });

  it('updateDimensions updates dimensions and recalculates initial timer cap', () => {
    const { updateDimensions } = useBoardGeneratorActions();
    updateDimensions(8, 6);

    const boardState = useBoardStore.getState();
    expect(boardState.cols).toBe(8);
    expect(boardState.rows).toBe(6);

    const sessionState = useGameSessionStore.getState();
    const expectedCap = Math.max(1, Math.round(8 * 6 * sessionState.timerMultiplier));
    expect(sessionState.maxCountdown).toBe(expectedCap);
  });

  it('revertTimerCap recalculates countdown to match multiplier', () => {
    const { revertTimerCap } = useBoardGeneratorActions();
    useGameSessionStore.getState().setMaxCountdown(999);
    expect(useGameSessionStore.getState().maxCountdown).toBe(999);

    revertTimerCap();
    const sessionState = useGameSessionStore.getState();
    const expectedCap = Math.max(1, Math.round(10 * 10 * sessionState.timerMultiplier));
    expect(sessionState.maxCountdown).toBe(expectedCap);
  });

  it('applyDifficultyOnly generates and sets tile weights on board store', () => {
    const { applyDifficultyOnly } = useBoardGeneratorActions();
    useGameSessionStore.getState().setSelectedDifficultyTier('easy');

    applyDifficultyOnly();

    const boardState = useBoardStore.getState();
    expect(boardState.tileWeights).toBeDefined();
    expect(boardState.tileWeights).toHaveLength(9);
    expect(boardState.activeTilt).toBeGreaterThanOrEqual(2.0);
  });

  it('loadSeed sets active seed on board store and resets session', () => {
    const { loadSeed } = useBoardGeneratorActions();
    loadSeed('custom-seed-777');

    expect(useBoardStore.getState().seed).toBe('custom-seed-777');
  });

  it('rollNewSeed generates a new seed and updates store', () => {
    const { rollNewSeed } = useBoardGeneratorActions();

    rollNewSeed();

    const nextSeed = useBoardStore.getState().seed;
    expect(nextSeed).toBeTruthy();
    expect(typeof nextSeed).toBe('string');
  });
});
