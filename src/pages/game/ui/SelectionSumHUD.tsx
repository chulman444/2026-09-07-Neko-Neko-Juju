import React from 'react';
import { useSelectionStore } from '@/features/select-tiles';
import type { TileCoord } from '@/entities/board';
import { hexToRgba } from '@/shared/lib/prng';

export interface SelectionSumHUDProps {
  selectedTiles?: TileCoord[];
  selectedSum?: number;
  diagonalSum?: number;
  isSquareSelection?: boolean;
  activeSelectionType?: 'box' | 'diagonal' | null;
  selectionColor?: string;
  validColor?: string;
  className?: string;
}

export const SelectionSumHUD: React.FC<SelectionSumHUDProps> = ({
  selectedTiles: propsSelectedTiles,
  selectedSum: propsSelectedSum,
  diagonalSum: propsDiagonalSum,
  isSquareSelection: propsIsSquareSelection,
  activeSelectionType: propsActiveSelectionType,
  selectionColor = '#ff9f1c',
  validColor = '#10b981',
  className = '',
}) => {
  const storeSelectedTiles = useSelectionStore((state) => state.selectedTiles);
  const storeSelectedSum = useSelectionStore((state) => state.selectedSum);
  const storeDiagonalSum = useSelectionStore((state) => state.diagonalSum);
  const storeIsSquareSelection = useSelectionStore((state) => state.isSquareSelection);
  const storeActiveSelectionType = useSelectionStore((state) => state.activeSelectionType);

  const selectedTiles = propsSelectedTiles ?? storeSelectedTiles;
  const selectedSum = propsSelectedSum ?? storeSelectedSum;
  const diagonalSum = propsDiagonalSum ?? storeDiagonalSum;
  const isSquareSelection = propsIsSquareSelection ?? storeIsSquareSelection;
  const activeSelectionType = propsActiveSelectionType ?? storeActiveSelectionType;

  const hasSelection = selectedTiles.length > 0;
  const isValidBoxSum = selectedSum === 10 && hasSelection;
  const boxActiveColor = isValidBoxSum ? validColor : selectionColor;

  const isValidDiagSum =
    ((isSquareSelection && diagonalSum === 10) ||
      (activeSelectionType === 'diagonal' && selectedSum === 10)) &&
    hasSelection;
  const diagActiveColor = isValidDiagSum ? validColor : selectionColor;

  if (!hasSelection) {
    return <div className="h-7" aria-hidden="true" />;
  }

  return (
    <div
      className={`flex items-center gap-2 h-7 px-3 py-1 rounded-full border shadow-sm transition-all duration-150 animate-in fade-in zoom-in-95 bg-white/95 dark:bg-zinc-800/95 ${className}`.trim()}
      style={{
        borderColor:
          isValidBoxSum || isValidDiagSum ? hexToRgba(validColor, 0.4) : 'rgba(0,0,0,0.1)',
      }}
      aria-label="Selection Sum Indicator"
    >
      {/* If it's a 2x2 square selection, display dual-preview badges */}
      {isSquareSelection ? (
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          {/* Box / 4-Tile Sum */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors"
            style={{
              backgroundColor: isValidBoxSum
                ? hexToRgba(validColor, 0.15)
                : hexToRgba(boxActiveColor, 0.1),
              color: boxActiveColor,
            }}
          >
            <span className="text-[10px] uppercase font-sans font-semibold opacity-70">Box:</span>
            <span className="text-sm font-extrabold">{selectedSum}</span>
            {isValidBoxSum && <span className="text-[11px]">✓</span>}
          </div>

          <span className="text-zinc-400 dark:text-zinc-500 font-sans">•</span>

          {/* Diagonal / 2-Tile Sum */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors"
            style={{
              backgroundColor: isValidDiagSum
                ? hexToRgba(validColor, 0.15)
                : hexToRgba(diagActiveColor, 0.1),
              color: diagActiveColor,
            }}
          >
            <span className="text-[10px] uppercase font-sans font-semibold opacity-70">Diag:</span>
            <span className="text-sm font-extrabold">{diagonalSum}</span>
            {isValidDiagSum && <span className="text-[11px]">✓</span>}
          </div>
        </div>
      ) : (
        /* Regular Rectangle / Diagonal Drag Selection */
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
          <span
            className="text-[10px] uppercase font-sans font-semibold opacity-70"
            style={{ color: activeSelectionType === 'diagonal' ? diagActiveColor : boxActiveColor }}
          >
            {activeSelectionType === 'diagonal' ? 'Diag Sum:' : 'Sum:'}
          </span>
          <span
            className="text-sm font-black"
            style={{ color: activeSelectionType === 'diagonal' ? diagActiveColor : boxActiveColor }}
          >
            {selectedSum}
          </span>
          {((activeSelectionType === 'diagonal' && isValidDiagSum) ||
            (activeSelectionType !== 'diagonal' && isValidBoxSum)) && (
            <span className="text-[12px] font-bold" style={{ color: validColor }}>
              ✓
            </span>
          )}
        </div>
      )}
    </div>
  );
};
