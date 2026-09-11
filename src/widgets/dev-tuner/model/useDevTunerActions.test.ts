import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '@/entities/board';
import { useGameSessionStore } from '@/entities/game-session';
import { useDevTunerActions } from './useDevTunerActions';

describe('useDevTunerActions', () => {
  beforeEach(() => {
    useBoardStore.getState().generateNewBoard();
    useGameSessionStore.getState().resetSession();
  });

  it('clamps dimensions between 3 and 20 and auto-calculates timer cap', () => {
    const { updateDimensions } = useDevTunerActions();

    updateDimensions(2, 25);
    const boardState = useBoardStore.getState();
    expect(boardState.cols).toBe(3);
    expect(boardState.rows).toBe(20);

    const sessionState = useGameSessionStore.getState();
    const expectedTimer = Math.max(1, Math.round(3 * 20 * sessionState.timerMultiplier));
    expect(sessionState.maxCountdown).toBe(expectedTimer);
  });

  it('reverts timer cap based on current dimensions and multiplier', () => {
    const { revertTimerCap } = useDevTunerActions();
    useBoardStore.getState().setDimensions(10, 10);
    useGameSessionStore.getState().setMaxCountdown(5);

    revertTimerCap();
    const multiplier = useGameSessionStore.getState().timerMultiplier;
    expect(useGameSessionStore.getState().maxCountdown).toBe(Math.max(1, Math.round(100 * multiplier)));
  });

  it('applies difficulty tilt to board store', () => {
    const { applyDifficultyOnly } = useDevTunerActions();
    useGameSessionStore.getState().setSelectedDifficultyTier('easy');
    useGameSessionStore.getState().setDifficultyTiltRange('easy', 0, 3.0);
    useGameSessionStore.getState().setDifficultyTiltRange('easy', 1, 3.0);

    applyDifficultyOnly();
    const activeTilt = useBoardStore.getState().activeTilt;
    expect(activeTilt).toBe(3.0);
  });

  it('loads specific seed and updates board store', () => {
    const { loadSeed } = useDevTunerActions();
    loadSeed('TEST-SEED-123');
    expect(useBoardStore.getState().seed).toBe('TEST-SEED-123');
  });

  it('rolls a new seed', () => {
    const { rollNewSeed } = useDevTunerActions();
    rollNewSeed();
    const newSeed = useBoardStore.getState().seed;
    expect(newSeed).not.toBe('');
    expect(typeof newSeed).toBe('string');
  });
});
