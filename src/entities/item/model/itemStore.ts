import { create } from 'zustand';
import type { ItemState, ItemCounts } from './types';

export const DEFAULT_ITEM_COUNTS: ItemCounts = {
  randomNumber: 5,
  randomChoose: 5,
  omnitile: 5,
  shake: 5,
  hint: 5,
};

export const useItemStore = create<ItemState>((set, get) => ({
  counts: { ...DEFAULT_ITEM_COUNTS },
  activeItem: null,
  isToggled: false,
  activeItemStage: 0,

  setItemCount: (item, count) => {
    const clamped = Math.max(0, count);
    set((state) => ({
      counts: {
        ...state.counts,
        [item]: clamped,
      },
    }));
  },

  resetItemCounts: () => {
    set({
      counts: { ...DEFAULT_ITEM_COUNTS },
    });
  },

  consumeItem: (item, amount = 1) => {
    const current = get().counts[item];
    if (current < amount) return false;
    set((state) => ({
      counts: {
        ...state.counts,
        [item]: Math.max(0, state.counts[item] - amount),
      },
    }));
    return true;
  },

  addItem: (item, amount = 1) => {
    if (amount <= 0) return;
    set((state) => ({
      counts: {
        ...state.counts,
        [item]: state.counts[item] + amount,
      },
    }));
  },

  toggleItem: (item, forceStage) => {
    const state = get();
    if (state.activeItem !== item) {
      set({
        activeItem: item,
        isToggled: true,
        activeItemStage: forceStage ?? 1,
      });
    } else if (state.activeItemStage === 1) {
      set({
        activeItemStage: 2,
      });
    } else {
      set({
        isToggled: false,
        activeItem: null,
        activeItemStage: 0,
      });
    }
  },

  untoggle: () => {
    set({
      isToggled: false,
      activeItem: null,
      activeItemStage: 0,
    });
  },

  setActiveItem: (item, stage = 1) => {
    if (!item) {
      set({
        activeItem: null,
        isToggled: false,
        activeItemStage: 0,
      });
    } else {
      set({
        activeItem: item,
        isToggled: true,
        activeItemStage: stage,
      });
    }
  },
}));
