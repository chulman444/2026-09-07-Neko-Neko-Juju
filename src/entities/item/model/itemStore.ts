import { create } from 'zustand';
import { useBoardStore } from '@/entities/board';
import { useGameSessionStore } from '@/entities/game-session';
import { generateSeed, seededRandomGenerator } from '@/shared/lib/prng';
import type { ItemState, ItemCounts, ItemType } from './types';

export const DEFAULT_ITEM_COUNTS: ItemCounts = {
  randomNumber: 5,
  randomChoose: 5,
  hint: 5,
};

function getNextRandom(state: ItemState): { rand: number; nextStep: number } {
  const seedBase = state.useBoardSeed ? useBoardStore.getState().seed : state.itemSeed;
  const currentStep = state.itemSeedStep;
  const gen = seededRandomGenerator(`${seedBase}_item_${currentStep}`);
  return { rand: gen(), nextStep: currentStep + 1 };
}

const initialSeed = generateSeed();

export const useItemStore = create<ItemState>((set, get) => ({
  counts: { ...DEFAULT_ITEM_COUNTS },
  activeItem: null,
  isToggled: false,

  historyConstraintN: 3,
  rollHistory: [],
  currentRolledNumber: null,

  randomChooseOptions: null,
  selectedChooseNumber: null,

  useBoardSeed: false,
  itemSeed: initialSeed,
  itemSeedStep: 0,

  toggleItem: (item: 'randomNumber' | 'randomChoose') => {
    const state = get();
    if (state.isToggled && state.activeItem === item) {
      set({ isToggled: false, activeItem: null });
      return;
    }

    if (item === 'randomNumber') {
      if (state.currentRolledNumber !== null) {
        set({ activeItem: 'randomNumber', isToggled: true });
      } else {
        get().rollRandomNumber(false);
      }
    } else if (item === 'randomChoose') {
      if (state.randomChooseOptions !== null) {
        set({ activeItem: 'randomChoose', isToggled: true });
      } else {
        get().rollRandomChoose(false);
      }
    }
  },

  untoggle: () => {
    set({ isToggled: false, activeItem: null });
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

    const { rand, nextStep } = getNextRandom(state);
    const index = Math.floor(rand * candidates.length);
    const chosenNumber = candidates[index] ?? candidates[0] ?? 1;

    const nextHistory = n > 0 ? [...history, chosenNumber].slice(-n) : [];

    set({
      counts: isFree
        ? state.counts
        : { ...state.counts, randomNumber: Math.max(0, state.counts.randomNumber - 1) },
      currentRolledNumber: chosenNumber,
      rollHistory: nextHistory,
      itemSeedStep: nextStep,
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

    let step = state.itemSeedStep;
    const options: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const seedBase = state.useBoardSeed ? useBoardStore.getState().seed : state.itemSeed;
      const gen = seededRandomGenerator(`${seedBase}_item_${step}`);
      options[i] = Math.floor(gen() * range) + minNum;
      step++;
    }

    set({
      counts: isFree
        ? state.counts
        : { ...state.counts, randomChoose: Math.max(0, state.counts.randomChoose - 1) },
      randomChooseOptions: options,
      selectedChooseNumber: options[0],
      itemSeedStep: step,
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

    const success = useGameSessionStore.getState().triggerHint();
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
    set({ itemSeed: seed, itemSeedStep: 0 });
  },

  regenerateItemSeed: () => {
    set({ itemSeed: generateSeed(), itemSeedStep: 0 });
  },

  getActiveNumber: () => {
    const state = get();
    if (!state.isToggled) return null;
    if (state.activeItem === 'randomNumber') return state.currentRolledNumber;
    if (state.activeItem === 'randomChoose') return state.selectedChooseNumber;
    return null;
  },
}));
