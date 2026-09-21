import type { TileCoord } from '@/entities/board';

export interface HintState {
  // Config & Tuning
  maxFreeHints: number;
  freeHintInterval: number;

  // Runtime State
  hintsRemaining: number;
  hintCountdown: number;
  hintPhaseStarted: boolean;
  isPhase1Over: boolean;
  activeHintCombos: TileCoord[][];
  highlightedTiles: TileCoord[];
  noHintsAvailableMsg: string | null;

  // Actions
  setMaxFreeHints: (val: number) => void;
  setFreeHintInterval: (val: number) => void;
  setHighlightedTiles: (tiles: TileCoord[] | ((prev: TileCoord[]) => TileCoord[])) => void;
  setNoHintsAvailableMsg: (msg: string | null) => void;
  triggerHint: (explicitCombos?: TileCoord[][]) => boolean;
  validateActiveHints: () => void;
  removeClearedTiles: (clearedTiles: TileCoord[]) => void;
  tick: (deltaSeconds: number, isSurvivalDepleted: boolean, isTimerPaused?: boolean) => void;
  resetHintSession: () => void;
}
