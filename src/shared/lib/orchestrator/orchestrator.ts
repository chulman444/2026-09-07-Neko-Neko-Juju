export interface TileCoordinate {
  col: number;
  row: number;
}

export interface GameOrchestrator {
  executePlayerMatch: (
    tiles: TileCoordinate[],
    spanCount?: number,
    actualNonZeroCount?: number
  ) => boolean;
  handleMatch: (
    tiles: TileCoordinate[],
    spanCount?: number,
    actualNonZeroCount?: number
  ) => boolean;
  executeRivalSteal: (tiles: TileCoordinate[]) => boolean;
  executeHighlightHint: (isFree?: boolean) => boolean;
  getClearableHints: () => TileCoordinate[][];
  isBoardUnsolvable: () => boolean;
  isComboValid: (tiles: TileCoordinate[]) => boolean;
  onBoardMutated: () => void;
  resetAllSessions: () => void;
}

let activeOrchestrator: GameOrchestrator | null = null;

export const setGameOrchestrator = (inst: GameOrchestrator | null) => {
  activeOrchestrator = inst;
};

export const getGameOrchestrator = (): GameOrchestrator | null => {
  return activeOrchestrator;
};

export const orchestrator: GameOrchestrator = {
  executePlayerMatch: (tiles, spanCount, actualNonZeroCount) => {
    return activeOrchestrator?.executePlayerMatch(tiles, spanCount, actualNonZeroCount) ?? false;
  },
  handleMatch: (tiles, spanCount, actualNonZeroCount) => {
    return activeOrchestrator?.handleMatch(tiles, spanCount, actualNonZeroCount) ?? false;
  },
  executeRivalSteal: (tiles) => {
    return activeOrchestrator?.executeRivalSteal(tiles) ?? false;
  },
  executeHighlightHint: (isFree = false) => {
    return activeOrchestrator?.executeHighlightHint(isFree) ?? false;
  },
  getClearableHints: () => {
    return activeOrchestrator?.getClearableHints() ?? [];
  },
  isBoardUnsolvable: () => {
    return activeOrchestrator?.isBoardUnsolvable() ?? false;
  },
  isComboValid: (tiles) => {
    return activeOrchestrator?.isComboValid(tiles) ?? false;
  },
  onBoardMutated: () => {
    activeOrchestrator?.onBoardMutated();
  },
  resetAllSessions: () => {
    activeOrchestrator?.resetAllSessions();
  },
};
