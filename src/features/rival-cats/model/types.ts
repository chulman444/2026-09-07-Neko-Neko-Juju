import type { TileCoord } from '@/entities/board';

export type CatPhase = 'dormant' | 'idle' | 'targeting';
export type CatType = 'normal' | 'tough';
export type DefeatCondition = 'exact_match' | 'any_overlap' | 'start_tile_only';

export interface RivalCat {
  id: string;
  type: CatType;
  phase: CatPhase;
  countdown: number;
  targetMatch: TileCoord[] | null;
}

export interface RivalCatState {
  isEnabled: boolean;
  defeatCondition: DefeatCondition;
  cats: RivalCat[];
  dormantDuration: number;
  spawnInterval: number;
  stealDuration: number;
  pushbackPerClear: number;
  toughCatPushbackBonus: number;
  stolenTilesCount: number;
  showTargets: boolean;
  showTimer: boolean;
  showExternalBreakPathReactions: boolean;

  // Backward compatibility aliases
  rivalCatInterval: number;
  rivalCatCountdown: number;
  activeRivalCats: number;

  // Setters & Configuration
  setIsEnabled: (enabled: boolean) => void;
  setShowTargets: (show: boolean) => void;
  setShowTimer: (show: boolean) => void;
  setShowExternalBreakPathReactions: (show: boolean) => void;
  setDefeatCondition: (condition: DefeatCondition) => void;
  setDormantDuration: (val: number) => void;
  setSpawnInterval: (val: number) => void;
  setStealDuration: (val: number) => void;
  setPushbackPerClear: (val: number) => void;
  setToughCatPushbackBonus: (val: number) => void;
  setRivalCatInterval: (interval: number) => void;
  setActiveRivalCats: (count: number) => void;
  setStolenTilesCount: (count: number) => void;
  setCats: (cats: RivalCat[]) => void;
  addCat: (type?: CatType) => string;
  removeCat: (id: string) => void;

  // Gameplay actions
  resetCountdown: () => void;
  resetRivalCats: () => void;
  tick: (deltaSeconds: number, isPaused?: boolean) => void;
  onPlayerClearedTiles: (tiles: TileCoord[]) => void;
  stealMatch: (catId?: string, explicitCombos?: TileCoord[][]) => boolean;
}
