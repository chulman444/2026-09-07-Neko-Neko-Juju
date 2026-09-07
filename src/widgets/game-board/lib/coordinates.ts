import type { TileCoord } from '@/entities/board';

export function getGridPitch(shapeSize: number, tileBorder: number): number {
  return shapeSize + tileBorder * 2;
}

export function getCanvasMousePos(
  canvas: HTMLCanvasElement | null,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function getTileFromCanvasPos(
  pos: { x: number; y: number },
  cols: number,
  rows: number,
  pitch: number
): TileCoord {
  return {
    col: Math.max(0, Math.min(cols - 1, Math.floor(pos.x / pitch))),
    row: Math.max(0, Math.min(rows - 1, Math.floor(pos.y / pitch))),
  };
}
