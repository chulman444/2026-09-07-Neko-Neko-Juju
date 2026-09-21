import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBoardStore } from '@/entities/board';
import {
  useRivalCatStore,
  setRivalCatHintsResolver,
  registerRivalStealListener,
} from './rivalCatStore';

describe('rivalCatStore', () => {
  beforeEach(() => {
    useRivalCatStore.setState({
      isEnabled: false,
      defeatCondition: 'any_overlap',
      dormantDuration: 6,
      spawnInterval: 5,
      stealDuration: 4,
      pushbackPerClear: 1.5,
      toughCatPushbackBonus: -0.5,
      stolenTilesCount: 0,
      rivalCatInterval: 5,
      rivalCatCountdown: 5,
      activeRivalCats: 1,
      cats: [
        {
          id: 'cat-1',
          type: 'normal',
          phase: 'idle',
          countdown: 5,
          targetMatch: null,
        },
      ],
    });
    setRivalCatHintsResolver(null);
    registerRivalStealListener(null);
    useBoardStore.getState().setMatrix([
      [1, 9, 2],
      [3, 7, 4],
      [5, 5, 6],
    ]);
  });

  it('initializes with default values and variants', () => {
    const state = useRivalCatStore.getState();
    expect(state.isEnabled).toBe(false);
    expect(state.defeatCondition).toBe('any_overlap');
    expect(state.cats).toHaveLength(1);
    expect(state.cats[0].type).toBe('normal');
    expect(state.cats[0].phase).toBe('idle');
    expect(state.stolenTilesCount).toBe(0);
  });

  it('does not decrement countdown on tick when disabled or paused', () => {
    useRivalCatStore.getState().setIsEnabled(false);
    useRivalCatStore.getState().tick(1.0, false);
    expect(useRivalCatStore.getState().cats[0].countdown).toBe(5);

    useRivalCatStore.getState().setIsEnabled(true);
    useRivalCatStore.getState().tick(1.0, true);
    expect(useRivalCatStore.getState().cats[0].countdown).toBe(5);
  });

  it('transitions from idle to targeting when countdown reaches 0 and hints exist', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    useRivalCatStore.getState().setSpawnInterval(3);

    const combo = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ];
    setRivalCatHintsResolver(() => [combo]);

    // Tick 3s to transition from idle to targeting
    useRivalCatStore.getState().tick(3.0, false);

    const cat = useRivalCatStore.getState().cats[0];
    expect(cat.phase).toBe('targeting');
    expect(cat.countdown).toBe(4); // stealDuration
    expect(cat.targetMatch).toEqual(combo);
  });

  it('executes steal when targeting countdown reaches 0', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    const combo = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ];
    setRivalCatHintsResolver(() => [combo]);

    const stealSpy = vi.fn();
    registerRivalStealListener(stealSpy);

    useRivalCatStore.setState({
      cats: [
        {
          id: 'cat-1',
          type: 'normal',
          phase: 'targeting',
          countdown: 2.0,
          targetMatch: combo,
        },
      ],
    });

    useRivalCatStore.getState().tick(2.0, false);

    expect(useBoardStore.getState().matrix[0]?.[0]).toBe(0);
    expect(useBoardStore.getState().matrix[0]?.[1]).toBe(0);
    expect(useRivalCatStore.getState().stolenTilesCount).toBe(2);
    expect(stealSpy).toHaveBeenCalledWith(combo);

    const catAfterSteal = useRivalCatStore.getState().cats[0];
    expect(catAfterSteal.phase).toBe('idle');
    expect(catAfterSteal.targetMatch).toBeNull();
  });

  it('handles any_overlap defeat condition: normal becomes dormant, tough gets idle penalty', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    useRivalCatStore.getState().setDefeatCondition('any_overlap');

    const targetCombo = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ];

    // Normal cat targeting
    useRivalCatStore.setState({
      cats: [
        {
          id: 'cat-normal',
          type: 'normal',
          phase: 'targeting',
          countdown: 3.0,
          targetMatch: targetCombo,
        },
        {
          id: 'cat-tough',
          type: 'tough',
          phase: 'targeting',
          countdown: 3.0,
          targetMatch: targetCombo,
        },
      ],
    });

    // Player clears one overlapping tile
    useRivalCatStore.getState().onPlayerClearedTiles([{ col: 0, row: 0 }]);

    const normalCat = useRivalCatStore.getState().cats.find((c) => c.id === 'cat-normal')!;
    const toughCat = useRivalCatStore.getState().cats.find((c) => c.id === 'cat-tough')!;

    expect(normalCat.phase).toBe('dormant');
    expect(normalCat.countdown).toBe(6); // dormantDuration
    expect(normalCat.targetMatch).toBeNull();

    expect(toughCat.phase).toBe('idle');
    expect(toughCat.countdown).toBe(10); // spawnInterval * 2 = 5 * 2
    expect(toughCat.targetMatch).toBeNull();
  });

  it('handles exact_match defeat condition: partial overlap causes break instead of defeat', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    useRivalCatStore.getState().setDefeatCondition('exact_match');

    const targetCombo = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ];
    const newHint = [
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ];
    setRivalCatHintsResolver(() => [newHint]);

    useRivalCatStore.setState({
      cats: [
        {
          id: 'cat-normal',
          type: 'normal',
          phase: 'targeting',
          countdown: 3.0,
          targetMatch: targetCombo,
        },
        {
          id: 'cat-tough',
          type: 'tough',
          phase: 'targeting',
          countdown: 3.0,
          targetMatch: targetCombo,
        },
      ],
    });

    // Player clears partial overlap (not exact match)
    useRivalCatStore.getState().onPlayerClearedTiles([{ col: 0, row: 0 }]);

    const normalCat = useRivalCatStore.getState().cats.find((c) => c.id === 'cat-normal')!;
    const toughCat = useRivalCatStore.getState().cats.find((c) => c.id === 'cat-tough')!;

    // Normal cat forgives and retreats to idle
    expect(normalCat.phase).toBe('idle');
    expect(normalCat.countdown).toBe(5);
    expect(normalCat.targetMatch).toBeNull();

    // Tough cat is relentless: immediately targets new hint and resets stealDuration
    expect(toughCat.phase).toBe('targeting');
    expect(toughCat.countdown).toBe(4);
    expect(toughCat.targetMatch).toEqual(newHint);
  });

  it('handles start_tile_only defeat condition', () => {
    useRivalCatStore.getState().setIsEnabled(true);
    useRivalCatStore.getState().setDefeatCondition('start_tile_only');

    const targetCombo = [
      { col: 0, row: 0 }, // start tile
      { col: 1, row: 0 }, // second tile
    ];

    // Case 1: Player clears second tile -> Broken (not defeated)
    useRivalCatStore.setState({
      cats: [
        {
          id: 'cat-normal',
          type: 'normal',
          phase: 'targeting',
          countdown: 3.0,
          targetMatch: targetCombo,
        },
      ],
    });
    useRivalCatStore.getState().onPlayerClearedTiles([{ col: 1, row: 0 }]);
    expect(useRivalCatStore.getState().cats[0].phase).toBe('idle');

    // Case 2: Player clears start tile -> Defeated!
    useRivalCatStore.setState({
      cats: [
        {
          id: 'cat-normal',
          type: 'normal',
          phase: 'targeting',
          countdown: 3.0,
          targetMatch: targetCombo,
        },
      ],
    });
    useRivalCatStore.getState().onPlayerClearedTiles([{ col: 0, row: 0 }]);
    expect(useRivalCatStore.getState().cats[0].phase).toBe('dormant');
  });

  it('applies pushback to idle cats when player clears tiles, but does not push back targeting cats', () => {
    useRivalCatStore.getState().setIsEnabled(true);

    const targetCombo = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ];

    useRivalCatStore.setState({
      pushbackPerClear: 1.5,
      toughCatPushbackBonus: -0.5,
      cats: [
        {
          id: 'cat-idle-normal',
          type: 'normal',
          phase: 'idle',
          countdown: 4.0,
          targetMatch: null,
        },
        {
          id: 'cat-idle-tough',
          type: 'tough',
          phase: 'idle',
          countdown: 4.0,
          targetMatch: null,
        },
        {
          id: 'cat-targeting-normal',
          type: 'normal',
          phase: 'targeting',
          countdown: 2.0,
          targetMatch: targetCombo,
        },
      ],
    });

    // Player clears unrelated tile (2, 2)
    useRivalCatStore.getState().onPlayerClearedTiles([{ col: 2, row: 2 }]);

    const idleNormalCat = useRivalCatStore.getState().cats.find((c) => c.id === 'cat-idle-normal')!;
    const idleToughCat = useRivalCatStore.getState().cats.find((c) => c.id === 'cat-idle-tough')!;
    const targetingCat = useRivalCatStore
      .getState()
      .cats.find((c) => c.id === 'cat-targeting-normal')!;

    // Idle Normal: 4.0 + 1.5 = 5.5
    expect(idleNormalCat.countdown).toBeCloseTo(5.5);
    // Idle Tough: 4.0 + (1.5 - 0.5) = 5.0
    expect(idleToughCat.countdown).toBeCloseTo(5.0);
    // Targeting: Unchanged, no pushback while targeting
    expect(targetingCat.countdown).toBeCloseTo(2.0);
  });

  it('updates showTargets via setShowTargets', () => {
    expect(useRivalCatStore.getState().showTargets).toBe(true);
    useRivalCatStore.getState().setShowTargets(false);
    expect(useRivalCatStore.getState().showTargets).toBe(false);
  });

  it('updates showTimer via setShowTimer', () => {
    expect(useRivalCatStore.getState().showTimer).toBe(true);
    useRivalCatStore.getState().setShowTimer(false);
    expect(useRivalCatStore.getState().showTimer).toBe(false);
  });

  it('detects externally broken targets on tick and reacts accordingly', () => {
    useRivalCatStore.getState().setIsEnabled(true);

    const targetCombo = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ];
    const newHint = [
      { col: 0, row: 2 },
      { col: 1, row: 2 },
    ];
    setRivalCatHintsResolver(() => [newHint]);

    useRivalCatStore.setState({
      cats: [
        {
          id: 'cat-normal',
          type: 'normal',
          phase: 'targeting',
          countdown: 3.0,
          targetMatch: targetCombo,
        },
        {
          id: 'cat-tough',
          type: 'tough',
          phase: 'targeting',
          countdown: 3.0,
          targetMatch: targetCombo,
        },
      ],
    });

    // An external event sets tile (0, 0) to 0
    useBoardStore.getState().clearTiles([{ col: 0, row: 0 }]);

    useRivalCatStore.getState().tick(0.1, false);

    const normalCat = useRivalCatStore.getState().cats.find((c) => c.id === 'cat-normal')!;
    const toughCat = useRivalCatStore.getState().cats.find((c) => c.id === 'cat-tough')!;

    // Normal cat retreats to idle
    expect(normalCat.phase).toBe('idle');
    expect(normalCat.targetMatch).toBeNull();

    // Tough cat picks new hint
    expect(toughCat.phase).toBe('targeting');
    expect(toughCat.targetMatch).toEqual(newHint);
  });

  it('allows adding and removing cats with minimum boundary', () => {
    const newId = useRivalCatStore.getState().addCat('tough');
    expect(useRivalCatStore.getState().cats).toHaveLength(2);
    expect(useRivalCatStore.getState().cats[1].type).toBe('tough');

    useRivalCatStore.getState().removeCat(newId);
    expect(useRivalCatStore.getState().cats).toHaveLength(1);

    // Should not remove last cat
    useRivalCatStore.getState().removeCat(useRivalCatStore.getState().cats[0].id);
    expect(useRivalCatStore.getState().cats).toHaveLength(1);
  });

  it('resets countdown and cats with resetRivalCats', () => {
    useRivalCatStore.getState().addCat('tough');
    useRivalCatStore.setState({ stolenTilesCount: 15 });

    useRivalCatStore.getState().resetRivalCats();

    const state = useRivalCatStore.getState();
    expect(state.cats).toHaveLength(1);
    expect(state.cats[0].type).toBe('normal');
    expect(state.cats[0].phase).toBe('idle');
    expect(state.stolenTilesCount).toBe(0);
  });
});
