import React from 'react';
import { useBoardStore, calculateBoardMetrics } from '@/entities/board';

export const BoardMetricsCard: React.FC = () => {
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const initialMatrix = useBoardStore((state) => state.initialMatrix);

  const boardMetrics = calculateBoardMetrics(initialMatrix);

  return (
    <div className="grid grid-cols-3 gap-2 bg-zinc-850/80 p-2.5 rounded-lg border border-zinc-750 text-center font-mono">
      <div className="flex flex-col">
        <span className="text-[10px] text-zinc-400 uppercase font-sans">Board Sum</span>
        <span className="text-xs font-bold text-amber-300">
          {boardMetrics.totalSum}{' '}
          <span className="text-[9px] text-zinc-500 font-normal">
            (exp: {cols * rows * 5})
          </span>
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-zinc-400 uppercase font-sans">Avg Tile (X̄)</span>
        <span className="text-xs font-bold text-zinc-200">
          {boardMetrics.averageTile.toFixed(2)}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-zinc-400 uppercase font-sans">Z-Score</span>
        <span
          className={`text-xs font-bold ${
            boardMetrics.zScore <= -1.2
              ? 'text-emerald-400'
              : boardMetrics.zScore >= 1.2
                ? 'text-rose-400'
                : 'text-amber-400'
          }`}
          title="Negative Z: high clearability (abundant 1-3). Positive Z: hard (choked with 7-9)."
        >
          {boardMetrics.zScore > 0
            ? `+${boardMetrics.zScore.toFixed(2)}`
            : boardMetrics.zScore.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
