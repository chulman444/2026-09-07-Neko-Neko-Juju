import { useBoardStore } from '@/entities/board';

export interface DevHotkeysListenerOptions {
  targetCanvasSelector?: string;
  onTileMutated?: (col: number, row: number, val: number) => void;
}

export function attachDevHotkeysListener(options?: DevHotkeysListenerOptions): () => void {
  const targetCanvasSelector = options?.targetCanvasSelector ?? 'main canvas, canvas';
  let hoverTile: { col: number; row: number } | null = null;

  const handlePointerMove = (e: PointerEvent) => {
    const canvas = document.querySelector<HTMLCanvasElement>(targetCanvasSelector);
    if (!canvas) {
      hoverTile = null;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      hoverTile = null;
      return;
    }

    const { shapeSize, tileBorder, cols, rows } = useBoardStore.getState();
    const pitch = shapeSize + tileBorder * 2;
    if (pitch <= 0) {
      hoverTile = null;
      return;
    }

    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(canvasX / pitch);
    const row = Math.floor(canvasY / pitch);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      hoverTile = { col, row };
    } else {
      hoverTile = null;
    }
  };

  const handlePointerLeave = () => {
    hoverTile = null;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as { tagName?: string; isContentEditable?: boolean } | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        Boolean(target.isContentEditable))
    ) {
      return;
    }

    if (!hoverTile) return;

    const { col, row } = hoverTile;
    const boardStore = useBoardStore.getState();

    if (e.key >= '1' && e.key <= '9') {
      const val = parseInt(e.key, 10);
      boardStore.setTileValue(col, row, val);
      options?.onTileMutated?.(col, row, val);
    } else if (e.key === 'Backspace') {
      boardStore.setTileValue(col, row, 0);
      options?.onTileMutated?.(col, row, 0);
    } else if (e.key.toLowerCase() === 'r') {
      const { minNum, maxNum, matrix } = boardStore;
      const currentVal = matrix[row]?.[col] ?? 0;
      let newVal = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
      if (currentVal > 0 && maxNum > minNum) {
        while (newVal === currentVal) {
          newVal = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        }
      }
      boardStore.setTileValue(col, row, newVal);
      options?.onTileMutated?.(col, row, newVal);
    }
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerleave', handlePointerLeave);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerleave', handlePointerLeave);
    window.removeEventListener('keydown', handleKeyDown);
    hoverTile = null;
  };
}
