import React from 'react';
import { useBoardStore, calculateBoardMetrics } from '@/entities/board';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const TileDistributionChart: React.FC = () => {
  const matrix = useBoardStore((state) => state.matrix);
  const boardMetrics = calculateBoardMetrics(matrix);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
        <span>Tile Frequency (1 → 9)</span>
        <span>{boardMetrics.totalTiles} tiles total</span>
      </div>
      <div className="grid grid-cols-9 gap-1 h-14 items-end bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-750/70">
        {DIGITS.map((digit) => {
          const count = boardMetrics.counts[digit] ?? 0;
          const pct = boardMetrics.totalTiles > 0 ? (count / boardMetrics.totalTiles) * 100 : 0;
          const barHeight = Math.min(100, Math.max(8, Math.round((pct / 25) * 100)));
          return (
            <div key={digit} className="flex flex-col items-center h-full justify-end group relative">
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  digit <= 3
                    ? 'bg-emerald-500/70 group-hover:bg-emerald-400'
                    : digit <= 6
                      ? 'bg-amber-500/70 group-hover:bg-amber-400'
                      : 'bg-rose-500/70 group-hover:bg-rose-400'
                }`}
                style={{ height: `${barHeight}%` }}
                title={`${digit}: ${count} tiles (${pct.toFixed(1)}%)`}
              />
              <span className="text-[10px] font-bold font-mono text-zinc-300 mt-1">{digit}</span>
              <span className="text-[8px] font-mono text-zinc-400">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
