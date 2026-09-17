import React, { useRef, useEffect } from 'react';
import { useBoardMakerStore, getFullStackAt, type Brush } from '@/entities/board-maker';
import { BM_COLOR_PALETTE } from '@/shared/config';

const HEATMAP_COLORS: Record<number, string> = {
  1: '#10b981', // green
  2: '#3b82f6', // blue
  3: '#f59e0b', // amber
  4: '#f97316', // orange
  5: '#ef4444', // red
};

export const DrawerCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cols = useBoardMakerStore((state) => state.cols);
  const rows = useBoardMakerStore((state) => state.rows);
  const matrix = useBoardMakerStore((state) => state.matrix);
  const stacks = useBoardMakerStore((state) => state.stacks);
  const activeLayer = useBoardMakerStore((state) => state.activeLayer);
  const inspectedStack = useBoardMakerStore((state) => state.inspectedStack);
  const heatmapMode = useBoardMakerStore((state) => state.heatmapMode);

  const setTileAtLayer = useBoardMakerStore((state) => state.setTileAtLayer);
  const setSelectedBrush = useBoardMakerStore((state) => state.setSelectedBrush);
  const setInspectedStack = useBoardMakerStore((state) => state.setInspectedStack);

  const tileSize = 36;
  const isDrawingRef = useRef(false);
  const drawingBrushRef = useRef<Brush>(1);
  const lastInteractedKeyRef = useRef<string | null>(null);
  const currentHoveredCoordRef = useRef<{ col: number; row: number } | null>(null);

  // Pan state for middle mouse button
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

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
        const cellX = c * tileSize;
        const cellY = r * tileSize;

        if (activeLayer === 'surface') {
          // --- Surface Mode Rendering ---
          const val = matrix[r]?.[c] ?? 0;
          const stack = stacks[`${c},${r}`];
          const stackLen = stack?.length ?? 0;
          const totalDepth = val > 0 ? stackLen + 1 : 0;

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
        } else {
          // --- Active Layer Mode Rendering ---
          const z = activeLayer;
          const fullStack = getFullStackAt(matrix, stacks, c, r);
          const hasSupport = z === 0 || fullStack.length >= z;
          const valAtZ = fullStack[z] ?? 0;
          const topVal = matrix[r]?.[c] ?? 0;

          if (!hasSupport) {
            // If a tile exists elsewhere in this stack, draw it ghosted underneath
            if (topVal > 0) {
              ctx.save();
              ctx.globalAlpha = 0.3;
              ctx.fillStyle = BM_COLOR_PALETTE[topVal] || '#3b82f6';
              ctx.fillRect(cellX, cellY, tileSize, tileSize);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 14px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(topVal.toString(), cellX + tileSize / 2, cellY + tileSize / 2);
              ctx.restore();

              // Translucent cannot-draw hatch overlay
              ctx.fillStyle = 'rgba(24, 24, 27, 0.75)';
              ctx.fillRect(cellX, cellY, tileSize, tileSize);
            } else {
              // Plain dark background for completely empty non-drawable cells
              ctx.fillStyle = '#27272a';
              ctx.fillRect(cellX, cellY, tileSize, tileSize);
            }

            // Diagonal hatch line
            ctx.strokeStyle = '#52525b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cellX, cellY + tileSize);
            ctx.lineTo(cellX + tileSize, cellY);
            ctx.stroke();

            ctx.strokeStyle = '#3f3f46';
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX, cellY, tileSize, tileSize);
          } else {
            // Supported cell
            if (valAtZ === 0) {
              // If supported empty slot at z > 0, show the top tile underneath ghosted
              if (topVal > 0) {
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = BM_COLOR_PALETTE[topVal] || '#3b82f6';
                ctx.fillRect(cellX, cellY, tileSize, tileSize);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(topVal.toString(), cellX + tileSize / 2, cellY + tileSize / 2);
                ctx.restore();

                // Platform border & dot indicating it can be drawn on
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.fillRect(cellX, cellY, tileSize, tileSize);

                ctx.fillStyle = '#0284c7';
                ctx.beginPath();
                ctx.arc(cellX + tileSize / 2, cellY + tileSize / 2, 3, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cellX, cellY, tileSize, tileSize);
              }
            } else {
              ctx.fillStyle = BM_COLOR_PALETTE[valAtZ] || '#3b82f6';
              ctx.fillRect(cellX, cellY, tileSize, tileSize);

              // Draw tile number
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 14px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(valAtZ.toString(), cellX + tileSize / 2, cellY + tileSize / 2);

              // Badge if tiles exist above layer Z
              if (fullStack.length > z + 1) {
                const aboveCount = fullStack.length - (z + 1);
                const badgeText = `+${aboveCount}`;
                const badgeW = 15;
                const badgeH = 12;
                const badgeX = cellX + tileSize - badgeW - 1;
                const badgeY = cellY + 1;

                ctx.save();
                ctx.fillStyle = '#1e3a8a'; // dark blue
                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2);
                ctx.fill();

                ctx.fillStyle = '#dbeafe';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
                ctx.restore();
              }
            }

            ctx.strokeStyle = '#e7cfa8';
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX, cellY, tileSize, tileSize);
          }
        }

        // Highlight currently inspected coordinate if matched
        if (inspectedStack && inspectedStack.col === c && inspectedStack.row === r) {
          ctx.save();
          ctx.strokeStyle = '#0284c7'; // vibrant sky-600
          ctx.lineWidth = 2.5;
          ctx.strokeRect(cellX + 1, cellY + 1, tileSize - 2, tileSize - 2);
          ctx.restore();
        }
      }
    }
  }, [cols, rows, matrix, stacks, activeLayer, inspectedStack, heatmapMode, tileSize]);

  // Handle Mouse / Wheel / Keyboard Events
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
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
      // Middle Click (button 1): Drag to pan container
      if (e.button === 1) {
        e.preventDefault();
        isPanningRef.current = true;
        if (container) {
          panStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
          };
          container.style.cursor = 'grabbing';
        }
        return;
      }

      const coord = getCoord(e);
      if (!coord) return;

      // Ctrl + Left Click: Inspect stack
      if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setInspectedStack({ col: coord.col, row: coord.row });
        return;
      }

      e.preventDefault();
      const curState = useBoardMakerStore.getState();
      const brushToUse: Brush = e.button === 2 ? 0 : curState.selectedBrush;

      isDrawingRef.current = true;
      drawingBrushRef.current = brushToUse;
      lastInteractedKeyRef.current = `${coord.col},${coord.row}`;

      setTileAtLayer(coord.col, coord.row, curState.activeLayer, brushToUse);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Handle Middle-click panning
      if (isPanningRef.current && container) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        container.scrollLeft = panStartRef.current.scrollLeft - dx;
        container.scrollTop = panStartRef.current.scrollTop - dy;
        return;
      }

      const coord = getCoord(e);
      currentHoveredCoordRef.current = coord;

      if (!isDrawingRef.current || !coord) return;
      const key = `${coord.col},${coord.row}`;
      if (lastInteractedKeyRef.current === key) return;

      lastInteractedKeyRef.current = key;
      const curState = useBoardMakerStore.getState();
      setTileAtLayer(coord.col, coord.row, curState.activeLayer, drawingBrushRef.current);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1 && isPanningRef.current) {
        isPanningRef.current = false;
        if (container) {
          container.style.cursor = '';
        }
      }
      isDrawingRef.current = false;
      lastInteractedKeyRef.current = null;
    };

    const handleMouseLeave = () => {
      currentHoveredCoordRef.current = null;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Scroll wheel: Cycle selectedBrush strictly through 1-9 (excluding 0, -, +)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const curBrush = useBoardMakerStore.getState().selectedBrush;
      let nextNum: number;
      if (typeof curBrush !== 'number' || curBrush < 1 || curBrush > 9) {
        nextNum = e.deltaY < 0 ? 1 : 9;
      } else {
        if (e.deltaY < 0) {
          nextNum = curBrush === 9 ? 1 : curBrush + 1;
        } else {
          nextNum = curBrush === 1 ? 9 : curBrush - 1;
        }
      }
      setSelectedBrush(nextNum);
    };

    // Keyboard shortcuts: 0-9, -, =, +
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      let brush: Brush | null = null;
      if (e.key >= '0' && e.key <= '9') {
        brush = parseInt(e.key, 10);
      } else if (e.key === '-') {
        brush = '-';
      } else if (e.key === '=' || e.key === '+') {
        brush = '+';
      }

      if (brush !== null) {
        setSelectedBrush(brush);
        const coord = currentHoveredCoordRef.current;
        if (coord) {
          const curState = useBoardMakerStore.getState();
          setTileAtLayer(coord.col, coord.row, curState.activeLayer, brush);
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('wheel', handleWheel);
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setTileAtLayer, setSelectedBrush, setInspectedStack, tileSize]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] max-h-[420px] overflow-auto bg-amber-50/50 dark:bg-zinc-900 border border-amber-900/20 dark:border-zinc-700 rounded-xl p-3 flex select-none shadow-inner"
    >
      <canvas
        ref={canvasRef}
        id="bmGridCanvas"
        className="m-auto cursor-crosshair block rounded shadow border border-amber-900/10"
      />
    </div>
  );
};
