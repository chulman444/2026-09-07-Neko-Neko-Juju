import { create } from 'zustand';
import { DEFAULT_CONFIG } from '@/shared/config';
import type { PlayerState } from './types';

export const usePlayerStore = create<PlayerState>((set) => ({
  checkerboardMode: DEFAULT_CONFIG.checkerboardMode ?? '2-color',
  checkerColors: [DEFAULT_CONFIG.checker1, DEFAULT_CONFIG.checker2],
  inversePan: true,
  panSensitivity: 1.5,
  dimBackdrop: true,
  isSettingsOpen: false,

  setCheckerboardMode: (checkerboardMode) => set({ checkerboardMode }),
  setCheckerColors: (checkerColors) => set({ checkerColors }),
  setInversePan: (inversePan) => set({ inversePan }),
  toggleInversePan: () => set((state) => ({ inversePan: !state.inversePan })),
  setPanSensitivity: (panSensitivity) =>
    set({ panSensitivity: Math.max(0.2, Math.min(6.0, panSensitivity)) }),
  setDimBackdrop: (dimBackdrop) => set({ dimBackdrop }),
  toggleDimBackdrop: () => set((state) => ({ dimBackdrop: !state.dimBackdrop })),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
}));
