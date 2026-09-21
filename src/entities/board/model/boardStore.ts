import { create } from 'zustand';
import { generateSeed, seededRandomGenerator } from '@/shared/lib/prng';
import { DEFAULT_CONFIG } from '@/shared/config';
import { createBoardMatrix, createBoardWithStacks } from './boardGenerators';
import type { TileCoord, ClearingAnimation } from './types';
import {
  rotateCW,
  rotateCCW,
  transpose,
  antiTranspose,
  invertTransform,
  nextOrientationCW,
  nextOrientationCCW,
  nextOrientationTranspose,
  nextOrientationAntiTranspose,
  DEFAULT_ORIENTATION_OFFSET,
  type OrientationOffset,
} from '../lib/matrixTransforms';

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
  initialStacks: Record<string, number[]>;
  stacks: Record<string, number[]>;
  panOffset: { x: number; y: number };
  isPanMode: boolean;
  orientationOffset: OrientationOffset;
  clearingAnimations: ClearingAnimation[];
  tileWeights?: number[];
  activeTilt?: number;

  // Actions
  applyRotationCW: () => void;
  applyRotationCCW: () => void;
  applyTranspose: () => void;
  applyAntiTranspose: () => void;
  revertOrientation: () => void;
  setPanOffset: (
    offset:
      { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })
  ) => void;
  resetPanOffset: () => void;
  setIsPanMode: (isPanMode: boolean | ((prev: boolean) => boolean)) => void;
  togglePanMode: () => void;
  setDimensions: (cols: number, rows: number, stackedTilesCount?: number) => void;
  setTileWeights: (weights?: number[], activeTilt?: number) => void;
  setShapeSize: (shapeSize: number) => void;
  setTileBorder: (tileBorder: number) => void;
  setTextSize: (textSize: number) => void;
  setMinNum: (minNum: number) => void;
  setMaxNum: (maxNum: number) => void;
  setSeed: (seed: string) => void;
  generateNewBoard: (forcedSeed?: string, stackedTilesCount?: number) => void;
  restartCurrentBoard: () => void;
  setMatrix: (matrix: number[][], stacks?: Record<string, number[]>) => void;
  setStacks: (stacks: Record<string, number[]>) => void;
  clearTiles: (tiles: TileCoord[]) => number;
  setTileValue: (col: number, row: number, val: number) => void;
  shakeBoard: () => number[][];
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
  initialStacks: {},
  stacks: {},
  panOffset: { x: 0, y: 0 },
  isPanMode: false,
  orientationOffset: DEFAULT_ORIENTATION_OFFSET,
  clearingAnimations: [],
  tileWeights: undefined,
  activeTilt: 0,

  applyRotationCW: () => {
    const { matrix, initialMatrix, stacks, initialStacks, rows, orientationOffset } = get();
    if (!matrix.length) return;
    const newMatrix = rotateCW(matrix);
    const newInitialMatrix = rotateCW(initialMatrix);
    const transform = (c: number, r: number) => ({ c: rows - 1 - r, r: c });
    const rotate = (st: Record<string, number[]>) => {
      const res: Record<string, number[]> = {};
      for (const [key, val] of Object.entries(st)) {
        const [c, r] = key.split(',').map(Number);
        const t = transform(c, r);
        res[`${t.c},${t.r}`] = [...val];
      }
      return res;
    };

    set({
      rows: newMatrix.length,
      cols: newMatrix[0]?.length ?? 0,
      matrix: newMatrix,
      initialMatrix: newInitialMatrix,
      stacks: rotate(stacks),
      initialStacks: rotate(initialStacks),
      orientationOffset: nextOrientationCW(orientationOffset),
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
    });
  },

  applyRotationCCW: () => {
    const { matrix, initialMatrix, stacks, initialStacks, cols, orientationOffset } = get();
    if (!matrix.length) return;
    const newMatrix = rotateCCW(matrix);
    const newInitialMatrix = rotateCCW(initialMatrix);
    const transform = (c: number, r: number) => ({ c: r, r: cols - 1 - c });
    const rotate = (st: Record<string, number[]>) => {
      const res: Record<string, number[]> = {};
      for (const [key, val] of Object.entries(st)) {
        const [c, r] = key.split(',').map(Number);
        const t = transform(c, r);
        res[`${t.c},${t.r}`] = [...val];
      }
      return res;
    };

    set({
      rows: newMatrix.length,
      cols: newMatrix[0]?.length ?? 0,
      matrix: newMatrix,
      initialMatrix: newInitialMatrix,
      stacks: rotate(stacks),
      initialStacks: rotate(initialStacks),
      orientationOffset: nextOrientationCCW(orientationOffset),
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
    });
  },

  applyTranspose: () => {
    const { matrix, initialMatrix, stacks, initialStacks, orientationOffset } = get();
    if (!matrix.length) return;
    const newMatrix = transpose(matrix);
    const newInitialMatrix = transpose(initialMatrix);
    const rotate = (st: Record<string, number[]>) => {
      const res: Record<string, number[]> = {};
      for (const [key, val] of Object.entries(st)) {
        const [c, r] = key.split(',').map(Number);
        res[`${r},${c}`] = [...val];
      }
      return res;
    };

    set({
      rows: newMatrix.length,
      cols: newMatrix[0]?.length ?? 0,
      matrix: newMatrix,
      initialMatrix: newInitialMatrix,
      stacks: rotate(stacks),
      initialStacks: rotate(initialStacks),
      orientationOffset: nextOrientationTranspose(orientationOffset),
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
    });
  },

  applyAntiTranspose: () => {
    const { matrix, initialMatrix, stacks, initialStacks, rows, cols, orientationOffset } = get();
    if (!matrix.length) return;
    const newMatrix = antiTranspose(matrix);
    const newInitialMatrix = antiTranspose(initialMatrix);
    const transform = (c: number, r: number) => ({ c: rows - 1 - r, r: cols - 1 - c });
    const rotate = (st: Record<string, number[]>) => {
      const res: Record<string, number[]> = {};
      for (const [key, val] of Object.entries(st)) {
        const [c, r] = key.split(',').map(Number);
        const t = transform(c, r);
        res[`${t.c},${t.r}`] = [...val];
      }
      return res;
    };

    set({
      rows: newMatrix.length,
      cols: newMatrix[0]?.length ?? 0,
      matrix: newMatrix,
      initialMatrix: newInitialMatrix,
      stacks: rotate(stacks),
      initialStacks: rotate(initialStacks),
      orientationOffset: nextOrientationAntiTranspose(orientationOffset),
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
    });
  },

  revertOrientation: () => {
    const { matrix, initialMatrix, initialStacks, orientationOffset } = get();
    if (!matrix.length) return;
    if (orientationOffset.rot === 0 && !orientationOffset.flip) return;

    const newMatrix = invertTransform(matrix, orientationOffset);
    const newInitialMatrix = invertTransform(initialMatrix, orientationOffset);
    set({
      rows: newMatrix.length,
      cols: newMatrix[0]?.length ?? 0,
      matrix: newMatrix,
      initialMatrix: newInitialMatrix,
      stacks: Object.fromEntries(Object.entries(initialStacks).map(([k, v]) => [k, [...v]])),
      orientationOffset: DEFAULT_ORIENTATION_OFFSET,
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
    });
  },

  setPanOffset: (offset) => {
    set((state) => ({
      panOffset: typeof offset === 'function' ? offset(state.panOffset) : offset,
    }));
  },

  resetPanOffset: () => set({ panOffset: { x: 0, y: 0 } }),

  setIsPanMode: (isPanMode) => {
    set((state) => ({
      isPanMode: typeof isPanMode === 'function' ? isPanMode(state.isPanMode) : isPanMode,
    }));
  },

  togglePanMode: () => set((state) => ({ isPanMode: !state.isPanMode })),

  setDimensions: (cols, rows, stackedTilesCount = 0) => {
    const { minNum, maxNum, seed, tileWeights } = get();
    const prng = seededRandomGenerator(seed);
    const { matrix: initialMatrix, stacks: initialStacks } = createBoardWithStacks(
      cols,
      rows,
      minNum,
      maxNum,
      prng,
      tileWeights,
      stackedTilesCount
    );
    set({
      cols,
      rows,
      orientationOffset: DEFAULT_ORIENTATION_OFFSET,
      prng,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      stacks: Object.fromEntries(Object.entries(initialStacks).map(([k, v]) => [k, [...v]])),
      initialStacks: Object.fromEntries(Object.entries(initialStacks).map(([k, v]) => [k, [...v]])),
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
      orientationOffset: DEFAULT_ORIENTATION_OFFSET,
      prng,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      stacks: {},
      initialStacks: {},
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
      orientationOffset: DEFAULT_ORIENTATION_OFFSET,
      prng,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      stacks: {},
      initialStacks: {},
      seedHistory: updatedHistory,
      clearingAnimations: [],
    });
  },

  generateNewBoard: (forcedSeed, stackedTilesCount = 0) => {
    const { cols, rows, minNum, maxNum, seedHistory, tileWeights } = get();
    const newSeed = forcedSeed || generateSeed();
    const prng = seededRandomGenerator(newSeed);
    const { matrix: initialMatrix, stacks: initialStacks } = createBoardWithStacks(
      cols,
      rows,
      minNum,
      maxNum,
      prng,
      tileWeights,
      stackedTilesCount
    );
    const updatedHistory = seedHistory.includes(newSeed)
      ? seedHistory
      : [newSeed, ...seedHistory].slice(0, 50);
    set({
      seed: newSeed,
      orientationOffset: DEFAULT_ORIENTATION_OFFSET,
      prng,
      initialMatrix,
      matrix: initialMatrix.map((r) => [...r]),
      stacks: Object.fromEntries(Object.entries(initialStacks).map(([k, v]) => [k, [...v]])),
      initialStacks: Object.fromEntries(Object.entries(initialStacks).map(([k, v]) => [k, [...v]])),
      seedHistory: updatedHistory,
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
      isPanMode: false,
    });
  },

  restartCurrentBoard: () => {
    const { initialMatrix, initialStacks, cols, rows, minNum, maxNum, seed, tileWeights } = get();
    const prng = seededRandomGenerator(seed);
    // Advance PRNG through initial board creation to restore stream position
    createBoardMatrix(cols, rows, minNum, maxNum, prng, tileWeights);
    set({
      prng,
      orientationOffset: DEFAULT_ORIENTATION_OFFSET,
      matrix: initialMatrix.map((r) => [...r]),
      stacks: Object.fromEntries(Object.entries(initialStacks ?? {}).map(([k, v]) => [k, [...v]])),
      clearingAnimations: [],
      panOffset: { x: 0, y: 0 },
      isPanMode: false,
    });
  },

  setMatrix: (matrix, stacks = {}) => {
    const rows = matrix.length;
    const cols = rows > 0 ? (matrix[0]?.length ?? 0) : 0;
    const copiedStacks = Object.fromEntries(Object.entries(stacks).map(([k, v]) => [k, [...v]]));
    set({
      initialMatrix: matrix.map((r) => [...r]),
      matrix: matrix.map((r) => [...r]),
      initialStacks: copiedStacks,
      stacks: Object.fromEntries(Object.entries(stacks).map(([k, v]) => [k, [...v]])),
      rows,
      cols,
      orientationOffset: DEFAULT_ORIENTATION_OFFSET,
      clearingAnimations: [],
    });
  },

  setStacks: (stacks) => {
    const copiedStacks = Object.fromEntries(Object.entries(stacks).map(([k, v]) => [k, [...v]]));
    set({
      initialStacks: copiedStacks,
      stacks: Object.fromEntries(Object.entries(stacks).map(([k, v]) => [k, [...v]])),
    });
  },

  clearTiles: (tiles) => {
    const currentMatrix = get().matrix;
    const currentStacks = get().stacks;
    const newMatrix = currentMatrix.map((row) => [...row]);
    const newStacks: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(currentStacks)) {
      newStacks[k] = [...v];
    }
    let clearedCount = 0;

    tiles.forEach(({ col, row }) => {
      const rowArr = newMatrix[row];
      if (rowArr && (rowArr[col] ?? 0) > 0) {
        clearedCount++;
        const stackKey = `${col},${row}`;
        const stack = newStacks[stackKey];
        if (stack && stack.length > 0) {
          rowArr[col] = stack.pop()!;
          if (stack.length === 0) {
            delete newStacks[stackKey];
          }
        } else {
          rowArr[col] = 0;
        }
      }
    });

    set({ matrix: newMatrix, stacks: newStacks });
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

  shakeBoard: () => {
    const { matrix, minNum, maxNum, tileWeights } = get();
    const count = maxNum - minNum + 1;
    let normalizedWeights: number[] | null = null;
    if (tileWeights && tileWeights.length === count) {
      const sum = tileWeights.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        normalizedWeights = tileWeights.map((w) => w / sum);
      }
    }

    const newMatrix = matrix.map((row) =>
      row.map((val) => {
        if (val <= 0) return 0;
        if (normalizedWeights) {
          const roll = Math.random();
          let acc = 0;
          let chosen = maxNum;
          for (let i = 0; i < normalizedWeights.length; i++) {
            acc += normalizedWeights[i]!;
            if (roll <= acc || i === normalizedWeights.length - 1) {
              chosen = minNum + i;
              break;
            }
          }
          return chosen;
        }
        return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
      })
    );

    set({ matrix: newMatrix });
    return newMatrix;
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
