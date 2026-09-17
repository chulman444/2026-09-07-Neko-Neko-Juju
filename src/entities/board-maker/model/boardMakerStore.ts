import { create } from 'zustand';
import { seededRandomGenerator, generateSeed } from '@/shared/lib/prng';

export type Brush = number | '-' | '+';

export interface InspectedStack {
  col: number;
  row: number;
  stack: number[];
}

export interface BoardMakerState {
  cols: number;
  rows: number;
  matrix: number[][];
  stacks: Record<string, number[]>;
  seed: string;
  spaceType: 'space' | 'tab';
  spaceWidth: number;
  dataBox: string;
  selectedBrush: Brush;
  activeLayer: number | 'surface';
  inspectedStack: InspectedStack | null;
  heatmapMode: boolean;

  // Actions
  setDimensions: (cols: number, rows: number) => void;
  setSeed: (seed: string) => void;
  rerollSeed: () => void;
  setSpaceType: (spaceType: 'space' | 'tab') => void;
  setSpaceWidth: (spaceWidth: number) => void;
  setDataBox: (data: string) => void;
  setSelectedBrush: (brush: Brush) => void;
  setActiveLayer: (layer: number | 'surface') => void;
  setInspectedStack: (coord: { col: number; row: number } | null) => void;
  toggleHeatmapMode: () => void;

  setTileAtLayer: (col: number, row: number, z: number | 'surface', brush: Brush) => void;
  clearStackAt: (col: number, row: number) => void;
  removeTileAtDepth: (col: number, row: number, z: number) => void;
  insertTileAtDepth: (col: number, row: number, z: number, val: number) => void;
  cycleTileValueAtDepth: (col: number, row: number, z: number, delta: number) => void;
  stepActiveLayer: (delta: number, maxLayer?: number) => void;

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

export const getTileCounts = (
  cols: number,
  rows: number,
  matrix: number[][],
  stacks: Record<string, number[]>
): { surface: number; layers: Record<number, number> } => {
  let surface = 0;
  const layers: Record<number, number> = {};

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fullStack = getFullStackAt(matrix, stacks, c, r);
      if (fullStack.length > 0) {
        surface++;
        for (let z = 0; z < fullStack.length; z++) {
          layers[z] = (layers[z] ?? 0) + 1;
        }
      }
    }
  }

  return { surface, layers };
};

const createBlankMatrix = (cols: number, rows: number): number[][] => {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
};

export const getFullStackAt = (
  matrix: number[][],
  stacks: Record<string, number[]>,
  col: number,
  row: number
): number[] => {
  const topVal = matrix[row]?.[col] ?? 0;
  if (topVal === 0) return [];
  const key = `${col},${row}`;
  const stackBelow = stacks[key] ?? [];
  return [...stackBelow, topVal];
};

