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
});
