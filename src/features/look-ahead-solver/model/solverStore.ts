import { create } from 'zustand';
import { useBoardStore, createBoardMatrix } from '@/entities/board';
import type {
  SolverCombination,
  DependencyCell,
  SolverTileCoord,
  SolverListType,
  HintAlgorithmMode,
} from './types';
import {
  runSolverEngine,
  buildDependencyGraph,
  cascadeClearTiles,
  findClearableCombinationsOnly,
} from './solverEngine';

export interface SolverState {
  hintMode: HintAlgorithmMode;
  combinations: SolverCombination[];
  dependencyGraph: DependencyCell[][];
  pages: Record<SolverListType, number>;
  pageSizes: Record<SolverListType, number>;
  isCalculated: boolean;

  // Actions
  setHintMode: (mode: HintAlgorithmMode) => void;
  recalculate: (board: number[][], seed?: string) => void;
  cascadeTiles: (clearedTiles: SolverTileCoord[], currentBoard?: number[][]) => void;
  setPage: (type: SolverListType, page: number) => void;
  changePage: (type: SolverListType, delta: number) => void;
  setPageSize: (type: SolverListType, size: number) => void;
  reset: () => void;
}

interface SeedBaselineCache {
  seed: string;
  combinations: SolverCombination[];
  dependencyGraph: DependencyCell[][];
}

let seedCache: SeedBaselineCache | null = null;

function cloneCombinations(combos: SolverCombination[]): SolverCombination[] {
  return combos.map((c) => ({
    id: c.id,
    family: c.family,
    shape: c.shape,
    required: c.required.map((t) => ({ row: t.row, col: t.col })),
    blockers: c.blockers.map((t) => ({ row: t.row, col: t.col })),
    isActive: c.isActive,
  }));
}

function cloneDependencyGraph(graph: DependencyCell[][]): DependencyCell[][] {
  return graph.map((row) =>
    row.map((cell) => ({
      requiredIn: [...cell.requiredIn],
      blockedIn: [...cell.blockedIn],
    }))
  );
}

export const useSolverStore = create<SolverState>((set, get) => ({
  hintMode: 'default',
  combinations: [],
  dependencyGraph: [],
  pages: { clearable: 1, blocked: 1 },
  pageSizes: { clearable: 50, blocked: 50 },
  isCalculated: false,

  setHintMode: (mode: HintAlgorithmMode) => {
    if (get().hintMode === mode) return;
    set({ hintMode: mode });
    const currentMatrix = useBoardStore.getState().matrix;
    const currentSeed = useBoardStore.getState().seed;
    get().recalculate(currentMatrix, currentSeed);
  },

  recalculate: (board: number[][], seed?: string) => {
    const currentSeed = seed ?? useBoardStore.getState().seed;

    // Invalidate cache if seed changed
    if (seedCache && seedCache.seed !== currentSeed) {
      seedCache = null;
    }

    const { hintMode } = get();

    if (hintMode === 'default') {
      const clearable = findClearableCombinationsOnly(board);
      const rows = board.length;
      const cols = rows > 0 ? (board[0]?.length ?? 0) : 0;
      const dependencyGraph = buildDependencyGraph(rows, cols, clearable);

      set({
        combinations: clearable,
        dependencyGraph,
        pages: { clearable: 1, blocked: 1 },
        isCalculated: true,
      });
      return;
    }

    // All Combinations Mode
    const boardStore = useBoardStore.getState();
    const rows = boardStore.rows;
    const cols = boardStore.cols;

    // Populate baseline cache on pristine seed board if missing or seed changed
    if (!seedCache || seedCache.seed !== currentSeed) {
      const initialBoard = createBoardMatrix(
        cols,
        rows,
        boardStore.minNum,
        boardStore.maxNum,
        currentSeed
      );
      const { combinations, dependencyGraph } = runSolverEngine(initialBoard);
      seedCache = {
        seed: currentSeed,
        combinations,
        dependencyGraph,
      };
    }

    // Clone cached baseline
    const workingCombos = cloneCombinations(seedCache.combinations);
    const workingGraph = cloneDependencyGraph(seedCache.dependencyGraph);

    // Identify already-cleared tiles by comparing pristine initial board with current board
    const initialBoard = createBoardMatrix(
      cols,
      rows,
      boardStore.minNum,
      boardStore.maxNum,
      currentSeed
    );
    const clearedTiles: SolverTileCoord[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((initialBoard[r]?.[c] ?? 0) > 0 && (board[r]?.[c] ?? 0) === 0) {
          clearedTiles.push({ row: r, col: c });
        }
      }
    }

    const remaining =
      clearedTiles.length > 0
        ? cascadeClearTiles(clearedTiles, workingCombos, workingGraph)
        : workingCombos;

    set({
      combinations: remaining,
      dependencyGraph: workingGraph,
      pages: { clearable: 1, blocked: 1 },
      isCalculated: true,
    });
  },

  cascadeTiles: (clearedTiles: SolverTileCoord[], currentBoard?: number[][]) => {
    const { hintMode } = get();

    if (hintMode === 'default') {
      const matrix = currentBoard ?? useBoardStore.getState().matrix;
      const clearable = findClearableCombinationsOnly(matrix);
      const rows = matrix.length;
      const cols = rows > 0 ? (matrix[0]?.length ?? 0) : 0;
      const dependencyGraph = buildDependencyGraph(rows, cols, clearable);
      set({ combinations: clearable, dependencyGraph });
      return;
    }

    // All Combinations Mode: perform O(1) cascade on current combinations
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
