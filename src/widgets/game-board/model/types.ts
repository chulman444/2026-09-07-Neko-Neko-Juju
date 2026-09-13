import type { TileCoord, ClearingAnimation, CheckerboardMode } from '@/entities/board';

export type SelectMode = 'drag' | 'tap';

export interface InteractionSnapshot {
  selectMode: SelectMode;
  activeAction: 'box' | 'diagonal' | null;
  isShiftPressed: boolean;
  dragStart: { x: number; y: number };
  dragCurrent: { x: number; y: number };
  startTile: TileCoord;
  currentTile: TileCoord;
  boxTiles: TileCoord[];
  isSquare: boolean;
  diagonalTiles: TileCoord[];
  dirX: number;
  dirY: number;
  diagonalSelected: TileCoord[];
  boxSum: number;
  diagSum: number;
}

export interface BoardRenderState {
  cols: number;
  rows: number;
  shapeSize: number;
  tileBorder: number;
  textSize: number;
  matrix: number[][];
  clearingAnimations: ClearingAnimation[];
}

export interface BoardVisualConfig {
  gameBg: string;
  selectionColor: string;
  validColor: string;
  textColor: string;
  textBorderColor: string;
  groupingMode: 'auto-square' | 'separate';
  clearAnimationType: 'munching' | 'fadeout';
  munchDuration: number;
  fadeoutDuration: number;
  munchSpeed: number;
  checkerboardMode?: CheckerboardMode;
  checkerColors?: string[];
  twoClickSelection?: boolean;
  hoverLiveSelection?: boolean;
}
