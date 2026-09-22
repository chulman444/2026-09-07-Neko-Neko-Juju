import { create } from 'zustand';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { isHintComboValid } from '../lib/hintMath';
import type { BoardHintsState } from './types';

let clearableHintsResolver: (() => TileCoord[][]) | null = null;

export const setClearableHintsResolver = (resolver: (() => TileCoord[][]) | null) => {
  clearableHintsResolver = resolver;
};

export const getResolvedClearableHints = (): TileCoord[][] => {
  if (!clearableHintsResolver) return [];
  return clearableHintsResolver();
};

export const useBoardHintsStore = create<BoardHintsState>((set, get) => ({
  activeHintCombos: [],
  highlightedTiles: [],
  noHintsAvailableMsg: null,

  setHighlightedTiles: (tiles) => {
    set((state) => {
      const nextTiles = typeof tiles === 'function' ? tiles(state.highlightedTiles) : tiles;

      if (nextTiles.length === 0 && state.activeHintCombos.length > 0) {
        const allCoords: TileCoord[] = [];
        state.activeHintCombos.forEach((c) => {
          c.forEach((coord) => {
            if (!allCoords.some((m) => m.row === coord.row && m.col === coord.col)) {
              allCoords.push(coord);
            }
          });
        });
        return {
          highlightedTiles: allCoords,
        };
      }

      return {
        highlightedTiles: nextTiles,
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
    } else {
      set({ noHintsAvailableMsg: 'No more hints available.' });
    }
  },

  resetBoardHints: () => {
    set({
      activeHintCombos: [],
      highlightedTiles: [],
      noHintsAvailableMsg: null,
    });
  },
}));

let lastMatrix = useBoardStore.getState().matrix;
useBoardStore.subscribe((state) => {
  if (state.matrix !== lastMatrix) {
    lastMatrix = state.matrix;
    useBoardHintsStore.getState().validateActiveHints();
  }
});
