import { describe, it, expect, beforeEach } from 'vitest';
import { useItemStore, DEFAULT_ITEM_COUNTS } from './itemStore';

describe('useItemStore', () => {
  beforeEach(() => {
    useItemStore.setState({
      counts: { ...DEFAULT_ITEM_COUNTS },
      activeItem: null,
      isToggled: false,
      activeItemStage: 0,
    });
  });

  it('initializes with default counts of 5 each', () => {
    const counts = useItemStore.getState().counts;
    expect(counts.randomNumber).toBe(5);
    expect(counts.randomChoose).toBe(5);
    expect(counts.omnitile).toBe(5);
    expect(counts.shake).toBe(5);
    expect(counts.hint).toBe(5);
  });

  it('allows setting and resetting item counts', () => {
    const store = useItemStore.getState();
    store.setItemCount('hint', 12);
    expect(useItemStore.getState().counts.hint).toBe(12);

    store.setItemCount('hint', -5);
    expect(useItemStore.getState().counts.hint).toBe(0);

    store.resetItemCounts();
    expect(useItemStore.getState().counts.hint).toBe(5);
  });

  it('consumes items correctly and fails when insufficient', () => {
    const store = useItemStore.getState();
    expect(store.consumeItem('shake', 2)).toBe(true);
    expect(useItemStore.getState().counts.shake).toBe(3);

    expect(store.consumeItem('shake', 4)).toBe(false);
    expect(useItemStore.getState().counts.shake).toBe(3);

    expect(store.consumeItem('shake', 3)).toBe(true);
    expect(useItemStore.getState().counts.shake).toBe(0);
  });

  it('adds items correctly and ignores non-positive amounts', () => {
    const store = useItemStore.getState();
    store.addItem('omnitile', 3);
    expect(useItemStore.getState().counts.omnitile).toBe(8);

    store.addItem('omnitile', 0);
    expect(useItemStore.getState().counts.omnitile).toBe(8);

    store.addItem('omnitile', -2);
    expect(useItemStore.getState().counts.omnitile).toBe(8);
  });

  it('toggles, cycles stages, and untoggles items', () => {
    const store = useItemStore.getState();

    // 1st click: stage 1
    store.toggleItem('randomNumber');
    expect(useItemStore.getState().isToggled).toBe(true);
    expect(useItemStore.getState().activeItem).toBe('randomNumber');
    expect(useItemStore.getState().activeItemStage).toBe(1);

    // 2nd click: stage 2
    store.toggleItem('randomNumber');
    expect(useItemStore.getState().isToggled).toBe(true);
    expect(useItemStore.getState().activeItem).toBe('randomNumber');
    expect(useItemStore.getState().activeItemStage).toBe(2);

    // 3rd click: untoggle
    store.toggleItem('randomNumber');
    expect(useItemStore.getState().isToggled).toBe(false);
    expect(useItemStore.getState().activeItem).toBeNull();
    expect(useItemStore.getState().activeItemStage).toBe(0);

    // Switching to a different item arms in stage 1
    store.toggleItem('omnitile');
    expect(useItemStore.getState().activeItem).toBe('omnitile');
    expect(useItemStore.getState().activeItemStage).toBe(1);

    store.untoggle();
    expect(useItemStore.getState().isToggled).toBe(false);
    expect(useItemStore.getState().activeItem).toBeNull();
    expect(useItemStore.getState().activeItemStage).toBe(0);
  });

  it('sets active item directly', () => {
    const store = useItemStore.getState();
    store.setActiveItem('randomChoose', 2);
    expect(useItemStore.getState().isToggled).toBe(true);
    expect(useItemStore.getState().activeItem).toBe('randomChoose');
    expect(useItemStore.getState().activeItemStage).toBe(2);

    store.setActiveItem(null);
    expect(useItemStore.getState().isToggled).toBe(false);
    expect(useItemStore.getState().activeItem).toBeNull();
    expect(useItemStore.getState().activeItemStage).toBe(0);
  });
});
