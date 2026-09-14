import type {
  SolverTileCoord,
  SolverCombination,
  FamilyDef,
  FamilySignature,
  DependencyCell,
} from './types';

let cachedFamilies: FamilyDef[] = [];

export function setupAll29Families(): FamilyDef[] {
  if (cachedFamilies.length > 0) return cachedFamilies;

  const rawPartitions = [
    [9, 1],
    [8, 2],
    [7, 3],
    [6, 4],
    [5, 5],
    [8, 1, 1],
    [7, 2, 1],
    [6, 3, 1],
    [6, 2, 2],
    [5, 4, 1],
    [5, 3, 2],
    [4, 4, 2],
    [4, 3, 3],
    [7, 1, 1, 1],
    [6, 2, 1, 1],
    [5, 3, 1, 1],
    [5, 2, 2, 1],
    [4, 4, 1, 1],
    [4, 3, 2, 1],
    [4, 2, 2, 2],
    [3, 3, 3, 1],
    [3, 3, 2, 2],
    [6, 1, 1, 1, 1],
    [5, 2, 1, 1, 1],
    [4, 3, 1, 1, 1],
    [4, 2, 2, 1, 1],
    [3, 3, 2, 1, 1],
    [3, 2, 2, 2, 1],
    [2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  const familyMap: Record<string, FamilyDef> = {};
  rawPartitions.forEach((partition) => {
    const uniqueDigits = [...new Set(partition)].sort((a, b) => b - a);
    const familyKey = `fam-${uniqueDigits.join('-')}`;

    if (!familyMap[familyKey]) {
      familyMap[familyKey] = {
        name: `${uniqueDigits.join('-')}-Family`,
        digits: uniqueDigits,
        signatures: [],
      };
    }

    const sig: FamilySignature = {};
    partition.forEach((num) => {
      sig[num] = (sig[num] || 0) + 1;
    });
    familyMap[familyKey].signatures.push(sig);
  });

  cachedFamilies = Object.values(familyMap);
  return cachedFamilies;
}

export function calculateSAT(grid: number[][], rows: number, cols: number): number[][] {
  const sat = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const top = r > 0 ? sat[r - 1][c] : 0;
      const left = c > 0 ? sat[r][c - 1] : 0;
      const topleft = r > 0 && c > 0 ? sat[r - 1][c - 1] : 0;
      sat[r][c] = (grid[r]?.[c] ?? 0) + top + left - topleft;
    }
  }
  return sat;
}

export function querySAT(r1: number, c1: number, r2: number, c2: number, sat: number[][]): number {
  const total = sat[r2]?.[c2] ?? 0;
  const top = r1 > 0 ? (sat[r1 - 1]?.[c2] ?? 0) : 0;
  const left = c1 > 0 ? (sat[r2]?.[c1 - 1] ?? 0) : 0;
  const topleft = r1 > 0 && c1 > 0 ? (sat[r1 - 1]?.[c1 - 1] ?? 0) : 0;
  return total - top - left + topleft;
}

function tryMatchSignature(
  tiles: { r: number; c: number; val: number }[],
  anchorA: SolverTileCoord,
  anchorB: SolverTileCoord,
  signature: FamilySignature,
  board: number[][]
): { requiredTiles: SolverTileCoord[]; blockerTiles: SolverTileCoord[] } | null {
  const needed = { ...signature };
  const requiredTiles: SolverTileCoord[] = [];
  const blockerTiles: SolverTileCoord[] = [];

  const valA = board[anchorA.row]?.[anchorA.col] ?? 0;
  const valB = board[anchorB.row]?.[anchorB.col] ?? 0;

  if (needed[valA] && needed[valA] > 0) {
    needed[valA]--;
    requiredTiles.push({ row: anchorA.row, col: anchorA.col });
  } else {
    return null;
  }

  if (needed[valB] && needed[valB] > 0) {
    needed[valB]--;
    requiredTiles.push({ row: anchorB.row, col: anchorB.col });
  } else {
    return null;
  }

  for (const tile of tiles) {
    if (
      (tile.r === anchorA.row && tile.c === anchorA.col) ||
      (tile.r === anchorB.row && tile.c === anchorB.col)
    ) {
      continue;
    }

    if (tile.val > 0) {
      if (needed[tile.val] !== undefined && needed[tile.val] > 0) {
        needed[tile.val]--;
        requiredTiles.push({ row: tile.r, col: tile.c });
      } else {
        blockerTiles.push({ row: tile.r, col: tile.c });
      }
    }
  }

  for (const d in needed) {
    if (needed[d] > 0) return null;
  }

  return { requiredTiles, blockerTiles };
}

