import { create } from 'zustand';
import { generateSeed, seededRandomGenerator } from '@/shared/lib/prng';
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
  prng: () => number;
  initialMatrix: number[][];
  matrix: number[][];
  panOffset: { x: number; y: number };
  clearingAnimations: ClearingAnimation[];
  tileWeights?: number[];
  activeTilt?: number;

  // Actions
  setPanOffset: (
    offset:
      | { x: number; y: number }
      | ((prev: { x: number; y: number }) => { x: number; y: number })
  ) => void;
  resetPanOffset: () => void;
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
  setTileValue: (col: number, row: number, val: number) => void;
  addClearingAnimation: (anim: ClearingAnimation) => void;
  removeExpiredAnimations: (now: number) => void;
}

const initialSeed = generateSeed();
const initialPrng = seededRandomGenerator(initialSeed);
const initialGeneratedMatrix = createBoardMatrix(
  DEFAULT_CONFIG.cols,
  DEFAULT_CONFIG.rows,
  DEFAULT_CONFIG.minNum,
  DEFAULT_CONFIG.maxNum,
  initialPrng
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
  prng: initialPrng,
  initialMatrix: initialGeneratedMatrix,
  matrix: initialGeneratedMatrix.map((r) => [...r]),
  panOffset: { x: 0, y: 0 },
  clearingAnimations: [],
  tileWeights: undefined,
  activeTilt: 0,

  setPanOffset: (offset) => {
    set((state) => ({
      panOffset: typeof offset === 'function' ? offset(state.panOffset) : offset,
    }));
  },

  resetPanOffset: () => set({ panOffset: { x: 0, y: 0 } }),

  setDimensions: (cols, rows) => {
    const { minNum, maxNum, seed, tileWeights } = get();
    const prng = seededRandomGenerator(seed);
    const initialMatrix = createBoardMatrix(cols, rows, minNum, maxNum, prng, tileWeights);
    set({
      cols,
      rows,
      prng,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
    });
  },

  setTileWeights: (tileWeights, activeTilt) => {
    const { cols, rows, minNum, maxNum, seed } = get();
    const prng = seededRandomGenerator(seed);
    const initialMatrix = createBoardMatrix(cols, rows, minNum, maxNum, prng, tileWeights);
    set({
      tileWeights,
      activeTilt: activeTilt !== undefined ? activeTilt : get().activeTilt,
      prng,
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
    const prng = seededRandomGenerator(seed);
    const initialMatrix = createBoardMatrix(cols, rows, minNum, maxNum, prng, tileWeights);
    const updatedHistory = seedHistory.includes(seed)
      ? seedHistory
      : [seed, ...seedHistory].slice(0, 50);
    set({
      seed,
      prng,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      seedHistory: updatedHistory,
      clearingAnimations: [],
    });
  },

  generateNewBoard: (forcedSeed) => {
    const { cols, rows, minNum, maxNum, seedHistory, tileWeights } = get();
    const newSeed = forcedSeed || generateSeed();
    const prng = seededRandomGenerator(newSeed);
    const initialMatrix = createBoardMatrix(cols, rows, minNum, maxNum, prng, tileWeights);
    const updatedHistory = seedHistory.includes(newSeed)
      ? seedHistory
      : [newSeed, ...seedHistory].slice(0, 50);
    set({
      seed: newSeed,
      prng,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      seedHistory: updatedHistory,
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
    });
  },

  restartCurrentBoard: () => {
    const { initialMatrix, cols, rows, minNum, maxNum, seed, tileWeights } = get();
    const prng = seededRandomGenerator(seed);
    // Advance PRNG through initial board creation to restore stream position
    createBoardMatrix(cols, rows, minNum, maxNum, prng, tileWeights);
    set({
      prng,
      matrix: initialMatrix.map((r) => [...r]),
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
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

  setTileValue: (col, row, val) => {
    const currentMatrix = get().matrix;
    if (!currentMatrix[row] || currentMatrix[row][col] === undefined) return;
    const newMatrix = currentMatrix.map((r, rIdx) =>
      rIdx === row ? r.map((c, cIdx) => (cIdx === col ? val : c)) : [...r]
    );
    set({ matrix: newMatrix });
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
