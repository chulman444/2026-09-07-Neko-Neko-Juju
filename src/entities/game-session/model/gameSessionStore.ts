import { create } from 'zustand';
import { useBoardStore, type TileCoord, OMNITILE_VALUE } from '@/entities/board';
import {
  useSolverStore,
  findClearableCombinationsOnly,
  type SolverCombination,
} from '@/features/look-ahead-solver';

export function isHintComboValid(combo: TileCoord[], matrix: number[][]): boolean {
  if (!combo || combo.length === 0) return false;
  let regularSum = 0;
  let omniCount = 0;
  for (let i = 0; i < combo.length; i++) {
    const t = combo[i]!;
    const val = matrix[t.row]?.[t.col] ?? 0;
    if (val <= 0) return false;
    if (val === OMNITILE_VALUE) {
      omniCount++;
    } else {
      regularSum += val;
    }
  }
  if (omniCount > 0) {
    return regularSum <= 10;
  }
  return regularSum === 10;
}

function getClearableHints(): SolverCombination[] {
  const solverStore = useSolverStore.getState();
  if (solverStore.hintMode === 'default' && solverStore.isCalculated) {
    return solverStore.combinations;
  }
  const matrix = useBoardStore.getState().matrix;
  return findClearableCombinationsOnly(matrix);
}

export interface GameSessionState {
  // Session & Meta
  score: number;
  phase1Score: number;
  phase2Score: number;
  clearedTiles: number;
  retryAllowed: boolean;
  highlightedTiles: TileCoord[];
  noHintsAvailableMsg: string | null;

  // Main Survival Timer
  countdown: number;
  maxCountdown: number;
  baseSecondsPerTile: number;
  isPaused: boolean;
  isDepleted: boolean;

  // Phase 1 Hint State
  maxFreeHints: number;
  freeHintInterval: number;
  hintsRemaining: number;
  hintCountdown: number;
  hintPhaseStarted: boolean;
  isPhase1Over: boolean;
  activeHintCombos: TileCoord[][];

  // Actions
  tick: (deltaSeconds: number, isTimerPausedByExternal?: boolean) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  addTime: (seconds: number) => void;
  registerMatch: (
    clearedTileCount: number,
    spanTileCount?: number,
    scoreMultiplier?: number,
    addTimeBonus?: number
  ) => void;
  setHighlightedTiles: (tiles: TileCoord[] | ((prev: TileCoord[]) => TileCoord[])) => void;
  removeClearedTiles: (clearedTiles: TileCoord[]) => void;
  validateActiveHints: () => void;
  triggerHint: () => boolean;

  // Tuning Setters
  setMaxCountdown: (val: number) => void;
  setMaxFreeHints: (val: number) => void;
  setFreeHintInterval: (val: number) => void;
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
  highlightedTiles: [],
  noHintsAvailableMsg: null,

  // Main Survival Timer Initial State
  countdown: 6,
  maxCountdown: 6,
  baseSecondsPerTile: 0,
  isPaused: false,
  isDepleted: false,

  // Phase 1 Hint Initial State
  maxFreeHints: 3,
  freeHintInterval: 4,
  hintsRemaining: 3,
  hintCountdown: 4,
  hintPhaseStarted: false,
  isPhase1Over: false,
  activeHintCombos: [],

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

  setHighlightedTiles: (tiles) => {
    set((state) => {
      const nextTiles = typeof tiles === 'function' ? tiles(state.highlightedTiles) : tiles;
      return {
        highlightedTiles: nextTiles,
        activeHintCombos: nextTiles.length === 0 ? [] : state.activeHintCombos,
      };
    });
  },

