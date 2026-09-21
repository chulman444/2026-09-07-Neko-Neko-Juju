import { create } from 'zustand';
import type { TileCoord } from '@/entities/board';

export interface SelectionState {
  selectedTiles: TileCoord[];
  selectedSum: number;
  diagonalSum: number;
  isSquareSelection: boolean;
  activeSelectionType: 'box' | 'diagonal' | null;

  setSelection: (selection: {
    selectedTiles: TileCoord[];
    selectedSum: number;
    diagonalSum?: number;
    isSquareSelection?: boolean;
    activeSelectionType?: 'box' | 'diagonal' | null;
  }) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedTiles: [],
  selectedSum: 0,
  diagonalSum: 0,
  isSquareSelection: false,
  activeSelectionType: null,

  setSelection: (selection) => {
    set({
      selectedTiles: selection.selectedTiles,
      selectedSum: selection.selectedSum,
      diagonalSum: selection.diagonalSum ?? 0,
      isSquareSelection: selection.isSquareSelection ?? false,
      activeSelectionType: selection.activeSelectionType ?? null,
    });
  },

  clearSelection: () => {
    set({
      selectedTiles: [],
      selectedSum: 0,
      diagonalSum: 0,
      isSquareSelection: false,
      activeSelectionType: null,
    });
  },
}));
