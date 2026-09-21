import { create } from 'zustand';

export interface GameSessionState {
  // Session & Meta
  score: number;
  phase1Score: number;
  phase2Score: number;
  clearedTiles: number;
  retryAllowed: boolean;

  // Main Survival Timer
  countdown: number;
  maxCountdown: number;
  baseSecondsPerTile: number;
  isPaused: boolean;
  isDepleted: boolean;

  // Actions
  tick: (deltaSeconds: number, isTimerPausedByExternal?: boolean) => void;
  addScore: (points: number, isPhase1?: boolean) => void;
  addClearedTiles: (count: number) => void;
  addTime: (seconds: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  registerMatch: (
    clearedTileCount: number,
    spanTileCount?: number,
    scoreMultiplier?: number,
    addTimeBonus?: number,
    isPhase1?: boolean
  ) => void;

  // Tuning Setters
  setMaxCountdown: (val: number) => void;
  setBaseSecondsPerTile: (val: number) => void;
  setRetryAllowed: (val: boolean) => void;

  // Lifecycle
  resetSession: () => void;
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  // Session & Meta Initial State
  score: 0,
  phase1Score: 0,
  phase2Score: 0,
  clearedTiles: 0,
  retryAllowed: true,

  // Main Survival Timer Initial State
  countdown: 6,
  maxCountdown: 6,
  baseSecondsPerTile: 0,
  isPaused: false,
  isDepleted: false,

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

  addScore: (points: number, isPhase1 = true) => {
    if (points <= 0) return;
    set((state) => ({
      score: state.score + points,
      phase1Score: isPhase1 ? state.phase1Score + points : state.phase1Score,
      phase2Score: isPhase1 ? state.phase2Score : state.phase2Score + points,
    }));
  },

  addClearedTiles: (count: number) => {
    if (count <= 0) return;
    set((state) => ({
      clearedTiles: state.clearedTiles + count,
    }));
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

  registerMatch: (
    clearedTileCount: number,
    spanTileCount?: number,
    scoreMultiplier = 1,
    addTimeBonus = 0,
    isPhase1 = true
  ) => {
    const basePoints = spanTileCount ?? clearedTileCount;
    const points = Math.round(basePoints * Math.max(0, scoreMultiplier));

    get().addScore(points, isPhase1);
    get().addClearedTiles(clearedTileCount);

    if (isPhase1) {
      const addedTime = clearedTileCount * get().baseSecondsPerTile + Math.max(0, addTimeBonus);
      get().addTime(addedTime);
    }
  },

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

  // Tuning actions
  setMaxCountdown: (val) => {
    const sanitized = Math.max(1, val);
    set((state) => ({
      maxCountdown: sanitized,
      countdown: Math.min(state.countdown, sanitized),
    }));
  },

  setBaseSecondsPerTile: (val) => {
    set({ baseSecondsPerTile: Math.max(0, val) });
  },

  setRetryAllowed: (val) => {
    set({ retryAllowed: val });
  },

  resetSession: () => {
    set((state) => ({
      score: 0,
      phase1Score: 0,
      phase2Score: 0,
      clearedTiles: 0,
      countdown: state.maxCountdown,
      isPaused: false,
      isDepleted: false,
    }));
  },
}));
