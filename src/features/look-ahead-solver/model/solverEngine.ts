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
    [9, 1], [8, 2], [7, 3], [6, 4], [5, 5],
    [8, 1, 1], [7, 2, 1], [6, 3, 1], [6, 2, 2], [5, 4, 1], [5, 3, 2], [4, 4, 2], [4, 3, 3],
    [7, 1, 1, 1], [6, 2, 1, 1], [5, 3, 1, 1], [5, 2, 2, 1], [4, 4, 1, 1], [4, 3, 2, 1], [4, 2, 2, 2], [3, 3, 3, 1], [3, 3, 2, 2],
    [6, 1, 1, 1, 1], [5, 2, 1, 1, 1], [4, 3, 1, 1, 1], [4, 2, 2, 1, 1], [3, 3, 2, 1, 1], [3, 2, 2, 2, 1],
    [2, 2, 2, 2, 2], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

export function querySAT(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  sat: number[][]
): number {
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
  let bestMatch: { requiredTiles: SolverTileCoord[]; blockerTiles: SolverTileCoord[] } | null = null;

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
          scanBoxAndVerify(a.row, a.col, b.row, b.col, family, 'Rectangle/Line', a, b, board, masterCombinations);
        }

        if (b.row > a.row && b.col > a.col && b.row - a.row === b.col - a.col) {
          scanDiagonalAndVerify(a.row, a.col, b.row, b.col, family, 1, 'Diagonal Down-Right', a, b, board, masterCombinations);
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
          scanBoxAndVerify(rMin, cMin, rMax, cMax, family, 'Ghost Rectangle', aOrig, bOrig, board, masterCombinations);
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
    runPassB(familyPoints, activeGridOrig, satFamilyFlipped, family, cols, board, masterCombinations);
  });

  const dependencyGraph = buildDependencyGraph(rows, cols, masterCombinations);

  return {
    combinations: masterCombinations,
    dependencyGraph,
  };
}

export function cascadeClearTiles(
  clearedTiles: SolverTileCoord[],
  combinations: SolverCombination[],
  dependencyGraph: DependencyCell[][]
): SolverCombination[] {
  clearedTiles.forEach((tile) => {
    const { row, col } = tile;
    const cellGraph = dependencyGraph[row]?.[col];
    if (!cellGraph) return;

    // Cascade A: Invalidate overlapping matches relying on this cell
    cellGraph.requiredIn.forEach((matchId) => {
      const linkedMatch = combinations.find((c) => c.id === matchId);
      if (linkedMatch) linkedMatch.isActive = false;
    });

    // Cascade B: Filter out elements from blocking vectors
    cellGraph.blockedIn.forEach((matchId) => {
      const linkedMatch = combinations.find((c) => c.id === matchId);
      if (linkedMatch && linkedMatch.isActive) {
        linkedMatch.blockers = linkedMatch.blockers.filter(
          (b) => !(b.row === row && b.col === col)
        );
      }
    });
  });

  return combinations.filter((c) => c.isActive);
}
