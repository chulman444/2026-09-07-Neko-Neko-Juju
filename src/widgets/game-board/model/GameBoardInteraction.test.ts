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

    const interaction = new GameBoardInteraction(
      mockCanvas as unknown as HTMLCanvasElement,
      ctxAccess
    );
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

    const interaction = new GameBoardInteraction(
      mockCanvas as unknown as HTMLCanvasElement,
      ctxAccess
    );
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

    const interaction = new GameBoardInteraction(
      mockCanvas as unknown as HTMLCanvasElement,
      ctxAccess
    );
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

  it('keeps cursor as crosshair in default gameplay (idle, drag, tap)', () => {
    const mockCanvas = createMockCanvas();
    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => 10,
      isInteractive: () => true,
      getBoardState: () => defaultBoardState,
      getVisualConfig: () => defaultVisualConfig,
      onClear: vi.fn(),
    };

    const interaction = new GameBoardInteraction(
      mockCanvas as unknown as HTMLCanvasElement,
      ctxAccess
    );
    interaction.bind();

    // Idle hover
    triggerWindow('pointermove', { clientX: 20, clientY: 20, buttons: 0, pointerType: 'mouse' });
    expect(mockCanvas.style.cursor).toBe('crosshair');

    // Pointer down (dragging)
    mockCanvas.trigger('pointerdown', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
    });
    expect(mockCanvas.style.cursor).toBe('crosshair');

    interaction.unbind();
  });

  it('sets cursor to grab/grabbing in pan mode and never crosshair', () => {
    const mockCanvas = createMockCanvas();
    let panMode = true;
    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => 10,
      isInteractive: () => true,
      isPanMode: () => panMode,
      getBoardState: () => defaultBoardState,
      getVisualConfig: () => defaultVisualConfig,
      onClear: vi.fn(),
    };

    const interaction = new GameBoardInteraction(
      mockCanvas as unknown as HTMLCanvasElement,
      ctxAccess
    );
    interaction.bind();

    // Hovering in pan mode
    triggerWindow('pointermove', { clientX: 20, clientY: 20, buttons: 0, pointerType: 'mouse' });
    expect(mockCanvas.style.cursor).toBe('grab');

    // Dragging/panning in pan mode
    mockCanvas.trigger('pointerdown', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
    });
    expect(mockCanvas.style.cursor).toBe('grabbing');

    triggerWindow('pointerup', { clientX: 20, clientY: 20, button: 0, pointerType: 'mouse' });
    expect(mockCanvas.style.cursor).toBe('grab');

    // Disabling pan mode restores default crosshair
    panMode = false;
    interaction.updateCursorState();
    expect(mockCanvas.style.cursor).toBe('crosshair');

    interaction.unbind();
  });

  it('sets cursor to pointer in item active mode and never crosshair', () => {
    const mockCanvas = createMockCanvas();
    let itemActive = true;
    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => 10,
      isInteractive: () => true,
      isItemActive: () => itemActive,
      getBoardState: () => defaultBoardState,
      getVisualConfig: () => defaultVisualConfig,
      onClear: vi.fn(),
    };

    const interaction = new GameBoardInteraction(
      mockCanvas as unknown as HTMLCanvasElement,
      ctxAccess
    );
    interaction.bind();

    triggerWindow('pointermove', { clientX: 20, clientY: 20, buttons: 0, pointerType: 'mouse' });
    expect(mockCanvas.style.cursor).toBe('pointer');

    // Disarming item restores crosshair
    itemActive = false;
    interaction.updateCursorState();
    expect(mockCanvas.style.cursor).toBe('crosshair');

    interaction.unbind();
  });

  it('bypasses selection mode when isItemActive is true', () => {
    const mockCanvas = createMockCanvas();
    const onClear = vi.fn();
    const onTileClick = vi.fn();
    const onSelectionChange = vi.fn();

    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => 10,
      isInteractive: () => true,
      isItemActive: () => true,
      getBoardState: () => defaultBoardState,
      getVisualConfig: () => defaultVisualConfig,
      onClear,
      onTileClick,
      onSelectionChange,
    };

    const interaction = new GameBoardInteraction(
      mockCanvas as unknown as HTMLCanvasElement,
      ctxAccess
    );
    interaction.bind();

    // 1. Pointer down on tile (0, 0)
    mockCanvas.trigger('pointerdown', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });

    // Should NOT have started a box selection action
    const snapshotDown = interaction.getSnapshot();
    expect(snapshotDown.activeAction).toBeNull();
    expect(snapshotDown.boxTiles).toEqual([]);

    // 2. Drag to tile (1, 0)
    triggerWindow('pointermove', {
      clientX: 60,
      clientY: 20,
      buttons: 1,
      pointerType: 'mouse',
      shiftKey: false,
    });

    const snapshotMove = interaction.getSnapshot();
    expect(snapshotMove.activeAction).toBeNull();
    expect(snapshotMove.boxTiles).toEqual([]);

    // 3. Pointer up on tile (1, 0) (dragged away from startTile)
    triggerWindow('pointerup', {
      clientX: 60,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
      shiftKey: false,
    });

    // Should NOT clear tiles and should NOT click tile (since released on different tile)
    expect(onClear).not.toHaveBeenCalled();
    expect(onTileClick).not.toHaveBeenCalled();

    // 4. Click cleanly on tile (0, 0)
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
    // Should NOT enter tap mode
    const snapshotClick = interaction.getSnapshot();
    expect(snapshotClick.selectMode).toBe('drag');
    expect(snapshotClick.activeAction).toBeNull();

    interaction.unbind();
  });

  it('cancels in-progress tap selection when item becomes active on next interaction', () => {
    const mockCanvas = createMockCanvas();
    const onClear = vi.fn();
    const onTileClick = vi.fn().mockReturnValue(false);
    let itemActive = false;

    const ctxAccess: BoardContextAccess = {
      getTargetSum: () => 10,
      isInteractive: () => true,
      isItemActive: () => itemActive,
      getBoardState: () => defaultBoardState,
      getVisualConfig: () => defaultVisualConfig,
      onClear,
      onTileClick,
    };

    const interaction = new GameBoardInteraction(
      mockCanvas as unknown as HTMLCanvasElement,
      ctxAccess
    );
    interaction.bind();

    // Click 1 on tile (0, 0) entering tap mode
    mockCanvas.trigger('pointerdown', {
      clientX: 20,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
    });
    triggerWindow('pointerup', { clientX: 20, clientY: 20, button: 0, pointerType: 'mouse' });
    expect(interaction.getSnapshot().selectMode).toBe('tap');

    // Arm item
    itemActive = true;
    // Next click down on canvas immediately resets tap mode and executes item targeting
    mockCanvas.trigger('pointerdown', {
      clientX: 60,
      clientY: 20,
      button: 0,
      pointerType: 'mouse',
    });
    expect(interaction.getSnapshot().selectMode).toBe('drag');
    expect(interaction.getSnapshot().activeAction).toBeNull();

    triggerWindow('pointerup', { clientX: 60, clientY: 20, button: 0, pointerType: 'mouse' });
    expect(onTileClick).toHaveBeenCalledWith({ col: 1, row: 0 });

    interaction.unbind();
  });

  describe('Omnitile Matching (*)', () => {
    // Board with Omnitile (10) at (0, 0), 3 at (1, 0), 7 at (0, 1), 8 at (1, 1), 1 at (2, 0), 9 at (2, 1)
    const omniMatrix = [
      [10, 3, 1],
      [7, 8, 9],
      [0, 0, 0],
    ];

    const omniBoardState = {
      matrix: omniMatrix,
      cols: 3,
      rows: 3,
      shapeSize: 36,
      tileBorder: 2,
    };

    it('clears solitary Omnitile on single tap because it acts as 10', () => {
      const mockCanvas = createMockCanvas();
      const onClear = vi.fn();
      const onTileClick = vi.fn().mockReturnValue(false);

      const ctxAccess: BoardContextAccess = {
        getTargetSum: () => 10,
        isInteractive: () => true,
        getBoardState: () => omniBoardState,
        getVisualConfig: () => defaultVisualConfig,
        onClear,
        onTileClick,
      };

      const interaction = new GameBoardInteraction(
        mockCanvas as unknown as HTMLCanvasElement,
        ctxAccess
      );
      interaction.bind();

      // Click on Omnitile at (0, 0)
      mockCanvas.trigger('pointerdown', {
        clientX: 20,
        clientY: 20,
        button: 0,
        pointerType: 'mouse',
      });
      triggerWindow('pointerup', { clientX: 20, clientY: 20, button: 0, pointerType: 'mouse' });

      // Should directly trigger clear for the solitary Omnitile!
      expect(onClear).toHaveBeenCalledWith([{ col: 0, row: 0 }], 10);
      interaction.unbind();
    });

    it('clears Omnitile + 3 as 10 (acts as 7)', () => {
      const mockCanvas = createMockCanvas();
      const onClear = vi.fn();

      const ctxAccess: BoardContextAccess = {
        getTargetSum: () => 10,
        isInteractive: () => true,
        getBoardState: () => omniBoardState,
        getVisualConfig: () => defaultVisualConfig,
        onClear,
      };

      const interaction = new GameBoardInteraction(
        mockCanvas as unknown as HTMLCanvasElement,
        ctxAccess
      );
      interaction.bind();

      // Drag from (0, 0) to (1, 0): Omnitile + 3
      mockCanvas.trigger('pointerdown', {
        clientX: 20,
        clientY: 20,
        button: 0,
        pointerType: 'mouse',
      });
      triggerWindow('pointermove', { clientX: 60, clientY: 20, button: 0, pointerType: 'mouse' });
      triggerWindow('pointerup', { clientX: 60, clientY: 20, button: 0, pointerType: 'mouse' });

      expect(onClear).toHaveBeenCalledWith(
        expect.arrayContaining([
          { col: 0, row: 0 },
          { col: 1, row: 0 },
        ]),
        10
      );
      interaction.unbind();
    });

    it('clears Omnitile + 1 + 9 as 10 (acts as 0)', () => {
      const mockCanvas = createMockCanvas();
      const onClear = vi.fn();

      // Box covering (0, 0) to (2, 1) has 10 (omni), 3, 1, 7, 8, 9 - sum is too high
      // Let's create a specific line board: Omnitile at (0, 0), 1 at (1, 0), 9 at (2, 0)
      const lineMatrix = [
        [10, 1, 9],
        [0, 0, 0],
        [0, 0, 0],
      ];
      const lineBoardState = { ...omniBoardState, matrix: lineMatrix };

      const ctxAccess: BoardContextAccess = {
        getTargetSum: () => 10,
        isInteractive: () => true,
        getBoardState: () => lineBoardState,
        getVisualConfig: () => defaultVisualConfig,
        onClear,
      };

      const interaction = new GameBoardInteraction(
        mockCanvas as unknown as HTMLCanvasElement,
        ctxAccess
      );
      interaction.bind();

      // Drag line from (0, 0) to (2, 0)
      mockCanvas.trigger('pointerdown', {
        clientX: 20,
        clientY: 20,
        button: 0,
        pointerType: 'mouse',
      });
      triggerWindow('pointermove', { clientX: 100, clientY: 20, button: 0, pointerType: 'mouse' });
      triggerWindow('pointerup', { clientX: 100, clientY: 20, button: 0, pointerType: 'mouse' });

      expect(onClear).toHaveBeenCalledWith(
        expect.arrayContaining([
          { col: 0, row: 0 },
          { col: 1, row: 0 },
          { col: 2, row: 0 },
        ]),
        10
      );
      interaction.unbind();
    });

    it('rejects selection if regular sum > 10 (Omnitile cannot act as negative)', () => {
      const mockCanvas = createMockCanvas();
      const onClear = vi.fn();

      // Line: Omnitile at (0, 0), 7 at (1, 0), 8 at (2, 0) -> regular sum = 15 > 10
      const lineMatrix = [
        [10, 7, 8],
        [0, 0, 0],
        [0, 0, 0],
      ];
      const lineBoardState = { ...omniBoardState, matrix: lineMatrix };

      const ctxAccess: BoardContextAccess = {
        getTargetSum: () => 10,
        isInteractive: () => true,
        getBoardState: () => lineBoardState,
        getVisualConfig: () => defaultVisualConfig,
        onClear,
      };

      const interaction = new GameBoardInteraction(
        mockCanvas as unknown as HTMLCanvasElement,
        ctxAccess
      );
      interaction.bind();

      // Drag line from (0, 0) to (2, 0)
      mockCanvas.trigger('pointerdown', {
        clientX: 20,
        clientY: 20,
        button: 0,
        pointerType: 'mouse',
      });
      triggerWindow('pointermove', { clientX: 100, clientY: 20, button: 0, pointerType: 'mouse' });
      triggerWindow('pointerup', { clientX: 100, clientY: 20, button: 0, pointerType: 'mouse' });

      expect(onClear).not.toHaveBeenCalled();
      interaction.unbind();
    });
  });
});
