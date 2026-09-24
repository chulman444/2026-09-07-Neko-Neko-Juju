import { create } from 'zustand';
import type { GameConfigState, GameFeatureFlags, GamePreset } from './types';

export const PRESET_CONFIGS: Record<GamePreset, GameFeatureFlags> = {
  classic: {
    enableItems: false,
    enableItemRefills: false,
    itemRefillStyle: 'spin',
    itemButtonVariant: 'classic',
    itemSplitStyle: 'cell',
    itemBadgePlacement: 'bottom-right',
    itemCdDirection: 'left',
    itemCdFormat: 'integer',
    enableDevTools: true,
    enableSolidBlocks: false,
    enableBounties: false,
    enableCombos: true,
    enableFreeTriggeredHint: false,
    enableTimer: true,
    enableSelectionHUD: false,
  },
  editor: {
    enableItems: false,
    enableItemRefills: false,
    itemRefillStyle: 'spin',
    itemButtonVariant: 'classic',
    itemSplitStyle: 'cell',
    itemBadgePlacement: 'bottom-right',
    itemCdDirection: 'left',
    itemCdFormat: 'integer',
    enableDevTools: true,
    enableSolidBlocks: false,
    enableBounties: false,
    enableCombos: true,
    enableFreeTriggeredHint: true,
    enableTimer: true,
    enableSelectionHUD: true,
  },
  arcade: {
    enableItems: true,
    enableItemRefills: true,
    itemRefillStyle: 'spin',
    itemButtonVariant: 'classic',
    itemSplitStyle: 'cell',
    itemBadgePlacement: 'bottom-right',
    itemCdDirection: 'left',
    itemCdFormat: 'integer',
    enableDevTools: true,
    enableSolidBlocks: false,
    enableBounties: false,
    enableCombos: true,
    enableFreeTriggeredHint: true,
    enableTimer: true,
    enableSelectionHUD: true,
  },
  roguelite: {
    enableItems: true,
    enableItemRefills: true,
    itemRefillStyle: 'spin',
    itemButtonVariant: 'classic',
    itemSplitStyle: 'cell',
    itemBadgePlacement: 'bottom-right',
    itemCdDirection: 'left',
    itemCdFormat: 'integer',
    enableDevTools: true,
    enableSolidBlocks: true,
    enableBounties: true,
    enableCombos: true,
    enableFreeTriggeredHint: true,
    enableTimer: true,
    enableSelectionHUD: true,
  },
};

export const DEFAULT_PRESET: GamePreset = 'arcade';

export const useGameConfigStore = create<GameConfigState>((set, get) => ({
  preset: DEFAULT_PRESET,
  ...PRESET_CONFIGS[DEFAULT_PRESET],

  setPreset: (preset: GamePreset) => {
    set({
      preset,
      ...PRESET_CONFIGS[preset],
    });
  },

  setFlag: (flag, value) => {
    set({ [flag]: value });
  },

  resetToPreset: () => {
    const currentPreset = get().preset;
    set({
      ...PRESET_CONFIGS[currentPreset],
    });
  },
}));
