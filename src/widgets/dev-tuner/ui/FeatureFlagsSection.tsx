import React from 'react';
import { useGameConfigStore, type GamePreset, type GameFeatureFlags } from '@/entities/game-config';

export const FeatureFlagsSection: React.FC = () => {
  const store = useGameConfigStore();
  const { preset, setPreset, setFlag } = store;
  
  // Pluck flags manually or iterate
  const flags = {
    enableItems: store.enableItems,
    enableDevTools: store.enableDevTools,
    enableSolidBlocks: store.enableSolidBlocks,
    enableBounties: store.enableBounties,
    enableCombos: store.enableCombos,
    enableHints: store.enableHints,
    enableTimer: store.enableTimer,
    enableSelectionHUD: store.enableSelectionHUD,
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreset(e.target.value as GamePreset);
  };

  const toggleFlag = (key: keyof GameFeatureFlags) => {
    setFlag(key, !flags[key]);
  };

  return (
    <div className="bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
      <h3 className="font-bold text-zinc-100 mb-3 flex items-center gap-2">
        <span>⚙️</span> Game Mode & Feature Flags
      </h3>
      
      <div className="flex flex-col gap-4">
        {/* Preset Selector */}
        <div className="flex items-center justify-between">
          <label htmlFor="preset-select" className="text-zinc-300 font-medium text-xs">
            Active Preset Mode
          </label>
          <select
            id="preset-select"
            value={preset}
            onChange={handlePresetChange}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 outline-none focus:border-amber-500"
          >
            <option value="classic">Classic (v0.1)</option>
            <option value="editor">Editor (v0.2)</option>
            <option value="arcade">Arcade (v0.3)</option>
            <option value="roguelite">Roguelite (v0.4)</option>
          </select>
        </div>

        <hr className="border-zinc-700/50" />

        {/* Live Toggles */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {(Object.keys(flags) as Array<keyof GameFeatureFlags>).map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={() => toggleFlag(key)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors select-none">
                {key}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
