import { create } from 'zustand';
import { useBoardStore, type TileCoord } from '@/entities/board';
import type { RivalCatState } from './types';

let hintsResolver: (() => TileCoord[][]) | null = null;
let stealListener: ((tiles: TileCoord[]) => void) | null = null;

export const setRivalCatHintsResolver = (resolver: (() => TileCoord[][]) | null) => {
  hintsResolver = resolver;
};

export const getRivalCatHints = (): TileCoord[][] => {
  if (!hintsResolver) return [];
  return hintsResolver();
};

export const registerRivalStealListener = (listener: ((tiles: TileCoord[]) => void) | null) => {
  stealListener = listener;
};

export const notifyRivalSteal = (tiles: TileCoord[]) => {
  stealListener?.(tiles);
};

export const useRivalCatStore = create<RivalCatState>((set, get) => ({
  isEnabled: false,
  rivalCatInterval: 5,
  rivalCatCountdown: 5,
  activeRivalCats: 1,
  stolenTilesCount: 0,

  setIsEnabled: (enabled: boolean) => {
    set({ isEnabled: enabled });
  },

  setRivalCatInterval: (val: number) => {
    const sanitized = Math.max(0.5, val);
    set((state) => ({
      rivalCatInterval: sanitized,
      rivalCatCountdown: Math.min(state.rivalCatCountdown, sanitized),
    }));
  },

  setActiveRivalCats: (count: number) => {
    set({ activeRivalCats: Math.max(1, count) });
  },

  setStolenTilesCount: (count: number) => {
    set({ stolenTilesCount: Math.max(0, count) });
  },

  resetCountdown: () => {
    set((state) => ({
      rivalCatCountdown: state.rivalCatInterval,
    }));
  },

  resetRivalCats: () => {
    set((state) => ({
      rivalCatCountdown: state.rivalCatInterval,
      stolenTilesCount: 0,
    }));
  },

  tick: (deltaSeconds: number, isPaused = false) => {
    const state = get();
    if (!state.isEnabled || isPaused || deltaSeconds <= 0) return;

    const nextCountdown = state.rivalCatCountdown - deltaSeconds;
    if (nextCountdown <= 0) {
      state.stealMatch();
    } else {
      set({ rivalCatCountdown: nextCountdown });
    }
  },

  stealMatch: (explicitCombos?: TileCoord[][]) => {
    const state = get();
    const activeClearables = explicitCombos ?? getRivalCatHints();

    if (activeClearables.length === 0) {
      set({ rivalCatCountdown: state.rivalCatInterval });
      return false;
    }

    const randomIndex = Math.floor(Math.random() * activeClearables.length);
    const targetCombo = activeClearables[randomIndex];
    if (!targetCombo || targetCombo.length === 0) {
      set({ rivalCatCountdown: state.rivalCatInterval });
      return false;
    }

    const cleared = useBoardStore.getState().clearTiles(targetCombo);
    const stolenAmount = cleared > 0 ? cleared : targetCombo.length;

    set((s) => ({
      stolenTilesCount: s.stolenTilesCount + stolenAmount,
      rivalCatCountdown: s.rivalCatInterval,
    }));

    notifyRivalSteal(targetCombo);
    return true;
  },
}));
