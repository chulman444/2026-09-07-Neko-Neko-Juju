import { create } from 'zustand';
import { useBoardStore, type TileCoord, OMNITILE_VALUE } from '@/entities/board';
import { generateSeed, seededRandomGenerator } from '@/shared/lib/prng';
import type { ItemState, ItemCounts, ItemType } from './types';

let hintTriggerHandler: (() => boolean) | null = null;

export const registerHintTriggerHandler = (fn: (() => boolean) | null) => {
  hintTriggerHandler = fn;
};

export const DEFAULT_ITEM_COUNTS: ItemCounts = {
  randomNumber: 5,
  randomChoose: 5,
  omnitile: 5,
  shake: 5,
  hint: 5,
};

let separateItemPrng: (() => number) | null = null;
let cachedItemSeed = '';

function getItemRandom(state: ItemState): number {
  if (state.useBoardSeed) {
    return useBoardStore.getState().prng();
  }
  if (!separateItemPrng || cachedItemSeed !== state.itemSeed) {
    cachedItemSeed = state.itemSeed;
    separateItemPrng = seededRandomGenerator(state.itemSeed);
  }
  return separateItemPrng();
}

const initialSeed = generateSeed();

export const useItemStore = create<ItemState>((set, get) => ({
  counts: { ...DEFAULT_ITEM_COUNTS },
  activeItem: null,
  isToggled: false,
  activeItemStage: 0,
  toggleCheck: {
    randomNumber: false,
    randomChoose: false,
    omnitile: false,
  },
  targetTile: null,

  historyConstraintN: 3,
  rollHistory: [],
  currentRolledNumber: null,

  randomChooseOptions: null,
  selectedChooseNumber: null,

  useBoardSeed: true,
  itemSeed: initialSeed,

  toggleItem: (item: 'randomNumber' | 'randomChoose' | 'omnitile') => {
    const state = get();
    if (state.activeItem !== item) {
      // 1st click: Arm in Stage 1 (or Stage 2 if toggleCheck was already pre-enabled)
      const stage = state.toggleCheck[item] ? 2 : 1;
      set({
        activeItem: item,
        isToggled: true,
        activeItemStage: stage,
        targetTile: null,
        randomChooseOptions: null,
        selectedChooseNumber: null,
        toggleCheck: {
          randomNumber: item === 'randomNumber' ? stage === 2 : false,
          randomChoose: item === 'randomChoose' ? stage === 2 : false,
          omnitile: item === 'omnitile' ? stage === 2 : false,
        },
      });
    } else if (state.activeItemStage === 1) {
      // 2nd click: Advance to Stage 2 (Multi-Use Mode)
      set({
        activeItemStage: 2,
        toggleCheck: {
          ...state.toggleCheck,
          [item]: true,
        },
      });
    } else {
      // 3rd click: Disarm to Stage 0
      set({
        isToggled: false,
        activeItem: null,
        activeItemStage: 0,
        targetTile: null,
        randomChooseOptions: null,
        selectedChooseNumber: null,
        toggleCheck: {
          ...state.toggleCheck,
          [item]: false,
        },
      });
    }
  },

  untoggle: () => {
    set({
      isToggled: false,
      activeItem: null,
      activeItemStage: 0,
      targetTile: null,
      randomChooseOptions: null,
      selectedChooseNumber: null,
      toggleCheck: {
        randomNumber: false,
        randomChoose: false,
        omnitile: false,
      },
    });
  },

  setToggleCheck: (item: 'randomNumber' | 'randomChoose' | 'omnitile', enabled: boolean) => {
    const state = get();
    const nextStage = state.activeItem === item ? (enabled ? 2 : 1) : state.activeItemStage;
    set({
      activeItemStage: nextStage,
      toggleCheck: {
        ...state.toggleCheck,
        [item]: enabled,
      },
    });
  },

  handleBoardTileClick: (coord: TileCoord, isFree = false) => {
    const state = get();
    if (!state.isToggled || !state.activeItem) return false;

    // Guard against targeting empty / already cleared cells
    const { matrix } = useBoardStore.getState();
    const currentTileValue = matrix[coord.row]?.[coord.col];
    if (currentTileValue === undefined || currentTileValue <= 0) {
      return false;
    }

    if (state.activeItem === 'randomNumber') {
      if (!isFree && state.counts.randomNumber <= 0) {
        return false;
      }

      const { minNum, maxNum } = useBoardStore.getState();
      const history = state.rollHistory;
      const n = Math.max(0, Math.min(8, state.historyConstraintN));

      let candidates: number[] = [];
      for (let num = minNum; num <= maxNum; num++) {
        if (!history.includes(num)) {
          candidates.push(num);
        }
      }

      if (candidates.length === 0) {
        for (let num = minNum; num <= maxNum; num++) {
          candidates.push(num);
        }
      }

      const rand = getItemRandom(state);
      const index = Math.floor(rand * candidates.length);
      const chosenNumber = candidates[index] ?? candidates[0] ?? 1;
      const nextHistory = n > 0 ? [...history, chosenNumber].slice(-n) : [];

      // Update tile directly on board
      useBoardStore.getState().setTileValue(coord.col, coord.row, chosenNumber);

      const nextCounts = isFree
        ? state.counts
        : { ...state.counts, randomNumber: Math.max(0, state.counts.randomNumber - 1) };

      const isMultipleUse = state.activeItemStage === 2 || state.toggleCheck.randomNumber;
      const shouldStayArmed = isMultipleUse && (isFree || nextCounts.randomNumber > 0);
      set({
        counts: nextCounts,
        currentRolledNumber: chosenNumber,
        rollHistory: nextHistory,
        isToggled: shouldStayArmed,
        activeItem: shouldStayArmed ? 'randomNumber' : null,
        activeItemStage: shouldStayArmed ? 2 : 0,
        toggleCheck: {
          ...state.toggleCheck,
          randomNumber: shouldStayArmed,
        },
      });

      return true;
    }

    if (state.activeItem === 'randomChoose') {
      if (!isFree && state.counts.randomChoose <= 0) {
        return false;
      }

      const { minNum, maxNum } = useBoardStore.getState();
      const range = maxNum - minNum + 1;

      // Draw 3 consecutive numbers from continuous PRNG stream
      const options: [number, number, number] = [
        Math.floor(getItemRandom(state) * range) + minNum,
        Math.floor(getItemRandom(state) * range) + minNum,
        Math.floor(getItemRandom(state) * range) + minNum,
      ];

      const nextCounts = isFree
        ? state.counts
        : { ...state.counts, randomChoose: Math.max(0, state.counts.randomChoose - 1) };

      set({
        counts: nextCounts,
        targetTile: coord,
        randomChooseOptions: options,
        selectedChooseNumber: options[0],
      });

      return true;
    }

    if (state.activeItem === 'omnitile') {
      if (!isFree && state.counts.omnitile <= 0) {
        return false;
      }

      useBoardStore.getState().setTileValue(coord.col, coord.row, OMNITILE_VALUE);

      const nextCounts = isFree
        ? state.counts
        : { ...state.counts, omnitile: Math.max(0, state.counts.omnitile - 1) };

      const isMultipleUse = state.activeItemStage === 2 || state.toggleCheck.omnitile;
      const shouldStayArmed = isMultipleUse && (isFree || nextCounts.omnitile > 0);

      set({
        counts: nextCounts,
        isToggled: shouldStayArmed,
        activeItem: shouldStayArmed ? 'omnitile' : null,
        activeItemStage: shouldStayArmed ? 2 : 0,
        toggleCheck: {
          ...state.toggleCheck,
          omnitile: shouldStayArmed,
        },
      });

      return true;
    }

    return false;
  },

  confirmRandomChoose: (val: number, isFree = false) => {
    const state = get();
    if (!state.targetTile) return false;

    useBoardStore.getState().setTileValue(state.targetTile.col, state.targetTile.row, val);

    // Roll was already consumed upon tile click. Do not double-decrement counts.
    const isMultipleUse = state.activeItemStage === 2 || state.toggleCheck.randomChoose;
    const shouldStayArmed = isMultipleUse && (isFree || state.counts.randomChoose > 0);
    set({
      targetTile: null,
      randomChooseOptions: null,
      selectedChooseNumber: null,
      isToggled: shouldStayArmed,
      activeItem: shouldStayArmed ? 'randomChoose' : null,
      activeItemStage: shouldStayArmed ? 2 : 0,
      toggleCheck: {
        ...state.toggleCheck,
        randomChoose: shouldStayArmed,
      },
    });

    return true;
  },

  cancelTargetTile: () => {
    set({
      targetTile: null,
      randomChooseOptions: null,
      selectedChooseNumber: null,
    });
  },

  rollRandomNumber: (isFree = false) => {
    const state = get();
    if (!isFree && state.counts.randomNumber <= 0) {
      return null;
    }

    const { minNum, maxNum } = useBoardStore.getState();
    const history = state.rollHistory;
    const n = Math.max(0, Math.min(8, state.historyConstraintN));

    // Exclude the last N numbers from recent history
    let candidates: number[] = [];
    for (let num = minNum; num <= maxNum; num++) {
      if (!history.includes(num)) {
        candidates.push(num);
      }
    }

    if (candidates.length === 0) {
      for (let num = minNum; num <= maxNum; num++) {
        candidates.push(num);
      }
    }

    const rand = getItemRandom(state);
    const index = Math.floor(rand * candidates.length);
    const chosenNumber = candidates[index] ?? candidates[0] ?? 1;

    const nextHistory = n > 0 ? [...history, chosenNumber].slice(-n) : [];

    set({
      counts: isFree
        ? state.counts
        : { ...state.counts, randomNumber: Math.max(0, state.counts.randomNumber - 1) },
      currentRolledNumber: chosenNumber,
      rollHistory: nextHistory,
      activeItem: 'randomNumber',
      isToggled: true,
    });

    return chosenNumber;
  },

  rollRandomChoose: (isFree = false) => {
    const state = get();
    if (!isFree && state.counts.randomChoose <= 0) {
      return null;
    }

    const { minNum, maxNum } = useBoardStore.getState();
    const range = maxNum - minNum + 1;

    // Draw 3 consecutive numbers from the continuous stream
    const options: [number, number, number] = [
      Math.floor(getItemRandom(state) * range) + minNum,
      Math.floor(getItemRandom(state) * range) + minNum,
      Math.floor(getItemRandom(state) * range) + minNum,
    ];

    set({
      counts: isFree
        ? state.counts
        : { ...state.counts, randomChoose: Math.max(0, state.counts.randomChoose - 1) },
      randomChooseOptions: options,
      selectedChooseNumber: options[0],
      activeItem: 'randomChoose',
      isToggled: true,
    });

    return options;
  },

  selectChooseNumber: (val: number) => {
    set({ selectedChooseNumber: val });
  },

  triggerHintItem: (isFree = false) => {
    const state = get();
    if (!isFree && state.counts.hint <= 0) {
      return false;
    }

    const success = hintTriggerHandler ? hintTriggerHandler() : false;
    if (success && !isFree) {
      set({
        counts: {
          ...state.counts,
          hint: Math.max(0, state.counts.hint - 1),
        },
      });
    }
    return success;
  },

  triggerShakeItem: (isFree = false) => {
    const state = get();
    if (!isFree && state.counts.shake <= 0) {
      return false;
    }

    useBoardStore.getState().shakeBoard();

    if (!isFree) {
      set({
        counts: {
          ...state.counts,
          shake: Math.max(0, state.counts.shake - 1),
        },
      });
    }
    return true;
  },

  clearRollHistory: () => {
    set({ rollHistory: [] });
  },

  setHistoryConstraintN: (n: number) => {
    const clamped = Math.max(0, Math.min(8, n));
    set((state) => ({
      historyConstraintN: clamped,
      rollHistory: state.rollHistory.slice(-clamped),
    }));
  },

  setItemCount: (item: ItemType, count: number) => {
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

  setUseBoardSeed: (useBoard: boolean) => {
    set({ useBoardSeed: useBoard });
  },

  setItemSeed: (seed: string) => {
    cachedItemSeed = seed;
    separateItemPrng = seededRandomGenerator(seed);
    set({ itemSeed: seed });
  },

  regenerateItemSeed: () => {
    const newSeed = generateSeed();
    cachedItemSeed = newSeed;
    separateItemPrng = seededRandomGenerator(newSeed);
    set({ itemSeed: newSeed });
  },

  getActiveNumber: () => {
    const state = get();
    if (!state.isToggled) return null;
    if (state.activeItem === 'randomNumber') return state.currentRolledNumber;
    if (state.activeItem === 'randomChoose') return state.selectedChooseNumber;
    if (state.activeItem === 'omnitile') return OMNITILE_VALUE;
    return null;
  },
}));
