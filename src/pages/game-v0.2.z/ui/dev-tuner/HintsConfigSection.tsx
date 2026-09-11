import React from 'react';
import { useGameSessionStore } from '../../model/gameSessionStore';

export const HintsConfigSection: React.FC = () => {
  const maxFreeHints = useGameSessionStore((state) => state.maxFreeHints);
  const freeHintInterval = useGameSessionStore((state) => state.freeHintInterval);
  const baseSecondsPerTile = useGameSessionStore((state) => state.baseSecondsPerTile);

  const setMaxFreeHints = useGameSessionStore((state) => state.setMaxFreeHints);
  const setFreeHintInterval = useGameSessionStore((state) => state.setFreeHintInterval);
  const setBaseSecondsPerTile = useGameSessionStore((state) => state.setBaseSecondsPerTile);

  return (
    <div>
      <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
        Phase 1 Hints
      </h4>
      <div className="grid grid-cols-2 gap-3 items-center bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <span className="text-xs font-medium text-zinc-300">Max Free Hints (N)</span>
        <input
          type="number"
          min="0"
          step="1"
          value={maxFreeHints}
          onChange={(e) => setMaxFreeHints(parseInt(e.target.value, 10) || 0)}
          className="bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
        />

        <span className="text-xs font-medium text-zinc-300">Hint Interval (T, s)</span>
        <input
          type="number"
          min="1"
          step="1"
          value={freeHintInterval}
          onChange={(e) => setFreeHintInterval(parseFloat(e.target.value) || 0)}
          className="bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
        />

        <span className="text-xs font-medium text-zinc-300">Reward Per Tile (s)</span>
        <input
          type="number"
          min="0"
          step="0.1"
          value={baseSecondsPerTile}
          onChange={(e) => setBaseSecondsPerTile(parseFloat(e.target.value) || 0)}
          className="bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
        />
      </div>
    </div>
  );
};
