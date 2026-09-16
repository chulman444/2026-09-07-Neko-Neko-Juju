import React, { useRef, useEffect } from 'react';
import { useBoardMakerStore } from '@/entities/board-maker';
import { BM_COLOR_PALETTE } from '@/shared/config';

const HEATMAP_COLORS: Record<number, string> = {
  1: '#10b981', // green
  2: '#3b82f6', // blue
  3: '#f59e0b', // amber
  4: '#f97316', // orange
  5: '#ef4444', // red
};

export const DrawerCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cols = useBoardMakerStore((state) => state.cols);
  const rows = useBoardMakerStore((state) => state.rows);
  const matrix = useBoardMakerStore((state) => state.matrix);
  const stacks = useBoardMakerStore((state) => state.stacks);
  const heatmapMode = useBoardMakerStore((state) => state.heatmapMode);

  const addTileAt = useBoardMakerStore((state) => state.addTileAt);
  const removeTileAt = useBoardMakerStore((state) => state.removeTileAt);
  const setTileValue = useBoardMakerStore((state) => state.setTileValue);
  const cycleTileValue = useBoardMakerStore((state) => state.cycleTileValue);

  const tileSize = 36;
  const isDrawingRef = useRef(false);
  const drawingActionRef = useRef<'add' | 'remove'>('add');
  const lastInteractedKeyRef = useRef<string | null>(null);
  const currentHoveredCoordRef = useRef<{ col: number; row: number } | null>(null);

  const dimensionsRef = useRef({ cols, rows });
  useEffect(() => {
    dimensionsRef.current = { cols, rows };
  }, [cols, rows]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r]?.[c] ?? 0;
        const stack = stacks[`${c},${r}`];
        const stackLen = stack?.length ?? 0;
        const totalDepth = val > 0 ? stackLen + 1 : 0;

        const cellX = c * tileSize;
        const cellY = r * tileSize;

        // Background color determination
        if (val === 0) {
          ctx.fillStyle = '#ffffff';
        } else if (heatmapMode) {
          ctx.fillStyle = HEATMAP_COLORS[Math.min(totalDepth, 5)] || '#8b5cf6';
        } else {
          ctx.fillStyle = BM_COLOR_PALETTE[val] || '#3b82f6';
        }

        ctx.fillRect(cellX, cellY, tileSize, tileSize);

        // Tile border
        ctx.strokeStyle = '#e7cfa8';
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, tileSize, tileSize);

        // Draw tile number
        if (val > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val.toString(), cellX + tileSize / 2, cellY + tileSize / 2);
        }

        // Draw stack depth badge if stacked
        if (totalDepth > 1) {
          const badgeText = `x${totalDepth}`;
          const badgeW = badgeText.length >= 3 ? 18 : 15;
          const badgeH = 12;
          const badgeX = cellX + tileSize - badgeW - 1;
          const badgeY = cellY + 1;

          ctx.save();
          ctx.fillStyle = '#7c2d12'; // deep rust/amber
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2);
          ctx.fill();

          ctx.fillStyle = '#fef3c7';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
          ctx.restore();
        }
      }
    }
  }, [cols, rows, matrix, stacks, heatmapMode, tileSize]);

  // Handle Mouse / Wheel / Keyboard Events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCoord = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / tileSize);
      const row = Math.floor(y / tileSize);
      const { cols: curCols, rows: curRows } = dimensionsRef.current;
      if (col >= 0 && col < curCols && row >= 0 && row < curRows) {
        return { col, row };
      }
      return null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const coord = getCoord(e);
      if (!coord) return;

      e.preventDefault();
      isDrawingRef.current = true;
      drawingActionRef.current = e.button === 2 ? 'remove' : 'add';
      lastInteractedKeyRef.current = `${coord.col},${coord.row}`;

      if (drawingActionRef.current === 'add') {
        addTileAt(coord.col, coord.row);
      } else {
        removeTileAt(coord.col, coord.row);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const coord = getCoord(e);
      currentHoveredCoordRef.current = coord;

      if (!isDrawingRef.current || !coord) return;
      const key = `${coord.col},${coord.row}`;
      if (lastInteractedKeyRef.current === key) return;

      lastInteractedKeyRef.current = key;
      if (drawingActionRef.current === 'add') {
        addTileAt(coord.col, coord.row);
      } else {
        removeTileAt(coord.col, coord.row);
      }
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
      lastInteractedKeyRef.current = null;
    };

    const handleMouseLeave = () => {
      currentHoveredCoordRef.current = null;
      isDrawingRef.current = false;
      lastInteractedKeyRef.current = null;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleWheel = (e: WheelEvent) => {
      const coord = currentHoveredCoordRef.current;
      if (coord) {
        e.preventDefault();
        cycleTileValue(coord.col, coord.row, e.deltaY < 0 ? 1 : -1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const coord = currentHoveredCoordRef.current;
      if (coord && e.key >= '0' && e.key <= '9') {
        setTileValue(coord.col, coord.row, parseInt(e.key, 10));
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addTileAt, removeTileAt, setTileValue, cycleTileValue, tileSize]);

  return (
    <div className="h-[420px] max-h-[420px] overflow-auto bg-amber-50/50 dark:bg-zinc-900 border border-amber-900/20 dark:border-zinc-700 rounded-xl p-3 flex justify-center items-center select-none shadow-inner">
      <canvas
        ref={canvasRef}
        id="bmGridCanvas"
        className="cursor-crosshair block rounded shadow border border-amber-900/10"
      />
    </div>
  );
};
