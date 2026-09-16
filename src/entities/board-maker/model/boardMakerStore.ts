import { create } from 'zustand';
import { seededRandomGenerator, generateSeed } from '@/shared/lib/prng';

export interface BoardMakerState {
  cols: number;
  rows: number;
  matrix: number[][];
  stacks: Record<string, number[]>;
  seed: string;
  spaceType: 'space' | 'tab';
  spaceWidth: number;
  dataBox: string;
  selectedBrush: number;
  heatmapMode: boolean;

  // Actions
  setDimensions: (cols: number, rows: number) => void;
  setSeed: (seed: string) => void;
  rerollSeed: () => void;
  setSpaceType: (spaceType: 'space' | 'tab') => void;
  setSpaceWidth: (spaceWidth: number) => void;
  setDataBox: (data: string) => void;
  setSelectedBrush: (val: number) => void;
  toggleHeatmapMode: () => void;

  addTileAt: (col: number, row: number, val?: number) => void;
  removeTileAt: (col: number, row: number) => void;
  setTileValue: (col: number, row: number, val: number) => void;
  cycleTileValue: (col: number, row: number, delta: number) => void;

  generateBlankBoard: (cols?: number, rows?: number) => void;
  fillFromSeed: (
    cols?: number,
    rows?: number,
    seedStr?: string,
    minNum?: number,
    maxNum?: number
  ) => void;
  fillRandomSum10s: (minNum?: number, maxNum?: number) => void;

  setBoard: (matrix: number[][], stacks?: Record<string, number[]>) => void;
}

const createBlankMatrix = (cols: number, rows: number): number[][] => {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
};

export const useBoardMakerStore = create<BoardMakerState>((set, get) => ({
  cols: 17,
  rows: 10,
  matrix: createBlankMatrix(17, 10),
  stacks: {},
  seed: '849201',
  spaceType: 'space',
  spaceWidth: 1,
  dataBox: '',
  selectedBrush: 1,
  heatmapMode: false,

  setDimensions: (cols, rows) => {
    set({ cols, rows });
    get().generateBlankBoard(cols, rows);
  },
  setSeed: (seed) => set({ seed }),
  rerollSeed: () => set({ seed: generateSeed() }),
  setSpaceType: (spaceType) => set({ spaceType }),
  setSpaceWidth: (spaceWidth) => set({ spaceWidth }),
  setDataBox: (dataBox) => set({ dataBox }),
  setSelectedBrush: (selectedBrush) => set({ selectedBrush }),
  toggleHeatmapMode: () => set((state) => ({ heatmapMode: !state.heatmapMode })),

  addTileAt: (col, row, val) => {
    const { matrix, stacks, selectedBrush, cols, rows } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const currentVal = matrix[row]?.[col] ?? 0;
    const tileVal = val !== undefined ? val : selectedBrush;
    const newMatrix = matrix.map((r) => [...r]);
    const newStacks: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(stacks)) {
      newStacks[k] = [...v];
    }

    const key = `${col},${row}`;
    if (currentVal > 0) {
      if (!newStacks[key]) {
        newStacks[key] = [];
      }
      newStacks[key]!.push(currentVal);
    }

    newMatrix[row]![col] = tileVal;
    set({ matrix: newMatrix, stacks: newStacks });
  },

  removeTileAt: (col, row) => {
    const { matrix, stacks, cols, rows } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const key = `${col},${row}`;
    const newMatrix = matrix.map((r) => [...r]);
    const newStacks: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(stacks)) {
      newStacks[k] = [...v];
    }

    const stack = newStacks[key];
    if (stack && stack.length > 0) {
      newMatrix[row]![col] = stack.pop()!;
      if (stack.length === 0) {
        delete newStacks[key];
      }
    } else {
      newMatrix[row]![col] = 0;
    }

    set({ matrix: newMatrix, stacks: newStacks });
  },

  setTileValue: (col, row, val) => {
    const { matrix, cols, rows } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const newMatrix = matrix.map((r, rIdx) =>
      rIdx === row ? r.map((c, cIdx) => (cIdx === col ? val : c)) : [...r]
    );
    set({ matrix: newMatrix });
  },

  cycleTileValue: (col, row, delta) => {
    const { matrix, cols, rows } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const currentVal = matrix[row]?.[col] ?? 0;
    let nextVal: number;
    if (currentVal === 0) {
      nextVal = delta > 0 ? 1 : 9;
    } else {
      nextVal = currentVal + delta;
      if (nextVal > 9) nextVal = 1;
      if (nextVal < 1) nextVal = 9;
    }

    const newMatrix = matrix.map((r, rIdx) =>
      rIdx === row ? r.map((c, cIdx) => (cIdx === col ? nextVal : c)) : [...r]
    );
    set({ matrix: newMatrix });
  },

  generateBlankBoard: (customCols, customRows) => {
    const c = customCols ?? get().cols;
    const r = customRows ?? get().rows;
    set({
      cols: c,
      rows: r,
      matrix: createBlankMatrix(c, r),
      stacks: {},
    });
  },

  fillFromSeed: (customCols, customRows, customSeed, minNum = 1, maxNum = 9) => {
    const c = customCols ?? get().cols;
    const r = customRows ?? get().rows;
    const seedStr = customSeed ?? get().seed;
    const prng = seededRandomGenerator(seedStr);

    const newMatrix: number[][] = [];
    for (let row = 0; row < r; row++) {
      const rowArr: number[] = [];
      for (let col = 0; col < c; col++) {
        rowArr.push(Math.floor(prng() * (maxNum - minNum + 1)) + minNum);
      }
      newMatrix.push(rowArr);
    }

    set({ cols: c, rows: r, seed: seedStr, matrix: newMatrix, stacks: {} });
  },

  fillRandomSum10s: (minNum = 1, maxNum = 9) => {
    const newSeed = generateSeed();
    set({ seed: newSeed });
    get().fillFromSeed(undefined, undefined, newSeed, minNum, maxNum);
  },

  setBoard: (matrix, stacks = {}) => {
    const rows = matrix.length;
    const cols = rows > 0 ? (matrix[0]?.length ?? 0) : 0;
    set({
      matrix: matrix.map((r) => [...r]),
      stacks: Object.fromEntries(Object.entries(stacks).map(([k, v]) => [k, [...v]])),
      cols,
      rows,
    });
  },
}));
