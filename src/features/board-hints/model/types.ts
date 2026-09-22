import type { TileCoord } from '@/entities/board';

export interface BoardHintsState {
  // Runtime State
  activeHintCombos: TileCoord[][];
  highlightedTiles: TileCoord[];
  noHintsAvailableMsg: string | null;

  // Actions
  setHighlightedTiles: (tiles: TileCoord[] | ((prev: TileCoord[]) => TileCoord[])) => void;
  setNoHintsAvailableMsg: (msg: string | null) => void;
  triggerHint: (explicitCombos?: TileCoord[][]) => boolean;
  validateActiveHints: () => void;
  removeClearedTiles: (clearedTiles: TileCoord[]) => void;
  resetBoardHints: () => void;
}
