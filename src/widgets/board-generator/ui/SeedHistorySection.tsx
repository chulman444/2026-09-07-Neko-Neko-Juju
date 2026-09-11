import React, { useState } from 'react';
import { useBoardStore } from '@/entities/board';
import { useBoardGeneratorActions } from '../model/useBoardGeneratorActions';

export const SeedHistorySection: React.FC = () => {
  const currentSeed = useBoardStore((state) => state.seed);
  const seedHistory = useBoardStore((state) => state.seedHistory);
  const [customSeedInput, setCustomSeedInput] = useState<string>('');

  const { loadSeed, rollNewSeed } = useBoardGeneratorActions();

  const handleLoadCustomSeed = () => {
    const trimmed = customSeedInput.trim();
    if (trimmed) {
      loadSeed(trimmed);
      setCustomSeedInput('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          Seed Management & History
        </h4>
        <span className="text-[10px] font-mono text-zinc-400">
          Active: <span className="text-amber-400 font-bold">{currentSeed}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        {/* Custom Seed Input & Quick Actions */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Enter seed string..."
            value={customSeedInput}
            onChange={(e) => setCustomSeedInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadCustomSeed()}
            className="flex-1 min-w-0 bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={!customSeedInput.trim()}
            onClick={handleLoadCustomSeed}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
          >
            Load
          </button>
          <button
            type="button"
            onClick={rollNewSeed}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-750 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition cursor-pointer shrink-0"
            title="Generate a brand-new random seed"
          >
            🎲 Roll
          </button>
        </div>

        {/* Played Seeds List */}
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Played Seeds ({seedHistory.length})</span>
          </div>
          <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {seedHistory.map((s, idx) => {
              const isActive = s === currentSeed;
              return (
                <div
                  key={`${s}-${idx}`}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                      : 'bg-zinc-850/60 border-zinc-750 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span>{s}</span>
                    {isActive && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 uppercase font-sans">
                        Active
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => loadSeed(s)}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded bg-zinc-750 hover:bg-amber-500 hover:text-zinc-950 border border-zinc-600 text-zinc-200 transition cursor-pointer"
                    title={`Restart board with seed ${s}`}
                  >
                    ↺ Retry
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
