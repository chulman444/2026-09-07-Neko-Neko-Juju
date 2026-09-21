import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardGenConfigStore } from './boardGenConfigStore';
import { DEFAULT_BOARD_SIZE_RANGES, DEFAULT_TIER_ASPECT_CONFIGS } from '@/entities/board';

describe('boardGenConfigStore', () => {
  beforeEach(() => {
    useBoardGenConfigStore.setState({
      boardSizeRanges: { ...DEFAULT_BOARD_SIZE_RANGES },
      selectedSizeTier: 'medium',
      tierAspectConfigs: { ...DEFAULT_TIER_ASPECT_CONFIGS },
      rollSeedOnGenerate: false,
    });
  });

  it('updates boardSizeRanges min and max independently for each tier', () => {
    useBoardGenConfigStore.getState().setBoardSizeRange('small', 0, 4);
    useBoardGenConfigStore.getState().setBoardSizeRange('small', 1, 7);
    expect(useBoardGenConfigStore.getState().boardSizeRanges.small).toEqual([4, 7]);

    useBoardGenConfigStore.getState().setBoardSizeRange('medium', 0, 10);
    useBoardGenConfigStore.getState().setBoardSizeRange('medium', 1, 13);
    expect(useBoardGenConfigStore.getState().boardSizeRanges.medium).toEqual([10, 13]);

    useBoardGenConfigStore.getState().setBoardSizeRange('large', 0, 16);
    useBoardGenConfigStore.getState().setBoardSizeRange('large', 1, 20);
    expect(useBoardGenConfigStore.getState().boardSizeRanges.large).toEqual([16, 20]);

    useBoardGenConfigStore.getState().setBoardSizeRange('any', 0, 5);
    useBoardGenConfigStore.getState().setBoardSizeRange('any', 1, 19);
    expect(useBoardGenConfigStore.getState().boardSizeRanges.any).toEqual([5, 19]);
  });

  it('updates selectedSizeTier, per-tier bell curve parameters, and rollSeedOnGenerate', () => {
    useBoardGenConfigStore.getState().setSelectedSizeTier('small');
    expect(useBoardGenConfigStore.getState().selectedSizeTier).toBe('small');

    useBoardGenConfigStore.getState().setTierRatioMean('small', 1.05);
    expect(useBoardGenConfigStore.getState().tierAspectConfigs.small.ratioMean).toBe(1.05);

    useBoardGenConfigStore.getState().setTierRatioSpread('small', 0.18);
    expect(useBoardGenConfigStore.getState().tierAspectConfigs.small.ratioSpread).toBe(0.18);

    // Medium remains unchanged
    expect(useBoardGenConfigStore.getState().tierAspectConfigs.medium.ratioMean).toBe(1.35);

    useBoardGenConfigStore.getState().setRollSeedOnGenerate(true);
    expect(useBoardGenConfigStore.getState().rollSeedOnGenerate).toBe(true);

    useBoardGenConfigStore.getState().setStackedTilesCount(15);
    expect(useBoardGenConfigStore.getState().stackedTilesCount).toBe(15);
  });
});
