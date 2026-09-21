import type { TileCoord } from '@/entities/board';

export interface RivalCatState {
  isEnabled: boolean;
  rivalCatInterval: number;
  rivalCatCountdown: number;
  activeRivalCats: number;
  stolenTilesCount: number;

  setIsEnabled: (enabled: boolean) => void;
  setRivalCatInterval: (interval: number) => void;
  setActiveRivalCats: (count: number) => void;
  setStolenTilesCount: (count: number) => void;
  resetCountdown: () => void;
  resetRivalCats: () => void;
  tick: (deltaSeconds: number, isPaused?: boolean) => void;
  stealMatch: (explicitCombos?: TileCoord[][]) => boolean;
}
