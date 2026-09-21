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

export interface ComboRule {
  id: string;
  upToCombo: number | null; // null means unbounded (e.g., 8+)
  addTimeValue: string | number; // e.g., '2' or 'x * 0.5'
  timerFlowMode: 'normal' | 'pause';
  pauseDuration: string | number; // Evaluates 'x' and 'c'. Default: 'c'
  comboDuration: string | number; // in seconds, e.g. '4'
  scoreMultiplier: string | number; // e.g., '1.5' or '1 + x*0.1'
}

export const DEFAULT_COMBO_RULES: ComboRule[] = [
  {
    id: 'combo-rule-1',
    upToCombo: 4,
    addTimeValue: '1',
    timerFlowMode: 'normal',
    pauseDuration: 'c',
    comboDuration: '5',
    scoreMultiplier: '1',
  },
  {
    id: 'combo-rule-2',
    upToCombo: 7,
    addTimeValue: '3',
    timerFlowMode: 'normal',
    pauseDuration: 'c',
    comboDuration: '4',
    scoreMultiplier: '1.5',
  },
  {
    id: 'combo-rule-3',
    upToCombo: null,
    addTimeValue: '5',
    timerFlowMode: 'normal',
    pauseDuration: 'c',
    comboDuration: '3',
    scoreMultiplier: '2',
  },
];

