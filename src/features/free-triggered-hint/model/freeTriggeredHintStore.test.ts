import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFreeTriggeredHintStore } from '../index';

describe('freeTriggeredHintStore', () => {
  beforeEach(() => {
    useFreeTriggeredHintStore.getState().resetHintSession();
    useFreeTriggeredHintStore.getState().setMaxFreeHints(3);
    useFreeTriggeredHintStore.getState().setFreeHintInterval(4);
  });

  describe('configuration', () => {
    it('updates maxFreeHints and clamps to 0', () => {
      useFreeTriggeredHintStore.getState().setMaxFreeHints(5);
      expect(useFreeTriggeredHintStore.getState().maxFreeHints).toBe(5);
      expect(useFreeTriggeredHintStore.getState().hintsRemaining).toBe(5);

      useFreeTriggeredHintStore.getState().setMaxFreeHints(-2);
      expect(useFreeTriggeredHintStore.getState().maxFreeHints).toBe(0);
      expect(useFreeTriggeredHintStore.getState().hintsRemaining).toBe(0);
    });

    it('updates freeHintInterval and clamps to minimum 1', () => {
      useFreeTriggeredHintStore.getState().setFreeHintInterval(6);
      expect(useFreeTriggeredHintStore.getState().freeHintInterval).toBe(6);
      expect(useFreeTriggeredHintStore.getState().hintCountdown).toBe(6);

      useFreeTriggeredHintStore.getState().setFreeHintInterval(0);
      expect(useFreeTriggeredHintStore.getState().freeHintInterval).toBe(1);
    });
  });

  describe('tick hint progression', () => {
    it('does not trigger hint before survival timer is depleted', () => {
      const tryTrigger = vi.fn(() => true);
      useFreeTriggeredHintStore.getState().tick(1.0, false, false, tryTrigger);

      expect(useFreeTriggeredHintStore.getState().hintPhaseStarted).toBe(false);
      expect(useFreeTriggeredHintStore.getState().hintsRemaining).toBe(3);
      expect(tryTrigger).not.toHaveBeenCalled();
    });

    it('triggers Hint #1 immediately when survival timer is depleted', () => {
      const tryTrigger = vi.fn(() => true);

      // Depleted transition frame (isSurvivalDepleted = true)
      useFreeTriggeredHintStore.getState().tick(0.016, true, false, tryTrigger);
      const state = useFreeTriggeredHintStore.getState();

      expect(state.hintPhaseStarted).toBe(true);
      expect(state.hintsRemaining).toBe(2);
      expect(state.hintCountdown).toBe(4);
      expect(state.isPhase1Over).toBe(false);
      expect(tryTrigger).toHaveBeenCalledTimes(1);
    });

    it('does not transition if tryTriggerHint returns false on depletion', () => {
      const tryTrigger = vi.fn(() => false);

      useFreeTriggeredHintStore.getState().tick(0.016, true, false, tryTrigger);
      const state = useFreeTriggeredHintStore.getState();

      expect(state.hintPhaseStarted).toBe(false);
      expect(state.hintsRemaining).toBe(3);
      expect(tryTrigger).toHaveBeenCalledTimes(1);
    });

    it('ticks countdown and triggers subsequent hints until final hint strictly ends Phase 1', () => {
      const tryTrigger = vi.fn(() => true);
      useFreeTriggeredHintStore.getState().setMaxFreeHints(2);

      // Trigger Hint #1 on depletion
      useFreeTriggeredHintStore.getState().tick(0.016, true, false, tryTrigger);
      expect(useFreeTriggeredHintStore.getState().hintsRemaining).toBe(1);
      expect(useFreeTriggeredHintStore.getState().isPhase1Over).toBe(false);

      // Tick intermediate 2 seconds
      useFreeTriggeredHintStore.getState().tick(2.0, true, false, tryTrigger);
      expect(useFreeTriggeredHintStore.getState().hintCountdown).toBe(2);
      expect(useFreeTriggeredHintStore.getState().hintsRemaining).toBe(1);
      expect(useFreeTriggeredHintStore.getState().isPhase1Over).toBe(false);

      // Tick remaining 2 seconds -> triggers final hint (Hint #2), ending Phase 1
      useFreeTriggeredHintStore.getState().tick(2.0, true, false, tryTrigger);
      const finalState = useFreeTriggeredHintStore.getState();
      expect(finalState.hintsRemaining).toBe(0);
      expect(finalState.hintCountdown).toBe(0);
      expect(finalState.isPhase1Over).toBe(true);
      expect(tryTrigger).toHaveBeenCalledTimes(2);
    });

    it('pauses countdown when isTimerPaused is true', () => {
      const tryTrigger = vi.fn(() => true);
      useFreeTriggeredHintStore.getState().tick(0.016, true, false, tryTrigger);
      const initialCountdown = useFreeTriggeredHintStore.getState().hintCountdown;

      // Tick while paused
      useFreeTriggeredHintStore.getState().tick(1.5, true, true, tryTrigger);
      expect(useFreeTriggeredHintStore.getState().hintCountdown).toBe(initialCountdown);

      // Resume
      useFreeTriggeredHintStore.getState().tick(1.0, true, false, tryTrigger);
      expect(useFreeTriggeredHintStore.getState().hintCountdown).toBe(initialCountdown - 1.0);
    });
  });

  describe('resetHintSession', () => {
    it('resets hintsRemaining and countdown to configured defaults', () => {
      useFreeTriggeredHintStore.setState({
        hintsRemaining: 0,
        hintCountdown: 0,
        hintPhaseStarted: true,
        isPhase1Over: true,
      });

      useFreeTriggeredHintStore.getState().resetHintSession();
      const state = useFreeTriggeredHintStore.getState();
      expect(state.hintsRemaining).toBe(3);
      expect(state.hintCountdown).toBe(4);
      expect(state.hintPhaseStarted).toBe(false);
      expect(state.isPhase1Over).toBe(false);
    });
  });
});
