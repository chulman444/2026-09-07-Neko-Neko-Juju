import React from 'react';
import { useGameSessionStore } from '../../model/gameSessionStore';

export const SimulationSection: React.FC = () => {
  const isPaused = useGameSessionStore((state) => state.isPaused);
  const retryAllowed = useGameSessionStore((state) => state.retryAllowed);

  const togglePause = useGameSessionStore((state) => state.togglePause);
  const setRetryAllowed = useGameSessionStore((state) => state.setRetryAllowed);

  return (
    <div>
      <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
        Gameplay & Simulation Options
      </h4>
      <div className="flex flex-col gap-2.5 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-700/60">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-semibold text-zinc-200">Simulation Pause</span>
            <span className="text-[10px] text-zinc-400">
              Freeze timer countdown and simulation (dev only).
            </span>
          </div>
          <button
            type="button"
            onClick={togglePause}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer shrink-0 ${
              isPaused
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-extrabold shadow-sm'
                : 'bg-zinc-700 hover:bg-zinc-650 text-zinc-200 border-zinc-600'
            }`}
          >
            {isPaused ? '▶ Resume Simulation' : '⏸ Pause Simulation'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-semibold text-zinc-200">Allow Retry Button</span>
            <span className="text-[10px] text-zinc-400">
              When disabled, hides the Retry button from the main header.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={retryAllowed}
              onChange={(e) => setRetryAllowed(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