function evaluateSignatures(
  tiles: { r: number; c: number; val: number }[],
  family: FamilyDef,
  shapeType: string,
  anchorA: SolverTileCoord,
  anchorB: SolverTileCoord,
  board: number[][],
  masterCombinations: SolverCombination[]
) {
  let bestMatch: { requiredTiles: SolverTileCoord[]; blockerTiles: SolverTileCoord[] } | null =
    null;

  for (const sig of family.signatures) {
    const match = tryMatchSignature(tiles, anchorA, anchorB, sig, board);
    if (match) {
      if (!bestMatch || match.blockerTiles.length < bestMatch.blockerTiles.length) {
        bestMatch = match;
      }
    }
  }

  if (bestMatch) {
    masterCombinations.push({
      id: masterCombinations.length + 1,
      family: family.name,
      shape: shapeType,
      required: bestMatch.requiredTiles,
      blockers: bestMatch.blockerTiles,
      isActive: true,
    });
  }
}

function scanBoxAndVerify(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  family: FamilyDef,
  shapeType: string,
  anchorA: SolverTileCoord,
  anchorB: SolverTileCoord,
  board: number[][],
  masterCombinations: SolverCombination[]
) {
  const tilesInBox: { r: number; c: number; val: number }[] = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      tilesInBox.push({ r, c, val: board[r]?.[c] ?? 0 });
    }
  }
  evaluateSignatures(tilesInBox, family, shapeType, anchorA, anchorB, board, masterCombinations);
}

function scanDiagonalAndVerify(
  r1: number,
  c1: number,
  r2: number,
  _c2: number,
  family: FamilyDef,
  colStep: number,
  shapeType: string,
  anchorA: SolverTileCoord,
  anchorB: SolverTileCoord,
  board: number[][],
  masterCombinations: SolverCombination[]
) {
  const tilesInLine: { r: number; c: number; val: number }[] = [];
  const steps = r2 - r1;
  let c = c1;
  for (let i = 0; i <= steps; i++) {
    const r = r1 + i;
    tilesInLine.push({ r, c, val: board[r]?.[c] ?? 0 });
    c += colStep;
  }
  evaluateSignatures(tilesInLine, family, shapeType, anchorA, anchorB, board, masterCombinations);
}

function runPassA(
  points: SolverTileCoord[],
  satFamily: number[][],
  family: FamilyDef,
  board: number[][],
  masterCombinations: SolverCombination[]
) {
  points.sort((a, b) => a.row - b.row || a.col - b.col);

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];

      if (b.col >= a.col) {
        if (querySAT(a.row, a.col, b.row, b.col, satFamily) >= 10) {
          scanBoxAndVerify(
            a.row,
            a.col,
            b.row,
            b.col,
            family,
            'Rectangle/Line',
            a,
            b,
            board,
            masterCombinations
          );
        }

        if (b.row > a.row && b.col > a.col && b.row - a.row === b.col - a.col) {
          scanDiagonalAndVerify(
            a.row,
            a.col,
            b.row,
            b.col,
            family,
            1,
            'Diagonal Down-Right',
            a,
            b,
            board,
            masterCombinations
          );
        }
      }
    }
  }
}

