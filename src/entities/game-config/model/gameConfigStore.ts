import { create } from 'zustand';
import type { GameConfigState, GameFeatureFlags, GamePreset } from './types';

export const PRESET_CONFIGS: Record<GamePreset, GameFeatureFlags> = {
  classic: {
    enableItems: false,
    enableDevTools: false,
    enableSolidBlocks: false,
    enableBounties: false,
    enableCombos: true,
    enableHints: false,
    enableTimer: true,
    enableSelectionHUD: false,
  },
  editor: {
    enableItems: false,
    enableDevTools: true,
    enableSolidBlocks: false,
    enableBounties: false,
    enableCombos: true,
    enableHints: true,
    enableTimer: true,
    enableSelectionHUD: true,
  },
  arcade: {
    enableItems: true,
    enableDevTools: true,
    enableSolidBlocks: false,
    enableBounties: false,
    enableCombos: true,
    enableHints: true,
    enableTimer: true,
    enableSelectionHUD: true,
  },
  roguelite: {
    enableItems: true,
    enableDevTools: false,
    enableSolidBlocks: true,
    enableBounties: true,
    enableCombos: true,
    enableHints: true,
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
