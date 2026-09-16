import { useBoardStore, type TileCoord } from '@/entities/board';
import { useItemStore } from '@/entities/item';
import {
  GameBoardInteraction,
  type BoardContextAccess,
  type SelectionMeta,
} from './GameBoardInteraction';
import { GameBoardRenderer } from './GameBoardRenderer';
import type { BoardVisualConfig, BoardRenderState } from './types';

export interface GameBoardEngineOptions {
  canvas: HTMLCanvasElement;
  interactive?: boolean;
  targetSum?: number;
  matrix?: number[][];
  stacks?: Record<string, number[]>;
  highlightedTiles?: TileCoord[];
  targetTile?: TileCoord | null;
  visualConfig?: Partial<BoardVisualConfig>;
  onTilesCleared?: (tiles: TileCoord[], sum: number, actualCount?: number) => void;
  onSelectionChange?: (
    tiles: TileCoord[],
    sum: number,
    isValid: boolean,
    meta?: SelectionMeta
  ) => void;
  onTileClick?: (tile: TileCoord) => boolean | void;
  isItemActive?: () => boolean;
}

export class GameBoardEngine {
  private canvas: HTMLCanvasElement;
  private interaction: GameBoardInteraction;
  private renderer: GameBoardRenderer;
  private animId: number | null = null;
  private lastTimestamp: number | null = null;

  // Options & Overrides
  private interactive = true;
  private targetSum = 10;
  private matrixOverride?: number[][];
  private stacksOverride?: Record<string, number[]>;
  private highlightedTiles: TileCoord[] = [];
  private targetTile: TileCoord | null = null;
  private onTilesCleared?: (tiles: TileCoord[], sum: number, actualCount?: number) => void;
  private onSelectionChange?: (
    tiles: TileCoord[],
    sum: number,
    isValid: boolean,
    meta?: SelectionMeta
  ) => void;
  private onTileClick?: (tile: TileCoord) => boolean | void;
  private isItemActiveProp?: () => boolean;
  private visualConfig: BoardVisualConfig;

  constructor(options: GameBoardEngineOptions) {
    this.canvas = options.canvas;
    this.interactive = options.interactive ?? true;
    this.targetSum = options.targetSum ?? 10;
    this.matrixOverride = options.matrix ? options.matrix.map((row) => [...row]) : undefined;
    this.stacksOverride = options.stacks
      ? Object.fromEntries(Object.entries(options.stacks).map(([k, v]) => [k, [...v]]))
      : undefined;
    this.highlightedTiles = options.highlightedTiles ?? [];
    this.targetTile = options.targetTile ?? null;
    this.onTilesCleared = options.onTilesCleared;
    this.onSelectionChange = options.onSelectionChange;
    this.onTileClick = options.onTileClick;
    this.isItemActiveProp = options.isItemActive;

    this.visualConfig = {
      gameBg: options.visualConfig?.gameBg ?? '#fbf2df',
      selectionColor: options.visualConfig?.selectionColor ?? '#ff9f1c',
      validColor: options.visualConfig?.validColor ?? '#10b981',
      textColor: options.visualConfig?.textColor ?? '#ffffff',
      textBorderColor: options.visualConfig?.textBorderColor ?? '#4a2e12',
      groupingMode: options.visualConfig?.groupingMode ?? 'auto-square',
      clearAnimationType: options.visualConfig?.clearAnimationType ?? 'munching',
      munchDuration: options.visualConfig?.munchDuration ?? 600,
      fadeoutDuration: options.visualConfig?.fadeoutDuration ?? 400,
      munchSpeed: options.visualConfig?.munchSpeed ?? 80,
      checkerboardMode: options.visualConfig?.checkerboardMode ?? '2-color',
      checkerColors: options.visualConfig?.checkerColors,
      twoClickSelection: options.visualConfig?.twoClickSelection ?? true,
      hoverLiveSelection: options.visualConfig?.hoverLiveSelection ?? true,
    };

    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => this.targetSum,
      isInteractive: () => this.interactive,
      isPanMode: () => useBoardStore.getState().isPanMode,
      isItemActive: () =>
        this.isItemActiveProp ? this.isItemActiveProp() : useItemStore.getState().isToggled,
      getBoardState: () => this.getBoardState(),
      getVisualConfig: () => this.visualConfig,
      onClear: (tiles, sum) => this.handleClear(tiles, sum),
      onSelectionChange: (tiles, sum, isValid, meta) =>
        this.onSelectionChange?.(tiles, sum, isValid, meta),
      onTileClick: (tile) => (this.onTileClick ? Boolean(this.onTileClick(tile)) : false),
    };

