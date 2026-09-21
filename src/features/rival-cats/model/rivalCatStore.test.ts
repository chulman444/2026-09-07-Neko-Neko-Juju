import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBoardStore } from '@/entities/board';
import {
  useRivalCatStore,
  setRivalCatHintsResolver,
  registerRivalStealListener,
} from './rivalCatStore';

describe('rivalCatStore', () => {
  beforeEach(() => {
    useRivalCatStore.setState({
      isEnabled: false,
      rivalCatInterval: 5,
      rivalCatCountdown: 5,
      activeRivalCats: 1,
      stolenTilesCount: 0,
    });
    setRivalCatHintsResolver(null);
    registerRivalStealListener(null);
    useBoardStore.getState().setMatrix([
      [1, 9, 2],
      [3, 7, 4],
      [5, 5, 6],
    ]);
  });

  it('initializes with default values', () => {
    const state = useRivalCatStore.getState();
    expect(state.isEnabled).toBe(false);
    expect(state.rivalCatInterval).toBe(5);
    expect(state.rivalCatCountdown).toBe(5);
    expect(state.activeRivalCats).toBe(1);
    expect(state.stolenTilesCount).toBe(0);
  });

  it('updates isEnabled, rivalCatInterval, and clamps countdown', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    expect(useRivalCatStore.getState().isEnabled).toBe(true);

    useRivalCatStore.getState().setRivalCatInterval(3);
    expect(useRivalCatStore.getState().rivalCatInterval).toBe(3);
    expect(useRivalCatStore.getState().rivalCatCountdown).toBe(3);
  });

  it('does not decrement countdown on tick when disabled or paused', () => {
    useRivalCatStore.getState().setIsEnabled(false);
    useRivalCatStore.getState().tick(1.0, false);
    expect(useRivalCatStore.getState().rivalCatCountdown).toBe(5);

    useRivalCatStore.getState().setIsEnabled(true);
    useRivalCatStore.getState().tick(1.0, true);
    expect(useRivalCatStore.getState().rivalCatCountdown).toBe(5);
  });

  it('decrements countdown on tick when enabled and not paused', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    useRivalCatStore.getState().tick(1.5, false);
    expect(useRivalCatStore.getState().rivalCatCountdown).toBeCloseTo(3.5);
  });

  it('steals match when countdown reaches 0 on tick', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    useRivalCatStore.getState().setRivalCatInterval(3);

    const combo = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ];
    setRivalCatHintsResolver(() => [combo]);

    const stealSpy = vi.fn();
    registerRivalStealListener(stealSpy);

    useRivalCatStore.getState().tick(3.0, false);

    expect(useBoardStore.getState().matrix[0]?.[0]).toBe(0);
    expect(useBoardStore.getState().matrix[0]?.[1]).toBe(0);
    expect(useRivalCatStore.getState().stolenTilesCount).toBe(2);
    expect(useRivalCatStore.getState().rivalCatCountdown).toBe(3);
    expect(stealSpy).toHaveBeenCalledWith(combo);
  });

  it('handles stealMatch gracefully when no hints are available', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    setRivalCatHintsResolver(() => []);

    const result = useRivalCatStore.getState().stealMatch();
    expect(result).toBe(false);
    expect(useRivalCatStore.getState().stolenTilesCount).toBe(0);
    expect(useRivalCatStore.getState().rivalCatCountdown).toBe(5);
  });

  it('resets countdown and total stolen tiles with resetRivalCats', () => {
    useRivalCatStore.setState({
      rivalCatInterval: 4,
      rivalCatCountdown: 1.2,
      stolenTilesCount: 14,
    });

    useRivalCatStore.getState().resetCountdown();
    expect(useRivalCatStore.getState().rivalCatCountdown).toBe(4);
    expect(useRivalCatStore.getState().stolenTilesCount).toBe(14);

    useRivalCatStore.getState().resetRivalCats();
    expect(useRivalCatStore.getState().rivalCatCountdown).toBe(4);
    expect(useRivalCatStore.getState().stolenTilesCount).toBe(0);
  });
});
