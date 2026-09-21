import React, { useMemo } from 'react';
import { useBoardStore, calculateBoardMetrics } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useGameSessionStore } from '@/entities/game-session';

export interface HeaderStatusHUDProps {
  className?: string;
}

export const HeaderStatusHUD: React.FC<HeaderStatusHUDProps> = ({ className = '' }) => {
  // Board Store Selectors
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const initialMatrix = useBoardStore((state) => state.initialMatrix);

  // Solver Store Selectors
  const combinations = useSolverStore((state) => state.combinations);

  // Game Session Selectors
  const score = useGameSessionStore((state) => state.score);
  const clearedTiles = useGameSessionStore((state) => state.clearedTiles);

  // Derived Board & Clearable Metrics
  const totalTiles = cols * rows;
  const expectedSum = cols * rows * 5;
  const remainingTiles = Math.max(0, totalTiles - clearedTiles);

  const boardMetrics = useMemo(() => calculateBoardMetrics(initialMatrix), [initialMatrix]);
  const totalSum = boardMetrics.totalSum;
  const averageTile = boardMetrics.averageTile;
  const zScore = boardMetrics.zScore;

  const statDifficulty = useMemo(() => {
    if (zScore <= -0.8) {
      return {
        label: 'Easy',
        color: 'text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500',
      };
    }
    if (zScore >= 0.8) {
      return {
        label: 'Hard',
        color: 'text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-500',
      };
    }
    return {
      label: 'Medium',
      color: 'text-amber-800/90 dark:text-amber-300',
      dot: 'bg-amber-400 dark:bg-amber-500',
    };
  }, [zScore]);

  const { clearableTileCount, clearableCombosCount } = useMemo(() => {
    const activeClearable = combinations.filter((c) => c.isActive && c.blockers.length === 0);
    const uniqueCoords = new Set<string>();
    for (const combo of activeClearable) {
      for (const tile of combo.required) {
        uniqueCoords.add(`${tile.row},${tile.col}`);
      }
    }
    return {
      clearableTileCount: uniqueCoords.size,
      clearableCombosCount: activeClearable.length,
    };
  }, [combinations]);

  return (
    <div
      className={`flex flex-col bg-amber-50/70 dark:bg-zinc-800/70 border border-amber-200/80 dark:border-zinc-700 rounded-xl p-2.5 shadow-xs font-mono text-xs gap-1.5 min-w-[290px] ${className}`}
    >
      {/* Top Row: Left (Score Cleared & Span Hover) | Right (Clearable Moves & Combos) */}
      <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-amber-900/10 dark:border-zinc-700/80">
        {/* Left: Score / Cleared */}
        <div
          className="flex items-center gap-1.5 cursor-help"
          title={`Span Score: ${score} pts • Cleared: ${clearedTiles} of ${totalTiles} tiles`}
        >
          <span className="text-amber-800/80 dark:text-zinc-400 font-sans font-semibold">
            Score:
          </span>
          <span className="text-sm font-black text-amber-950 dark:text-amber-200 font-mono">
            {clearedTiles}
          </span>
          <span className="text-[10px] text-amber-700/70 dark:text-zinc-400 font-sans">
            cleared
          </span>
        </div>

        {/* Right: How many left (Clearable tiles & combinations) */}
        <div
          className="flex items-center gap-1.5 text-right font-mono cursor-help"
          title={`${remainingTiles} tiles remaining on board • ${clearableTileCount} tiles matchable across ${clearableCombosCount} combinations`}
        >
          <span
            className={`text-xs font-bold ${
              clearableTileCount === 0
                ? 'text-rose-500 animate-pulse'
                : 'text-amber-950 dark:text-amber-100'
            }`}
          >
            {clearableTileCount}
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans">clearable</span>
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            ({clearableCombosCount} {clearableCombosCount === 1 ? 'combo' : 'combos'})
          </span>
        </div>
      </div>

      {/* Bottom Row: Size & Total Tiles, and Difficulty with total & exp sum */}
      <div className="flex items-center justify-between gap-3 pt-0.5 font-mono text-xs">
        {/* Left: Size & Total Tiles */}
        <div
          className="flex items-center gap-1.5 cursor-help"
          title={`Board Size: ${cols} columns × ${rows} rows (${totalTiles} total tiles)`}
        >
          <span className="text-amber-800/80 dark:text-zinc-400 font-sans font-semibold">
            Size:
          </span>
          <span className="text-sm font-black text-amber-950 dark:text-amber-200 font-mono">
            {cols}×{rows}
          </span>
          <span className="text-xs font-bold text-amber-900/80 dark:text-zinc-300 font-mono">
            ({totalTiles} tiles)
          </span>
        </div>

        {/* Right: Difficulty with total sum and exp sum */}
        <div
          className="flex items-center gap-1.5 text-right font-mono cursor-help"
          title={`Statistical Difficulty: ${statDifficulty.label} (Z-Score: ${
            zScore > 0 ? '+' : ''
          }${zScore.toFixed(2)}, Avg: ${averageTile.toFixed(2)}) • Generated Board Sum: ${totalSum} • Expected Uniform Sum: ${expectedSum}`}
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${statDifficulty.dot}`} />
          <span
            className={`text-[10px] font-bold uppercase tracking-wider font-sans ${statDifficulty.color}`}
          >
            {statDifficulty.label}
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">•</span>
          <span className="text-xs font-bold text-amber-950 dark:text-amber-100">{totalSum}</span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
            / exp {expectedSum}
          </span>
        </div>
      </div>
    </div>
  );
};
