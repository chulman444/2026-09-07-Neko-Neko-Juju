import React from 'react';
import { useGameSessionStore } from '@/entities/game-session';
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
  const storeSelectedTiles = useGameSessionStore((state) => state.selectedTiles);
  const storeSelectedSum = useGameSessionStore((state) => state.selectedSum);
  const storeDiagonalSum = useGameSessionStore((state) => state.diagonalSum);
  const storeIsSquareSelection = useGameSessionStore((state) => state.isSquareSelection);
  const storeActiveSelectionType = useGameSessionStore((state) => state.activeSelectionType);

  const selectedTiles = propsSelectedTiles ?? storeSelectedTiles;
  const selectedSum = propsSelectedSum ?? storeSelectedSum;
  const diagonalSum = propsDiagonalSum ?? storeDiagonalSum;
  const isSquareSelection = propsIsSquareSelection ?? storeIsSquareSelection;
  const activeSelectionType = propsActiveSelectionType ?? storeActiveSelectionType;

  const hasSelection = selectedTiles.length > 0;
  const isValidBoxSum = selectedSum === 10 && hasSelection;
  const boxActiveColor = isValidBoxSum ? validColor : selectionColor;

  const isValidDiagSum =
    ((isSquareSelection && diagonalSum === 10) || (activeSelectionType === 'diagonal' && selectedSum === 10)) &&
    hasSelection;
  const diagActiveColor = isValidDiagSum ? validColor : selectionColor;

  // Determine what to show
  const isPureDiagonal = activeSelectionType === 'diagonal';
  const showDualPreview = isSquareSelection && !isPureDiagonal;

  return (
    <div
      className={`h-9 flex items-center justify-center min-w-0 px-2 text-center select-none transition-all duration-150 ${className}`}
      aria-label="Selection Sum Indicator"
    >
      {hasSelection ? (
        <div className="flex items-center gap-2 h-full shrink-0 animate-in fade-in zoom-in-95 duration-100">
          {/* Pure Diagonal Drag Badge */}
          {isPureDiagonal ? (
            <div
              id="hud-diag-sum-container"
              className="inline-flex items-center justify-center font-black select-none h-[30px] box-border px-3 rounded-lg text-lg leading-none transition-colors duration-150 shrink-0 border-2 gap-1 [-webkit-text-stroke:1px_#4a2e12] shadow-xs"
              style={{
                borderColor: diagActiveColor,
                backgroundColor: hexToRgba(diagActiveColor, 0.22),
                color: diagActiveColor,
              }}
              title={`Diagonal Sum: ${selectedSum} ${isValidDiagSum ? '(Valid Match-10!)' : ''}`}
            >
              <span className="inline-flex items-center text-[15px] -translate-y-px">╱</span>
              <span id="diag-sum-display" className="inline-flex items-center -translate-y-px font-mono">
                {selectedSum}
              </span>
            </div>
          ) : (
            <>
              {/* Box Sum Badge */}
              <div
                id="hud-sum-container"
                className="inline-flex items-center justify-center font-black select-none h-[30px] box-border px-3 rounded-lg text-lg leading-none transition-colors duration-150 shrink-0 border-2 [-webkit-text-stroke:1px_#4a2e12] shadow-xs"
                style={{
                  borderColor: boxActiveColor,
                  backgroundColor: hexToRgba(boxActiveColor, 0.22),
                  color: boxActiveColor,
                }}
                title={`Selected Sum: ${selectedSum} ${isValidBoxSum ? '(Valid Match-10!)' : ''}`}
              >
                <span id="sum-display" className="inline-flex items-center -translate-y-px font-mono">
                  {selectedSum}
                </span>
              </div>

              {/* Square Diagonal Sum Badge (Shown alongside Box Sum when dragging a square) */}
              {showDualPreview && (
                <div
                  id="hud-diag-sum-container"
                  className="inline-flex items-center justify-center font-black select-none h-[30px] box-border px-3 rounded-lg text-lg leading-none transition-colors duration-150 shrink-0 border-2 gap-1 [-webkit-text-stroke:1px_#4a2e12] shadow-xs animate-in fade-in slide-in-from-left-1 duration-100"
                  style={{
                    borderColor: diagActiveColor,
                    backgroundColor: hexToRgba(diagActiveColor, 0.22),
                    color: diagActiveColor,
                  }}
                  title={`Square Diagonal Sum: ${diagonalSum} ${isValidDiagSum ? '(Valid Match-10!)' : ''}`}
                >
                  <span className="inline-flex items-center text-[15px] -translate-y-px">╱</span>
                  <span id="diag-sum-display" className="inline-flex items-center -translate-y-px font-mono">
                    {diagonalSum}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Idle State: Guide text */
        <div className="flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-xs font-semibold select-none leading-snug text-center max-h-[34px] px-2.5 py-1 rounded-md bg-amber-900/5 dark:bg-zinc-800/40 border border-amber-900/10 dark:border-zinc-700/50">
          <span>Group numbers that sum to 10</span>
        </div>
      )}
    </div>
  );
};