  removeClearedTiles: (clearedTiles) => {
    const matrix = useBoardStore.getState().matrix;
    set((state) => {
      let nextCombos: TileCoord[][] = [];
      let nextHighlighted: TileCoord[] = [];

      if (state.activeHintCombos.length > 0) {
        nextCombos = state.activeHintCombos.filter((combo) => {
          const intersects = combo.some((t) =>
            clearedTiles.some((c) => c.row === t.row && c.col === t.col)
          );
          if (intersects) return false;
          return isHintComboValid(combo, matrix);
        });

        const allCoords: TileCoord[] = [];
        nextCombos.forEach((c) => {
          c.forEach((coord) => {
            if (!allCoords.some((m) => m.row === coord.row && m.col === coord.col)) {
              allCoords.push(coord);
            }
          });
        });
        nextHighlighted = allCoords;
      } else if (state.highlightedTiles.length > 0) {
        // Fallback for manually assigned highlightedTiles
        const intersects = state.highlightedTiles.some((t) =>
          clearedTiles.some((c) => c.row === t.row && c.col === t.col)
        );
        nextHighlighted = intersects ? [] : state.highlightedTiles;
      }

      return {
        activeHintCombos: nextCombos,
        highlightedTiles: nextHighlighted,
      };
    });
    useSolverStore.getState().cascadeTiles(clearedTiles);

    // Re-evaluate clearable hints after clearing tiles
    const clearables = getClearableHints();
    if (clearables.length > 0) {
      if (get().noHintsAvailableMsg) {
        set({ noHintsAvailableMsg: null });
      }
    } else if (!get().isPhase1Over) {
      set({ noHintsAvailableMsg: 'No more hints available.' });
    }
  },

