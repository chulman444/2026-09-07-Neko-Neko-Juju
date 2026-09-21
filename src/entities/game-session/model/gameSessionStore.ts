import { create } from 'zustand';

export interface GameSessionState {
  // Session & Meta
  score: number;
  clearedTiles: number;
  retryAllowed: boolean;
  isPaused: boolean;

  // Actions
  addScore: (points: number) => void;
  addClearedTiles: (count: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  setRetryAllowed: (val: boolean) => void;

  // Lifecycle
  resetSession: () => void;
}

export const useGameSessionStore = create<GameSessionState>((set) => ({
  // Session & Meta Initial State
  score: 0,
  clearedTiles: 0,
  retryAllowed: true,
  isPaused: false,

  setScore: (score) => {
    set((state) => ({
      score: typeof score === 'function' ? score(state.score) : score,
    }));
  },

  setPaused: (paused) => {
    set({ isPaused: paused });
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
  },

  addScore: (points: number) => {
    if (points <= 0) return;
    set((state) => ({
      score: state.score + points,
    }));
  },

  addClearedTiles: (count: number) => {
    if (count <= 0) return;
    set((state) => ({
      clearedTiles: state.clearedTiles + count,
    }));
  },

  setRetryAllowed: (val: boolean) => {
    set({ retryAllowed: val });
  },

  resetSession: () => {
    set({
      score: 0,
      clearedTiles: 0,
      isPaused: false,
    });
  },
}));
