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

  describe('Active Layer mode (Layer Z)', () => {
    it('sets and overrides value at z=0 without pushing new layers', () => {
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 0, 4);
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(4);
      expect(useBoardMakerStore.getState().stacks['0,0']).toBeUndefined();

      // Override with another number at z=0
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 0, 8);
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(8);
      expect(useBoardMakerStore.getState().stacks['0,0']).toBeUndefined();
    });

    it('ignores drawing at z > 0 if there is no support tile underneath', () => {
      // Cell (0,0) is empty, trying to draw at z=1 should do nothing
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 1, 5);
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(0);
      expect(useBoardMakerStore.getState().stacks['0,0']).toBeUndefined();
    });

    it('allows drawing at z=1 if z=0 exists', () => {
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 0, 3);
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 1, 7);

      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(7);
      expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([3]);

      // Override at z=1
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 1, 9);
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(9);
      expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([3]);
    });

    it('erases tile with brush 0 only if no tiles exist above it', () => {
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 0, 2);
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 1, 4);
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 2, 6);

      // Attempt to erase z=1 (which has z=2 above it) -> ignored!
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 1, 0);
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(6);
      expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([2, 4]);

      // Erasing z=2 (top-most) -> permitted!
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 2, 0);
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(4);
      expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([2]);
    });

    it('increments and decrements with + and - wrapping 1-9', () => {
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 0, 9);
      useBoardMakerStore.getState().setTileAtLayer(0, 0, 0, '+');
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(1);

      useBoardMakerStore.getState().setTileAtLayer(0, 0, 0, '-');
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(9);

      // On empty supported cell (z=0)
      useBoardMakerStore.getState().setTileAtLayer(1, 1, 0, '+');
      expect(useBoardMakerStore.getState().matrix[1]![1]).toBe(1);

      useBoardMakerStore.getState().setTileAtLayer(2, 2, 0, '-');
      expect(useBoardMakerStore.getState().matrix[2]![2]).toBe(9);
    });
  });

  describe('Stack Inspector manipulation', () => {
    it('removes middle tile and lets upper tiles fall down', () => {
      useBoardMakerStore.getState().addTileAt(0, 0, 1);
      useBoardMakerStore.getState().addTileAt(0, 0, 2);
      useBoardMakerStore.getState().addTileAt(0, 0, 3);
      // Stack is [1, 2, 3]

      useBoardMakerStore.getState().removeTileAtDepth(0, 0, 1); // remove 2
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(3);
      expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([1]);
    });

    it('inserts tile at specific depth', () => {
      useBoardMakerStore.getState().addTileAt(0, 0, 1);
      useBoardMakerStore.getState().addTileAt(0, 0, 3);
      // Stack is [1, 3]

      useBoardMakerStore.getState().insertTileAtDepth(0, 0, 1, 2); // insert 2 at depth 1
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(3);
      expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([1, 2]);
    });

    it('clears entire stack at cell', () => {
      useBoardMakerStore.getState().addTileAt(0, 0, 1);
      useBoardMakerStore.getState().addTileAt(0, 0, 2);
      useBoardMakerStore.getState().clearStackAt(0, 0);

      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(0);
      expect(useBoardMakerStore.getState().stacks['0,0']).toBeUndefined();
    });

    it('synchronizes inspectedStack state', () => {
      useBoardMakerStore.getState().addTileAt(1, 1, 5);
      useBoardMakerStore.getState().addTileAt(1, 1, 9);
      useBoardMakerStore.getState().setInspectedStack({ col: 1, row: 1 });

      expect(useBoardMakerStore.getState().inspectedStack).toEqual({
        col: 1,
        row: 1,
        stack: [5, 9],
      });

      useBoardMakerStore.getState().removeTileAtDepth(1, 1, 0);
      expect(useBoardMakerStore.getState().inspectedStack).toEqual({
        col: 1,
        row: 1,
        stack: [9],
      });
    });

    it('cycles tile values at specific depth wrapping 1-9', () => {
      useBoardMakerStore.getState().addTileAt(0, 0, 9);
      useBoardMakerStore.getState().addTileAt(0, 0, 2);
      // Stack is [9, 2]

      // Increment base tile (z=0): 9 -> 1
      useBoardMakerStore.getState().cycleTileValueAtDepth(0, 0, 0, 1);
      expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([1]);

      // Decrement base tile (z=0): 1 -> 9
      useBoardMakerStore.getState().cycleTileValueAtDepth(0, 0, 0, -1);
      expect(useBoardMakerStore.getState().stacks['0,0']).toEqual([9]);

      // Decrement top tile (z=1): 2 -> 1
      useBoardMakerStore.getState().cycleTileValueAtDepth(0, 0, 1, -1);
      expect(useBoardMakerStore.getState().matrix[0]![0]).toBe(1);
    });

    it('steps active layer with no cycling', () => {
      useBoardMakerStore.getState().setActiveLayer(0);

      // Stepping down at 0 clamps to 0 (no cycle)
      useBoardMakerStore.getState().stepActiveLayer(-1, 3);
      expect(useBoardMakerStore.getState().activeLayer).toBe(0);

      // Step up
      useBoardMakerStore.getState().stepActiveLayer(1, 3);
      expect(useBoardMakerStore.getState().activeLayer).toBe(1);

      useBoardMakerStore.getState().stepActiveLayer(1, 3);
      expect(useBoardMakerStore.getState().activeLayer).toBe(2);

      useBoardMakerStore.getState().stepActiveLayer(1, 3);
      // Stepping up at maxLayer (3) goes to 'surface' (top-down view)
      useBoardMakerStore.getState().stepActiveLayer(1, 3);
      expect(useBoardMakerStore.getState().activeLayer).toBe('surface');

      // Stepping up at 'surface' stays at 'surface' (no cycle)
      useBoardMakerStore.getState().stepActiveLayer(1, 3);
      expect(useBoardMakerStore.getState().activeLayer).toBe('surface');

      // Stepping down at 'surface' goes to maxLayer (3)
      useBoardMakerStore.getState().stepActiveLayer(-1, 3);
      expect(useBoardMakerStore.getState().activeLayer).toBe(3);

      // Stepping down from 3 goes to 2
      useBoardMakerStore.getState().stepActiveLayer(-1, 3);
      expect(useBoardMakerStore.getState().activeLayer).toBe(2);
    });

    it('toggles cannotDrawStyle between slash and cross', () => {
      expect(useBoardMakerStore.getState().cannotDrawStyle).toBe('slash');

      useBoardMakerStore.getState().setCannotDrawStyle('cross');
      expect(useBoardMakerStore.getState().cannotDrawStyle).toBe('cross');

      useBoardMakerStore.getState().setCannotDrawStyle('slash');
      expect(useBoardMakerStore.getState().cannotDrawStyle).toBe('slash');
    });
  });
});
