import { describe, it, expect, beforeEach } from 'vitest';
import { useGameSessionStore } from './gameSessionStore';

describe('gameSessionStore', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession();
  });

  describe('Survival Timer Countdown', () => {
    it('initializes countdown to maxCountdown and decrements on tick', () => {
      const store = useGameSessionStore.getState();
      expect(store.countdown).toBe(store.maxCountdown);
      expect(store.isDepleted).toBe(false);

      useGameSessionStore.getState().tick(1.0);
      expect(useGameSessionStore.getState().countdown).toBe(store.maxCountdown - 1.0);
      expect(useGameSessionStore.getState().isDepleted).toBe(false);
    });

    it('marks isDepleted true when countdown reaches 0', () => {
      const store = useGameSessionStore.getState();
      useGameSessionStore.getState().tick(store.maxCountdown + 1);

      const state = useGameSessionStore.getState();
      expect(state.countdown).toBe(0);
      expect(state.isDepleted).toBe(true);
    });

    it('pauses countdown when isPaused is true or isTimerPausedByExternal is true', () => {
      const initialCountdown = useGameSessionStore.getState().countdown;

      // Paused by external
      useGameSessionStore.getState().tick(1.0, true);
      expect(useGameSessionStore.getState().countdown).toBe(initialCountdown);

      // Paused by store flag
      useGameSessionStore.getState().setPaused(true);
      useGameSessionStore.getState().tick(1.0, false);
      expect(useGameSessionStore.getState().countdown).toBe(initialCountdown);

      // Unpause
      useGameSessionStore.getState().setPaused(false);
      useGameSessionStore.getState().tick(1.0, false);
      expect(useGameSessionStore.getState().countdown).toBe(initialCountdown - 1.0);
    });

    it('adds time up to maxCountdown with addTime', () => {
      useGameSessionStore.getState().tick(3.0);
      const afterTick = useGameSessionStore.getState().countdown;

      useGameSessionStore.getState().addTime(1.0);
      expect(useGameSessionStore.getState().countdown).toBe(afterTick + 1.0);

      // Clamps to maxCountdown
      useGameSessionStore.getState().addTime(100.0);
      expect(useGameSessionStore.getState().countdown).toBe(
        useGameSessionStore.getState().maxCountdown
      );
    });
  });

  describe('Atomic Setters: addScore, addClearedTiles, addTime', () => {
    it('increments score and phase scores atomically', () => {
      const store = useGameSessionStore.getState();
      store.addScore(5, true);
      expect(useGameSessionStore.getState().score).toBe(5);
      expect(useGameSessionStore.getState().phase1Score).toBe(5);
      expect(useGameSessionStore.getState().phase2Score).toBe(0);

      store.addScore(3, false);
      expect(useGameSessionStore.getState().score).toBe(8);
      expect(useGameSessionStore.getState().phase1Score).toBe(5);
      expect(useGameSessionStore.getState().phase2Score).toBe(3);
    });

    it('tracks cleared tiles count', () => {
      const store = useGameSessionStore.getState();
      store.addClearedTiles(3);
      expect(useGameSessionStore.getState().clearedTiles).toBe(3);
      store.addClearedTiles(2);
      expect(useGameSessionStore.getState().clearedTiles).toBe(5);
    });
  });

  describe('Match Registration & Points', () => {
    it('awards exactly 1 point per cleared tile without inflation and tracks clearedTiles', () => {
      expect(useGameSessionStore.getState().score).toBe(0);
      expect(useGameSessionStore.getState().clearedTiles).toBe(0);

      // Clear 2 tiles (e.g. 5+5)
      useGameSessionStore.getState().registerMatch(2);
      expect(useGameSessionStore.getState().score).toBe(2);
      expect(useGameSessionStore.getState().clearedTiles).toBe(2);

      // Clear 4 tiles (e.g. 1+2+3+4)
      useGameSessionStore.getState().registerMatch(4);
      expect(useGameSessionStore.getState().score).toBe(6);
      expect(useGameSessionStore.getState().clearedTiles).toBe(6);

      // Clear 2 tiles with a larger span of 10
      useGameSessionStore.getState().registerMatch(2, 10);
      expect(useGameSessionStore.getState().score).toBe(16); // 6 + 10
      expect(useGameSessionStore.getState().clearedTiles).toBe(8); // 6 + 2
    });

    it('applies scoreMultiplier and addTimeBonus correctly', () => {
      useGameSessionStore.getState().registerMatch(2, 2, 2.5, 3.0);
      expect(useGameSessionStore.getState().score).toBe(5); // round(2 * 2.5)
    });
  });

  describe('phase1Score and phase2Score tracking', () => {
    it('tracks points in phase1Score during Phase 1 and freezes it during Phase 2', () => {
      const store = useGameSessionStore.getState();
      expect(store.phase1Score).toBe(0);
      expect(store.phase2Score).toBe(0);
      expect(store.score).toBe(0);

      // Match during Phase 1
      store.registerMatch(2, undefined, 1, 0, true);
      expect(useGameSessionStore.getState().score).toBe(2);
      expect(useGameSessionStore.getState().phase1Score).toBe(2);
      expect(useGameSessionStore.getState().phase2Score).toBe(0);

      // Another match during Phase 1
      store.registerMatch(3, undefined, 1, 0, true);
      const phase1Total = useGameSessionStore.getState().phase1Score;
      expect(phase1Total).toBeGreaterThanOrEqual(5);
      expect(useGameSessionStore.getState().phase2Score).toBe(0);

      // Match during Phase 2 (isPhase1 = false)
      store.registerMatch(2, undefined, 1, 0, false);
      const afterPhase2State = useGameSessionStore.getState();
      expect(afterPhase2State.phase1Score).toBe(phase1Total); // Frozen!
      expect(afterPhase2State.phase2Score).toBeGreaterThan(0);
      expect(afterPhase2State.score).toBe(phase1Total + afterPhase2State.phase2Score);

      // Reset
      useGameSessionStore.getState().resetSession();
      expect(useGameSessionStore.getState().phase1Score).toBe(0);
      expect(useGameSessionStore.getState().phase2Score).toBe(0);
      expect(useGameSessionStore.getState().score).toBe(0);
    });
  });
});