function runPassB(
  points: SolverTileCoord[],
  activeGridOrig: boolean[][],
  satFamilyFlipped: number[][],
  family: FamilyDef,
  cols: number,
  board: number[][],
  masterCombinations: SolverCombination[]
) {
  const flippedPoints = points.map((p) => ({ row: p.row, col: cols - 1 - p.col }));
  flippedPoints.sort((a, b) => a.row - b.row || a.col - b.col);

  for (let i = 0; i < flippedPoints.length; i++) {
    for (let j = i + 1; j < flippedPoints.length; j++) {
      const aFlip = flippedPoints[i];
      const bFlip = flippedPoints[j];

      if (aFlip.row === bFlip.row || aFlip.col === bFlip.col) continue;

      if (bFlip.col > aFlip.col) {
        const aOrigCol = cols - 1 - aFlip.col;
        const bOrigCol = cols - 1 - bFlip.col;

        const aOrig = { row: aFlip.row, col: aOrigCol };
        const bOrig = { row: bFlip.row, col: bOrigCol };

        if (bFlip.row - aFlip.row === bFlip.col - aFlip.col) {
          scanDiagonalAndVerify(
            aFlip.row,
            aOrigCol,
            bFlip.row,
            bOrigCol,
            family,
            -1,
            'Diagonal Down-Left',
            aOrig,
            bOrig,
            board,
            masterCombinations
          );
        }

        if (activeGridOrig[aFlip.row]?.[bOrigCol] && activeGridOrig[bFlip.row]?.[aOrigCol]) {
          continue;
        }

        if (querySAT(aFlip.row, aFlip.col, bFlip.row, bFlip.col, satFamilyFlipped) >= 10) {
          const rMin = aFlip.row;
          const rMax = bFlip.row;
          const cMin = Math.min(aOrigCol, bOrigCol);
          const cMax = Math.max(aOrigCol, bOrigCol);
          scanBoxAndVerify(
            rMin,
            cMin,
            rMax,
            cMax,
            family,
            'Ghost Rectangle',
            aOrig,
            bOrig,
            board,
            masterCombinations
          );
        }
      }
    }
  }
}

export function buildDependencyGraph(
  rows: number,
  cols: number,
  combinations: SolverCombination[]
): DependencyCell[][] {
  const dependencyGraph: DependencyCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ requiredIn: [], blockedIn: [] }))
  );

  combinations.forEach((match) => {
    match.isActive = true;

    match.required.forEach((t) => {
      dependencyGraph[t.row]?.[t.col]?.requiredIn.push(match.id);
    });

    match.blockers.forEach((t) => {
      dependencyGraph[t.row]?.[t.col]?.blockedIn.push(match.id);
    });
  });

  return dependencyGraph;
}

export function runSolverEngine(board: number[][]): {
  combinations: SolverCombination[];
  dependencyGraph: DependencyCell[][];
} {
  const rows = board.length;
  const cols = rows > 0 ? (board[0]?.length ?? 0) : 0;
  if (rows === 0 || cols === 0) {
    return { combinations: [], dependencyGraph: [] };
  }

  const families = setupAll29Families();
  const masterCombinations: SolverCombination[] = [];

  const activeGridOrig = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (board[r]?.[c] ?? 0) > 0)
  );

  families.forEach((family) => {
    const famGridOrig = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const famGridFlipped = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const familyPoints: SolverTileCoord[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = board[r]?.[c] ?? 0;
        if (family.digits.includes(val)) {
          famGridOrig[r][c] = val;
          famGridFlipped[r][cols - 1 - c] = val;
          familyPoints.push({ row: r, col: c });
        }
      }
    }

    if (familyPoints.length < 2) return;

    const satFamilyOrig = calculateSAT(famGridOrig, rows, cols);
    const satFamilyFlipped = calculateSAT(famGridFlipped, rows, cols);

    runPassA(familyPoints, satFamilyOrig, family, board, masterCombinations);
    runPassB(
      familyPoints,
      activeGridOrig,
      satFamilyFlipped,
      family,
      cols,
      board,
      masterCombinations
    );
  });

  // Solo Omnitile matches (value = 10)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r]?.[c] === 10) {
        masterCombinations.push({
          id: masterCombinations.length + 1,
          family: 'Omnitile',
          shape: '1x1',
          required: [{ row: r, col: c }],
          blockers: [],
          isActive: true,
        });
      }
    }
  }

  const dependencyGraph = buildDependencyGraph(rows, cols, masterCombinations);

  return {
    combinations: masterCombinations,
    dependencyGraph,
  };
}

