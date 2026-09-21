import { create } from 'zustand';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { isHintComboValid } from '../lib/hintMath';
import type { HintState } from './types';

let clearableHintsResolver: (() => TileCoord[][]) | null = null;

export const setClearableHintsResolver = (resolver: (() => TileCoord[][]) | null) => {
  clearableHintsResolver = resolver;
};

export const getResolvedClearableHints = (): TileCoord[][] => {
  if (!clearableHintsResolver) return [];
  return clearableHintsResolver();
};

export const useHintStore = create<HintState>((set, get) => ({
  maxFreeHints: 3,
  freeHintInterval: 4,
  hintsRemaining: 3,
  hintCountdown: 4,
  hintPhaseStarted: false,
  isPhase1Over: false,
  activeHintCombos: [],
  highlightedTiles: [],
  noHintsAvailableMsg: null,

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

  setHighlightedTiles: (tiles) => {
    set((state) => {
      const nextTiles = typeof tiles === 'function' ? tiles(state.highlightedTiles) : tiles;
      return {
        highlightedTiles: nextTiles,
        activeHintCombos: nextTiles.length === 0 ? [] : state.activeHintCombos,
      };
    });
  },

  setNoHintsAvailableMsg: (msg: string | null) => {
    set({ noHintsAvailableMsg: msg });
  },

  triggerHint: (explicitCombos?: TileCoord[][]) => {
    const activeClearables = explicitCombos ?? getResolvedClearableHints();

    if (activeClearables.length === 0) {
      set({
        noHintsAvailableMsg: 'No more hints available.',
      });
      return false;
    }

    set((state) => {
      // Find clearable combinations whose tiles are not yet fully highlighted
      const unhighlightedCombos = activeClearables.filter((combo) =>
        combo.some(
          (req) => !state.highlightedTiles.some((p) => p.row === req.row && p.col === req.col)
        )
      );

      const candidates = unhighlightedCombos.length > 0 ? unhighlightedCombos : activeClearables;
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const targetCombo = candidates[randomIndex];
      if (!targetCombo) return state;

      const nextCombos = [...state.activeHintCombos, targetCombo];
      const merged = [...state.highlightedTiles];
      targetCombo.forEach((coord) => {
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

  removeClearedTiles: (clearedTiles: TileCoord[]) => {
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

    // Re-evaluate clearable hints message after clearing tiles
    const clearables = getResolvedClearableHints();
    if (clearables.length > 0) {
      if (get().noHintsAvailableMsg) {
        set({ noHintsAvailableMsg: null });
      }
    } else if (!get().isPhase1Over) {
      set({ noHintsAvailableMsg: 'No more hints available.' });
    }
  },

  tick: (deltaSeconds: number, isSurvivalDepleted: boolean, isTimerPaused = false) => {
    const state = get();
    if (deltaSeconds <= 0) return;

    let nextHintsRemaining = state.hintsRemaining;
    let nextHintCountdown = state.hintCountdown;
    let nextHintPhaseStarted = state.hintPhaseStarted;
    let nextIsPhase1Over = state.isPhase1Over;

    const clearableHints = getResolvedClearableHints();
    const hasClearableHints = clearableHints.length > 0;

    if (!hasClearableHints) {
      if (!nextIsPhase1Over && state.noHintsAvailableMsg !== 'No more hints available.') {
        set({ noHintsAvailableMsg: 'No more hints available.' });
      }
      return;
    }

    if (state.noHintsAvailableMsg) {
      set({ noHintsAvailableMsg: null });
    }

    // 1. Transition frame into Hint Phase: Survival timer depleted, Hint #1 triggers atomically
    if (isSurvivalDepleted && !nextHintPhaseStarted && !nextIsPhase1Over) {
      if (nextHintsRemaining > 0) {
        nextHintPhaseStarted = true;
        nextHintsRemaining = nextHintsRemaining - 1;
        nextHintCountdown = state.freeHintInterval;
        get().triggerHint();

        if (nextHintsRemaining <= 0) {
          nextIsPhase1Over = true;
          nextHintCountdown = 0;
        }
      }
    } else if (!nextIsPhase1Over && nextHintPhaseStarted && nextHintsRemaining > 0) {
      // 2. Subsequent hint countdowns (Hint #2, Hint #3, etc.)
      if (!isTimerPaused) {
        nextHintCountdown = state.hintCountdown - deltaSeconds;

        if (nextHintCountdown <= 0) {
          const triggered = get().triggerHint();
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
      activeHintCombos: [],
      highlightedTiles: [],
      noHintsAvailableMsg: null,
    }));
  },
}));

let lastMatrix = useBoardStore.getState().matrix;
useBoardStore.subscribe((state) => {
  if (state.matrix !== lastMatrix) {
    lastMatrix = state.matrix;
    useHintStore.getState().validateActiveHints();
  }
});