const saveFullStackAt = (
  matrix: number[][],
  stacks: Record<string, number[]>,
  col: number,
  row: number,
  fullStack: number[]
): { matrix: number[][]; stacks: Record<string, number[]> } => {
  const newMatrix = matrix.map((r) => [...r]);
  const newStacks: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(stacks)) {
    newStacks[k] = [...v];
  }
  const key = `${col},${row}`;

  if (fullStack.length === 0) {
    if (newMatrix[row]) {
      newMatrix[row][col] = 0;
    }
    delete newStacks[key];
  } else {
    if (newMatrix[row]) {
      newMatrix[row][col] = fullStack[fullStack.length - 1]!;
    }
    if (fullStack.length > 1) {
      newStacks[key] = fullStack.slice(0, fullStack.length - 1);
    } else {
      delete newStacks[key];
    }
  }

  return { matrix: newMatrix, stacks: newStacks };
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
  activeLayer: 'surface',
  inspectedStack: null,
  heatmapMode: false,

  setDimensions: (cols, rows) => {
    set({ cols, rows, inspectedStack: null });
    get().generateBlankBoard(cols, rows);
  },
  setSeed: (seed) => set({ seed }),
  rerollSeed: () => set({ seed: generateSeed() }),
  setSpaceType: (spaceType) => set({ spaceType }),
  setSpaceWidth: (spaceWidth) => set({ spaceWidth }),
  setDataBox: (dataBox) => set({ dataBox }),
  setSelectedBrush: (selectedBrush) => set({ selectedBrush }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setInspectedStack: (coord) => {
    if (!coord) {
      set({ inspectedStack: null });
      return;
    }
    const { matrix, stacks } = get();
    const stack = getFullStackAt(matrix, stacks, coord.col, coord.row);
    set({ inspectedStack: { col: coord.col, row: coord.row, stack } });
  },
  toggleHeatmapMode: () => set((state) => ({ heatmapMode: !state.heatmapMode })),

  setTileAtLayer: (col, row, z, brush) => {
    const { matrix, stacks, cols, rows, inspectedStack } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const fullStack = getFullStackAt(matrix, stacks, col, row);

    if (z === 'surface') {
      if (typeof brush === 'number') {
        if (brush === 0) {
          // Pop top tile
          if (fullStack.length > 0) {
            fullStack.pop();
          }
        } else {
          // Push new tile on top (or set 1st tile if empty)
          fullStack.push(brush);
        }
      } else if (brush === '+' || brush === '-') {
        if (fullStack.length === 0) {
          fullStack.push(brush === '+' ? 1 : 9);
        } else {
          const topIdx = fullStack.length - 1;
          const cur = fullStack[topIdx]!;
          if (brush === '+') {
            fullStack[topIdx] = cur === 9 ? 1 : cur + 1;
          } else {
            fullStack[topIdx] = cur === 1 ? 9 : cur - 1;
          }
        }
      }
    } else {
      // Active Layer Z mode
      // Support check: z=0 is always supported, z>0 requires fullStack.length >= z
      if (z > 0 && fullStack.length < z) {
        return; // No support underneath, abort
      }

      if (typeof brush === 'number') {
        if (brush === 0) {
          // Erase at z ONLY IF there are no tiles above it
          if (fullStack.length > z + 1) {
            return; // Tiles exist above z, ignore
          }
          if (fullStack.length === z + 1) {
            fullStack.pop();
          }
        } else {
          // Set or override tile at z
          if (z < fullStack.length) {
            fullStack[z] = brush;
          } else if (z === fullStack.length) {
            fullStack.push(brush);
          }
        }
      } else if (brush === '+' || brush === '-') {
        if (fullStack.length === z) {
          fullStack.push(brush === '+' ? 1 : 9);
        } else if (fullStack.length > z) {
          const cur = fullStack[z]!;
          if (brush === '+') {
            fullStack[z] = cur === 9 ? 1 : cur + 1;
          } else {
            fullStack[z] = cur === 1 ? 9 : cur - 1;
          }
        }
      }
    }

    const { matrix: newMatrix, stacks: newStacks } = saveFullStackAt(
      matrix,
      stacks,
      col,
      row,
      fullStack
    );

    const updatedInspected =
      inspectedStack && inspectedStack.col === col && inspectedStack.row === row
        ? { col, row, stack: fullStack }
        : inspectedStack;

    set({ matrix: newMatrix, stacks: newStacks, inspectedStack: updatedInspected });
  },

  clearStackAt: (col, row) => {
    const { matrix, stacks, cols, rows, inspectedStack } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const { matrix: newMatrix, stacks: newStacks } = saveFullStackAt(matrix, stacks, col, row, []);
    const updatedInspected =
      inspectedStack && inspectedStack.col === col && inspectedStack.row === row
        ? { col, row, stack: [] }
        : inspectedStack;

    set({ matrix: newMatrix, stacks: newStacks, inspectedStack: updatedInspected });
  },

  removeTileAtDepth: (col, row, z) => {
    const { matrix, stacks, cols, rows, inspectedStack } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const fullStack = getFullStackAt(matrix, stacks, col, row);
    if (z < 0 || z >= fullStack.length) return;

    fullStack.splice(z, 1);
    const { matrix: newMatrix, stacks: newStacks } = saveFullStackAt(
      matrix,
      stacks,
      col,
      row,
      fullStack
    );

    const updatedInspected =
      inspectedStack && inspectedStack.col === col && inspectedStack.row === row
        ? { col, row, stack: fullStack }
        : inspectedStack;

    set({ matrix: newMatrix, stacks: newStacks, inspectedStack: updatedInspected });
  },

  insertTileAtDepth: (col, row, z, val) => {
    const { matrix, stacks, cols, rows, inspectedStack } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const fullStack = getFullStackAt(matrix, stacks, col, row);
    if (z < 0 || z > fullStack.length) return;

    fullStack.splice(z, 0, val);
    const { matrix: newMatrix, stacks: newStacks } = saveFullStackAt(
      matrix,
      stacks,
      col,
      row,
      fullStack
    );

    const updatedInspected =
      inspectedStack && inspectedStack.col === col && inspectedStack.row === row
        ? { col, row, stack: fullStack }
        : inspectedStack;

    set({ matrix: newMatrix, stacks: newStacks, inspectedStack: updatedInspected });
  },

  cycleTileValueAtDepth: (col, row, z, delta) => {
    const { matrix, stacks, cols, rows, inspectedStack } = get();
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    const fullStack = getFullStackAt(matrix, stacks, col, row);
    if (z < 0 || z >= fullStack.length) return;

    const cur = fullStack[z]!;
    let next: number;
    if (delta > 0) {
      next = cur === 9 ? 1 : cur + 1;
    } else {
      next = cur === 1 ? 9 : cur - 1;
    }
    fullStack[z] = next;

    const { matrix: newMatrix, stacks: newStacks } = saveFullStackAt(
      matrix,
      stacks,
      col,
      row,
      fullStack
    );

    const updatedInspected =
      inspectedStack && inspectedStack.col === col && inspectedStack.row === row
        ? { col, row, stack: fullStack }
        : inspectedStack;

    set({ matrix: newMatrix, stacks: newStacks, inspectedStack: updatedInspected });
  },

  stepActiveLayer: (delta, maxLayer = 0) => {
    const { activeLayer } = get();
    if (delta > 0) {
      if (activeLayer === 'surface') {
        return;
      }
      if (activeLayer >= maxLayer) {
        set({ activeLayer: 'surface' });
      } else {
        set({ activeLayer: activeLayer + 1 });
      }
    } else if (delta < 0) {
      if (activeLayer === 'surface') {
        set({ activeLayer: maxLayer });
      } else if (typeof activeLayer === 'number' && activeLayer > 0) {
        set({ activeLayer: activeLayer - 1 });
      }
    }
  },

  addTileAt: (col, row, val) => {
    const brush = val !== undefined ? val : get().selectedBrush;
    get().setTileAtLayer(col, row, 'surface', brush);
  },

  removeTileAt: (col, row) => {
    get().setTileAtLayer(col, row, 'surface', 0);
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
    get().setTileAtLayer(col, row, 'surface', delta > 0 ? '+' : '-');
  },

  generateBlankBoard: (customCols, customRows) => {
    const c = customCols ?? get().cols;
    const r = customRows ?? get().rows;
    set({
      cols: c,
      rows: r,
      matrix: createBlankMatrix(c, r),
      stacks: {},
      inspectedStack: null,
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

    set({
      cols: c,
      rows: r,
      seed: seedStr,
      matrix: newMatrix,
      stacks: {},
      inspectedStack: null,
    });
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
      inspectedStack: null,
    });
  },
}));
