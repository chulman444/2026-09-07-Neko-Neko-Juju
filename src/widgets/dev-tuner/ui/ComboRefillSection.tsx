import React from 'react';
import { useGameSessionStore, type ComboConfig } from '@/entities/game-session';

export const ComboRefillSection: React.FC = () => {
  const comboConfig = useGameSessionStore((state) => state.comboConfig);
  const setComboConfig = useGameSessionStore((state) => state.setComboConfig);

  const handleComboChange = (key: keyof ComboConfig, value: number) => {
    setComboConfig({ ...comboConfig, [key]: value });
  };

  const handleToggle = () => {
    setComboConfig({ ...comboConfig, isTierRefillEnabled: !comboConfig.isTierRefillEnabled });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          Combo Timer Refill (Seconds)
        </h4>
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={comboConfig.isTierRefillEnabled}
            onChange={handleToggle}
            className="accent-amber-500 rounded border-zinc-700 bg-zinc-800"
          />
          Enabled
        </label>
      </div>
      <div
        className={`grid grid-cols-2 gap-3 text-xs bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70 transition-opacity ${!comboConfig.isTierRefillEnabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <span className="flex items-center text-zinc-300">Tier 1 (x1 - x4)</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={comboConfig.tier1Refill}
          onChange={(e) => handleComboChange('tier1Refill', parseFloat(e.target.value))}
          disabled={!comboConfig.isTierRefillEnabled}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none disabled:bg-zinc-800/50"
        />

        <span className="flex items-center text-zinc-300">Tier 2 (x5 - x7)</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={comboConfig.tier2Refill}
          onChange={(e) => handleComboChange('tier2Refill', parseFloat(e.target.value))}
          disabled={!comboConfig.isTierRefillEnabled}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none disabled:bg-zinc-800/50"
        />

        <span className="flex items-center text-zinc-300">Tier 3 (x8+)</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={comboConfig.tier3Refill}
          onChange={(e) => handleComboChange('tier3Refill', parseFloat(e.target.value))}
          disabled={!comboConfig.isTierRefillEnabled}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none disabled:bg-zinc-800/50"
        />
      </div>
    </div>
  );
};
