import { create } from 'zustand';
import {
  DEFAULT_BOARD_SIZE_RANGES,
  DEFAULT_TIER_ASPECT_CONFIGS,
  type BoardSizeTier,
  type BoardSizeRanges,
  type TierAspectConfigs,
} from '@/entities/board';

export interface BoardGenConfigState {
  boardSizeRanges: BoardSizeRanges;
  selectedSizeTier: BoardSizeTier;
  tierAspectConfigs: TierAspectConfigs;
  rollSeedOnGenerate: boolean;
  stackedTilesCount: number;

  setBoardSizeRange: (tier: BoardSizeTier, index: 0 | 1, val: number) => void;
  setSelectedSizeTier: (tier: BoardSizeTier) => void;
  setTierRatioMean: (tier: BoardSizeTier, val: number) => void;
  setTierRatioSpread: (tier: BoardSizeTier, val: number) => void;
  setRollSeedOnGenerate: (val: boolean) => void;
  setStackedTilesCount: (val: number) => void;
}

export const useBoardGenConfigStore = create<BoardGenConfigState>((set) => ({
  boardSizeRanges: { ...DEFAULT_BOARD_SIZE_RANGES },
  selectedSizeTier: 'medium',
  tierAspectConfigs: { ...DEFAULT_TIER_ASPECT_CONFIGS },
  rollSeedOnGenerate: false,
  stackedTilesCount: 0,

  setBoardSizeRange: (tier, index, val) => {
    set((state) => {
      const current = state.boardSizeRanges[tier];
      const updated: [number, number] = [...current];
      updated[index] = val;
      return {
        boardSizeRanges: {
          ...state.boardSizeRanges,
          [tier]: updated,
        },
      };
    });
  },

  setSelectedSizeTier: (tier) => {
    set({ selectedSizeTier: tier });
  },

  setTierRatioMean: (tier, val) => {
    set((state) => ({
      tierAspectConfigs: {
        ...state.tierAspectConfigs,
        [tier]: {
          ...state.tierAspectConfigs[tier],
          ratioMean: val,
        },
      },
    }));
  },

  setTierRatioSpread: (tier, val) => {
    set((state) => ({
      tierAspectConfigs: {
        ...state.tierAspectConfigs,
        [tier]: {
          ...state.tierAspectConfigs[tier],
          ratioSpread: Math.max(0.01, val),
        },
      },
    }));
  },

  setRollSeedOnGenerate: (val) => {
    set({ rollSeedOnGenerate: val });
  },

  setStackedTilesCount: (val) => {
    set({ stackedTilesCount: Math.max(0, val) });
  },
}));
