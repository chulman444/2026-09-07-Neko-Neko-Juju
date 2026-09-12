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
});