export function evaluateFormula(
  formula: string | number | undefined | null,
  variables: { x: number; c?: number },
  fallback = 0
): number {
  if (formula === undefined || formula === null) return fallback;
  if (typeof formula === 'number') {
    return Number.isFinite(formula) ? formula : fallback;
  }
  const trimmed = String(formula).trim();
  if (!trimmed) return fallback;

  const directNum = Number(trimmed);
  if (!Number.isNaN(directNum)) {
    return directNum;
  }

  // Sanitize: allow numbers, arithmetic operators, parentheses, commas, whitespace, identifier characters
  if (!/^[0-9+\-*/%^().,\s_a-zA-Z]+$/.test(trimmed)) {
    return fallback;
  }

  const blockedWords =
    /\b(constructor|prototype|__proto__|window|document|global|process|eval|function|import|export|let|var|const|return|throw|while|for|if|else|switch|case|break|continue|new|class|this|void|typeof|delete|in|instanceof|yield|await|async)\b/i;
  if (blockedWords.test(trimmed)) {
    return fallback;
  }

  const expr = trimmed.replace(/\^/g, '**');

  try {
    const x = Number.isFinite(variables.x) ? variables.x : 0;
    const c = Number.isFinite(variables.c ?? 0) ? (variables.c ?? 0) : 0;

    const fn = new Function(
      'x',
      'c',
      'Math',
      `
      const { sin, cos, tan, atan, asin, acos, sqrt, pow, abs, min, max, floor, ceil, round, log, exp, PI, E } = Math;
      return (${expr});
      `
    );
    const result = fn(x, c, Math);
    if (typeof result === 'number' && Number.isFinite(result)) {
      return result;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function getMatchingComboRule(rules: ComboRule[], combo: number): ComboRule {
  if (!rules || rules.length === 0) {
    return DEFAULT_COMBO_RULES[0]!;
  }
  const sorted = [...rules].sort((a, b) => {
    const aVal = a.upToCombo ?? Infinity;
    const bVal = b.upToCombo ?? Infinity;
    return aVal - bVal;
  });
  for (const rule of sorted) {
    if (rule.upToCombo === null || combo <= rule.upToCombo) {
      return rule;
    }
  }
  return sorted[sorted.length - 1]!;
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

  // Combo System
  comboCount: number;
  comboPct: number;
  comboPauseRemaining: number;
  comboRules: ComboRule[];

  // Real-Time Selection State
  selectedTiles: TileCoord[];
  selectedSum: number;
  diagonalSum: number;
  isSquareSelection: boolean;
  activeSelectionType: 'box' | 'diagonal' | null;

  // Actions
  tick: (deltaSeconds: number) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  addTime: (seconds: number) => void;
  registerMatch: (clearedTileCount: number, spanTileCount?: number) => void;
  setHighlightedTiles: (tiles: TileCoord[] | ((prev: TileCoord[]) => TileCoord[])) => void;
  removeClearedTiles: (clearedTiles: TileCoord[]) => void;
  validateActiveHints: () => void;
  triggerHint: () => boolean;
  setSelection: (selection: {
    selectedTiles: TileCoord[];
    selectedSum: number;
    diagonalSum?: number;
    isSquareSelection?: boolean;
    activeSelectionType?: 'box' | 'diagonal' | null;
  }) => void;
  clearSelection: () => void;

  // Tuning Setters
  setMaxCountdown: (val: number) => void;
  setMaxFreeHints: (val: number) => void;
  setFreeHintInterval: (val: number) => void;
  setBaseSecondsPerTile: (val: number) => void;
  setRetryAllowed: (val: boolean) => void;
  setComboRules: (rules: ComboRule[]) => void;

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

  // Combo System Initial State
  comboCount: 0,
  comboPct: 0,
  comboPauseRemaining: 0,
  comboRules: [...DEFAULT_COMBO_RULES],

  // Real-Time Selection Initial State
  selectedTiles: [],
  selectedSum: 0,
  diagonalSum: 0,
  isSquareSelection: false,
  activeSelectionType: null,

  setSelection: (selection) => {
    set({
      selectedTiles: selection.selectedTiles,
      selectedSum: selection.selectedSum,
      diagonalSum: selection.diagonalSum ?? 0,
      isSquareSelection: selection.isSquareSelection ?? false,
      activeSelectionType: selection.activeSelectionType ?? null,
    });
  },

  clearSelection: () => {
    set({
      selectedTiles: [],
      selectedSum: 0,
      diagonalSum: 0,
      isSquareSelection: false,
      activeSelectionType: null,
    });
  },

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

  registerMatch: (clearedTileCount: number, spanTileCount?: number) => {
    const state = get();
    const newComboCount = state.comboCount + 1;
    const rule = getMatchingComboRule(state.comboRules, newComboCount);

    // 1. Evaluate comboDuration (c)
    const evaluatedComboDuration = Math.max(
      0.1,
      evaluateFormula(rule.comboDuration, { x: newComboCount, c: 0 }, 4)
    );

    // 2. Evaluate addTimeValue
    const evaluatedAddTime = Math.max(
      0,
      evaluateFormula(rule.addTimeValue, { x: newComboCount, c: evaluatedComboDuration }, 0)
    );

    // 3. Evaluate scoreMultiplier
    const evaluatedMultiplier = Math.max(
      0,
      evaluateFormula(rule.scoreMultiplier, { x: newComboCount, c: evaluatedComboDuration }, 1)
    );

    // 4. Timer flow state
    let nextComboPauseRemaining = 0;
    if (rule.timerFlowMode === 'pause') {
      nextComboPauseRemaining = Math.max(
        0,
        evaluateFormula(
          rule.pauseDuration,
          { x: newComboCount, c: evaluatedComboDuration },
          evaluatedComboDuration
        )
      );
    }

    // Award base points with evaluated score multiplier
    const basePoints = spanTileCount ?? clearedTileCount;
    const points = Math.round(basePoints * evaluatedMultiplier);

    // In Phase 1, award time based strictly on actual cleared tiles + evaluated addTime
    let nextCountdown = state.countdown;
    let nextDepleted = state.isDepleted;
    if (!state.isPhase1Over) {
      const addedTime = clearedTileCount * state.baseSecondsPerTile + evaluatedAddTime;
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
      comboCount: newComboCount,
      comboPct: 100,
      comboPauseRemaining: nextComboPauseRemaining,
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
    let nextComboPauseRemaining = state.comboPauseRemaining;

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

    const currentRule =
      state.comboCount > 0 ? getMatchingComboRule(state.comboRules, state.comboCount) : null;
    const isTimerPausedByCombo =
      state.comboCount > 0 &&
      (nextComboPauseRemaining > 0 ||
        (currentRule?.timerFlowMode === 'pause' && currentRule.pauseDuration === 'c'));

    if (nextComboPauseRemaining > 0) {
      nextComboPauseRemaining = Math.max(0, nextComboPauseRemaining - deltaSeconds);
    }

    // 1. Survival Timer Countdown (if not depleted)
    if (!state.isDepleted) {
      if (!isTimerPausedByCombo) {
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
      if (!isTimerPausedByCombo) {
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

    // 3. Combo Drain (runs whenever comboCount > 0)
    if (state.comboCount > 0) {
      const rule = currentRule ?? getMatchingComboRule(state.comboRules, state.comboCount);
      const evaluatedDuration = Math.max(
        0.1,
        evaluateFormula(rule.comboDuration, { x: state.comboCount, c: 0 }, 4)
      );
      const drainRate = 100 / evaluatedDuration;
      nextComboPct = state.comboPct - drainRate * deltaSeconds;

      if (nextComboPct <= 0) {
        nextComboCount = 0;
        nextComboPct = 0;
        nextComboPauseRemaining = 0;
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
      comboPauseRemaining: nextComboPauseRemaining,
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

  setComboRules: (rules) => {
    set({ comboRules: rules });
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
      comboCount: 0,
      comboPct: 0,
      comboPauseRemaining: 0,
      selectedTiles: [],
      selectedSum: 0,
      diagonalSum: 0,
      isSquareSelection: false,
      activeSelectionType: null,
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
