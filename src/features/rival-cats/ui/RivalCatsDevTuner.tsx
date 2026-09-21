import React from 'react';
import { useRivalCatStore } from '../model/rivalCatStore';
import type { DefeatCondition } from '../model/types';

export interface RivalCatsDevTunerProps {
  className?: string;
}

export const RivalCatsDevTuner: React.FC<RivalCatsDevTunerProps> = ({ className = '' }) => {
  const isEnabled = useRivalCatStore((state) => state.isEnabled);
  const defeatCondition = useRivalCatStore((state) => state.defeatCondition);
  const cats = useRivalCatStore((state) => state.cats);
  const dormantDuration = useRivalCatStore((state) => state.dormantDuration);
  const spawnInterval = useRivalCatStore((state) => state.spawnInterval);
  const stealDuration = useRivalCatStore((state) => state.stealDuration);
  const pushbackPerClear = useRivalCatStore((state) => state.pushbackPerClear);
  const toughCatPushbackBonus = useRivalCatStore((state) => state.toughCatPushbackBonus);
  const stolenTilesCount = useRivalCatStore((state) => state.stolenTilesCount);

  const setIsEnabled = useRivalCatStore((state) => state.setIsEnabled);
  const setDefeatCondition = useRivalCatStore((state) => state.setDefeatCondition);
  const setDormantDuration = useRivalCatStore((state) => state.setDormantDuration);
  const setSpawnInterval = useRivalCatStore((state) => state.setSpawnInterval);
  const setStealDuration = useRivalCatStore((state) => state.setStealDuration);
  const setPushbackPerClear = useRivalCatStore((state) => state.setPushbackPerClear);
  const setToughCatPushbackBonus = useRivalCatStore((state) => state.setToughCatPushbackBonus);
  const addCat = useRivalCatStore((state) => state.addCat);
  const removeCat = useRivalCatStore((state) => state.removeCat);
  const resetRivalCats = useRivalCatStore((state) => state.resetRivalCats);
  const stealMatch = useRivalCatStore((state) => state.stealMatch);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
          <span>🐾</span> Rival Cats ({cats.length})
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

        {/* Defeat Condition Dropdown */}
        <div className="flex flex-col gap-1 pt-2 border-t border-zinc-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Defeat Condition</span>
            <select
              value={defeatCondition}
              onChange={(e) => setDefeatCondition(e.target.value as DefeatCondition)}
              className="bg-zinc-850 border border-zinc-700 rounded px-2 py-0.5 text-xs text-amber-300 font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="any_overlap">Any Overlap (Casual)</option>
              <option value="exact_match">Exact Match (Strict)</option>
              <option value="start_tile_only">Start Tile Only (Headshot)</option>
            </select>
          </div>
          <span className="text-[9px] text-zinc-400">
            {defeatCondition === 'any_overlap' && 'Stealing any tile in target defeats the cat.'}
            {defeatCondition === 'exact_match' && 'Player must match the exact combination.'}
            {defeatCondition === 'start_tile_only' &&
              'Clearing the telegraphed Paw tile defeats the cat.'}
          </span>
        </div>

        {/* Sliders: Timers & Durations */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-700/60">
          {/* Spawn / Idle Interval */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">Idle Interval</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {spawnInterval.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={spawnInterval}
              onChange={(e) => setSpawnInterval(parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer h-1.5"
            />
          </div>

          {/* Steal Duration */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">Telegraph / Steal Duration</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {stealDuration.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={stealDuration}
              onChange={(e) => setStealDuration(parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer h-1.5"
            />
          </div>

          {/* Dormant Duration */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">Dormant Duration (Stun)</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {dormantDuration.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={dormantDuration}
              onChange={(e) => setDormantDuration(parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer h-1.5"
            />
          </div>

          {/* Pushback Per Clear */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">Pushback Per Clear</span>
              <span className="text-[10px] font-mono text-zinc-400">
                +{pushbackPerClear.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.25"
              value={pushbackPerClear}
              onChange={(e) => setPushbackPerClear(parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer h-1.5"
            />
          </div>

          {/* Tough Cat Pushback Bonus */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">Tough Cat Pushback Bonus</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {toughCatPushbackBonus >= 0
                  ? `+${toughCatPushbackBonus.toFixed(1)}`
                  : toughCatPushbackBonus.toFixed(1)}
                s
              </span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.25"
              value={toughCatPushbackBonus}
              onChange={(e) => setToughCatPushbackBonus(parseFloat(e.target.value))}
              className="accent-rose-500 cursor-pointer h-1.5"
            />
          </div>
        </div>

        {/* Add Cats / Spawner */}
        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-700/60">
          <button
            type="button"
            onClick={() => addCat('normal')}
            className="flex-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
          >
            + Normal Cat
          </button>
          <button
            type="button"
            onClick={() => addCat('tough')}
            className="flex-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition cursor-pointer"
          >
            + Tough Cat
          </button>
        </div>

        {/* Live Active Cats List */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-700/60">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Active Cats Live Status
          </span>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
            {cats.map((cat, index) => {
              const isTough = cat.type === 'tough';
              const phaseBadgeColor =
                cat.phase === 'targeting'
                  ? isTough
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                    : 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                  : cat.phase === 'dormant'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40';

              const targetCoords = cat.targetMatch
                ? cat.targetMatch.map((t) => `(${t.row},${t.col})`).join('-')
                : null;

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-2 py-1 bg-zinc-900/80 rounded border border-zinc-750 text-xs font-mono"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400">#{index + 1}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1 rounded ${
                        isTough
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {cat.type}
                    </span>
                    <span className={`text-[9px] uppercase px-1 rounded border ${phaseBadgeColor}`}>
                      {cat.phase}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400">
                      {targetCoords ? `🎯 ${targetCoords}` : `${cat.countdown.toFixed(1)}s`}
                    </span>

                    {cats.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCat(cat.id)}
                        className="text-[10px] text-zinc-500 hover:text-rose-400 transition cursor-pointer px-1"
                        title="Remove cat"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
            ↺ Reset Cats
          </button>
        </div>
      </div>
    </div>
  );
};
