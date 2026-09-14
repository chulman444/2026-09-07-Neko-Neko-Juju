import { useRef, useState, useCallback } from 'react';
import { useBoardStore } from '@/entities/board';
import { usePlayerStore } from '@/entities/player';

interface UseTrackballOptions {
  sensitivity?: number;
  inverseMovement?: boolean;
}

export function useTrackball(options: UseTrackballOptions = {}) {
  const rows = useBoardStore((state) => state.rows);
  const cols = useBoardStore((state) => state.cols);
  const shapeSize = useBoardStore((state) => state.shapeSize);
  const panOffset = useBoardStore((state) => state.panOffset);
  const inversePan = usePlayerStore((state) => state.inversePan);
  const panSensitivity = usePlayerStore((state) => state.panSensitivity);
  const setPanOffset = useBoardStore((state) => state.setPanOffset);
  const resetPanOffset = useBoardStore((state) => state.resetPanOffset);

  const sensitivity = options.sensitivity ?? panSensitivity;
  const inverseMovement = options.inverseMovement ?? inversePan;

  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const trackballPadRef = useRef<HTMLDivElement | null>(null);

  const dragStateRef = useRef({
    isDragging: false,
    startPointerX: 0,
    startPointerY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  // Compute pan limits dynamically from board dimensions
  const gap = 4;
  const boardWidth = cols * (shapeSize + gap) + gap;
  const boardHeight = rows * (shapeSize + gap) + gap;
  const panLimitX = Math.max(400, boardWidth * 0.6);
  const panLimitY = Math.max(400, boardHeight * 0.6);

  const handleTrackballPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const pad = trackballPadRef.current;
      if (!pad) return;

      pad.setPointerCapture(e.pointerId);
      dragStateRef.current = {
        isDragging: true,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
    },
    [panOffset.x, panOffset.y]
  );

  const handleTrackballPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current.isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const { startPointerX, startPointerY, startPanX, startPanY } = dragStateRef.current;

      const deltaX = e.clientX - startPointerX;
      const deltaY = e.clientY - startPointerY;

      const coeff = inverseMovement ? -1 : 1;
      const nextPanX = clamp(startPanX + deltaX * sensitivity * coeff, -panLimitX, panLimitX);
      const nextPanY = clamp(startPanY + deltaY * sensitivity * coeff, -panLimitY, panLimitY);

      setPanOffset({ x: nextPanX, y: nextPanY });

      // Local knob visual translation offsets clamped to 18px circle
      const currentDistance = Math.hypot(deltaX, deltaY);
      const maxVisualRadius = 18;

      let knobX = deltaX;
      let knobY = deltaY;

      if (currentDistance > maxVisualRadius) {
        knobX = (deltaX / currentDistance) * maxVisualRadius;
        knobY = (deltaY / currentDistance) * maxVisualRadius;
      }

      setKnobOffset({ x: knobX, y: knobY });
    },
    [sensitivity, inverseMovement, panLimitX, panLimitY, setPanOffset]
  );

  const handleTrackballPointerUpOrCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current.isDragging) return;

      dragStateRef.current.isDragging = false;

      const pad = trackballPadRef.current;
      if (pad && pad.hasPointerCapture(e.pointerId)) {
        pad.releasePointerCapture(e.pointerId);
      }

      // Spring back to center
      setKnobOffset({ x: 0, y: 0 });
    },
    []
  );

  const handleTrackballDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resetPanOffset();
      setKnobOffset({ x: 0, y: 0 });
    },
    [resetPanOffset]
  );

  return {
    panOffset,
    knobOffset,
    trackballPadRef,
    handleTrackballPointerDown,
    handleTrackballPointerMove,
    handleTrackballPointerUpOrCancel,
    handleTrackballDoubleClick,
    resetPanOffset,
  };
}
