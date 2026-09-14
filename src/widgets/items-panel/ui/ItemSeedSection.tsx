import React from 'react';
import { useBoardStore } from '@/entities/board';
import { useItemStore } from '@/entities/item';

export const ItemSeedSection: React.FC = () => {
  const boardSeed = useBoardStore((state) => state.seed);
  const useBoardSeed = useItemStore((state) => state.useBoardSeed);
  const setUseBoardSeed = useItemStore((state) => state.setUseBoardSeed);
  const itemSeed = useItemStore((state) => state.itemSeed);
  const setItemSeed = useItemStore((state) => state.setItemSeed);
  const regenerateItemSeed = useItemStore((state) => state.regenerateItemSeed);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          🌱 Item PRNG & Seed Room
        </h4>
        <span className="text-[10px] font-mono text-zinc-400">
          {useBoardSeed ? 'Linked to Board' : 'Isolated'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
            <input
              type="radio"
              name="seedMode"
              checked={!useBoardSeed}
              onChange={() => setUseBoardSeed(false)}
              className="accent-amber-500 cursor-pointer"
            />
            <span>Separate Item Seed</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
            <input
              type="radio"
              name="seedMode"
              checked={useBoardSeed}
              onChange={() => setUseBoardSeed(true)}
              className="accent-amber-500 cursor-pointer"
            />
            <span>Use Board Seed</span>
          </label>
        </div>

        {useBoardSeed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
            <span className="text-[11px] text-zinc-400">Active Board Seed:</span>
            <span className="text-xs font-mono font-bold text-amber-400">{boardSeed}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={itemSeed}
              onChange={(e) => setItemSeed(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded-lg text-amber-300 focus:outline-none focus:border-amber-500"
              placeholder="Enter seed string..."
            />
            <button
              type="button"
              onClick={regenerateItemSeed}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition cursor-pointer shrink-0"
              title="Generate fresh item random seed"
            >
              🎲 New Seed
            </button>
          </div>
        )}

        <p className="text-[10px] text-zinc-500 m-0">
          Separate seeds ensure item rolls do not interfere with deterministic board layout
          generation.
        </p>
      </div>
    </div>
  );
};
