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
