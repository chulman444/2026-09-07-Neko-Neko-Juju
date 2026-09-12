import React, { useRef, useEffect } from 'react';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { GameBoardEngine } from '../model/GameBoardEngine';
import { getGridPitch } from '../lib/coordinates';

export interface GameBoardWidgetProps {
  /** Optional 2D array override. If not passed, reads from useBoardStore */
  matrix?: number[][];
  /** Whether user can interact with the board. Defaults to true */
  interactive?: boolean;
  /** Target sum required to clear tiles (default 10) */
  targetSum?: number;
  /** Whether two-click / tap selection is enabled (default true) */
  twoClickSelection?: boolean;
  /** Whether hovering over tiles in tap mode live updates the preview (default true) */
  hoverLiveSelection?: boolean;
  /** Highlighted tile coordinates (e.g. for hint system) */
  highlightedTiles?: TileCoord[];
  /** Targeted tile coordinate for item application (e.g. Random Choose) */
  targetTile?: TileCoord | null;
  /** Board background color override */
  gameBg?: string;
  /** Callback fired when a valid set of tiles is matched and cleared */
  onTilesCleared?: (tiles: TileCoord[], sum: number) => void;
  /** Callback fired whenever user selects tiles */
  onSelectionChange?: (tiles: TileCoord[], sum: number, isValid: boolean) => void;
  /** Callback fired when a single tile is clicked without drag (e.g. for item placement) */
  onTileClick?: (tile: TileCoord) => void;
  className?: string;
}

export const GameBoardWidget: React.FC<GameBoardWidgetProps> = ({
  matrix,
  interactive = true,
  targetSum = 10,
  twoClickSelection = true,
  hoverLiveSelection = true,
  highlightedTiles = [],
  targetTile = null,
  gameBg = '#fbf2df',
  onTilesCleared,
  onSelectionChange,
  onTileClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameBoardEngine | null>(null);

  const shapeSize = useBoardStore((state) => state.shapeSize);
  const tileBorder = useBoardStore((state) => state.tileBorder);
  const storeCols = useBoardStore((state) => state.cols);
  const storeRows = useBoardStore((state) => state.rows);

  const cols = matrix && matrix.length > 0 ? (matrix[0]?.length ?? storeCols) : storeCols;
  const rows = matrix ? matrix.length : storeRows;
  const pitch = getGridPitch(shapeSize, tileBorder);
  const canvasWidth = cols * pitch;
  const canvasHeight = rows * pitch;

  // Setup engine on canvas mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameBoardEngine({
      canvas,
      interactive,
      targetSum,
      matrix,
      highlightedTiles,
      targetTile,
      visualConfig: { gameBg, twoClickSelection, hoverLiveSelection },
      onTilesCleared,
      onSelectionChange,
      onTileClick,
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize dynamic prop updates without tearing down the engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setInteractive(interactive);
    }
  }, [interactive]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTargetSum(targetSum);
    }
  }, [targetSum]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVisualConfig({ gameBg, twoClickSelection, hoverLiveSelection });
    }
  }, [gameBg, twoClickSelection, hoverLiveSelection]);

  const lastMatrixPropRef = useRef<number[][] | undefined>(matrix ? matrix.map((r) => [...r]) : undefined);

  useEffect(() => {
    if (!engineRef.current) return;
    const prev = lastMatrixPropRef.current;
    const isSame =
      (matrix === undefined && prev === undefined) ||
      (matrix !== undefined &&
        prev !== undefined &&
        matrix.length === prev.length &&
        matrix.every((row, r) => {
          const prevRow = prev[r];
          return prevRow && row.length === prevRow.length && row.every((val, c) => val === prevRow[c]);
        }));

    if (!isSame) {
      lastMatrixPropRef.current = matrix ? matrix.map((r) => [...r]) : undefined;
      engineRef.current.setMatrixOverride(matrix);
    }
  }, [matrix]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setHighlightedTiles(highlightedTiles);
    }
  }, [highlightedTiles]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTargetTile(targetTile ?? null);
    }
  }, [targetTile]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCallbacks(onTilesCleared, onSelectionChange, onTileClick);
    }
  }, [onTilesCleared, onSelectionChange, onTileClick]);

  return (
    <div className={`inline-block select-none ${className}`}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="block rounded-xl shadow-inner border border-amber-900/10"
        style={{
          backgroundColor: gameBg,
          touchAction: 'none',
        }}
      />
    </div>
  );
};
