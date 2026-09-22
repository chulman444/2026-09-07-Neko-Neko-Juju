import React from 'react';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { useFreeTriggeredHintStore } from '@/features/free-triggered-hint';

export const HintsConfigSection: React.FC = () => {
  const maxFreeHints = useFreeTriggeredHintStore((state) => state.maxFreeHints);
  const freeHintInterval = useFreeTriggeredHintStore((state) => state.freeHintInterval);
  const baseSecondsPerTile = useSurvivalTimerStore((state) => state.baseSecondsPerTile);

  const setMaxFreeHints = useFreeTriggeredHintStore((state) => state.setMaxFreeHints);
  const setFreeHintInterval = useFreeTriggeredHintStore((state) => state.setFreeHintInterval);
  const setBaseSecondsPerTile = useSurvivalTimerStore((state) => state.setBaseSecondsPerTile);

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
