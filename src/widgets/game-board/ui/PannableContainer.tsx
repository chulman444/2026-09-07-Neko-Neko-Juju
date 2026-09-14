import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useBoardStore } from '@/entities/board';

export interface PannableContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PannableContainer: React.FC<PannableContainerProps> = ({
  children,
  className = '',
  style,
}) => {
  const panOffset = useBoardStore((state) => state.panOffset);
  const setPanOffset = useBoardStore((state) => state.setPanOffset);
  const isPanMode = useBoardStore((state) => state.isPanMode);
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const shapeSize = useBoardStore((state) => state.shapeSize);

  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

  // Compute pan limits based on board dimensions
  const gap = 4;
  const boardWidth = cols * (shapeSize + gap) + gap;
  const boardHeight = rows * (shapeSize + gap) + gap;
  const panLimitX = Math.max(400, boardWidth * 0.6);
  const panLimitY = Math.max(400, boardHeight * 0.6);

  const canStartPan = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): boolean => {
      const isCanvas = (e.target as HTMLElement).tagName.toLowerCase() === 'canvas';

      // 1. Pan Mode active: any mouse button (0: LMB, 1: MMB, 2: RMB) pans
      if (isPanMode) {
        return e.button === 0 || e.button === 1 || e.button === 2;
      }

      // 2. Normal Mode:
      // MMB (button 1) always pans anywhere (even directly on board canvas)
      if (e.button === 1) {
        return true;
      }

      // RMB (button 2) pans ONLY when started in the empty area outside the canvas
      if (e.button === 2 && !isCanvas) {
        return true;
      }

      return false;
    },
    [isPanMode]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canStartPan(e)) return;

    e.preventDefault();
    isPanningRef.current = true;
    setIsPanning(true);

    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isPanningRef.current) return;
      e.preventDefault();

      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;

      const nextX = clamp(panStartRef.current.initialPanX + dx, -panLimitX, panLimitX);
      const nextY = clamp(panStartRef.current.initialPanY + dy, -panLimitY, panLimitY);

      setPanOffset({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      setIsPanning(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [panLimitX, panLimitY, setPanOffset]);

  const cursorClass = isPanning ? 'cursor-grabbing' : isPanMode ? 'cursor-grab' : '';

  return (
    <div
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative overflow-hidden flex items-center justify-center select-none ${cursorClass} ${className}`}
      style={style}
    >
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: isPanning ? 'none' : 'transform 0.04s ease-out',
        }}
        className="relative flex items-center justify-center"
      >
        {children}
      </div>
    </div>
  );
};
