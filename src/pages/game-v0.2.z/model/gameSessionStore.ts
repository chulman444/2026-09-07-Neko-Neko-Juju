import { create } from 'zustand';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { useSolverStore, findClearableCombinationsOnly, type SolverCombination } from '@/features/look-ahead-solver';

function getClearableHints(): SolverCombination[] {
  const solverStore = useSolverStore.getState();
  if (solverStore.hintMode === 'default' && solverStore.isCalculated) {
    return solverStore.combinations;
  }
  const matrix = useBoardStore.getState().matrix;
  return findClearableCombinationsOnly(matrix);
}

export interface ComboConfig {
  drainExponent: number;
  fixedMinimalDrain: number; // Percent per second
  multiplier: number;
  tier1Refill: number; // Seconds added to main timer for Combos 1-4
  tier2Refill: number; // Seconds added to main timer for Combos 5-7
  tier3Refill: number; // Seconds added to main timer for Combos 8+
}

export const DEFAULT_COMBO_CONFIG: ComboConfig = {
  drainExponent: 1.5,
  fixedMinimalDrain: 15,
  multiplier: 2,
  tier1Refill: 1,
  tier2Refill: 3,
  tier3Refill: 5,
};

export interface BoardSizeRanges {
  small: [number, number];
  medium: [number, number];
  large: [number, number];
}

export interface GameSessionState {
  // Session & Meta
  score: number;
  retryAllowed: boolean;
  highlightedTiles: TileCoord[];
  noHintsAvailableMsg: string | null;

  // Main Survival Timer
  countdown: number;
  maxCountdown: number;
  baseSecondsPerTile: number;
  isPaused: boolean;
  isDepleted: boolean;

  // Board Size & Timer Multiplier Tuning
  timerMultiplier: number;
  boardSizeRanges: BoardSizeRanges;

  // Phase 1 Hint State
  maxFreeHints: number;
  freeHintInterval: number;
  hintsRemaining: number;
  hintCountdown: number;
  hintPhaseStarted: boolean;
  isPhase1Over: boolean;

  // Combo System
  comboCount: number;
  comboPct: number;
  comboConfig: ComboConfig;

  // Actions
  tick: (deltaSeconds: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  addTime: (seconds: number) => void;
  registerMatch: (clearedTileCount: number) => void;
  setHighlightedTiles: (tiles: TileCoord[] | ((prev: TileCoord[]) => TileCoord[])) => void;
  removeClearedTiles: (clearedTiles: TileCoord[]) => void;
  triggerHint: () => boolean;

  // Tuning Setters
  setMaxCountdown: (val: number) => void;
  setMaxFreeHints: (val: number) => void;
  setFreeHintInterval: (val: number) => void;
  setBaseSecondsPerTile: (val: number) => void;
  setRetryAllowed: (val: boolean) => void;
  setComboConfig: (config: ComboConfig) => void;
  setTimerMultiplier: (val: number) => void;
  setBoardSizeRange: (tier: keyof BoardSizeRanges, index: 0 | 1, val: number) => void;

  // Lifecycle
  resetSession: () => void;
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  // Session & Meta Initial State
  score: 0,
  retryAllowed: true,
  highlightedTiles: [],
  noHintsAvailableMsg: null,

  // Main Survival Timer Initial State
  countdown: 6,
  maxCountdown: 6,
  baseSecondsPerTile: 0,
  isPaused: false,
  isDepleted: false,

  // Board Size & Timer Multiplier Initial State
  timerMultiplier: 20 / 170,
  boardSizeRanges: {
    small: [3, 8],
    medium: [9, 14],
    large: [15, 20],
  },

  // Phase 1 Hint Initial State
  maxFreeHints: 3,
  freeHintInterval: 4,
  hintsRemaining: 3,
  hintCountdown: 4,
  hintPhaseStarted: false,
  isPhase1Over: false,

  // Combo System Initial State
  comboCount: 0,
  comboPct: 0,
  comboConfig: { ...DEFAULT_COMBO_CONFIG },

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
    set((state) => ({
      highlightedTiles: typeof tiles === 'function' ? tiles(state.highlightedTiles) : tiles,
    }));
  },

