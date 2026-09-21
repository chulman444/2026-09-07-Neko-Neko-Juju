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

  it('manages applyRotationCW, applyRotationCCW, applyTranspose, and applyAntiTranspose', () => {
    // Initial state: 3 cols x 2 rows
    const testMatrix = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    useBoardStore.getState().setMatrix(testMatrix);
    expect(useBoardStore.getState().cols).toBe(3);
    expect(useBoardStore.getState().rows).toBe(2);
    expect(useBoardStore.getState().orientationOffset).toEqual({ rot: 0, flip: false });

    // Rotate 90 deg CW
    useBoardStore.getState().applyRotationCW();
    let state = useBoardStore.getState();
    expect(state.cols).toBe(2);
    expect(state.rows).toBe(3);
    expect(state.orientationOffset).toEqual({ rot: 1, flip: false });
    expect(state.matrix).toEqual([
      [4, 1],
      [5, 2],
      [6, 3],
    ]);

    // Rotate 90 deg CCW (should restore)
    useBoardStore.getState().applyRotationCCW();
    state = useBoardStore.getState();
    expect(state.cols).toBe(3);
    expect(state.rows).toBe(2);
    expect(state.orientationOffset).toEqual({ rot: 0, flip: false });
    expect(state.matrix).toEqual(testMatrix);

    // Transpose (locks top-left and bottom-right)
    useBoardStore.getState().applyTranspose();
    state = useBoardStore.getState();
    expect(state.cols).toBe(2);
    expect(state.rows).toBe(3);
    expect(state.orientationOffset).toEqual({ rot: 0, flip: true });
    expect(state.matrix).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);

    // Revert orientation
    useBoardStore.getState().revertOrientation();
    state = useBoardStore.getState();
    expect(state.cols).toBe(3);
    expect(state.rows).toBe(2);
    expect(state.orientationOffset).toEqual({ rot: 0, flip: false });
    expect(state.matrix).toEqual(testMatrix);

    // Anti-transpose (locks top-right and bottom-left)
    useBoardStore.getState().applyAntiTranspose();
    state = useBoardStore.getState();
    expect(state.cols).toBe(2);
    expect(state.rows).toBe(3);
    expect(state.orientationOffset).toEqual({ rot: 2, flip: true });
    expect(state.matrix).toEqual([
      [6, 3],
      [5, 2],
      [4, 1],
    ]);

    // Revert orientation
    useBoardStore.getState().revertOrientation();
    state = useBoardStore.getState();
    expect(state.cols).toBe(3);
    expect(state.rows).toBe(2);
    expect(state.orientationOffset).toEqual({ rot: 0, flip: false });
    expect(state.matrix).toEqual(testMatrix);
  });

  it('revertOrientation perfectly restores dimensions and layout without restoring cleared tiles', () => {
    // Asymmetrical board: 4 cols x 3 rows
    const testMatrix = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ];
    useBoardStore.getState().setMatrix(testMatrix);

    // Clear tile at (col: 0, row: 0) which is value 1
    useBoardStore.getState().clearTiles([{ col: 0, row: 0 }]);
    expect(useBoardStore.getState().matrix[0]![0]).toBe(0);

    // Apply multiple transformations: CW, Transpose, CW, AntiTranspose
    useBoardStore.getState().applyRotationCW();
    useBoardStore.getState().applyTranspose();
    useBoardStore.getState().applyRotationCW();
    useBoardStore.getState().applyAntiTranspose();

    expect(useBoardStore.getState().orientationOffset).not.toEqual({ rot: 0, flip: false });

    // Revert orientation
    useBoardStore.getState().revertOrientation();

    const restoredState = useBoardStore.getState();
    expect(restoredState.cols).toBe(4);
    expect(restoredState.rows).toBe(3);
    expect(restoredState.orientationOffset).toEqual({ rot: 0, flip: false });

    // Cleared tile must remain 0 and NOT be restored!
    expect(restoredState.matrix[0]![0]).toBe(0);
    expect(restoredState.matrix).toEqual([
      [0, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ]);
  });

  it('resets orientationOffset on setDimensions, generateNewBoard, and restartCurrentBoard', () => {
    useBoardStore.getState().setDimensions(4, 4);

    // Rotate CW
    useBoardStore.getState().applyRotationCW();
    expect(useBoardStore.getState().orientationOffset).toEqual({ rot: 1, flip: false });

    // Reset on setDimensions
    useBoardStore.getState().setDimensions(5, 5);
    expect(useBoardStore.getState().orientationOffset).toEqual({ rot: 0, flip: false });

    // Rotate CW
    useBoardStore.getState().applyRotationCW();
    expect(useBoardStore.getState().orientationOffset).toEqual({ rot: 1, flip: false });

    // Reset on generateNewBoard
    useBoardStore.getState().generateNewBoard();
    expect(useBoardStore.getState().orientationOffset).toEqual({ rot: 0, flip: false });

    // Rotate CW
    useBoardStore.getState().applyRotationCW();
    expect(useBoardStore.getState().orientationOffset).toEqual({ rot: 1, flip: false });

    // Reset on restartCurrentBoard
    useBoardStore.getState().restartCurrentBoard();
    expect(useBoardStore.getState().orientationOffset).toEqual({ rot: 0, flip: false });
  });
});

