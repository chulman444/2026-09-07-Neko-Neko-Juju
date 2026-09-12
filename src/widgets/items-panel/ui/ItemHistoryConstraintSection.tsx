import React from 'react';
import { useItemStore } from '@/entities/item';

export const ItemHistoryConstraintSection: React.FC = () => {
  const historyConstraintN = useItemStore((state) => state.historyConstraintN);
  const setHistoryConstraintN = useItemStore((state) => state.setHistoryConstraintN);
  const rollHistory = useItemStore((state) => state.rollHistory);
  const clearRollHistory = useItemStore((state) => state.clearRollHistory);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          🎲 Random Roll Repeat Constraint
        </h4>
        <span className="text-[10px] font-mono text-zinc-400">
          N = <strong className="text-amber-400 text-xs">{historyConstraintN}</strong> / 8
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs text-zinc-300">
            <span>Do not repeat last <strong>{historyConstraintN}</strong> rolled numbers</span>
            <span className="text-[10px] text-zinc-400 font-mono">Max: 8 (Full Cycle)</span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={historyConstraintN}
            onChange={(e) => setHistoryConstraintN(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
            <span>0 (Pure Random)</span>
            <span>3 (Default)</span>
            <span>8 (Full 9-Cycle)</span>
          </div>
        </div>

        {/* Recent Roll History Display */}
        <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-900/70 border border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-300">
              Recent Roll History ({rollHistory.length}/{historyConstraintN})
            </span>
            {rollHistory.length > 0 && (
              <button
                type="button"
                onClick={clearRollHistory}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {rollHistory.length === 0 ? (
            <span className="text-[11px] text-zinc-500 italic py-1">No numbers rolled yet.</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {rollHistory.map((num, idx) => (
                <span
                  key={`${idx}-${num}`}
                  className="w-6 h-6 flex items-center justify-center text-xs font-bold font-mono rounded bg-amber-500/20 border border-amber-500/40 text-amber-300"
                  title={`Position ${idx + 1} in exclusion history`}
                >
                  {num}
                </span>
              ))}
            </div>
          )}

          <p className="text-[10px] text-zinc-500 m-0 mt-0.5">
            These numbers are actively excluded from the next Random Number roll.
          </p>
        </div>
      </div>
    </div>
  );
};
