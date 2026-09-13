import { type TileCoord, OMNITILE_VALUE } from '@/entities/board';
import {
  calculateDetailedBoxSelection,
  calculateDiagonalSelection,
} from '@/features/select-tiles';
import { getGridPitch, getCanvasMousePos, getTileFromCanvasPos } from '../lib/coordinates';
import type { InteractionSnapshot, SelectMode, BoardVisualConfig } from './types';

export interface BoardContextAccess {
  getTargetSum: () => number;
  isInteractive: () => boolean;
  isPanMode?: () => boolean;
  isItemActive?: () => boolean;
  getBoardState: () => {
    matrix: number[][];
    cols: number;
    rows: number;
    shapeSize: number;
    tileBorder: number;
  };
  getVisualConfig: () => BoardVisualConfig;
  onClear: (tiles: TileCoord[], sum: number) => void;
  onSelectionChange?: (tiles: TileCoord[], sum: number, isValid: boolean) => void;
  onTileClick?: (tile: TileCoord) => boolean | void;
}

export class GameBoardInteraction {
  private canvas: HTMLCanvasElement;
  private ctxAccess: BoardContextAccess;

  // Interaction / Selection State
  private selectMode: SelectMode = 'drag';
  private isPointerDownOnCanvas = false;
  private isShiftPressed = false;
  private activeAction: 'box' | 'diagonal' | null = null;
  private dragStart: { x: number; y: number } = { x: 0, y: 0 };
  private dragCurrent: { x: number; y: number } = { x: 0, y: 0 };
  private startTile: TileCoord = { col: 0, row: 0 };
  private currentTile: TileCoord = { col: 0, row: 0 };

  private diagonalSelected: TileCoord[] = [];
  private boxTiles: TileCoord[] = [];
  private isSquare = false;
  private diagonalTiles: TileCoord[] = [];
  private dirX = 1;
  private dirY = 1;
  private boxSum = 0;
  private diagSum = 0;
  private lastSelectionKey = '';
  private lastCursor = '';

  constructor(canvas: HTMLCanvasElement, ctxAccess: BoardContextAccess) {
    this.canvas = canvas;
    this.ctxAccess = ctxAccess;
  }

  public bind(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerenter', this.handlePointerEnter);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public unbind(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerenter', this.handlePointerEnter);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  public updateCursorState(): void {
    this.updateCursor();
  }

