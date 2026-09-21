import { create } from 'zustand';

export interface SurvivalTimerState {
  countdown: number;
  maxCountdown: number;
  baseSecondsPerTile: number;
  isPaused: boolean;
  isDepleted: boolean;

  tick: (deltaSeconds: number, isTimerPausedByExternal?: boolean) => void;
  addTime: (seconds: number) => void;
  setMaxCountdown: (val: number) => void;
  setBaseSecondsPerTile: (val: number) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  resetTimer: () => void;
}

export const useSurvivalTimerStore = create<SurvivalTimerState>((set, get) => ({
  countdown: 6,
  maxCountdown: 6,
  baseSecondsPerTile: 0,
  isPaused: false,
  isDepleted: false,

  tick: (deltaSeconds: number, isTimerPausedByExternal = false) => {
    const state = get();
    if (state.isPaused || isTimerPausedByExternal || deltaSeconds <= 0) return;

    if (!state.isDepleted) {
      const nextCountdown = Math.max(0, state.countdown - deltaSeconds);
      set({
        countdown: nextCountdown,
        isDepleted: nextCountdown <= 0,
      });
    }
  },

  addTime: (seconds: number) => {
    if (seconds <= 0) return;
    set((state) => {
      const next = Math.min(state.countdown + seconds, state.maxCountdown);
      return {
        countdown: next,
        isDepleted: next <= 0,
      };
    });
  },

  setMaxCountdown: (val: number) => {
    const sanitized = Math.max(1, val);
    set((state) => ({
      maxCountdown: sanitized,
      countdown: Math.min(state.countdown, sanitized),
    }));
  },

  setBaseSecondsPerTile: (val: number) => {
    set({ baseSecondsPerTile: Math.max(0, val) });
  },

  setPaused: (paused: boolean) => {
    set({ isPaused: paused });
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
  },

  resetTimer: () => {
    set((state) => ({
      countdown: state.maxCountdown,
      isPaused: false,
      isDepleted: false,
    }));
  },
}));