  removeClearedTiles: (clearedTiles) => {
    set((state) => ({
      highlightedTiles: state.highlightedTiles.filter(
        (p) => !clearedTiles.some((c) => c.row === p.row && c.col === p.col)
      ),
    }));
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

  registerMatch: (clearedTileCount: number) => {
    const state = get();
    const newComboCount = state.comboCount + 1;

    // Calculate refill time based on new combo count
    let comboRefillTime = 0;
    if (newComboCount <= 4) {
      comboRefillTime = state.comboConfig.tier1Refill;
    } else if (newComboCount <= 7) {
      comboRefillTime = state.comboConfig.tier2Refill;
    } else {
      comboRefillTime = state.comboConfig.tier3Refill;
    }

    // Award base points (1 tile = 1 point)
    const points = clearedTileCount;

    // In Phase 1, award time
    let nextCountdown = state.countdown;
    let nextDepleted = state.isDepleted;
    if (!state.isPhase1Over) {
      const addedTime = clearedTileCount * state.baseSecondsPerTile + comboRefillTime;
      nextCountdown = Math.min(state.countdown + addedTime, state.maxCountdown);
      if (nextCountdown > 0) {
        nextDepleted = false;
      }
    }

    set({
      score: state.score + points,
      comboCount: newComboCount,
      comboPct: 100,
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
        combo.required.some((req) => !state.highlightedTiles.some((p) => p.row === req.row && p.col === req.col))
      );

      const candidates = unhighlightedCombos.length > 0 ? unhighlightedCombos : activeClearables;
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const targetCombo = candidates[randomIndex];
      if (!targetCombo) return state;

      const newCoords = targetCombo.required.map((t) => ({ row: t.row, col: t.col }));
      const merged = [...state.highlightedTiles];
      newCoords.forEach((coord) => {
        if (!merged.some((m) => m.row === coord.row && m.col === coord.col)) {
          merged.push(coord);
        }
      });

      return {
        highlightedTiles: merged,
        noHintsAvailableMsg: null,
      };
    });

    return true;
  },

  tick: (deltaSeconds: number) => {
    const state = get();
    if (state.isPaused || deltaSeconds <= 0) return;

    let nextCountdown = state.countdown;
    let nextIsDepleted = state.isDepleted;
    let nextHintsRemaining = state.hintsRemaining;
    let nextHintCountdown = state.hintCountdown;
    let nextHintPhaseStarted = state.hintPhaseStarted;
    let nextIsPhase1Over = state.isPhase1Over;
    let nextComboCount = state.comboCount;
    let nextComboPct = state.comboPct;

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
    } else if (!nextIsPhase1Over && nextHintPhaseStarted && nextHintsRemaining > 0) {
      // 2. Hint Countdown (Hint #2, Hint #3, etc.)
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

    // 3. Combo Drain (runs whenever comboCount > 0)
    if (state.comboCount > 0) {
      const { fixedMinimalDrain, multiplier, drainExponent } = state.comboConfig;
      const drainRate = fixedMinimalDrain + multiplier * Math.pow(state.comboCount, drainExponent);
      nextComboPct = state.comboPct - drainRate * deltaSeconds;

      if (nextComboPct <= 0) {
        nextComboCount = 0;
        nextComboPct = 0;
      }
    }

    set({
      countdown: nextCountdown,
      isDepleted: nextIsDepleted,
      hintsRemaining: nextHintsRemaining,
      hintCountdown: Math.max(0, nextHintCountdown),
      hintPhaseStarted: nextHintPhaseStarted,
      isPhase1Over: nextIsPhase1Over,
      comboCount: nextComboCount,
      comboPct: nextComboPct,
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
      const nextRemaining = !state.hintPhaseStarted ? sanitized : Math.min(state.hintsRemaining, sanitized);
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

  setComboConfig: (config) => {
    set({ comboConfig: config });
  },

  setTimerMultiplier: (val) => {
    set({ timerMultiplier: Math.max(0, val) });
  },

  setBoardSizeRange: (tier, index, val) => {
    set((state) => {
      const current = state.boardSizeRanges[tier];
      const updated: [number, number] = [...current];
      updated[index] = val;
      return {
        boardSizeRanges: {
          ...state.boardSizeRanges,
          [tier]: updated,
        },
      };
    });
  },

  resetSession: () => {
    set((state) => ({
      score: 0,
      highlightedTiles: [],
      noHintsAvailableMsg: null,
      countdown: state.maxCountdown,
      isPaused: false,
      isDepleted: false,
      hintsRemaining: state.maxFreeHints,
      hintCountdown: state.freeHintInterval,
      hintPhaseStarted: false,
      isPhase1Over: false,
      comboCount: 0,
      comboPct: 0,
    }));
  },
}));