export function findClearableCombinationsOnly(board: number[][]): SolverCombination[] {
  const rows = board.length;
  const cols = rows > 0 ? (board[0]?.length ?? 0) : 0;
  if (rows === 0 || cols === 0) return [];

  const sat = calculateSAT(board, rows, cols);
  const clearableCombinations: SolverCombination[] = [];
  const seenKeys = new Set<string>();

  // 0. Detect 1x1 Omnitiles (each Omnitile is an instant valid solo match)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r]?.[c] === 10) {
        const key = `1x1:${r},${c}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          clearableCombinations.push({
            id: clearableCombinations.length + 1,
            family: 'Omnitile',
            shape: '1x1',
            required: [{ row: r, col: c }],
            blockers: [],
            isActive: true,
          });
        }
      }
    }
  }

  // 1. Scan tight rectangles [r1..r2, c1..c2]
  for (let r1 = 0; r1 < rows; r1++) {
    for (let r2 = r1; r2 < rows; r2++) {
      for (let c1 = 0; c1 < cols; c1++) {
        for (let c2 = c1; c2 < cols; c2++) {
          if (r1 === r2 && c1 === c2) continue; // 1x1 cannot sum to 10

          const sum = querySAT(r1, c1, r2, c2, sat);
          if (sum > 10) {
            // As c2 increases, sum is monotonically non-decreasing because board[r][c] >= 0
            break;
          }

          if (sum === 10) {
            // Check tightness in O(1): every boundary edge must have at least one non-zero cell
            const topRowHasTile = querySAT(r1, c1, r1, c2, sat) > 0;
            const bottomRowHasTile = querySAT(r2, c1, r2, c2, sat) > 0;
            const leftColHasTile = querySAT(r1, c1, r2, c1, sat) > 0;
            const rightColHasTile = querySAT(r1, c2, r2, c2, sat) > 0;

            if (topRowHasTile && bottomRowHasTile && leftColHasTile && rightColHasTile) {
              const required: SolverTileCoord[] = [];
              const digits: number[] = [];

              for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                  const val = board[r]?.[c] ?? 0;
                  if (val > 0) {
                    required.push({ row: r, col: c });
                    digits.push(val);
                  }
                }
              }

              if (required.length >= 2) {
                const uniqueDigits = [...new Set(digits)].sort((a, b) => b - a);
                const familyName = `${uniqueDigits.join('-')}-Family`;
                const shape = 'Rectangle/Line';
                const key = `${shape}:${required.map((t) => `${t.row},${t.col}`).join(';')}`;

                if (!seenKeys.has(key)) {
                  seenKeys.add(key);
                  clearableCombinations.push({
                    id: clearableCombinations.length + 1,
                    family: familyName,
                    shape,
                    required,
                    blockers: [],
                    isActive: true,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  // 2. Scan diagonals Down-Right
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((board[r]?.[c] ?? 0) === 0) continue; // Start must be non-zero

      let sum = board[r][c];
      const maxLen = Math.min(rows - r, cols - c);

      for (let len = 2; len <= maxLen; len++) {
        const endR = r + len - 1;
        const endC = c + len - 1;
        const endVal = board[endR]?.[endC] ?? 0;
        sum += endVal;

        if (sum > 10) break;

        if (sum === 10 && endVal > 0) {
          const required: SolverTileCoord[] = [];
          const digits: number[] = [];

          for (let i = 0; i < len; i++) {
            const tr = r + i;
            const tc = c + i;
            const val = board[tr]?.[tc] ?? 0;
            if (val > 0) {
              required.push({ row: tr, col: tc });
              digits.push(val);
            }
          }

          if (required.length >= 2) {
            const uniqueDigits = [...new Set(digits)].sort((a, b) => b - a);
            const familyName = `${uniqueDigits.join('-')}-Family`;
            const shape = 'Diagonal Down-Right';
            const key = `${shape}:${required.map((t) => `${t.row},${t.col}`).join(';')}`;

            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              clearableCombinations.push({
                id: clearableCombinations.length + 1,
                family: familyName,
                shape,
                required,
                blockers: [],
                isActive: true,
              });
            }
          }
        }
      }
    }
  }

  // 3. Scan diagonals Down-Left
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((board[r]?.[c] ?? 0) === 0) continue; // Start must be non-zero

      let sum = board[r][c];
      const maxLen = Math.min(rows - r, c + 1);

      for (let len = 2; len <= maxLen; len++) {
        const endR = r + len - 1;
        const endC = c - len + 1;
        const endVal = board[endR]?.[endC] ?? 0;
        sum += endVal;

        if (sum > 10) break;

        if (sum === 10 && endVal > 0) {
          const required: SolverTileCoord[] = [];
          const digits: number[] = [];

          for (let i = 0; i < len; i++) {
            const tr = r + i;
            const tc = c - i;
            const val = board[tr]?.[tc] ?? 0;
            if (val > 0) {
              required.push({ row: tr, col: tc });
              digits.push(val);
            }
          }

          if (required.length >= 2) {
            const uniqueDigits = [...new Set(digits)].sort((a, b) => b - a);
            const familyName = `${uniqueDigits.join('-')}-Family`;
            const shape = 'Diagonal Down-Left';
            const key = `${shape}:${required.map((t) => `${t.row},${t.col}`).join(';')}`;

            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              clearableCombinations.push({
                id: clearableCombinations.length + 1,
                family: familyName,
                shape,
                required,
                blockers: [],
                isActive: true,
              });
            }
          }
        }
      }
    }
  }

  return clearableCombinations;
}

export function buildBlockerLookup(combinations: SolverCombination[]): {
  requiredMap: Map<string, SolverCombination[]>;
  blockerMap: Map<string, SolverCombination[]>;
} {
  const requiredMap = new Map<string, SolverCombination[]>();
  const blockerMap = new Map<string, SolverCombination[]>();

  combinations.forEach((c) => {
    c.required.forEach((t) => {
      const key = `${t.row},${t.col}`;
      let list = requiredMap.get(key);
      if (!list) {
        list = [];
        requiredMap.set(key, list);
      }
      list.push(c);
    });

    c.blockers.forEach((t) => {
      const key = `${t.row},${t.col}`;
      let list = blockerMap.get(key);
      if (!list) {
        list = [];
        blockerMap.set(key, list);
      }
      list.push(c);
    });
  });

  return { requiredMap, blockerMap };
}

export function cascadeClearTiles(
  clearedTiles: SolverTileCoord[],
  combinations: SolverCombination[],
  dependencyGraph?: DependencyCell[][],
  lookupMaps?: {
    requiredMap: Map<string, SolverCombination[]>;
    blockerMap: Map<string, SolverCombination[]>;
  }
): SolverCombination[] {
  // 1. Direct O(1) dictionary lookup if provided
  if (lookupMaps) {
    const { requiredMap, blockerMap } = lookupMaps;
    clearedTiles.forEach((tile) => {
      const key = `${tile.row},${tile.col}`;

      const reqList = requiredMap.get(key);
      if (reqList) {
        for (let i = 0; i < reqList.length; i++) {
          reqList[i].isActive = false;
        }
      }

      const blockList = blockerMap.get(key);
      if (blockList) {
        for (let i = 0; i < blockList.length; i++) {
          const combo = blockList[i];
          if (combo.isActive) {
            combo.blockers = combo.blockers.filter(
              (b) => !(b.row === tile.row && b.col === tile.col)
            );
          }
        }
      }
    });

    return combinations.filter((c) => c.isActive);
  }

  // 2. O(1) by-id lookup if dependencyGraph is provided
  const combosById = new Map<number, SolverCombination>();
  for (let i = 0; i < combinations.length; i++) {
    combosById.set(combinations[i].id, combinations[i]);
  }

  clearedTiles.forEach((tile) => {
    const { row, col } = tile;
    if (dependencyGraph) {
      const cellGraph = dependencyGraph[row]?.[col];
      if (cellGraph) {
        // Invalidate overlapping matches relying on this cell
        cellGraph.requiredIn.forEach((matchId) => {
          const linkedMatch = combosById.get(matchId);
          if (linkedMatch) linkedMatch.isActive = false;
        });

        // Filter out cleared element from blocking vectors
        cellGraph.blockedIn.forEach((matchId) => {
          const linkedMatch = combosById.get(matchId);
          if (linkedMatch && linkedMatch.isActive) {
            linkedMatch.blockers = linkedMatch.blockers.filter(
              (b) => !(b.row === row && b.col === col)
            );
          }
        });
      }
    }
  });

  return combinations.filter((c) => c.isActive);
}
