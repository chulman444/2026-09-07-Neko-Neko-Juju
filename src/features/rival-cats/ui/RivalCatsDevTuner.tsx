import React from 'react';
import { useRivalCatStore } from '../model/rivalCatStore';

export interface RivalCatsDevTunerProps {
  className?: string;
}

export const RivalCatsDevTuner: React.FC<RivalCatsDevTunerProps> = ({ className = '' }) => {
  const isEnabled = useRivalCatStore((state) => state.isEnabled);
  const rivalCatInterval = useRivalCatStore((state) => state.rivalCatInterval);
  const rivalCatCountdown = useRivalCatStore((state) => state.rivalCatCountdown);
  const stolenTilesCount = useRivalCatStore((state) => state.stolenTilesCount);

  const setIsEnabled = useRivalCatStore((state) => state.setIsEnabled);
  const setRivalCatInterval = useRivalCatStore((state) => state.setRivalCatInterval);
  const resetRivalCats = useRivalCatStore((state) => state.resetRivalCats);
  const stealMatch = useRivalCatStore((state) => state.stealMatch);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          🐱 Rival Cats
        </h4>
        <span className="text-[10px] font-mono text-zinc-400">
          Stolen: <span className="text-amber-400 font-bold">{stolenTilesCount}</span> tiles
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        {/* Toggle Enable */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="rival-cats-toggle"
            className="text-xs font-medium text-zinc-300 cursor-pointer"
          >
            Enable Rival Cats
          </label>
          <input
            id="rival-cats-toggle"
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
          />
        </div>

        {/* Interval Slider & Input */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Steal Interval (s)</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[10px] text-zinc-400">
                Next: {rivalCatCountdown.toFixed(1)}s
              </span>
              <input
                type="number"
                min="0.5"
                max="60"
                step="0.5"
                value={rivalCatInterval}
                onChange={(e) => setRivalCatInterval(parseFloat(e.target.value) || 1)}
                className="w-14 bg-zinc-850 border border-zinc-700 rounded px-1.5 py-0.5 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={rivalCatInterval}
            onChange={(e) => setRivalCatInterval(parseFloat(e.target.value))}
            className="accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-700/60">
          <button
            type="button"
            onClick={() => stealMatch()}
            disabled={!isEnabled}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
              isEnabled
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                : 'bg-zinc-850 text-zinc-500 border-zinc-750 cursor-not-allowed opacity-60'
            }`}
            title="Trigger an immediate match steal"
          >
            🐾 Steal Now
          </button>

          <button
            type="button"
            onClick={resetRivalCats}
            className="px-2 py-1 text-xs font-medium rounded-lg bg-zinc-750 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 transition cursor-pointer"
            title="Reset stolen tile counter and countdown"
          >
            ↺ Reset Counter
          </button>
        </div>
      </div>
    </div>
  );
};
