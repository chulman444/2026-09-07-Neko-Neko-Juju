import { create } from 'zustand';

export interface AccumulatedBlock {
  originalValue: number;
  sourceBoardIndex: number; // Identifies which risk board this block came from (1-indexed for display)
  originalPosition?: { col: number; row: number }; // Where it was left over on the risk board
}

export type BoardSizeTier = 'small' | 'medium' | 'large' | 'any';
export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'any';

export interface MacroBoardResult {
  phase1Score: number;
  leftoverBlocksCount: number;
}

export interface MacroBoardConfig {
  boardType: 'risk' | 'reward';
  sizeTier: BoardSizeTier;
  difficultyTier: DifficultyTier;
  seed: string;
  result?: MacroBoardResult;
}

export interface MacroLoopState {
  boards: MacroBoardConfig[];
  currentPlayIndex: number;
  editingBoardIndex: number | null;
  totalRiskMeter: number;
  accumulatedSolidBlocks: AccumulatedBlock[];

  // Actions
  startEditing: (index: number) => void;
  saveEditing: (newConfig?: Partial<MacroBoardConfig>) => void;
  cancelEditing: () => void;
  advanceToNextBoard: (
    phase1Score: number,
    leftoverTiles: { col?: number; row?: number; val?: number }[]
  ) => void;
  addBoard: (config?: Partial<MacroBoardConfig>) => void;
  playBoard: (index: number) => void;
  addAccumulatedBlock: (block: AccumulatedBlock) => void;
  removeAccumulatedBlock: (index: number) => void;
  clearAccumulatedBlocks: () => void;
  resetMacroLoop: () => void;
}

export const DEFAULT_MACRO_BOARDS: MacroBoardConfig[] = [
  {
    boardType: 'risk',
    sizeTier: 'small',
    difficultyTier: 'easy',
    seed: 'A1B2',
  },
  {
    boardType: 'risk',
    sizeTier: 'medium',
    difficultyTier: 'medium',
    seed: 'RAND',
  },
  {
    boardType: 'risk',
    sizeTier: 'medium',
    difficultyTier: 'medium',
    seed: 'RAND-3',
  },
  {
    boardType: 'reward',
    sizeTier: 'large',
    difficultyTier: 'hard',
    seed: 'REWARD',
  },
];

export const DEFAULT_MACRO_LOOP_STATE = {
  boards: DEFAULT_MACRO_BOARDS,
  currentPlayIndex: 0,
  editingBoardIndex: null as number | null,
  totalRiskMeter: 0,
  accumulatedSolidBlocks: [] as AccumulatedBlock[],
};

export const useMacroLoopStore = create<MacroLoopState>((set) => ({
  ...DEFAULT_MACRO_LOOP_STATE,

  startEditing: (index) => {
    set((state) => {
      if (index < 0 || index >= state.boards.length) return state;
      return { editingBoardIndex: index };
    });
  },

  saveEditing: (newConfig) => {
    set((state) => {
      if (state.editingBoardIndex === null) return state;
      const targetIndex = state.editingBoardIndex;
      const targetBoard = state.boards[targetIndex];
      if (!targetBoard) return { editingBoardIndex: null };

      const updatedBoards = [...state.boards];
      updatedBoards[targetIndex] = {
        ...targetBoard,
        ...newConfig,
      };

      return {
        boards: updatedBoards,
        editingBoardIndex: null,
      };
    });
  },

  cancelEditing: () => {
    set({ editingBoardIndex: null });
  },

  advanceToNextBoard: (phase1Score, leftoverTiles) => {
    set((state) => {
      const currentIdx = state.currentPlayIndex;
      const currentBoard = state.boards[currentIdx];

      // Convert leftover non-zero tiles into accumulated solid blocks
      const newBlocks: AccumulatedBlock[] = leftoverTiles.map((tile) => ({
        originalValue: tile.val ?? 1,
        sourceBoardIndex: currentIdx + 1,
        originalPosition:
          tile.col !== undefined && tile.row !== undefined
            ? { col: tile.col, row: tile.row }
            : undefined,
      }));

      // Update current board's historical result
      const updatedBoards = [...state.boards];
      if (currentBoard) {
        updatedBoards[currentIdx] = {
          ...currentBoard,
          result: {
            phase1Score,
            leftoverBlocksCount: leftoverTiles.length,
          },
        };
      }

      const nextPlayIndex = Math.min(state.boards.length - 1, currentIdx + 1);

      return {
        totalRiskMeter: state.totalRiskMeter + phase1Score,
        accumulatedSolidBlocks: [...state.accumulatedSolidBlocks, ...newBlocks],
        boards: updatedBoards,
        currentPlayIndex: nextPlayIndex,
      };
    });
  },

  addBoard: (config) => {
    set((state) => {
      const nextIndex = state.boards.length + 1;
      const newBoard: MacroBoardConfig = {
        boardType: config?.boardType ?? 'risk',
        sizeTier: config?.sizeTier ?? 'medium',
        difficultyTier: config?.difficultyTier ?? 'medium',
        seed: config?.seed ?? `SEED-${nextIndex}`,
        ...config,
      };
      return {
        boards: [...state.boards, newBoard],
      };
    });
  },

  playBoard: (index) => {
    set((state) => {
      if (index < 0 || index >= state.boards.length) return state;
      return { currentPlayIndex: index };
    });
  },

  addAccumulatedBlock: (block) => {
    set((state) => ({
      accumulatedSolidBlocks: [...state.accumulatedSolidBlocks, block],
    }));
  },

  removeAccumulatedBlock: (index) => {
    set((state) => ({
      accumulatedSolidBlocks: state.accumulatedSolidBlocks.filter((_, i) => i !== index),
    }));
  },

  clearAccumulatedBlocks: () => {
    set({ accumulatedSolidBlocks: [] });
  },

  resetMacroLoop: () => {
    set({
      boards: DEFAULT_MACRO_BOARDS.map((b) => ({ ...b })),
      currentPlayIndex: 0,
      editingBoardIndex: null,
      totalRiskMeter: 0,
      accumulatedSolidBlocks: [],
    });
  },
}));
