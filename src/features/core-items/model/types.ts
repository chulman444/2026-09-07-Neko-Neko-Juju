import type { TileCoord } from '@/entities/board';

export interface ToggleCheckConfig {
  randomNumber: boolean;
  randomChoose: boolean;
  omnitile: boolean;
}

export interface CoreItemsState {
  // Toggle Check (Single Use vs Multiple Use / Continuous)
  toggleCheck: ToggleCheckConfig;

  // In-Place Targeting & Rolling
  targetTile: TileCoord | null;

  // Random Number State
  historyConstraintN: number; // 0 to 8, default 3
  rollHistory: number[]; // last N rolled numbers
  currentRolledNumber: number | null;

  // Random Choose State
  randomChooseOptions: [number, number, number] | null;
  selectedChooseNumber: number | null;

  // Seed Configuration
  useBoardSeed: boolean;
  itemSeed: string;

  // Item Execution & Interaction Actions
  toggleItem: (item: 'randomNumber' | 'randomChoose' | 'omnitile') => void;
  untoggle: () => void;
  setToggleCheck: (item: 'randomNumber' | 'randomChoose' | 'omnitile', enabled: boolean) => void;
  handleBoardTileClick: (coord: TileCoord, isFree?: boolean) => boolean;
  confirmRandomChoose: (val: number, isFree?: boolean) => boolean;
  cancelTargetTile: () => void;

  // Direct triggers & roll methods
  rollRandomNumber: (isFree?: boolean) => number | null;
  rollRandomChoose: (isFree?: boolean) => [number, number, number] | null;
  selectChooseNumber: (val: number) => void;
  triggerHintItem: (isFree?: boolean) => boolean;
  triggerShakeItem: (isFree?: boolean) => boolean;
  clearRollHistory: () => void;
  setHistoryConstraintN: (n: number) => void;
  setUseBoardSeed: (useBoard: boolean) => void;
  setItemSeed: (seed: string) => void;
  regenerateItemSeed: () => void;
  getActiveNumber: () => number | null;
}
