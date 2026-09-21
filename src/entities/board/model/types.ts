export interface TileCoord {
  col: number;
  row: number;
}

export interface ClearingAnimation {
  id: string;
  col: number;
  row: number;
  val: number;
  type: 'munching' | 'fadeout';
  startTime: number;
  duration: number;
  bounceSpeed: number;
}

export const OMNITILE_VALUE = 10;
export const isOmniTile = (val: number): boolean => val === OMNITILE_VALUE;

export type BoardSizeTier = 'small' | 'medium' | 'large' | 'any';

export interface BoardSizeRanges {
  small: [number, number];
  medium: [number, number];
  large: [number, number];
  any: [number, number];
}

export interface TierAspectConfig {
  ratioMean: number;
  ratioSpread: number;
}

export type TierAspectConfigs = Record<BoardSizeTier, TierAspectConfig>;

export const DEFAULT_TIER_ASPECT_CONFIGS: TierAspectConfigs = {
  small: { ratioMean: 1.0, ratioSpread: 0.15 },
  medium: { ratioMean: 1.35, ratioSpread: 0.25 },
  large: { ratioMean: 1.65, ratioSpread: 0.3 },
  any: { ratioMean: 1.25, ratioSpread: 0.35 },
};

export const DEFAULT_BOARD_SIZE_RANGES: BoardSizeRanges = {
  small: [3, 8],
  medium: [9, 14],
  large: [15, 20],
  any: [3, 20],
};
