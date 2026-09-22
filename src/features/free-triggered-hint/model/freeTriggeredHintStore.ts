import { create } from 'zustand';
import type { FreeTriggeredHintState } from './types';

export const useFreeTriggeredHintStore = create<FreeTriggeredHintState>((set, get) => ({
  maxFreeHints: 3,
  freeHintInterval: 4,
  hintsRemaining: 3,
  hintCountdown: 4,
  hintPhaseStarted: false,
  isPhase1Over: false,

  setMaxFreeHints: (val: number) => {
    const sanitized = Math.max(0, val);
    set((state) => {
      const nextRemaining = !state.hintPhaseStarted
        ? sanitized
        : Math.min(state.hintsRemaining, sanitized);
      return {
        maxFreeHints: sanitized,
        hintsRemaining: nextRemaining,
      };
    });
  },

  setFreeHintInterval: (val: number) => {
    const sanitized = Math.max(1, val);
    set((state) => ({
      freeHintInterval: sanitized,
      hintCountdown: !state.hintPhaseStarted ? sanitized : state.hintCountdown,
    }));
  },

  tick: (
    deltaSeconds: number,
    isSurvivalDepleted: boolean,
    isTimerPaused = false,
    tryTriggerHint?: () => boolean
  ) => {
    const state = get();
    if (deltaSeconds <= 0) return;

    let nextHintsRemaining = state.hintsRemaining;
    let nextHintCountdown = state.hintCountdown;
    let nextHintPhaseStarted = state.hintPhaseStarted;
    let nextIsPhase1Over = state.isPhase1Over;

    // 1. Transition frame into Hint Phase: Survival timer depleted, Hint #1 triggers atomically
    if (isSurvivalDepleted && !nextHintPhaseStarted && !nextIsPhase1Over) {
      if (nextHintsRemaining > 0) {
        const triggered = tryTriggerHint ? tryTriggerHint() : true;
        if (triggered) {
          nextHintPhaseStarted = true;
          nextHintsRemaining = nextHintsRemaining - 1;
          nextHintCountdown = state.freeHintInterval;

          if (nextHintsRemaining <= 0) {
            nextIsPhase1Over = true;
            nextHintCountdown = 0;
          }
        }
      }
    } else if (!nextIsPhase1Over && nextHintPhaseStarted && nextHintsRemaining > 0) {
      // 2. Subsequent hint countdowns (Hint #2, Hint #3, etc.)
      if (!isTimerPaused) {
        nextHintCountdown = state.hintCountdown - deltaSeconds;

        if (nextHintCountdown <= 0) {
          const triggered = tryTriggerHint ? tryTriggerHint() : true;
          if (triggered) {
            nextHintsRemaining = nextHintsRemaining - 1;
            if (nextHintsRemaining <= 0) {
              nextIsPhase1Over = true;
              nextHintCountdown = 0;
            } else {
              nextHintCountdown = state.freeHintInterval;
            }
          } else {
            nextHintCountdown = 0;
          }
        }
      }
    }

    set({
      hintsRemaining: nextHintsRemaining,
      hintCountdown: Math.max(0, nextHintCountdown),
      hintPhaseStarted: nextHintPhaseStarted,
      isPhase1Over: nextIsPhase1Over,
    });
  },

  resetHintSession: () => {
    set((state) => ({
      hintsRemaining: state.maxFreeHints,
      hintCountdown: state.freeHintInterval,
      hintPhaseStarted: false,
      isPhase1Over: false,
    }));
  },
}));
