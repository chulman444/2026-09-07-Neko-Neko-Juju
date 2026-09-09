import { create } from 'zustand';
import type { SolverCombination, DependencyCell, SolverTileCoord, SolverListType } from './types';
import { runSolverEngine, cascadeClearTiles } from './solverEngine';

export interface SolverState {
  combinations: SolverCombination[];
  dependencyGraph: DependencyCell[][];
  pages: Record<SolverListType, number>;
  pageSizes: Record<SolverListType, number>;
  isCalculated: boolean;

  // Actions
  recalculate: (board: number[][]) => void;
  cascadeTiles: (clearedTiles: SolverTileCoord[]) => void;
  setPage: (type: SolverListType, page: number) => void;
  changePage: (type: SolverListType, delta: number) => void;
  setPageSize: (type: SolverListType, size: number) => void;
  reset: () => void;
}

export const useSolverStore = create<SolverState>((set, get) => ({
  combinations: [],
  dependencyGraph: [],
  pages: { clearable: 1, blocked: 1 },
  pageSizes: { clearable: 50, blocked: 50 },
  isCalculated: false,

  recalculate: (board: number[][]) => {
    const { combinations, dependencyGraph } = runSolverEngine(board);
    set({
      combinations,
      dependencyGraph,
      pages: { clearable: 1, blocked: 1 },
      isCalculated: true,
    });
  },

  cascadeTiles: (clearedTiles: SolverTileCoord[]) => {
    const { combinations, dependencyGraph } = get();
    if (combinations.length === 0) return;
    const remaining = cascadeClearTiles(clearedTiles, combinations, dependencyGraph);
    set({ combinations: remaining });
  },

  setPage: (type: SolverListType, page: number) => {
    set((state) => ({
      pages: {
        ...state.pages,
        [type]: Math.max(1, page),
      },
    }));
  },

  changePage: (type: SolverListType, delta: number) => {
    const state = get();
    const current = state.pages[type];
    const size = state.pageSizes[type];
    const total =
      type === 'clearable'
        ? state.combinations.filter((c) => c.isActive && c.blockers.length === 0).length
        : state.combinations.filter((c) => c.isActive && c.blockers.length > 0).length;
    const maxPage = Math.max(1, Math.ceil(total / size));
    const nextPage = Math.min(maxPage, Math.max(1, current + delta));

    set((s) => ({
      pages: {
        ...s.pages,
        [type]: nextPage,
      },
    }));
  },

  setPageSize: (type: SolverListType, size: number) => {
    const clampedSize = Math.max(5, Math.min(1000, size));
    set((state) => ({
      pageSizes: {
        ...state.pageSizes,
        [type]: clampedSize,
      },
      pages: {
        ...state.pages,
        [type]: 1,
      },
    }));
  },

  reset: () => {
    set({
      combinations: [],
      dependencyGraph: [],
      pages: { clearable: 1, blocked: 1 },
      isCalculated: false,
    });
  },
}));
