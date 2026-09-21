import { create } from 'zustand';
import type { DifficultyTier, DifficultyTiltRanges } from './types';
import { DEFAULT_DIFFICULTY_TILT_RANGES } from './types';

export interface DifficultyState {
  selectedDifficultyTier: DifficultyTier;
  difficultyTiltRanges: DifficultyTiltRanges;
  difficultyNoiseSpread: number;
  timerMultiplier: number;

  setSelectedDifficultyTier: (tier: DifficultyTier) => void;
  setDifficultyTiltRange: (tier: DifficultyTier, index: 0 | 1, val: number) => void;
  setDifficultyNoiseSpread: (val: number) => void;
  setTimerMultiplier: (val: number) => void;
}

export const useDifficultyStore = create<DifficultyState>((set) => ({
  selectedDifficultyTier: 'medium',
  difficultyTiltRanges: { ...DEFAULT_DIFFICULTY_TILT_RANGES },
  difficultyNoiseSpread: 0.015,
  timerMultiplier: 20 / 170,

  setSelectedDifficultyTier: (tier) => {
    set({ selectedDifficultyTier: tier });
  },

  setDifficultyTiltRange: (tier, index, val) => {
    set((state) => {
      const current = [...state.difficultyTiltRanges[tier]] as [number, number];
      current[index] = val;
      return {
        difficultyTiltRanges: {
          ...state.difficultyTiltRanges,
          [tier]: current,
        },
      };
    });
  },

  setDifficultyNoiseSpread: (val) => {
    set({ difficultyNoiseSpread: Math.max(0, val) });
  },

  setTimerMultiplier: (val) => {
    set({ timerMultiplier: Math.max(0, val) });
  },
}));