describe('boardStore - stacked tiles (layers)', () => {
  it('correctly pops from stacks into matrix when clearing tiles', () => {
    const testMatrix = [
      [3, 4],
      [5, 6],
    ];
    const testStacks = {
      '0,0': [7, 8], // Bottom to top: 7, 8. When popped: 8 first, then 7.
      '1,0': [9],
    };

    useBoardStore.getState().setMatrix(testMatrix, testStacks);
    expect(useBoardStore.getState().matrix[0]![0]).toBe(3);
    expect(useBoardStore.getState().stacks['0,0']).toEqual([7, 8]);

    // 1st clear at (0, 0): Active 3 cleared -> reveals 8 from stack
    const cleared1 = useBoardStore.getState().clearTiles([{ col: 0, row: 0 }]);
    expect(cleared1).toBe(1);
    expect(useBoardStore.getState().matrix[0]![0]).toBe(8);
    expect(useBoardStore.getState().stacks['0,0']).toEqual([7]);

    // 2nd clear at (0, 0): Active 8 cleared -> reveals 7 from stack
    const cleared2 = useBoardStore.getState().clearTiles([{ col: 0, row: 0 }]);
    expect(cleared2).toBe(1);
    expect(useBoardStore.getState().matrix[0]![0]).toBe(7);
    expect(useBoardStore.getState().stacks['0,0']).toBeUndefined();

    // 3rd clear at (0, 0): Stack is now empty -> tile becomes 0
    const cleared3 = useBoardStore.getState().clearTiles([{ col: 0, row: 0 }]);
    expect(cleared3).toBe(1);
    expect(useBoardStore.getState().matrix[0]![0]).toBe(0);

    // 4th clear at (0, 0): Already 0 -> not cleared
    const cleared4 = useBoardStore.getState().clearTiles([{ col: 0, row: 0 }]);
    expect(cleared4).toBe(0);
  });

  it('restores initialStacks upon restartCurrentBoard', () => {
    const testMatrix = [
      [1, 2],
      [3, 4],
    ];
    const testStacks = {
      '0,0': [5, 6],
    };

    useBoardStore.getState().setMatrix(testMatrix, testStacks);
    useBoardStore.getState().clearTiles([{ col: 0, row: 0 }]);
    expect(useBoardStore.getState().matrix[0]![0]).toBe(6);
    expect(useBoardStore.getState().stacks['0,0']).toEqual([5]);

    // Restart board
    useBoardStore.getState().restartCurrentBoard();
    const state = useBoardStore.getState();
    expect(state.matrix[0]![0]).toBe(1);
    expect(state.stacks['0,0']).toEqual([5, 6]);
  });

  it('rotates stack coordinates when rotating board', () => {
    const testMatrix = [
      [1, 2, 3],
      [4, 5, 6],
    ]; // 3 cols, 2 rows
    const testStacks = {
      '2,0': [9], // Top-right corner
    };

    useBoardStore.getState().setMatrix(testMatrix, testStacks);
    // Rotate CW: (c: 2, r: 0) becomes (c: 2 - 1 - 0 = 1, r: 2) -> (1, 2)
    useBoardStore.getState().applyRotationCW();
    expect(useBoardStore.getState().stacks['1,2']).toEqual([9]);

    // Rotate CCW: restores back to (2, 0)
    useBoardStore.getState().applyRotationCCW();
    expect(useBoardStore.getState().stacks['2,0']).toEqual([9]);
  });
});
