import { describe, it, expect, beforeEach } from 'vitest';
import { useItemStore } from './itemStore';
import { useBoardStore } from '@/entities/board';

describe('useItemStore', () => {
  beforeEach(() => {
    useBoardStore.getState().generateNewBoard('test-stream-seed');
    useItemStore.setState({
      counts: { randomNumber: 5, randomChoose: 5, hint: 5 },
      activeItem: null,
      isToggled: false,
      historyConstraintN: 3,
      rollHistory: [],
      currentRolledNumber: null,
      randomChooseOptions: null,
      selectedChooseNumber: null,
      useBoardSeed: true,
    });
    useBoardStore.setState({ minNum: 1, maxNum: 9 });
  });

  it('initializes with 5 of each item', () => {
    const counts = useItemStore.getState().counts;
    expect(counts.randomNumber).toBe(5);
    expect(counts.randomChoose).toBe(5);
    expect(counts.hint).toBe(5);
  });

  it('decrements count on normal roll but preserves count on free roll', () => {
    const store = useItemStore.getState();

    // Normal roll
    const rolled = store.rollRandomNumber(false);
    expect(rolled).toBeTypeOf('number');
    expect(useItemStore.getState().counts.randomNumber).toBe(4);

    // Free roll (from dev panel)
    store.rollRandomNumber(true);
    expect(useItemStore.getState().counts.randomNumber).toBe(4);
  });

  it('does not repeat the last N rolled numbers', () => {
    useItemStore.getState().setHistoryConstraintN(3);

    for (let i = 0; i < 20; i++) {
      const historyBefore = [...useItemStore.getState().rollHistory];
      const roll = useItemStore.getState().rollRandomNumber(true);
      expect(roll).not.toBeNull();
      if (historyBefore.length > 0) {
        expect(historyBefore).not.toContain(roll);
      }
    }
  });

  it('cycles through all 9 numbers without duplicate in window when N=8', () => {
    useItemStore.getState().setHistoryConstraintN(8);

    // Roll 9 times
    const rolls: number[] = [];
    for (let i = 0; i < 9; i++) {
      const r = useItemStore.getState().rollRandomNumber(true);
      if (r !== null) rolls.push(r);
    }

    // When N=8, in a block of 9 consecutive rolls from 1..9, all 9 unique digits must appear!
    const unique = new Set(rolls);
    expect(unique.size).toBe(9);
  });

  it('generates 3 valid candidate numbers for random choose and advances stream', () => {
    const options1 = useItemStore.getState().rollRandomChoose(false);
    expect(options1).not.toBeNull();
    expect(options1).toHaveLength(3);
    options1?.forEach((num) => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(9);
    });
    expect(useItemStore.getState().counts.randomChoose).toBe(4);

    // Roll again and verify stream produces another valid set of numbers
    const options2 = useItemStore.getState().rollRandomChoose(true);
    expect(options2).not.toBeNull();
    // Verify that options across multiple rolls are not stuck on identical static values
    const allNumbers = [...(options1 ?? []), ...(options2 ?? [])];
    const unique = new Set(allNumbers);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('toggles and untoggles properly', () => {
    const store = useItemStore.getState();
    store.toggleItem('randomNumber');
    expect(useItemStore.getState().isToggled).toBe(true);
    expect(useItemStore.getState().activeItem).toBe('randomNumber');

    // Untoggle
    store.untoggle();
    expect(useItemStore.getState().isToggled).toBe(false);
    expect(useItemStore.getState().activeItem).toBeNull();
  });

  it('allows dev panel to set item counts', () => {
    useItemStore.getState().setItemCount('hint', 12);
    expect(useItemStore.getState().counts.hint).toBe(12);

    useItemStore.getState().resetItemCounts();
    expect(useItemStore.getState().counts.hint).toBe(5);
  });

  describe('In-Place Board Tile Rolling & Toggle Check', () => {
    it('rolls Random Number in-place onto board tile and auto-untoggles in Single Use mode', () => {
      const store = useItemStore.getState();
      store.setToggleCheck('randomNumber', false); // Single Use
      store.toggleItem('randomNumber');

      expect(useItemStore.getState().isToggled).toBe(true);
      expect(useItemStore.getState().activeItem).toBe('randomNumber');

      // Tap tile (2, 3)
      const success = store.handleBoardTileClick({ col: 2, row: 3 }, false);
      expect(success).toBe(true);

      // Verify board tile was updated directly
      const tileVal = useBoardStore.getState().matrix[3]?.[2];
      expect(tileVal).toBeGreaterThanOrEqual(1);
      expect(tileVal).toBeLessThanOrEqual(9);

      // Verify item count decremented
      expect(useItemStore.getState().counts.randomNumber).toBe(4);

      // Verify Single Use auto-untoggled back to select mode
      expect(useItemStore.getState().isToggled).toBe(false);
      expect(useItemStore.getState().activeItem).toBeNull();
    });

    it('stays armed in Random Number mode when Multiple Use is enabled', () => {
      const store = useItemStore.getState();
      store.setToggleCheck('randomNumber', true); // Multiple Use
      store.toggleItem('randomNumber');

      // 1st roll on tile (1, 1)
      const success1 = store.handleBoardTileClick({ col: 1, row: 1 }, false);
      expect(success1).toBe(true);
      expect(useItemStore.getState().counts.randomNumber).toBe(4);
      expect(useItemStore.getState().isToggled).toBe(true);
      expect(useItemStore.getState().activeItem).toBe('randomNumber');

      // 2nd roll on the EXACT SAME tile (1, 1) to re-roll
      const success2 = store.handleBoardTileClick({ col: 1, row: 1 }, false);
      expect(success2).toBe(true);
      expect(useItemStore.getState().counts.randomNumber).toBe(3);
      expect(useItemStore.getState().isToggled).toBe(true);
      expect(useItemStore.getState().activeItem).toBe('randomNumber');

      // Untoggle manually
      store.untoggle();
      expect(useItemStore.getState().isToggled).toBe(false);
    });

    it('targets tile and confirms choice for Random Choose in Single Use mode', () => {
      const store = useItemStore.getState();
      store.setToggleCheck('randomChoose', false); // Single Use
      store.toggleItem('randomChoose');

      // Tap tile (4, 2) to target it
      const success = store.handleBoardTileClick({ col: 4, row: 2 }, false);
      expect(success).toBe(true);

      const target = useItemStore.getState().targetTile;
      expect(target).toEqual({ col: 4, row: 2 });

      const options = useItemStore.getState().randomChooseOptions;
      expect(options).toHaveLength(3);

      // Pick chosen number (e.g. 7)
      const confirmSuccess = store.confirmRandomChoose(7, false);
      expect(confirmSuccess).toBe(true);

      // Verify board tile at (4, 2) is now 7
      expect(useBoardStore.getState().matrix[2]?.[4]).toBe(7);

      // Verify count decremented
      expect(useItemStore.getState().counts.randomChoose).toBe(4);

      // Verify target cleared and auto-untoggled
      expect(useItemStore.getState().targetTile).toBeNull();
      expect(useItemStore.getState().isToggled).toBe(false);
      expect(useItemStore.getState().activeItem).toBeNull();
    });

    it('stays armed for next tile in Random Choose when Multiple Use is enabled', () => {
      const store = useItemStore.getState();
      store.setToggleCheck('randomChoose', true); // Multiple Use
      store.toggleItem('randomChoose');

      // Target tile (0, 0)
      store.handleBoardTileClick({ col: 0, row: 0 }, false);
      store.confirmRandomChoose(8, false);

      expect(useBoardStore.getState().matrix[0]?.[0]).toBe(8);
      expect(useItemStore.getState().counts.randomChoose).toBe(4);

      // Stays armed in randomChoose mode, ready for next tile!
      expect(useItemStore.getState().isToggled).toBe(true);
      expect(useItemStore.getState().activeItem).toBe('randomChoose');
      expect(useItemStore.getState().targetTile).toBeNull();
    });

    it('enforces strict mutual exclusion between items', () => {
      const store = useItemStore.getState();
      store.toggleItem('randomNumber');
      expect(useItemStore.getState().activeItem).toBe('randomNumber');

      // Activating randomChoose disarms randomNumber
      store.toggleItem('randomChoose');
      expect(useItemStore.getState().activeItem).toBe('randomChoose');

      // Target a tile
      store.handleBoardTileClick({ col: 1, row: 1 }, false);
      expect(useItemStore.getState().targetTile).toEqual({ col: 1, row: 1 });

      // Switching to randomNumber clears targetTile and switches mode
      store.toggleItem('randomNumber');
      expect(useItemStore.getState().activeItem).toBe('randomNumber');
      expect(useItemStore.getState().targetTile).toBeNull();
      expect(useItemStore.getState().randomChooseOptions).toBeNull();
    });
  });
});
