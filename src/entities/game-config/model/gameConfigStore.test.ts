import { describe, it, expect, beforeEach } from 'vitest';
import { useGameConfigStore, PRESET_CONFIGS, DEFAULT_PRESET } from './gameConfigStore';

describe('useGameConfigStore', () => {
  beforeEach(() => {
    useGameConfigStore.getState().setPreset(DEFAULT_PRESET);
  });

  it('initializes with default preset arcade flags', () => {
    expect(PRESET_CONFIGS.arcade.enableItems).toBe(true);
    expect(PRESET_CONFIGS.arcade.enableItemRefills).toBe(true);
    expect(PRESET_CONFIGS.classic.enableItems).toBe(false);
    expect(PRESET_CONFIGS.classic.enableItemRefills).toBe(false);
    const state = useGameConfigStore.getState();
    expect(state.preset).toBe('arcade');
    expect(state.enableItems).toBe(true);
    expect(state.enableItemRefills).toBe(true);
    expect(state.itemRefillStyle).toBe('spin');
    expect(state.enableDevTools).toBe(true);
    expect(state.enableSolidBlocks).toBe(false);
    expect(state.enableBounties).toBe(false);
    expect(state.enableCombos).toBe(true);
    expect(state.enableFreeTriggeredHint).toBe(true);
    expect(state.enableTimer).toBe(true);
    expect(state.enableSelectionHUD).toBe(true);
  });

  it('switches to classic preset and updates flags', () => {
    useGameConfigStore.getState().setPreset('classic');
    const state = useGameConfigStore.getState();
    expect(state.preset).toBe('classic');
    expect(state.enableItems).toBe(false);
    expect(state.enableDevTools).toBe(true);
    expect(state.enableFreeTriggeredHint).toBe(false);
    expect(state.enableSelectionHUD).toBe(false);
    expect(state.enableCombos).toBe(true);
    expect(state.enableTimer).toBe(true);
  });

  it('switches to editor preset and updates flags', () => {
    useGameConfigStore.getState().setPreset('editor');
    const state = useGameConfigStore.getState();
    expect(state.preset).toBe('editor');
    expect(state.enableItems).toBe(false);
    expect(state.enableDevTools).toBe(true);
    expect(state.enableFreeTriggeredHint).toBe(true);
  });

  it('switches to roguelite preset and enables bounties and solid blocks', () => {
    useGameConfigStore.getState().setPreset('roguelite');
    const state = useGameConfigStore.getState();
    expect(state.preset).toBe('roguelite');
    expect(state.enableItems).toBe(true);
    expect(state.enableDevTools).toBe(true);
    expect(state.enableSolidBlocks).toBe(true);
    expect(state.enableBounties).toBe(true);
  });

  it('allows overriding individual flags and resetting to preset', () => {
    useGameConfigStore.getState().setPreset('classic');
    expect(useGameConfigStore.getState().enableFreeTriggeredHint).toBe(false);

    useGameConfigStore.getState().setFlag('enableFreeTriggeredHint', true);
    expect(useGameConfigStore.getState().enableFreeTriggeredHint).toBe(true);

    useGameConfigStore.getState().resetToPreset();
    expect(useGameConfigStore.getState().enableFreeTriggeredHint).toBe(false);
  });
});
