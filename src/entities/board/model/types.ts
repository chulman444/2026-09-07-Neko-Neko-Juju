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
