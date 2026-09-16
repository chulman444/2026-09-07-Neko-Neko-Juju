import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardMakerStore } from './boardMakerStore';

describe('boardMakerStore', () => {
  beforeEach(() => {
    useBoardMakerStore.getState().generateBlankBoard(3, 3);
  });

  it('adds tile at empty cell without pushing to stack', () => {
    useBoardMakerStore.getState().setSelectedBrush(5);
    useBoardMakerStore.getState().addTileAt(0, 0);

    const state = useBoardMakerStore.getState();
    expect(state.matrix[0]![0]).toBe(5);
    expect(state.stacks['0,0']).toBeUndefined();
  });

  it('pushes to stack when adding tile at already occupied cell', () => {
    useBoardMakerStore.getState().addTileAt(0, 0, 3); // 1st tile
    expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(3);
    expect(useBoardMakerStore.getState().stacks['0,0']).toBeUndefined();

    useBoardMakerStore.getState().addTileAt(0, 0, 7); // 2nd tile: pushes 3, puts 7
    expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(7);
    expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([3]);

    useBoardMakerStore.getState().addTileAt(0, 0, 9); // 3rd tile: pushes 7, puts 9
    expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(9);
    expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([3, 7]);
  });

  it('pops from stack when removing tile at cell with stacked tiles', () => {
    useBoardMakerStore.getState().addTileAt(1, 1, 2);
    useBoardMakerStore.getState().addTileAt(1, 1, 4);
    useBoardMakerStore.getState().addTileAt(1, 1, 8);

    // Initial state: matrix[1][1] = 8, stacks['1,1'] = [2, 4]
    expect(useBoardMakerStore.getState().matrix[1]![1]).toBe(8);
    expect(useBoardMakerStore.getState().stacks['1,1']).toEqual([2, 4]);

    // 1st remove: pops 4 into matrix[1][1]
    useBoardMakerStore.getState().removeTileAt(1, 1);
    expect(useBoardMakerStore.getState().matrix[1]![1]).toBe(4);
    expect(useBoardMakerStore.getState().stacks['1,1']).toEqual([2]);

    // 2nd remove: pops 2 into matrix[1][1]
    useBoardMakerStore.getState().removeTileAt(1, 1);
    expect(useBoardMakerStore.getState().matrix[1]![1]).toBe(2);
    expect(useBoardMakerStore.getState().stacks['1,1']).toBeUndefined();

    // 3rd remove: stack empty -> sets to 0
    useBoardMakerStore.getState().removeTileAt(1, 1);
    expect(useBoardMakerStore.getState().matrix[1]![1]).toBe(0);
  });

  it('cycles tile values using cycleTileValue', () => {
    useBoardMakerStore.getState().setTileValue(0, 0, 5);
    useBoardMakerStore.getState().cycleTileValue(0, 0, 1);
    expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(6);

    useBoardMakerStore.getState().cycleTileValue(0, 0, -1);
    expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(5);
  });
});
