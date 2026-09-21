export type ItemType = 'randomNumber' | 'randomChoose' | 'omnitile' | 'shake' | 'hint';

export interface ItemCounts {
  randomNumber: number;
  randomChoose: number;
  omnitile: number;
  shake: number;
  hint: number;
}

export interface ItemState {
  // Inventory Counts (real game)
  counts: ItemCounts;

  // Active Item & Toggle State
  activeItem: 'randomNumber' | 'randomChoose' | 'omnitile' | null;
  isToggled: boolean;
  activeItemStage: 0 | 1 | 2;

  // Actions
  setItemCount: (item: ItemType, count: number) => void;
  resetItemCounts: () => void;
  consumeItem: (item: ItemType, amount?: number) => boolean;
  addItem: (item: ItemType, amount?: number) => void;
  toggleItem: (item: 'randomNumber' | 'randomChoose' | 'omnitile', forceStage?: 1 | 2) => void;
  untoggle: () => void;
  setActiveItem: (
    item: 'randomNumber' | 'randomChoose' | 'omnitile' | null,
    stage?: 0 | 1 | 2
  ) => void;
}