  validateActiveHints: () => {
    const matrix = useBoardStore.getState().matrix;
    set((state) => {
      if (state.activeHintCombos.length === 0 && state.highlightedTiles.length === 0) {
        return state;
      }

      const nextCombos = state.activeHintCombos.filter((combo) => isHintComboValid(combo, matrix));

      let nextHighlighted: TileCoord[] = [];
      if (state.activeHintCombos.length > 0) {
        const allCoords: TileCoord[] = [];
        nextCombos.forEach((c) => {
          c.forEach((coord) => {
            if (!allCoords.some((m) => m.row === coord.row && m.col === coord.col)) {
              allCoords.push(coord);
            }
          });
        });
        nextHighlighted = allCoords;
      } else if (state.highlightedTiles.length > 0) {
        const hasCleared = state.highlightedTiles.some((t) => (matrix[t.row]?.[t.col] ?? 0) <= 0);
        nextHighlighted = hasCleared ? [] : state.highlightedTiles;
      }

      return {
        activeHintCombos: nextCombos,
        highlightedTiles: nextHighlighted,
      };
    });
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

  triggerHint: () => {
    const activeClearables = getClearableHints();

    if (activeClearables.length === 0) {
      set({
        noHintsAvailableMsg: 'No more hints available.',
      });
      return false;
    }

    set((state) => {
      // Find all clearable combinations whose tiles are not yet fully highlighted
      const unhighlightedCombos = activeClearables.filter((combo) =>
        combo.required.some(
          (req) => !state.highlightedTiles.some((p) => p.row === req.row && p.col === req.col)
        )
      );

      const candidates = unhighlightedCombos.length > 0 ? unhighlightedCombos : activeClearables;
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const targetCombo = candidates[randomIndex];
      if (!targetCombo) return state;

      const newCoords: TileCoord[] = targetCombo.required.map((t) => ({ row: t.row, col: t.col }));
      const nextCombos = [...state.activeHintCombos, newCoords];
      const merged = [...state.highlightedTiles];
      newCoords.forEach((coord) => {
        if (!merged.some((m) => m.row === coord.row && m.col === coord.col)) {
          merged.push(coord);
        }
      });

      return {
        activeHintCombos: nextCombos,
        highlightedTiles: merged,
        noHintsAvailableMsg: null,
      };
    });

    return true;
  },

  tick: (deltaSeconds: number, isTimerPausedByExternal = false) => {
    const state = get();
    if (state.isPaused || deltaSeconds <= 0) return;

    let nextCountdown = state.countdown;
    let nextIsDepleted = state.isDepleted;
    let nextHintsRemaining = state.hintsRemaining;
    let nextHintCountdown = state.hintCountdown;
    let nextHintPhaseStarted = state.hintPhaseStarted;
    let nextIsPhase1Over = state.isPhase1Over;

    const clearableHints = getClearableHints();
    const hasClearableHints = clearableHints.length > 0;

    if (!hasClearableHints) {
      // All active timers pause mid-countdown when no clearable hints are available!
      if (!nextIsPhase1Over && state.noHintsAvailableMsg !== 'No more hints available.') {
        set({ noHintsAvailableMsg: 'No more hints available.' });
      }
      return;
    }

    // Clearable hints exist: clear message if present
    if (state.noHintsAvailableMsg) {
      set({ noHintsAvailableMsg: null });
    }

    // 1. Survival Timer Countdown (if not depleted)
    if (!state.isDepleted) {
      if (!isTimerPausedByExternal) {
        nextCountdown = Math.max(0, state.countdown - deltaSeconds);

        // Exact transition frame: Main Timer hits 0!
        if (nextCountdown <= 0) {
          nextCountdown = 0;
          nextIsDepleted = true;

          // Atomically trigger Hint #1 if hints are available
          if (!nextIsPhase1Over && nextHintsRemaining > 0 && !nextHintPhaseStarted) {
            nextHintPhaseStarted = true;
            nextHintsRemaining = nextHintsRemaining - 1;
            nextHintCountdown = state.freeHintInterval;
            get().triggerHint();

            if (nextHintsRemaining <= 0) {
              nextIsPhase1Over = true;
              nextHintCountdown = 0;
            }
          }
        }
      }
    } else if (!nextIsPhase1Over && nextHintPhaseStarted && nextHintsRemaining > 0) {
      // 2. Hint Countdown (Hint #2, Hint #3, etc.)
      if (!isTimerPausedByExternal) {
        nextHintCountdown = state.hintCountdown - deltaSeconds;

        if (nextHintCountdown <= 0) {
          const triggered = get().triggerHint();
          if (triggered) {
            nextHintsRemaining = nextHintsRemaining - 1;

            // Phase 1 is strictly over ONLY when the final free triggered hint is consumed!
            if (nextHintsRemaining <= 0) {
              nextIsPhase1Over = true;
              nextHintCountdown = 0;
            } else {
              nextHintCountdown = state.freeHintInterval;
            }
          } else {
            // If hint couldn't be triggered, hold at 0
            nextHintCountdown = 0;
          }
        }
      }
    }

    set({
      countdown: nextCountdown,
      isDepleted: nextIsDepleted,
      hintsRemaining: nextHintsRemaining,
      hintCountdown: Math.max(0, nextHintCountdown),
      hintPhaseStarted: nextHintPhaseStarted,
      isPhase1Over: nextIsPhase1Over,
    });
  },

  // Tuning actions
  setMaxCountdown: (val) => {
    const sanitized = Math.max(1, val);
    set((state) => ({
      maxCountdown: sanitized,
      countdown: Math.min(state.countdown, sanitized),
    }));
  },

  setMaxFreeHints: (val) => {
    const sanitized = Math.max(0, val);
    set((state) => {
      // If hint phase hasn't started yet, adjust hintsRemaining to match new max
      const nextRemaining = !state.hintPhaseStarted
        ? sanitized
        : Math.min(state.hintsRemaining, sanitized);
      return {
        maxFreeHints: sanitized,
        hintsRemaining: nextRemaining,
      };
    });
  },

  setFreeHintInterval: (val) => {
    const sanitized = Math.max(1, val);
    set((state) => ({
      freeHintInterval: sanitized,
      // If hint countdown is still in standby before first trigger, keep it in sync
      hintCountdown: !state.hintPhaseStarted ? sanitized : state.hintCountdown,
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
      activeHintCombos: [],
      highlightedTiles: [],
      noHintsAvailableMsg: null,
      countdown: state.maxCountdown,
      isPaused: false,
      isDepleted: false,
      hintsRemaining: state.maxFreeHints,
      hintCountdown: state.freeHintInterval,
      hintPhaseStarted: false,
      isPhase1Over: false,
    }));
  },
}));

let lastMatrix = useBoardStore.getState().matrix;
useBoardStore.subscribe((state) => {
  if (state.matrix !== lastMatrix) {
    lastMatrix = state.matrix;
    useGameSessionStore.getState().validateActiveHints();
  }
});
