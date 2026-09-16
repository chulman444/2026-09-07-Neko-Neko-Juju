import { create } from 'zustand';

export interface DevHotkeysState {
  isDevHotkeysEnabled: boolean;
  setDevHotkeysEnabled: (enabled: boolean) => void;
  toggleDevHotkeys: () => void;
}

export const useDevHotkeysStore = create<DevHotkeysState>((set) => ({
  isDevHotkeysEnabled: false,
  setDevHotkeysEnabled: (enabled: boolean) => set({ isDevHotkeysEnabled: enabled }),
  toggleDevHotkeys: () => set((state) => ({ isDevHotkeysEnabled: !state.isDevHotkeysEnabled })),
}));