  public getSnapshot(): InteractionSnapshot {
    return {
      selectMode: this.selectMode,
      activeAction: this.activeAction,
      isShiftPressed: this.isShiftPressed,
      dragStart: this.dragStart,
      dragCurrent: this.dragCurrent,
      startTile: this.startTile,
      currentTile: this.currentTile,
      boxTiles: this.boxTiles,
      isSquare: this.isSquare,
      diagonalTiles: this.diagonalTiles,
      dirX: this.dirX,
      dirY: this.dirY,
      diagonalSelected: this.diagonalSelected,
      boxSum: this.boxSum,
      diagSum: this.diagSum,
    };
  }

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
      this.isShiftPressed = true;
      this.updateCursor();
    } else if (e.key === 'Escape') {
      this.resetSelectionState();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
      this.isShiftPressed = false;
      this.updateCursor();
    }
  };

  private handlePointerEnter = (): void => {
    this.updateCursor();
  };

  private handlePointerCancel = (): void => {
    this.isPointerDownOnCanvas = false;
    this.updateCursor();
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (!this.ctxAccess.isInteractive()) return;
    if (this.ctxAccess.isPanMode?.()) {
      this.isPointerDownOnCanvas = true;
      this.updateCursor();
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;

    if (this.ctxAccess.isItemActive?.()) {
      if (this.selectMode !== 'drag' || this.activeAction !== null) {
        this.resetSelectionState();
      }
      if (e.button === 0) {
        this.isPointerDownOnCanvas = true;
        const board = this.ctxAccess.getBoardState();
        const pitch = getGridPitch(board.shapeSize, board.tileBorder);
        const pos = getCanvasMousePos(this.canvas, e.clientX, e.clientY);
        this.startTile = getTileFromCanvasPos(pos, board.cols, board.rows, pitch);
      }
      this.updateCursor();
      return;
    }

    this.isPointerDownOnCanvas = true;
    const board = this.ctxAccess.getBoardState();
    const pitch = getGridPitch(board.shapeSize, board.tileBorder);
    const pos = getCanvasMousePos(this.canvas, e.clientX, e.clientY);

    if (this.selectMode === 'tap') {
      this.dragCurrent = pos;
      this.currentTile = getTileFromCanvasPos(pos, board.cols, board.rows, pitch);
      this.recalculateSelection();
      return;
    }

    this.isShiftPressed = e.shiftKey;
    this.dragStart = pos;
    this.dragCurrent = pos;
    this.startTile = getTileFromCanvasPos(pos, board.cols, board.rows, pitch);
    this.currentTile = this.startTile;
    this.activeAction = e.button === 2 ? 'diagonal' : 'box';

    this.updateCursor();
    this.recalculateSelection();
  };

  private handlePointerMove = (e: PointerEvent): void => {
    this.updateCursor();

    if (this.ctxAccess.isItemActive?.() || this.ctxAccess.isPanMode?.()) {
      return;
    }

    if (!this.activeAction) return;
    if (!this.ctxAccess.isInteractive()) {
      this.resetSelectionState();
      return;
    }

    const config = this.ctxAccess.getVisualConfig();

    if (!this.isPointerDownOnCanvas) {
      // If this is a mobile touch gesture or mouse drag outside canvas, ignore
      if (e.pointerType === 'touch' || e.buttons !== 0) {
        return;
      }

      // Only genuine PC mouse hover checks hoverLiveSelection
      if (this.selectMode === 'tap' && config.hoverLiveSelection === false) {
        return;
      }
    }

    this.isShiftPressed = e.shiftKey;
    const board = this.ctxAccess.getBoardState();
    const pitch = getGridPitch(board.shapeSize, board.tileBorder);
    const pos = getCanvasMousePos(this.canvas, e.clientX, e.clientY);
    this.dragCurrent = pos;
    this.currentTile = getTileFromCanvasPos(pos, board.cols, board.rows, pitch);

    this.updateCursor();
    this.recalculateSelection();
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (this.ctxAccess.isPanMode?.()) {
      this.isPointerDownOnCanvas = false;
      this.updateCursor();
      return;
    }

    if (this.ctxAccess.isItemActive?.()) {
      if (!this.isPointerDownOnCanvas) return;
      this.isPointerDownOnCanvas = false;

      const board = this.ctxAccess.getBoardState();
      const pitch = getGridPitch(board.shapeSize, board.tileBorder);
      const pos = getCanvasMousePos(this.canvas, e.clientX, e.clientY);
      const endTile = getTileFromCanvasPos(pos, board.cols, board.rows, pitch);

      if (endTile.col === this.startTile.col && endTile.row === this.startTile.row) {
        this.ctxAccess.onTileClick?.(endTile);
      }
      this.updateCursor();
      return;
    }

    if (!this.activeAction) return;

    if (!this.isPointerDownOnCanvas) return;
    this.isPointerDownOnCanvas = false;

    const board = this.ctxAccess.getBoardState();
    const pitch = getGridPitch(board.shapeSize, board.tileBorder);
    const pos = getCanvasMousePos(this.canvas, e.clientX, e.clientY);
    const endTile = getTileFromCanvasPos(pos, board.cols, board.rows, pitch);
    const config = this.ctxAccess.getVisualConfig();

    if (this.selectMode === 'tap') {
      if (endTile.col === this.startTile.col && endTile.row === this.startTile.row) {
        const targetSum = this.ctxAccess.getTargetSum();
        if (this.boxSum === targetSum && this.boxTiles.length > 0) {
          this.evaluateSelection();
          this.resetSelectionState();
          return;
        }
        if (this.ctxAccess.onTileClick) {
          this.ctxAccess.onTileClick(endTile);
        }
        this.resetSelectionState();
      } else {
        this.dragCurrent = pos;
        this.currentTile = endTile;
        this.recalculateSelection();
        this.evaluateSelection();
        this.resetSelectionState();
      }
      return;
    }

    if (endTile.col === this.startTile.col && endTile.row === this.startTile.row) {
      const handled = this.ctxAccess.onTileClick?.(endTile);
      if (handled) {
        this.resetSelectionState();
        return;
      }
      const targetSum = this.ctxAccess.getTargetSum();
      if (this.boxSum === targetSum && this.boxTiles.length > 0) {
        this.evaluateSelection();
        this.resetSelectionState();
        return;
      }
      if (config.twoClickSelection !== false) {
        this.selectMode = 'tap';
        const centerPos = {
          x: (this.startTile.col + 0.5) * pitch,
          y: (this.startTile.row + 0.5) * pitch,
        };
        this.dragStart = centerPos;
        this.dragCurrent = centerPos;
        this.currentTile = this.startTile;
        this.recalculateSelection();
      } else {
        this.resetSelectionState();
      }
    } else {
      this.evaluateSelection();
      this.resetSelectionState();
    }
  };

  private evaluateSelection(): void {
    const targetSum = this.ctxAccess.getTargetSum();
    const config = this.ctxAccess.getVisualConfig();

    let matchedTiles: TileCoord[] | null = null;
    let matchedSum = 0;

    if (this.activeAction === 'box') {
      if (this.boxSum === targetSum && this.boxTiles.length > 0) {
        matchedTiles = this.boxTiles;
        matchedSum = this.boxSum;
      } else if (
        config.groupingMode === 'auto-square' &&
        this.isSquare &&
        this.diagSum === targetSum &&
        this.diagonalTiles.length > 0
      ) {
        matchedTiles = this.diagonalTiles;
        matchedSum = this.diagSum;
      }
    } else if (this.activeAction === 'diagonal') {
      if (this.diagSum === targetSum && this.diagonalSelected.length > 0) {
        matchedTiles = this.diagonalSelected;
        matchedSum = this.diagSum;
      }
    }

    if (matchedTiles) {
      this.ctxAccess.onClear(matchedTiles, matchedSum);
    }
  }

  private recalculateSelection(): void {
    const board = this.ctxAccess.getBoardState();
    const pitch = getGridPitch(board.shapeSize, board.tileBorder);
    const targetSum = this.ctxAccess.getTargetSum();

    if (this.activeAction === 'box') {
      const detailed = calculateDetailedBoxSelection(
        this.startTile,
        this.currentTile,
        this.dragStart,
        this.dragCurrent,
        board.cols,
        board.rows,
        pitch
      );
      this.dirX = detailed.dirX;
      this.dirY = detailed.dirY;

      const selectionKey = `box:${this.startTile.col},${this.startTile.row}-${this.currentTile.col},${this.currentTile.row}`;

      if (detailed.isSquare) {
        this.boxTiles = detailed.boxTiles;
        this.isSquare = true;
        this.diagonalTiles = detailed.diagonalTiles;
        this.boxSum = this.calculateTileSum(detailed.boxTiles, board.matrix);
        this.diagSum = this.calculateTileSum(detailed.diagonalTiles, board.matrix);

        if (this.lastSelectionKey !== selectionKey) {
          this.lastSelectionKey = selectionKey;
          const isValid = this.boxSum === targetSum || this.diagSum === targetSum;
          this.ctxAccess.onSelectionChange?.(detailed.boxTiles, this.boxSum, isValid);
        }
      } else {
        const tiles = detailed.boxTiles;
        this.boxTiles = tiles;
        this.isSquare = false;
        this.diagonalTiles = [];
        this.boxSum = this.calculateTileSum(tiles, board.matrix);
        this.diagSum = 0;

        if (this.lastSelectionKey !== selectionKey) {
          this.lastSelectionKey = selectionKey;
          const isValid = this.boxSum === targetSum;
          this.ctxAccess.onSelectionChange?.(tiles, this.boxSum, isValid);
        }
      }
    } else if (this.activeAction === 'diagonal' && !this.isShiftPressed) {
      const curTile = getTileFromCanvasPos(this.dragCurrent, board.cols, board.rows, pitch);
      this.currentTile = curTile;
      const selectionKey = `diag:${this.startTile.col},${this.startTile.row}-${curTile.col},${curTile.row}`;
      const selected = calculateDiagonalSelection(
        this.startTile,
        this.dragCurrent,
        board.cols,
        board.rows,
        pitch
      );
      this.diagonalSelected = selected;
      this.diagSum = this.calculateTileSum(selected, board.matrix);
      this.boxSum = 0;

      if (this.lastSelectionKey !== selectionKey) {
        this.lastSelectionKey = selectionKey;
        const isValid = this.diagSum === targetSum;
        this.ctxAccess.onSelectionChange?.(selected, this.diagSum, isValid);
      }
    }
  }

  private updateCursor(): void {
    if (!this.ctxAccess.isInteractive()) {
      if (this.lastCursor !== 'not-allowed') {
        this.lastCursor = 'not-allowed';
        this.canvas.style.cursor = 'not-allowed';
      }
      return;
    }
    if (this.ctxAccess.isPanMode?.()) {
      const panCursor = this.isPointerDownOnCanvas ? 'grabbing' : 'grab';
      if (this.lastCursor !== panCursor) {
        this.lastCursor = panCursor;
        this.canvas.style.cursor = panCursor;
      }
      return;
    }
    if (this.ctxAccess.isItemActive?.()) {
      if (this.lastCursor !== 'pointer') {
        this.lastCursor = 'pointer';
        this.canvas.style.cursor = 'pointer';
      }
      return;
    }
    const targetCursor =
      this.activeAction === 'diagonal' && this.isShiftPressed ? 'none' : 'crosshair';
    if (this.lastCursor !== targetCursor) {
      this.lastCursor = targetCursor;
      this.canvas.style.cursor = targetCursor;
    }
  }

  public resetSelectionState(): void {
    this.selectMode = 'drag';
    this.isPointerDownOnCanvas = false;
    this.activeAction = null;
    this.diagonalSelected = [];
    this.boxTiles = [];
    this.isSquare = false;
    this.diagonalTiles = [];
    this.boxSum = 0;
    this.diagSum = 0;
    this.lastSelectionKey = '';
    this.updateCursor();
    this.ctxAccess.onSelectionChange?.([], 0, false);
  }

  private calculateTileSum(tiles: TileCoord[], matrix: number[][]): number {
    let regularSum = 0;
    let omniCount = 0;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      const val = matrix[t.row]?.[t.col] ?? 0;
      if (val === OMNITILE_VALUE) {
        omniCount++;
      } else if (val > 0) {
        regularSum += val;
      }
    }
    if (omniCount > 0) {
      return regularSum <= 10 ? 10 : regularSum;
    }
    return regularSum;
  }
}
