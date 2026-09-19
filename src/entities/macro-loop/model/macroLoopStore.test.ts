import { describe, it, expect, beforeEach } from 'vitest';
import { useMacroLoopStore, DEFAULT_MACRO_BOARDS } from './macroLoopStore';

describe('macroLoopStore', () => {
  beforeEach(() => {
    useMacroLoopStore.getState().resetMacroLoop();
  });

  it('initializes with default playlist and state', () => {
    const state = useMacroLoopStore.getState();
    expect(state.boards.length).toBe(DEFAULT_MACRO_BOARDS.length);
    expect(state.currentPlayIndex).toBe(0);
    expect(state.editingBoardIndex).toBeNull();
    expect(state.totalRiskMeter).toBe(0);
    expect(state.accumulatedSolidBlocks).toEqual([]);
  });

  it('locks editing with startEditing and unlocks with cancelEditing', () => {
    const store = useMacroLoopStore.getState();
    store.startEditing(1);
    expect(useMacroLoopStore.getState().editingBoardIndex).toBe(1);

    store.cancelEditing();
    expect(useMacroLoopStore.getState().editingBoardIndex).toBeNull();
  });

  it('saves new config and unlocks with saveEditing', () => {
    const store = useMacroLoopStore.getState();
    store.startEditing(0);

    store.saveEditing({
      seed: 'TEST_SEED',
      sizeTier: 'medium',
      difficultyTier: 'hard',
    });

    const updatedState = useMacroLoopStore.getState();
    expect(updatedState.editingBoardIndex).toBeNull();
    expect(updatedState.boards[0]?.seed).toBe('TEST_SEED');
    expect(updatedState.boards[0]?.sizeTier).toBe('medium');
    expect(updatedState.boards[0]?.difficultyTier).toBe('hard');
  });

  it('advances to next board, recording risk meter and leftover solid blocks', () => {
    const store = useMacroLoopStore.getState();
    expect(store.currentPlayIndex).toBe(0);

    store.advanceToNextBoard(450, [
      { col: 1, row: 2, val: 5 },
      { col: 3, row: 4, val: 9 },
    ]);

    const state = useMacroLoopStore.getState();
    expect(state.currentPlayIndex).toBe(1);
    expect(state.totalRiskMeter).toBe(450);
    expect(state.accumulatedSolidBlocks).toHaveLength(2);
    expect(state.accumulatedSolidBlocks[0]).toEqual({
      originalValue: 5,
      sourceBoardIndex: 1,
      originalPosition: { col: 1, row: 2 },
    });
    expect(state.accumulatedSolidBlocks[1]).toEqual({
      originalValue: 9,
      sourceBoardIndex: 1,
      originalPosition: { col: 3, row: 4 },
    });

    // Historical result on board 0
    expect(state.boards[0]?.result).toEqual({
      phase1Score: 450,
      leftoverBlocksCount: 2,
    });
  });

  it('allows adding boards and setting active play index', () => {
    const store = useMacroLoopStore.getState();
    store.addBoard({
      boardType: 'risk',
      sizeTier: 'large',
      difficultyTier: 'medium',
      seed: 'CUSTOM-SEED',
    });

    const state = useMacroLoopStore.getState();
    expect(state.boards.length).toBe(DEFAULT_MACRO_BOARDS.length + 1);
    expect(state.boards[state.boards.length - 1]?.seed).toBe('CUSTOM-SEED');

    store.playBoard(2);
    expect(useMacroLoopStore.getState().currentPlayIndex).toBe(2);
  });

  it('supports adding and clearing solid blocks manually', () => {
    const store = useMacroLoopStore.getState();
    store.addAccumulatedBlock({ originalValue: 8, sourceBoardIndex: 1 });
    expect(useMacroLoopStore.getState().accumulatedSolidBlocks).toHaveLength(1);

    store.removeAccumulatedBlock(0);
    expect(useMacroLoopStore.getState().accumulatedSolidBlocks).toHaveLength(0);

    store.addAccumulatedBlock({ originalValue: 7, sourceBoardIndex: 2 });
    store.clearAccumulatedBlocks();
    expect(useMacroLoopStore.getState().accumulatedSolidBlocks).toHaveLength(0);
  });
});
