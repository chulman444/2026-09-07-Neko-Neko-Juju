import { describe, it, expect, beforeEach } from 'vitest';
import { useGameSessionStore } from './gameSessionStore';

describe('gameSessionStore', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession();
  });

  describe('Session Scoring & Cleared Tiles', () => {
    it('initializes with default zero scores and unpaused', () => {
      const store = useGameSessionStore.getState();
      expect(store.score).toBe(0);
      expect(store.clearedTiles).toBe(0);
      expect(store.retryAllowed).toBe(true);
      expect(store.isPaused).toBe(false);
    });

    it('increments score and cleared tiles properly', () => {
      useGameSessionStore.getState().addScore(5);
      expect(useGameSessionStore.getState().score).toBe(5);

      useGameSessionStore.getState().addClearedTiles(3);
      expect(useGameSessionStore.getState().clearedTiles).toBe(3);

      useGameSessionStore.getState().addScore(10);
      useGameSessionStore.getState().addClearedTiles(2);
      expect(useGameSessionStore.getState().score).toBe(15);
      expect(useGameSessionStore.getState().clearedTiles).toBe(5);
    });

    it('supports functional setScore', () => {
      useGameSessionStore.getState().setScore(10);
      expect(useGameSessionStore.getState().score).toBe(10);

      useGameSessionStore.getState().setScore((prev) => prev * 2);
      expect(useGameSessionStore.getState().score).toBe(20);
    });
  });

  describe('Pause & Retry Controls', () => {
    it('sets and toggles pause state', () => {
      expect(useGameSessionStore.getState().isPaused).toBe(false);

      useGameSessionStore.getState().setPaused(true);
      expect(useGameSessionStore.getState().isPaused).toBe(true);

      useGameSessionStore.getState().togglePause();
      expect(useGameSessionStore.getState().isPaused).toBe(false);
    });

    it('sets retryAllowed option', () => {
      useGameSessionStore.getState().setRetryAllowed(false);
      expect(useGameSessionStore.getState().retryAllowed).toBe(false);
    });

    it('resets session properly on resetSession', () => {
      useGameSessionStore.getState().addScore(100);
      useGameSessionStore.getState().addClearedTiles(50);
      useGameSessionStore.getState().setPaused(true);

      useGameSessionStore.getState().resetSession();
      const state = useGameSessionStore.getState();
      expect(state.score).toBe(0);
      expect(state.clearedTiles).toBe(0);
      expect(state.isPaused).toBe(false);
    });
  });
});
