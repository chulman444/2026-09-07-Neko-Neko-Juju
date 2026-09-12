import { describe, it, expect, vi } from 'vitest';
import { GameBoardInteraction, type BoardContextAccess } from './GameBoardInteraction';
import type { BoardVisualConfig } from './types';

function createMockCanvas() {
  const listeners: Record<string, ((e: unknown) => void)[]> = {};
  return {
    addEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((l) => l !== cb);
      }
    }),
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 400,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    }),
    style: {} as Record<string, string>,
    trigger: (event: string, data: Record<string, unknown>) => {
      listeners[event]?.forEach((cb) => cb(data));
    },
  };
}

const windowListeners: Record<string, ((e: unknown) => void)[]> = {};
(globalThis as unknown as { window: unknown }).window = {
  addEventListener: (event: string, cb: (e: unknown) => void) => {
    windowListeners[event] = windowListeners[event] || [];
    windowListeners[event].push(cb);
  },
  removeEventListener: (event: string, cb: (e: unknown) => void) => {
    if (windowListeners[event]) {
      windowListeners[event] = windowListeners[event].filter((l) => l !== cb);
    }
  },
};

function triggerWindow(event: string, data: Record<string, unknown>) {
  windowListeners[event]?.forEach((cb) => cb(data));
}

describe('GameBoardInteraction - Two-Click Selection', () => {
  const matrix = [
    [5, 5, 3],
    [2, 8, 4],
    [1, 9, 6],
  ];

  const defaultBoardState = {
    matrix,
    cols: 3,
    rows: 3,
    shapeSize: 36,
    tileBorder: 2, // pitch = 40
  };

  const defaultVisualConfig: BoardVisualConfig = {
    gameBg: '#fbf2df',
    selectionColor: '#ff9f1c',
    validColor: '#10b981',
    textColor: '#ffffff',
    textBorderColor: '#4a2e12',
    groupingMode: 'auto-square',
    clearAnimationType: 'munching',
    munchDuration: 600,
    fadeoutDuration: 400,
    munchSpeed: 80,
    twoClickSelection: true,
    hoverLiveSelection: true,
  };

  it('enters tap mode on single tile click when onTileClick returns false', () => {
    const mockCanvas = createMockCanvas();
    const onClear = vi.fn();
    const onTileClick = vi.fn().mockReturnValue(false);

    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => 10,
      isInteractive: () => true,
      getBoardState: () => defaultBoardState,
      getVisualConfig: () => defaultVisualConfig,
      onClear,
      onTileClick,
    };

    const interaction = new GameBoardInteraction(mockCanvas as unknown as HTMLCanvasElement, ctxAccess);
    interaction.bind();

    // Click on tile (0, 0) (pos x=20, y=20)
    mockCanvas.trigger('pointerdown', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });
    triggerWindow('pointerup', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });

    expect(onTileClick).toHaveBeenCalledWith({ col: 0, row: 0 });
    // Snapshot should indicate active action 'box' and tap mode
    const snapshot = interaction.getSnapshot();
    expect(snapshot.activeAction).toBe('box');
    expect(snapshot.selectMode).toBe('tap');
    expect(snapshot.startTile).toEqual({ col: 0, row: 0 });

    interaction.unbind();
  });

  it('does not enter tap mode when onTileClick returns true (consumed by item)', () => {
    const mockCanvas = createMockCanvas();
    const onClear = vi.fn();
    const onTileClick = vi.fn().mockReturnValue(true);

    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => 10,
      isInteractive: () => true,
      getBoardState: () => defaultBoardState,
      getVisualConfig: () => defaultVisualConfig,
      onClear,
      onTileClick,
    };

    const interaction = new GameBoardInteraction(mockCanvas as unknown as HTMLCanvasElement, ctxAccess);
    interaction.bind();

    mockCanvas.trigger('pointerdown', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });
    triggerWindow('pointerup', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });

    expect(onTileClick).toHaveBeenCalledWith({ col: 0, row: 0 });
    // Snapshot should be reset (no active action)
    const snapshot = interaction.getSnapshot();
    expect(snapshot.activeAction).toBeNull();

    interaction.unbind();
  });

  it('completes match on second click in tap mode', () => {
    const mockCanvas = createMockCanvas();
    const onClear = vi.fn();
    const onTileClick = vi.fn().mockReturnValue(false);

    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => 10,
      isInteractive: () => true,
      getBoardState: () => defaultBoardState,
      getVisualConfig: () => defaultVisualConfig,
      onClear,
      onTileClick,
    };

    const interaction = new GameBoardInteraction(mockCanvas as unknown as HTMLCanvasElement, ctxAccess);
    interaction.bind();

    // Click 1 on tile (0, 0) [val 5]
    mockCanvas.trigger('pointerdown', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });
    triggerWindow('pointerup', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });

    // Move hover to tile (1, 0) [val 5] (sum = 10!)
    triggerWindow('pointermove', {
      clientX: 60,
      clientY: 20,
      buttons: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });

    // Click 2 on tile (1, 0)
    mockCanvas.trigger('pointerdown', {
      clientX: 60,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });
    triggerWindow('pointerup', {
      clientX: 60,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });

    expect(onClear).toHaveBeenCalledWith(
      [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
      ],
      10
    );

    interaction.unbind();
  });
});
