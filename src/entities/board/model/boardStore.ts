import { create } from 'zustand';
import { generateSeed } from '@/shared/lib/prng';
import { DEFAULT_CONFIG } from '@/shared/config';
import { createBoardMatrix } from './boardGenerators';
import type { TileCoord, ClearingAnimation } from './types';

export interface BoardState {
  cols: number;
  rows: number;
  shapeSize: number;
  tileBorder: number;
  textSize: number;
  minNum: number;
  maxNum: number;
  seed: string;
  seedHistory: string[];
  initialMatrix: number[][];
  matrix: number[][];
  clearingAnimations: ClearingAnimation[];
  tileWeights?: number[];
  activeTilt?: number;

  // Actions
  setDimensions: (cols: number, rows: number) => void;
  setTileWeights: (weights?: number[], activeTilt?: number) => void;
  setShapeSize: (shapeSize: number) => void;
  setTileBorder: (tileBorder: number) => void;
  setTextSize: (textSize: number) => void;
  setMinNum: (minNum: number) => void;
  setMaxNum: (maxNum: number) => void;
  setSeed: (seed: string) => void;
  generateNewBoard: (forcedSeed?: string) => void;
  restartCurrentBoard: () => void;
  setMatrix: (matrix: number[][]) => void;
  clearTiles: (tiles: TileCoord[]) => number;
  addClearingAnimation: (anim: ClearingAnimation) => void;
  removeExpiredAnimations: (now: number) => void;
}

const initialSeed = generateSeed();
const initialGeneratedMatrix = createBoardMatrix(
  DEFAULT_CONFIG.cols,
  DEFAULT_CONFIG.rows,
  DEFAULT_CONFIG.minNum,
  DEFAULT_CONFIG.maxNum,
  initialSeed
);

export const useBoardStore = create<BoardState>((set, get) => ({
  cols: DEFAULT_CONFIG.cols,
  rows: DEFAULT_CONFIG.rows,
  shapeSize: DEFAULT_CONFIG.shapeSize,
  tileBorder: DEFAULT_CONFIG.tileBorder,
  textSize: DEFAULT_CONFIG.textSize,
  minNum: DEFAULT_CONFIG.minNum,
  maxNum: DEFAULT_CONFIG.maxNum,
  seed: initialSeed,
  seedHistory: [initialSeed],
  initialMatrix: initialGeneratedMatrix,
  matrix: initialGeneratedMatrix.map((r) => [...r]),
  clearingAnimations: [],
  tileWeights: undefined,
  activeTilt: 0,

  setDimensions: (cols, rows) => {
    const { minNum, maxNum, seed, tileWeights } = get();
    const initialMatrix = createBoardMatrix(cols, rows, minNum, maxNum, seed, tileWeights);
    set({
      cols,
      rows,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      clearingAnimations: [],
    });
  },

  setTileWeights: (tileWeights, activeTilt) => {
    const { cols, rows, minNum, maxNum, seed } = get();
    const initialMatrix = createBoardMatrix(cols, rows, minNum, maxNum, seed, tileWeights);
    set({
      tileWeights,
      activeTilt: activeTilt !== undefined ? activeTilt : get().activeTilt,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      clearingAnimations: [],
    });
  },

  setShapeSize: (shapeSize) => set({ shapeSize }),
  setTileBorder: (tileBorder) => set({ tileBorder }),
  setTextSize: (textSize) => set({ textSize }),

  setMinNum: (minNum) => {
    set({ minNum });
    get().generateNewBoard();
  },

  setMaxNum: (maxNum) => {
    set({ maxNum });
    get().generateNewBoard();
  },

  setSeed: (seed) => {
    const { cols, rows, minNum, maxNum, seedHistory, tileWeights } = get();
    const initialMatrix = createBoardMatrix(cols, rows, minNum, maxNum, seed, tileWeights);
    const updatedHistory = seedHistory.includes(seed)
      ? seedHistory
      : [seed, ...seedHistory].slice(0, 50);
    set({
      seed,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      seedHistory: updatedHistory,
      clearingAnimations: [],
    });
  },

  generateNewBoard: (forcedSeed) => {
    const { cols, rows, minNum, maxNum, seedHistory, tileWeights } = get();
    const newSeed = forcedSeed || generateSeed();
    const initialMatrix = createBoardMatrix(cols, rows, minNum, maxNum, newSeed, tileWeights);
    const updatedHistory = seedHistory.includes(newSeed)
      ? seedHistory
      : [newSeed, ...seedHistory].slice(0, 50);
    set({
      seed: newSeed,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      seedHistory: updatedHistory,
      clearingAnimations: [],
    });
  },

  restartCurrentBoard: () => {
    const { initialMatrix } = get();
    set({
      matrix: initialMatrix.map((r) => [...r]),
      clearingAnimations: [],
    });
  },

  setMatrix: (matrix) => {
    const rows = matrix.length;
    const cols = rows > 0 ? (matrix[0]?.length ?? 0) : 0;
    set({
      initialMatrix: matrix.map((r) => [...r]),
      matrix: matrix.map((r) => [...r]),
      rows,
      cols,
    });
  },

  clearTiles: (tiles) => {
    const currentMatrix = get().matrix;
    const newMatrix = currentMatrix.map((row) => [...row]);
    let clearedCount = 0;

    tiles.forEach(({ col, row }) => {
      const rowArr = newMatrix[row];
      if (rowArr && (rowArr[col] ?? 0) > 0) {
        rowArr[col] = 0;
        clearedCount++;
      }
    });

    set({ matrix: newMatrix });
    return clearedCount;
  },

  addClearingAnimation: (anim) => {
    set((state) => ({
      clearingAnimations: [...state.clearingAnimations, anim],
    }));
  },

  removeExpiredAnimations: (now) => {
    set((state) => ({
      clearingAnimations: state.clearingAnimations.filter(
        (anim) => now - anim.startTime < anim.duration
      ),
    }));
  },
}));
