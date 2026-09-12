import React from 'react';
import { useItemStore, type ItemType } from '@/entities/item';

export const ItemsInventorySection: React.FC = () => {
  const counts = useItemStore((state) => state.counts);
  const setItemCount = useItemStore((state) => state.setItemCount);
  const resetItemCounts = useItemStore((state) => state.resetItemCounts);

  const handleStep = (item: ItemType, delta: number) => {
    setItemCount(item, Math.max(0, counts[item] + delta));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          Game Item Inventory
        </h4>
        <button
          type="button"
          onClick={resetItemCounts}
          className="text-[10px] px-2 py-0.5 rounded bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 transition cursor-pointer"
          title="Reset all item counts to 5"
        >
          Reset (5 each)
        </button>
      </div>

      <div className="flex flex-col gap-2.5 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <p className="text-[11px] text-zinc-400 m-0">
          Configure available item counts in the main game container.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Random Number Count */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">🎲 Random</span>
              <span className="text-xs font-mono font-bold text-amber-400">{counts.randomNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStep('randomNumber', -1)}
                className="flex-1 py-1 text-xs font-bold rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                max={99}
                value={counts.randomNumber}
                onChange={(e) => setItemCount('randomNumber', parseInt(e.target.value, 10) || 0)}
                className="w-12 text-center text-xs font-mono bg-zinc-800 border border-zinc-600 rounded py-0.5 text-white"
              />
              <button
                type="button"
                onClick={() => handleStep('randomNumber', 1)}
                className="flex-1 py-1 text-xs font-bold rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Random Choose Count */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">🎰 Choose</span>
              <span className="text-xs font-mono font-bold text-amber-400">{counts.randomChoose}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStep('randomChoose', -1)}
                className="flex-1 py-1 text-xs font-bold rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                max={99}
                value={counts.randomChoose}
                onChange={(e) => setItemCount('randomChoose', parseInt(e.target.value, 10) || 0)}
                className="w-12 text-center text-xs font-mono bg-zinc-800 border border-zinc-600 rounded py-0.5 text-white"
              />
              <button
                type="button"
                onClick={() => handleStep('randomChoose', 1)}
                className="flex-1 py-1 text-xs font-bold rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Hint Count */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">💡 Hint</span>
              <span className="text-xs font-mono font-bold text-amber-400">{counts.hint}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStep('hint', -1)}
                className="flex-1 py-1 text-xs font-bold rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                max={99}
                value={counts.hint}
                onChange={(e) => setItemCount('hint', parseInt(e.target.value, 10) || 0)}
                className="w-12 text-center text-xs font-mono bg-zinc-800 border border-zinc-600 rounded py-0.5 text-white"
              />
              <button
                type="button"
                onClick={() => handleStep('hint', 1)}
                className="flex-1 py-1 text-xs font-bold rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
