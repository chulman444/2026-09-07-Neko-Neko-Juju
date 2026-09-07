import type { TileCoord } from '@/entities/board';

export interface BoxSelectionResult {
  boxTiles: TileCoord[];
  isSquare: boolean;
  diagonalTiles: TileCoord[];
  startTile: TileCoord;
  currentTile: TileCoord;
  dirX: number;
  dirY: number;
  steps: number;
}

export function calculateBoxSelection(
  dragStart: { x: number; y: number },
  dragCurrent: { x: number; y: number },
  cols: number,
  rows: number,
  pitch: number
): TileCoord[] {
  const boxMinX = Math.min(dragStart.x, dragCurrent.x);
  const boxMinY = Math.min(dragStart.y, dragCurrent.y);
  const boxMaxX = Math.max(dragStart.x, dragCurrent.x);
  const boxMaxY = Math.max(dragStart.y, dragCurrent.y);

  const selected: TileCoord[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellX = c * pitch;
      const cellY = r * pitch;
      const cellMaxX = cellX + pitch;
      const cellMaxY = cellY + pitch;

      if (boxMinX < cellMaxX && boxMaxX > cellX && boxMinY < cellMaxY && boxMaxY > cellY) {
        selected.push({ col: c, row: r });
      }
    }
  }
  return selected;
}

export function calculateDetailedBoxSelection(
  startTile: TileCoord,
  currentTile: TileCoord,
  dragStart: { x: number; y: number },
  dragCurrent: { x: number; y: number },
  cols: number,
  rows: number,
  pitch: number
): BoxSelectionResult {
  const boxTiles = calculateBoxSelection(dragStart, dragCurrent, cols, rows, pitch);

  const minCol = Math.min(startTile.col, currentTile.col);
  const maxCol = Math.max(startTile.col, currentTile.col);
  const minRow = Math.min(startTile.row, currentTile.row);
  const maxRow = Math.max(startTile.row, currentTile.row);

  const widthTiles = maxCol - minCol + 1;
  const heightTiles = maxRow - minRow + 1;

  const isSquare = widthTiles === heightTiles && widthTiles >= 2;

  const dirX = currentTile.col >= startTile.col ? 1 : -1;
  const dirY = currentTile.row >= startTile.row ? 1 : -1;
  const steps = widthTiles - 1;

  const diagonalTiles: TileCoord[] = [];
  if (isSquare) {
    for (let i = 0; i <= steps; i++) {
      diagonalTiles.push({
        col: startTile.col + dirX * i,
        row: startTile.row + dirY * i,
      });
    }
  }

  return {
    boxTiles,
    isSquare,
    diagonalTiles,
    startTile,
    currentTile,
    dirX,
    dirY,
    steps,
  };
}

export function calculateDiagonalSelection(
  startTile: TileCoord,
  dragCurrent: { x: number; y: number },
  cols: number,
  rows: number,
  pitch: number
): TileCoord[] {
  const startCenterX = (startTile.col + 0.5) * pitch;
  const startCenterY = (startTile.row + 0.5) * pitch;

  const dx = dragCurrent.x - startCenterX;
  const dy = dragCurrent.y - startCenterY;

  const dirX = dx >= 0 ? 1 : -1;
  const dirY = dy >= 0 ? 1 : -1;

  const avgDist = (Math.abs(dx) + Math.abs(dy)) / 2;
  const steps = Math.max(0, Math.round(avgDist / pitch));

  const maxStepsX = dirX > 0 ? cols - 1 - startTile.col : startTile.col;
  const maxStepsY = dirY > 0 ? rows - 1 - startTile.row : startTile.row;
  const maxAllowedSteps = Math.min(maxStepsX, maxStepsY);
  const actualSteps = Math.min(steps, maxAllowedSteps);

  const selected: TileCoord[] = [];
  for (let i = 0; i <= actualSteps; i++) {
    selected.push({
      col: startTile.col + dirX * i,
      row: startTile.row + dirY * i,
    });
  }
  return selected;
}
