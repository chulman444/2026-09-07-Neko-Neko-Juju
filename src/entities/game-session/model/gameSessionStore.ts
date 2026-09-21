import { create } from 'zustand';

export interface GameSessionState {
  // Session & Meta
  score: number;
  phase1Score: number;
  phase2Score: number;
  clearedTiles: number;
  retryAllowed: boolean;
  isPhase1Over: boolean;

  // Main Survival Timer
  countdown: number;
  maxCountdown: number;
  baseSecondsPerTile: number;
  isPaused: boolean;
  isDepleted: boolean;

  // Actions
  tick: (deltaSeconds: number, isTimerPausedByExternal?: boolean) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  addTime: (seconds: number) => void;
  setIsPhase1Over: (isOver: boolean) => void;
  registerMatch: (
    clearedTileCount: number,
    spanTileCount?: number,
    scoreMultiplier?: number,
    addTimeBonus?: number
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
  isPhase1Over: false,

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

  setIsPhase1Over: (isOver) => {
    set({ isPhase1Over: isOver });
  },

  addTime: (seconds) => {
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
    addTimeBonus = 0
  ) => {
    const state = get();
    // Award base points with score multiplier
    const basePoints = spanTileCount ?? clearedTileCount;
    const points = Math.round(basePoints * Math.max(0, scoreMultiplier));

    // In Phase 1, award time based on actual cleared tiles + addTimeBonus
    let nextCountdown = state.countdown;
    let nextDepleted = state.isDepleted;
    if (!state.isPhase1Over) {
      const addedTime = clearedTileCount * state.baseSecondsPerTile + Math.max(0, addTimeBonus);
      nextCountdown = Math.min(state.countdown + addedTime, state.maxCountdown);
      if (nextCountdown > 0) {
        nextDepleted = false;
      }
    }

    const nextPhase1Score = state.isPhase1Over ? state.phase1Score : state.phase1Score + points;
    const nextPhase2Score = state.isPhase1Over ? state.phase2Score + points : state.phase2Score;

    set({
      score: state.score + points,
      phase1Score: nextPhase1Score,
      phase2Score: nextPhase2Score,
      clearedTiles: state.clearedTiles + clearedTileCount,
      countdown: nextCountdown,
      isDepleted: nextDepleted,
    });
  },

  tick: (deltaSeconds: number, isTimerPausedByExternal = false) => {
    const state = get();
    if (state.isPaused || deltaSeconds <= 0) return;

    // Survival Timer Countdown (if not depleted and not paused by external)
    if (!state.isDepleted && !isTimerPausedByExternal) {
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
      isPhase1Over: false,
    }));
  },
}));
