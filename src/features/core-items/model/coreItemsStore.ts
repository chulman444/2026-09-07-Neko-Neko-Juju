import { create } from 'zustand';
import { useBoardStore, type TileCoord, OMNITILE_VALUE } from '@/entities/board';
import { useItemStore } from '@/entities/item';
import { generateSeed, seededRandomGenerator } from '@/shared/lib/prng';
import type { CoreItemsState } from './types';

let hintTriggerHandler: (() => boolean) | null = null;

export const registerHintTriggerHandler = (fn: (() => boolean) | null) => {
  hintTriggerHandler = fn;
};

let unsolvableResolver: (() => boolean) | null = null;

export const setUnsolvableResolver = (fn: (() => boolean) | null) => {
  unsolvableResolver = fn;
};

export const isBoardUnsolvable = (): boolean => {
  return unsolvableResolver ? unsolvableResolver() : false;
};

let boardMutationListener: (() => void) | null = null;

export const registerBoardMutationListener = (fn: (() => void) | null) => {
  boardMutationListener = fn;
};

export const notifyBoardMutated = (): void => {
  boardMutationListener?.();
};

let separateItemPrng: (() => number) | null = null;
let cachedItemSeed = '';

function getItemRandom(state: CoreItemsState): number {
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

export const useCoreItemsStore = create<CoreItemsState>((set, get) => ({
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

  hintSuccessFlash: false,
  shakeSuccessFlash: false,

  useBoardSeed: true,
  itemSeed: initialSeed,

  toggleItem: (item) => {
    const itemStore = useItemStore.getState();
    const state = get();

    if (itemStore.activeItem !== item) {
      // 1st click: Arm in Stage 1 (or Stage 2 if toggleCheck was already pre-enabled)
      const stage = state.toggleCheck[item] ? 2 : 1;
      itemStore.setActiveItem(item, stage);
      set({
        targetTile: null,
        randomChooseOptions: null,
        selectedChooseNumber: null,
        toggleCheck: {
          randomNumber: item === 'randomNumber' ? stage === 2 : false,
          randomChoose: item === 'randomChoose' ? stage === 2 : false,
          omnitile: item === 'omnitile' ? stage === 2 : false,
        },
      });
    } else if (itemStore.activeItemStage === 1) {
      // 2nd click: Advance to Stage 2 (Multi-Use Mode)
      itemStore.setActiveItem(item, 2);
      set({
        toggleCheck: {
          ...state.toggleCheck,
          [item]: true,
        },
      });
    } else {
      // 3rd click: Disarm to Stage 0
      itemStore.untoggle();
      set({
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
    useItemStore.getState().untoggle();
    set({
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

  setToggleCheck: (item, enabled) => {
    const itemStore = useItemStore.getState();
    if (itemStore.activeItem === item) {
      itemStore.setActiveItem(item, enabled ? 2 : 1);
    }
    set((state) => ({
      toggleCheck: {
        ...state.toggleCheck,
        [item]: enabled,
      },
    }));
  },

  handleBoardTileClick: (coord: TileCoord, isFree = false) => {
    const itemStore = useItemStore.getState();
    const { activeItem, activeItemStage } = itemStore;
    if (!itemStore.isToggled || !activeItem) return false;

    const board = useBoardStore.getState();
    const currentTileValue = board.matrix[coord.row]?.[coord.col];
    if (currentTileValue === undefined || currentTileValue <= 0) {
      return false;
    }

    const state = get();

    if (activeItem === 'randomNumber') {
      if (!isFree && itemStore.counts.randomNumber <= 0) {
        return false;
      }

      const { minNum, maxNum } = board;
      const history = state.rollHistory;
      const n = Math.max(0, Math.min(8, state.historyConstraintN));

      // Exclude last N numbers from recent history
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

      board.setTileValue(coord.col, coord.row, chosenNumber);

      if (!isFree) {
        itemStore.consumeItem('randomNumber', 1);
      }

      const isMultipleUse = activeItemStage === 2 || state.toggleCheck.randomNumber;
      const remaining = useItemStore.getState().counts.randomNumber;
      const shouldStayArmed = isMultipleUse && (isFree || remaining > 0);

      if (shouldStayArmed) {
        itemStore.setActiveItem('randomNumber', 2);
      } else {
        itemStore.untoggle();
      }

      set({
        currentRolledNumber: chosenNumber,
        rollHistory: nextHistory,
        toggleCheck: {
          ...state.toggleCheck,
          randomNumber: shouldStayArmed,
        },
      });

      return true;
    }

    if (activeItem === 'randomChoose') {
      if (!isFree && itemStore.counts.randomChoose <= 0) {
        return false;
      }

      const { minNum, maxNum } = board;
      const range = maxNum - minNum + 1;

      // Draw 3 consecutive numbers from continuous PRNG stream
      const options: [number, number, number] = [
        Math.floor(getItemRandom(state) * range) + minNum,
        Math.floor(getItemRandom(state) * range) + minNum,
        Math.floor(getItemRandom(state) * range) + minNum,
      ];

      if (!isFree) {
        itemStore.consumeItem('randomChoose', 1);
      }

      set({
        targetTile: coord,
        randomChooseOptions: options,
        selectedChooseNumber: options[0],
      });

      return true;
    }

    if (activeItem === 'omnitile') {
      if (!isFree && itemStore.counts.omnitile <= 0) {
        return false;
      }

      board.setTileValue(coord.col, coord.row, OMNITILE_VALUE);

      if (!isFree) {
        itemStore.consumeItem('omnitile', 1);
      }

      const isMultipleUse = activeItemStage === 2 || state.toggleCheck.omnitile;
      const remaining = useItemStore.getState().counts.omnitile;
      const shouldStayArmed = isMultipleUse && (isFree || remaining > 0);

      if (shouldStayArmed) {
        itemStore.setActiveItem('omnitile', 2);
      } else {
        itemStore.untoggle();
      }

      set({
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

    const itemStore = useItemStore.getState();
    const isMultipleUse = itemStore.activeItemStage === 2 || state.toggleCheck.randomChoose;
    const shouldStayArmed = isMultipleUse && (isFree || itemStore.counts.randomChoose > 0);

    if (shouldStayArmed) {
      itemStore.setActiveItem('randomChoose', 2);
    } else {
      itemStore.untoggle();
    }

    set({
      targetTile: null,
      randomChooseOptions: null,
      selectedChooseNumber: null,
      toggleCheck: {
        ...state.toggleCheck,
        randomChoose: shouldStayArmed,
      },
    });

    notifyBoardMutated();
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
    const itemStore = useItemStore.getState();
    if (!isFree && itemStore.counts.randomNumber <= 0) {
      return null;
    }

    const { minNum, maxNum } = useBoardStore.getState();
    const history = get().rollHistory;
    const n = Math.max(0, Math.min(8, get().historyConstraintN));

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

    const rand = getItemRandom(get());
    const index = Math.floor(rand * candidates.length);
    const chosenNumber = candidates[index] ?? candidates[0] ?? 1;
    const nextHistory = n > 0 ? [...history, chosenNumber].slice(-n) : [];

    if (!isFree) {
      itemStore.consumeItem('randomNumber', 1);
    }

    itemStore.setActiveItem('randomNumber', 1);

    set({
      currentRolledNumber: chosenNumber,
      rollHistory: nextHistory,
    });

    return chosenNumber;
  },

  rollRandomChoose: (isFree = false) => {
    const itemStore = useItemStore.getState();
    if (!isFree && itemStore.counts.randomChoose <= 0) {
      return null;
    }

    const { minNum, maxNum } = useBoardStore.getState();
    const range = maxNum - minNum + 1;

    const options: [number, number, number] = [
      Math.floor(getItemRandom(get()) * range) + minNum,
      Math.floor(getItemRandom(get()) * range) + minNum,
      Math.floor(getItemRandom(get()) * range) + minNum,
    ];

    if (!isFree) {
      itemStore.consumeItem('randomChoose', 1);
    }

    itemStore.setActiveItem('randomChoose', 1);

    set({
      randomChooseOptions: options,
      selectedChooseNumber: options[0],
    });

    return options;
  },

  selectChooseNumber: (val: number) => {
    set({ selectedChooseNumber: val });
  },

  triggerHintItem: (isFree = false) => {
    const itemStore = useItemStore.getState();
    if (!isFree && itemStore.counts.hint <= 0) {
      return false;
    }

    const success = hintTriggerHandler ? hintTriggerHandler() : false;
    if (success && !isFree) {
      itemStore.consumeItem('hint', 1);
    }
    if (success) {
      set({ hintSuccessFlash: true });
      setTimeout(() => set({ hintSuccessFlash: false }), 500);
    }
    return success;
  },

  triggerShakeItem: (isFree = false) => {
    const itemStore = useItemStore.getState();
    if (!isFree && itemStore.counts.shake <= 0) {
      return false;
    }

    useBoardStore.getState().shakeBoard();

    if (!isFree) {
      itemStore.consumeItem('shake', 1);
    }
    set({ shakeSuccessFlash: true });
    setTimeout(() => set({ shakeSuccessFlash: false }), 500);
    notifyBoardMutated();
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
    const itemStore = useItemStore.getState();
    if (!itemStore.isToggled) return null;
    if (itemStore.activeItem === 'randomNumber') return get().currentRolledNumber;
    if (itemStore.activeItem === 'randomChoose') return get().selectedChooseNumber;
    if (itemStore.activeItem === 'omnitile') return OMNITILE_VALUE;
    return null;
  },
}));
