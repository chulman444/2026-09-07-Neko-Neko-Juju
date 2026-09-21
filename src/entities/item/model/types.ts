import type { ReactNode } from 'react';

export type ItemType = 'randomNumber' | 'randomChoose' | 'omnitile' | 'shake' | 'hint';

export type ItemWingColor = 'inactive' | 'active' | 'success' | 'amber' | 'purple' | 'emerald';

export interface ItemCounts {
  randomNumber: number;
  randomChoose: number;
  omnitile: number;
  shake: number;
  hint: number;
}

export interface ItemRenderContext {
  counts: ItemCounts;
  activeItem: string | null;
  activeItemStage: 0 | 1 | 2;
  isToggled: boolean;
  isPaused: boolean;
}

export interface ItemBehavior {
  id: ItemType | string;
  label?: string | ((context: ItemRenderContext) => string);
  icon: ReactNode;
  title: string | ((context: ItemRenderContext) => string);
  size?: 'sm' | 'md';
  leftWingState?: ItemWingColor | ((context: ItemRenderContext) => ItemWingColor);
  rightWingState?: ItemWingColor | ((context: ItemRenderContext) => ItemWingColor);
  leftWingTitle?: string | ((context: ItemRenderContext) => string);
  rightWingTitle?: string | ((context: ItemRenderContext) => string);
  disabled?: boolean | ((context: ItemRenderContext) => boolean);
  onActivate: (context: ItemRenderContext) => void;
  renderOverlay?: (context: ItemRenderContext) => ReactNode;
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
