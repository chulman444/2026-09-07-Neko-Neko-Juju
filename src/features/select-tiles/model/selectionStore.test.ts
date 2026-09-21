import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from './selectionStore';

describe('selectionStore', () => {
  beforeEach(() => {
    useSelectionStore.getState().clearSelection();
  });

  it('initializes with empty selection state', () => {
    const state = useSelectionStore.getState();
    expect(state.selectedTiles).toEqual([]);
    expect(state.selectedSum).toBe(0);
    expect(state.diagonalSum).toBe(0);
    expect(state.isSquareSelection).toBe(false);
    expect(state.activeSelectionType).toBeNull();
  });

  it('sets, clears, and resets real-time selection state correctly', () => {
    const tiles = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    useSelectionStore.getState().setSelection({
      selectedTiles: tiles,
      selectedSum: 8,
      diagonalSum: 10,
      isSquareSelection: true,
      activeSelectionType: 'box',
    });

    let state = useSelectionStore.getState();
    expect(state.selectedTiles).toEqual(tiles);
    expect(state.selectedSum).toBe(8);
    expect(state.diagonalSum).toBe(10);
    expect(state.isSquareSelection).toBe(true);
    expect(state.activeSelectionType).toBe('box');

    // Clear selection
    useSelectionStore.getState().clearSelection();
    state = useSelectionStore.getState();
    expect(state.selectedTiles).toEqual([]);
    expect(state.selectedSum).toBe(0);
    expect(state.diagonalSum).toBe(0);
    expect(state.isSquareSelection).toBe(false);
    expect(state.activeSelectionType).toBeNull();

    // Re-set with minimal optional arguments
    useSelectionStore.getState().setSelection({
      selectedTiles: tiles,
      selectedSum: 10,
      activeSelectionType: 'diagonal',
    });
    state = useSelectionStore.getState();
    expect(state.selectedTiles).toEqual(tiles);
    expect(state.selectedSum).toBe(10);
    expect(state.diagonalSum).toBe(0);
    expect(state.isSquareSelection).toBe(false);
    expect(state.activeSelectionType).toBe('diagonal');
  });
});
