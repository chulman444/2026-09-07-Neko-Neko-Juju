import type { TileCoord } from '@/entities/board';

export type ItemType = 'randomNumber' | 'randomChoose' | 'hint';

export interface ItemCounts {
  randomNumber: number;
  randomChoose: number;
  hint: number;
}

export interface ToggleCheckConfig {
  randomNumber: boolean;
  randomChoose: boolean;
}

export interface ItemState {
  // Inventory Counts (real game)
  counts: ItemCounts;

  // Active Item & Toggle State
  activeItem: 'randomNumber' | 'randomChoose' | null;
  isToggled: boolean;
  activeItemStage: 0 | 1 | 2;

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

  // Actions
  toggleItem: (item: 'randomNumber' | 'randomChoose') => void;
  untoggle: () => void;
  setToggleCheck: (item: 'randomNumber' | 'randomChoose', enabled: boolean) => void;
  handleBoardTileClick: (coord: TileCoord, isFree?: boolean) => boolean;
  confirmRandomChoose: (val: number, isFree?: boolean) => boolean;
  cancelTargetTile: () => void;

  // Direct helpers for dev triggers & test suites
  rollRandomNumber: (isFree?: boolean) => number | null;
  rollRandomChoose: (isFree?: boolean) => [number, number, number] | null;
  selectChooseNumber: (val: number) => void;
  triggerHintItem: (isFree?: boolean) => boolean;
  clearRollHistory: () => void;
  setHistoryConstraintN: (n: number) => void;
  setItemCount: (item: ItemType, count: number) => void;
  resetItemCounts: () => void;
  setUseBoardSeed: (useBoard: boolean) => void;
  setItemSeed: (seed: string) => void;
  regenerateItemSeed: () => void;
  getActiveNumber: () => number | null;
}

