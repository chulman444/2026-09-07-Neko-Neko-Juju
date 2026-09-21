import { describe, it, expect, beforeEach } from 'vitest';
import { useItemStore } from '@/entities/item';
import { useGameSessionStore } from '@/entities/game-session';
import {
  coreItemBehaviors,
  randomNumberBehavior,
  randomChooseBehavior,
  omnitileBehavior,
  hintBehavior,
  shakeBehavior,
} from './coreItemBehaviors';
import {
  useCoreItemsStore,
  setUnsolvableResolver,
  registerHintTriggerHandler,
} from './coreItemsStore';
import type { ItemRenderContext } from '@/entities/item';

describe('coreItemBehaviors', () => {
  beforeEach(() => {
    useItemStore.setState({
      counts: { randomNumber: 3, randomChoose: 2, omnitile: 1, shake: 4, hint: 5 },
      activeItem: null,
      isToggled: false,
      activeItemStage: 0,
    });
    useCoreItemsStore.setState({
      toggleCheck: { randomNumber: false, randomChoose: false, omnitile: false },
      targetTile: null,
      randomChooseOptions: null,
      selectedChooseNumber: null,
      hintSuccessFlash: false,
      shakeSuccessFlash: false,
    });
    useGameSessionStore.getState().resetSession();
    setUnsolvableResolver(null);
  });

  const getContext = (): ItemRenderContext => {
    const { counts, activeItem, activeItemStage, isToggled } = useItemStore.getState();
    const isPaused = useGameSessionStore.getState().isPaused;
    return { counts, activeItem, activeItemStage, isToggled, isPaused };
  };

  it('contains all 5 core item behaviors', () => {
    expect(coreItemBehaviors).toHaveLength(5);
    expect(coreItemBehaviors.map((b) => b.id)).toEqual([
      'randomNumber',
      'randomChoose',
      'omnitile',
      'hint',
      'shake',
    ]);
  });

  it('evaluates randomNumberBehavior correctly', () => {
    let ctx = getContext();
    expect(randomNumberBehavior.id).toBe('randomNumber');
    expect(randomNumberBehavior.icon).toBe('🎲');
    expect(
      typeof randomNumberBehavior.label === 'function' ? randomNumberBehavior.label(ctx) : ''
    ).toBe('×3');

    // Activate item
    randomNumberBehavior.onActivate(ctx);
    expect(useItemStore.getState().activeItem).toBe('randomNumber');
    expect(useItemStore.getState().isToggled).toBe(true);

    ctx = getContext();
    expect(
      typeof randomNumberBehavior.leftWingState === 'function'
        ? randomNumberBehavior.leftWingState(ctx)
        : ''
    ).toBe('amber');
    expect(
      typeof randomNumberBehavior.rightWingState === 'function'
        ? randomNumberBehavior.rightWingState(ctx)
        : ''
    ).toBe('inactive');
  });

  it('evaluates randomChooseBehavior correctly', () => {
    const ctx = getContext();
    expect(randomChooseBehavior.id).toBe('randomChoose');
    expect(randomChooseBehavior.icon).toBe('🎰');
    expect(
      typeof randomChooseBehavior.label === 'function' ? randomChooseBehavior.label(ctx) : ''
    ).toBe('×2');

    randomChooseBehavior.onActivate(ctx);
    expect(useItemStore.getState().activeItem).toBe('randomChoose');
    expect(useItemStore.getState().isToggled).toBe(true);
  });

  it('evaluates omnitileBehavior correctly', () => {
    const ctx = getContext();
    expect(omnitileBehavior.id).toBe('omnitile');
    expect(omnitileBehavior.icon).toBe('⭐');
    expect(omnitileBehavior.size).toBe('sm');
    expect(typeof omnitileBehavior.label === 'function' ? omnitileBehavior.label(ctx) : '').toBe(
      '×1'
    );

    omnitileBehavior.onActivate(ctx);
    expect(useItemStore.getState().activeItem).toBe('omnitile');
  });

  it('evaluates hintBehavior and triggers hint handler', () => {
    let hintTriggered = false;
    registerHintTriggerHandler(() => {
      hintTriggered = true;
      return true;
    });

    const ctx = getContext();
    expect(hintBehavior.id).toBe('hint');
    expect(hintBehavior.icon).toBe('💡');
    expect(typeof hintBehavior.label === 'function' ? hintBehavior.label(ctx) : '').toBe('×5');

    hintBehavior.onActivate(ctx);
    expect(hintTriggered).toBe(true);
  });

  it('evaluates shakeBehavior label as FREE when board is unsolvable', () => {
    let ctx = getContext();
    expect(typeof shakeBehavior.label === 'function' ? shakeBehavior.label(ctx) : '').toBe('×4');

    // Set unsolvable
    setUnsolvableResolver(() => true);
    ctx = getContext();
    expect(typeof shakeBehavior.label === 'function' ? shakeBehavior.label(ctx) : '').toBe('FREE');
    expect(
      typeof shakeBehavior.leftWingState === 'function' ? shakeBehavior.leftWingState(ctx) : ''
    ).toBe('emerald');
  });

  it('disables items when paused or counts are 0', () => {
    useItemStore.setState({
      counts: { randomNumber: 0, randomChoose: 0, omnitile: 0, shake: 0, hint: 0 },
    });
    const ctx = getContext();

    expect(
      typeof randomNumberBehavior.disabled === 'function'
        ? randomNumberBehavior.disabled(ctx)
        : false
    ).toBe(true);
    expect(
      typeof randomChooseBehavior.disabled === 'function'
        ? randomChooseBehavior.disabled(ctx)
        : false
    ).toBe(true);
    expect(
      typeof omnitileBehavior.disabled === 'function' ? omnitileBehavior.disabled(ctx) : false
    ).toBe(true);
    expect(typeof hintBehavior.disabled === 'function' ? hintBehavior.disabled(ctx) : false).toBe(
      true
    );
    expect(typeof shakeBehavior.disabled === 'function' ? shakeBehavior.disabled(ctx) : false).toBe(
      true
    );
  });
});