    this.interaction = new GameBoardInteraction(this.canvas, ctxAccess);
    this.renderer = new GameBoardRenderer(this.canvas, this.targetSum);
  }

  public setInteractive(interactive: boolean): void {
    this.interactive = interactive;
  }

  public setTargetSum(targetSum: number): void {
    this.targetSum = targetSum;
    this.renderer.setTargetSum(targetSum);
  }

  public setVisualConfig(config: Partial<BoardVisualConfig>): void {
    Object.assign(this.visualConfig, config);
  }

  public setMatrixOverride(matrix?: number[][], stacks?: Record<string, number[]>): void {
    this.matrixOverride = matrix ? matrix.map((row) => [...row]) : undefined;
    if (stacks !== undefined) {
      this.stacksOverride = Object.fromEntries(Object.entries(stacks).map(([k, v]) => [k, [...v]]));
    }
  }

  public setStacksOverride(stacks?: Record<string, number[]>): void {
    this.stacksOverride = stacks
      ? Object.fromEntries(Object.entries(stacks).map(([k, v]) => [k, [...v]]))
      : undefined;
  }

  public setHighlightedTiles(tiles: TileCoord[]): void {
    this.highlightedTiles = tiles;
  }

  public setTargetTile(targetTile: TileCoord | null): void {
    this.targetTile = targetTile;
  }

  public setCallbacks(
    onTilesCleared?: (tiles: TileCoord[], sum: number, actualCount?: number) => void,
    onSelectionChange?: (
      tiles: TileCoord[],
      sum: number,
      isValid: boolean,
      meta?: SelectionMeta
    ) => void,
    onTileClick?: (tile: TileCoord) => boolean | void
  ): void {
    this.onTilesCleared = onTilesCleared;
    this.onSelectionChange = onSelectionChange;
    this.onTileClick = onTileClick;
  }

  public setIsItemActive(isItemActive?: () => boolean): void {
    this.isItemActiveProp = isItemActive;
    this.interaction.updateCursorState();
  }

  public cancelSelection(): void {
    this.interaction.resetSelectionState();
  }

  public updateCursor(): void {
    this.interaction.updateCursorState();
  }

  public start(): void {
    this.interaction.bind();
    this.startLoop();
  }

  public destroy(): void {
    this.interaction.unbind();
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private getBoardState(): BoardRenderState {
    const store = useBoardStore.getState();
    const matrix = this.matrixOverride ?? store.matrix;
    const stacks = this.stacksOverride ?? store.stacks;
    const rows = matrix.length;
    const cols = rows > 0 ? (matrix[0]?.length ?? 0) : 0;

    return {
      cols,
      rows,
      shapeSize: store.shapeSize,
      tileBorder: store.tileBorder,
      textSize: store.textSize,
      matrix,
      stacks,
      clearingAnimations: store.clearingAnimations,
    };
  }

  private handleClear(tiles: TileCoord[], sum: number): void {
    const now = performance.now();
    const store = useBoardStore.getState();
    const duration =
      this.visualConfig.clearAnimationType === 'munching'
        ? this.visualConfig.munchDuration
        : this.visualConfig.fadeoutDuration;

    // 1. Add clearing animation to board state and count non-zero tiles
    let actualCount = 0;
    tiles.forEach((t) => {
      const val = (this.matrixOverride ?? store.matrix)[t.row]?.[t.col] ?? 0;
      if (val > 0) {
        actualCount++;
        store.addClearingAnimation({
          id: `${t.col}-${t.row}-${now}`,
          col: t.col,
          row: t.row,
          val,
          type: this.visualConfig.clearAnimationType,
          startTime: now,
          duration,
          bounceSpeed: this.visualConfig.munchSpeed,
        });
      }
    });

    // 2. Clear tiles in matrixOverride if present
    if (this.matrixOverride) {
      tiles.forEach(({ col, row }) => {
        const rowArr = this.matrixOverride?.[row];
        if (rowArr && (rowArr[col] ?? 0) > 0) {
          const stackKey = `${col},${row}`;
          const stack = this.stacksOverride?.[stackKey];
          if (stack && stack.length > 0) {
            rowArr[col] = stack.pop()!;
            if (stack.length === 0) {
              delete this.stacksOverride![stackKey];
            }
          } else {
            rowArr[col] = 0;
          }
        }
      });
    }

    // 3. Clear tiles in store
    store.clearTiles(tiles);

    // 4. Emit event to listeners (timer, score counter, etc.)
    this.onTilesCleared?.(tiles, sum, actualCount);
  }

  private startLoop(): void {
    const loop = (timestamp: number) => {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      this.lastTimestamp = timestamp;

      // Prune expired animations
      useBoardStore.getState().removeExpiredAnimations(timestamp);

      // Render frame
      const boardState = this.getBoardState();
      const snapshot = this.interaction.getSnapshot();
      this.renderer.render(
        boardState,
        this.visualConfig,
        snapshot,
        this.highlightedTiles,
        timestamp,
        this.targetTile
      );

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }
}
