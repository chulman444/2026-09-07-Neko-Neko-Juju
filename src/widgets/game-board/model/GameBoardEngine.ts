import { useBoardStore, type TileCoord } from '@/entities/board';
import { GameBoardInteraction, type BoardContextAccess } from './GameBoardInteraction';
import { GameBoardRenderer } from './GameBoardRenderer';
import type { BoardVisualConfig, BoardRenderState } from './types';

export interface GameBoardEngineOptions {
  canvas: HTMLCanvasElement;
  interactive?: boolean;
  targetSum?: number;
  matrix?: number[][];
  highlightedTiles?: TileCoord[];
  visualConfig?: Partial<BoardVisualConfig>;
  onTilesCleared?: (tiles: TileCoord[], sum: number) => void;
  onSelectionChange?: (tiles: TileCoord[], sum: number, isValid: boolean) => void;
  onTileClick?: (tile: TileCoord) => void;
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
  private highlightedTiles: TileCoord[] = [];
  private onTilesCleared?: (tiles: TileCoord[], sum: number) => void;
  private onSelectionChange?: (tiles: TileCoord[], sum: number, isValid: boolean) => void;
  private onTileClick?: (tile: TileCoord) => void;
  private visualConfig: BoardVisualConfig;

  constructor(options: GameBoardEngineOptions) {
    this.canvas = options.canvas;
    this.interactive = options.interactive ?? true;
    this.targetSum = options.targetSum ?? 10;
    this.matrixOverride = options.matrix ? options.matrix.map((row) => [...row]) : undefined;
    this.highlightedTiles = options.highlightedTiles ?? [];
    this.onTilesCleared = options.onTilesCleared;
    this.onSelectionChange = options.onSelectionChange;
    this.onTileClick = options.onTileClick;

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
      twoClickSelection: options.visualConfig?.twoClickSelection ?? true,
      hoverLiveSelection: options.visualConfig?.hoverLiveSelection ?? true,
    };

    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => this.targetSum,
      isInteractive: () => this.interactive,
      getBoardState: () => this.getBoardState(),
      getVisualConfig: () => this.visualConfig,
      onClear: (tiles, sum) => this.handleClear(tiles, sum),
      onSelectionChange: (tiles, sum, isValid) => this.onSelectionChange?.(tiles, sum, isValid),
      onTileClick: (tile) => this.onTileClick?.(tile),
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

  public setMatrixOverride(matrix?: number[][]): void {
    this.matrixOverride = matrix ? matrix.map((row) => [...row]) : undefined;
  }

  public setHighlightedTiles(tiles: TileCoord[]): void {
    this.highlightedTiles = tiles;
  }

  public setCallbacks(
    onTilesCleared?: (tiles: TileCoord[], sum: number) => void,
    onSelectionChange?: (tiles: TileCoord[], sum: number, isValid: boolean) => void,
    onTileClick?: (tile: TileCoord) => void
  ): void {
    this.onTilesCleared = onTilesCleared;
    this.onSelectionChange = onSelectionChange;
    this.onTileClick = onTileClick;
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
    const rows = matrix.length;
    const cols = rows > 0 ? (matrix[0]?.length ?? 0) : 0;

    return {
      cols,
      rows,
      shapeSize: store.shapeSize,
      tileBorder: store.tileBorder,
      textSize: store.textSize,
      matrix,
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

    // 1. Add clearing animation to board state
    tiles.forEach((t) => {
      const val = (this.matrixOverride ?? store.matrix)[t.row]?.[t.col] ?? 0;
      if (val > 0) {
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
          rowArr[col] = 0;
        }
      });
    }

    // 3. Clear tiles in store
    store.clearTiles(tiles);

    // 4. Emit event to listeners (timer, score counter, etc.)
    this.onTilesCleared?.(tiles, sum);
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
        timestamp
      );

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }
}
