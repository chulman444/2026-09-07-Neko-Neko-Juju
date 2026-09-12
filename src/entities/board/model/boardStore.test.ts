import { describe, it, expect } from 'vitest';
import { useBoardStore } from './boardStore';

describe('boardStore - setDimensions', () => {
  it('updates cols, rows, and matrix dimensions while preserving active seed', () => {
    const initialSeed = useBoardStore.getState().seed;
    expect(initialSeed).toBeTruthy();

    // Change dimensions to 8 cols x 5 rows
    useBoardStore.getState().setDimensions(8, 5);

    const state = useBoardStore.getState();
    expect(state.cols).toBe(8);
    expect(state.rows).toBe(5);
    expect(state.matrix.length).toBe(5);
    expect(state.matrix[0]?.length).toBe(8);
    expect(state.seed).toBe(initialSeed);
  });

  it('resets clearing animations when dimensions change', () => {
    useBoardStore.setState({
      clearingAnimations: [
        {
          id: 'anim-1',
          col: 0,
          row: 0,
          val: 5,
          type: 'munching',
          startTime: Date.now(),
          duration: 500,
          bounceSpeed: 80,
        },
      ],
    });

    expect(useBoardStore.getState().clearingAnimations.length).toBe(1);

    useBoardStore.getState().setDimensions(12, 7);

    expect(useBoardStore.getState().clearingAnimations).toEqual([]);
  });

  it('preserves initialMatrix when clearTiles mutates live matrix', () => {
    useBoardStore.getState().setDimensions(5, 5);
    const originalInitial = useBoardStore.getState().initialMatrix.map((r) => [...r]);
    const firstTileVal = originalInitial[0]![0]!;
    expect(firstTileVal).toBeGreaterThan(0);

    // Clear the tile at (0, 0)
    useBoardStore.getState().clearTiles([{ col: 0, row: 0 }]);

    const stateAfterClear = useBoardStore.getState();
    // Live matrix tile should be 0
    expect(stateAfterClear.matrix[0]![0]).toBe(0);
    // initialMatrix tile must remain unchanged
    expect(stateAfterClear.initialMatrix[0]![0]).toBe(firstTileVal);
    expect(stateAfterClear.initialMatrix).toEqual(originalInitial);

    // Restarting board should restore matrix from initialMatrix
    useBoardStore.getState().restartCurrentBoard();
    const stateAfterRestart = useBoardStore.getState();
    expect(stateAfterRestart.matrix[0]![0]).toBe(firstTileVal);
    expect(stateAfterRestart.matrix).toEqual(originalInitial);
  });

  it('manages panOffset and resets on board regeneration and restart', () => {
    // Initial offset should be (0, 0)
    useBoardStore.getState().resetPanOffset();
    expect(useBoardStore.getState().panOffset).toEqual({ x: 0, y: 0 });

    // Update with concrete value
    useBoardStore.getState().setPanOffset({ x: 45, y: -30 });
    expect(useBoardStore.getState().panOffset).toEqual({ x: 45, y: -30 });

    // Update with functional updater
    useBoardStore.getState().setPanOffset((prev) => ({ x: prev.x + 10, y: prev.y + 10 }));
    expect(useBoardStore.getState().panOffset).toEqual({ x: 55, y: -20 });

    // Reset via resetPanOffset
    useBoardStore.getState().resetPanOffset();
    expect(useBoardStore.getState().panOffset).toEqual({ x: 0, y: 0 });

    // Reset on restartCurrentBoard
    useBoardStore.getState().setPanOffset({ x: 100, y: 100 });
    useBoardStore.getState().restartCurrentBoard();
    expect(useBoardStore.getState().panOffset).toEqual({ x: 0, y: 0 });

    // Reset on generateNewBoard
    useBoardStore.getState().setPanOffset({ x: 80, y: 80 });
    useBoardStore.getState().generateNewBoard();
    expect(useBoardStore.getState().panOffset).toEqual({ x: 0, y: 0 });
  });

  it('manages isPanMode and togglePanMode correctly', () => {
    // Initial state is false
    useBoardStore.setState({ isPanMode: false });
    expect(useBoardStore.getState().isPanMode).toBe(false);

    // Toggle on
    useBoardStore.getState().togglePanMode();
    expect(useBoardStore.getState().isPanMode).toBe(true);

    // Toggle off
    useBoardStore.getState().togglePanMode();
    expect(useBoardStore.getState().isPanMode).toBe(false);

    // Set explicitly
    useBoardStore.getState().setIsPanMode(true);
    expect(useBoardStore.getState().isPanMode).toBe(true);

    // Functional setter
    useBoardStore.getState().setIsPanMode((prev) => !prev);
    expect(useBoardStore.getState().isPanMode).toBe(false);

    // Resets to false on board regeneration
    useBoardStore.getState().setIsPanMode(true);
    useBoardStore.getState().generateNewBoard();
    expect(useBoardStore.getState().isPanMode).toBe(false);

    // Resets to false on board restart
    useBoardStore.getState().setIsPanMode(true);
    useBoardStore.getState().restartCurrentBoard();
    expect(useBoardStore.getState().isPanMode).toBe(false);
  });

  it('manages inversePan and panSensitivity correctly', () => {
    // Initial defaults
    expect(useBoardStore.getState().inversePan).toBe(true);
    expect(useBoardStore.getState().panSensitivity).toBe(1.5);

    // Toggle inversePan
    useBoardStore.getState().toggleInversePan();
    expect(useBoardStore.getState().inversePan).toBe(false);

    useBoardStore.getState().toggleInversePan();
    expect(useBoardStore.getState().inversePan).toBe(true);

    // Set inversePan directly
    useBoardStore.getState().setInversePan(false);
    expect(useBoardStore.getState().inversePan).toBe(false);

    // Set panSensitivity within valid range
    useBoardStore.getState().setPanSensitivity(2.5);
    expect(useBoardStore.getState().panSensitivity).toBe(2.5);

    // Clamps below minimum 0.2
    useBoardStore.getState().setPanSensitivity(0.05);
    expect(useBoardStore.getState().panSensitivity).toBe(0.2);

    // Clamps above maximum 6.0
    useBoardStore.getState().setPanSensitivity(10.0);
    expect(useBoardStore.getState().panSensitivity).toBe(6.0);
  });
});
