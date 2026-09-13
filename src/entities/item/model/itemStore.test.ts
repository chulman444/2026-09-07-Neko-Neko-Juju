import { describe, it, expect, beforeEach } from 'vitest';
import { useItemStore } from './itemStore';
import { useBoardStore } from '@/entities/board';

describe('useItemStore', () => {
  beforeEach(() => {
    useBoardStore.getState().generateNewBoard('test-stream-seed');
    useItemStore.setState({
      counts: { randomNumber: 5, randomChoose: 5, omnitile: 5, shake: 5, hint: 5 },
      activeItem: null,
      isToggled: false,
      activeItemStage: 0,
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

      // Verify count is decremented immediately on roll
      expect(useItemStore.getState().counts.randomChoose).toBe(4);

      const target = useItemStore.getState().targetTile;
      expect(target).toEqual({ col: 4, row: 2 });

      const options = useItemStore.getState().randomChooseOptions;
      expect(options).toHaveLength(3);

      // Pick chosen number (e.g. 7)
      const confirmSuccess = store.confirmRandomChoose(7, false);
      expect(confirmSuccess).toBe(true);

      // Verify board tile at (4, 2) is now 7
      expect(useBoardStore.getState().matrix[2]?.[4]).toBe(7);

      // Verify count is NOT double-decremented
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
      expect(useItemStore.getState().counts.randomChoose).toBe(4);

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

    it('cycles two-stage button correctly (0 -> 1 -> 2 -> 0)', () => {
      const store = useItemStore.getState();
      store.untoggle();
      expect(useItemStore.getState().activeItemStage).toBe(0);
      expect(useItemStore.getState().isToggled).toBe(false);

      // 1st click: Stage 1 (Single Use)
      store.toggleItem('randomNumber');
      expect(useItemStore.getState().activeItem).toBe('randomNumber');
      expect(useItemStore.getState().activeItemStage).toBe(1);
      expect(useItemStore.getState().isToggled).toBe(true);

      // 2nd click: Stage 2 (Multi-Use)
      store.toggleItem('randomNumber');
      expect(useItemStore.getState().activeItem).toBe('randomNumber');
      expect(useItemStore.getState().activeItemStage).toBe(2);
      expect(useItemStore.getState().isToggled).toBe(true);

      // 3rd click: Disarms to Stage 0
      store.toggleItem('randomNumber');
      expect(useItemStore.getState().activeItem).toBeNull();
      expect(useItemStore.getState().activeItemStage).toBe(0);
      expect(useItemStore.getState().isToggled).toBe(false);

      // Switching from Stage 2 of Random Roll to Random Choose starts at Stage 1
      store.toggleItem('randomNumber'); // Stage 1
      store.toggleItem('randomNumber'); // Stage 2
      expect(useItemStore.getState().activeItemStage).toBe(2);

      store.toggleItem('randomChoose');
      expect(useItemStore.getState().activeItem).toBe('randomChoose');
      expect(useItemStore.getState().activeItemStage).toBe(1);
    });

    it('arms Omnitile and places OMNITILE_VALUE (10) on board', () => {
      const store = useItemStore.getState();
      store.toggleItem('omnitile');
      expect(useItemStore.getState().activeItem).toBe('omnitile');
      expect(useItemStore.getState().isToggled).toBe(true);
      expect(useItemStore.getState().activeItemStage).toBe(1);

      // Click board tile (0, 0)
      const success = store.handleBoardTileClick({ col: 0, row: 0 }, false);
      expect(success).toBe(true);

      // Value on board should now be 10 (OMNITILE_VALUE)
      expect(useBoardStore.getState().matrix[0][0]).toBe(10);
      // Count decremented by 1
      expect(useItemStore.getState().counts.omnitile).toBe(4);
      // Stage 1 disarms after single use
      expect(useItemStore.getState().isToggled).toBe(false);
      expect(useItemStore.getState().activeItem).toBeNull();
    });

    it('Omnitile in Stage 2 stays armed for continuous placement', () => {
      const store = useItemStore.getState();
      store.toggleItem('omnitile'); // Stage 1
      store.toggleItem('omnitile'); // Stage 2
      expect(useItemStore.getState().activeItemStage).toBe(2);

      store.handleBoardTileClick({ col: 0, row: 0 }, false);
      expect(useBoardStore.getState().matrix[0][0]).toBe(10);
      expect(useItemStore.getState().counts.omnitile).toBe(4);
      expect(useItemStore.getState().isToggled).toBe(true);
      expect(useItemStore.getState().activeItem).toBe('omnitile');

      store.handleBoardTileClick({ col: 1, row: 0 }, false);
      expect(useBoardStore.getState().matrix[0][1]).toBe(10);
      expect(useItemStore.getState().counts.omnitile).toBe(3);
      expect(useItemStore.getState().isToggled).toBe(true);
    });

    it('triggers Shake board and re-rolls fresh values for live tiles', () => {
      const store = useItemStore.getState();
      useBoardStore.setState({
        matrix: [
          [3, 3, 3],
          [0, 0, 0],
          [0, 0, 0],
        ],
        minNum: 1,
        maxNum: 9,
      });

      const success = store.triggerShakeItem(false);
      expect(success).toBe(true);
      expect(useItemStore.getState().counts.shake).toBe(4);

      const matrix = useBoardStore.getState().matrix;
      expect(matrix[0][0]).toBeGreaterThanOrEqual(1);
      expect(matrix[0][0]).toBeLessThanOrEqual(9);
      expect(matrix[0][1]).toBeGreaterThanOrEqual(1);
      expect(matrix[0][1]).toBeLessThanOrEqual(9);
      expect(matrix[0][2]).toBeGreaterThanOrEqual(1);
      expect(matrix[0][2]).toBeLessThanOrEqual(9);
      expect(matrix[1][0]).toBe(0);
      expect(matrix[2][0]).toBe(0);
    });

    it('allows Free Shake with 0 inventory cost when isFree is true', () => {
      const store = useItemStore.getState();
      useItemStore.setState({
        counts: { randomNumber: 5, randomChoose: 5, omnitile: 5, shake: 0, hint: 5 },
      });

      // Regular shake with 0 inventory fails
      expect(store.triggerShakeItem(false)).toBe(false);

      // Free shake succeeds and does not go negative
      expect(store.triggerShakeItem(true)).toBe(true);
      expect(useItemStore.getState().counts.shake).toBe(0);
    });

    it('charges randomChoose immediately on tile click and costs an additional item to re-roll', () => {
      const store = useItemStore.getState();
      store.toggleItem('randomChoose');

      expect(useItemStore.getState().counts.randomChoose).toBe(5);

      // 1st roll on tile (0, 0)
      const roll1 = store.handleBoardTileClick({ col: 0, row: 0 }, false);
      expect(roll1).toBe(true);
      expect(useItemStore.getState().counts.randomChoose).toBe(4);
      expect(useItemStore.getState().targetTile).toEqual({ col: 0, row: 0 });

      // 2nd roll (re-roll on tile 1, 0) costs another item
      const roll2 = store.handleBoardTileClick({ col: 1, row: 0 }, false);
      expect(roll2).toBe(true);
      expect(useItemStore.getState().counts.randomChoose).toBe(3);
      expect(useItemStore.getState().targetTile).toEqual({ col: 1, row: 0 });

      // Confirm chosen value - count remains 3 (no double charge)
      const confirm = store.confirmRandomChoose(9, false);
      expect(confirm).toBe(true);
      expect(useBoardStore.getState().matrix[0]?.[1]).toBe(9);
      expect(useItemStore.getState().counts.randomChoose).toBe(3);
    });

    it('rejects tile click and re-roll for randomChoose when count is 0', () => {
      const store = useItemStore.getState();
      useItemStore.setState({
        counts: { randomNumber: 5, randomChoose: 0, omnitile: 5, shake: 5, hint: 5 },
      });
      store.toggleItem('randomChoose');

      const roll = store.handleBoardTileClick({ col: 0, row: 0 }, false);
      expect(roll).toBe(false);
      expect(useItemStore.getState().targetTile).toBeNull();
      expect(useItemStore.getState().randomChooseOptions).toBeNull();
    });

    it('rejects tile click on empty or cleared cells (matrix <= 0) for all items without consuming counts', () => {
      const store = useItemStore.getState();
      // Set cell (0, 0) as cleared (0)
      useBoardStore.setState({
        matrix: [
          [0, 5, 5],
          [5, 5, 5],
          [5, 5, 5],
        ],
      });

      // 1. Random Number on empty cell
      store.toggleItem('randomNumber');
      const resRandomNumber = store.handleBoardTileClick({ col: 0, row: 0 }, false);
      expect(resRandomNumber).toBe(false);
      expect(useItemStore.getState().counts.randomNumber).toBe(5);
      expect(useBoardStore.getState().matrix[0]?.[0]).toBe(0);

      // 2. Random Choose on empty cell
      store.toggleItem('randomChoose');
      const resRandomChoose = store.handleBoardTileClick({ col: 0, row: 0 }, false);
      expect(resRandomChoose).toBe(false);
      expect(useItemStore.getState().counts.randomChoose).toBe(5);
      expect(useItemStore.getState().targetTile).toBeNull();

      // 3. Omnitile on empty cell
      store.toggleItem('omnitile');
      const resOmnitile = store.handleBoardTileClick({ col: 0, row: 0 }, false);
      expect(resOmnitile).toBe(false);
      expect(useItemStore.getState().counts.omnitile).toBe(5);
      expect(useBoardStore.getState().matrix[0]?.[0]).toBe(0);
    });
  });
});
