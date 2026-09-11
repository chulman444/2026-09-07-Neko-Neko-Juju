import React from 'react';
import { useGameSessionStore, type ComboConfig } from '@/entities/game-session';

export const ComboRefillSection: React.FC = () => {
  const comboConfig = useGameSessionStore((state) => state.comboConfig);
  const setComboConfig = useGameSessionStore((state) => state.setComboConfig);

  const handleComboChange = (key: keyof ComboConfig, value: number) => {
    setComboConfig({ ...comboConfig, [key]: value });
  };

  return (
    <div>
      <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
        Combo Timer Refill (Seconds)
      </h4>
      <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <span className="flex items-center text-zinc-300">Tier 1 (x1 - x4)</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={comboConfig.tier1Refill}
          onChange={(e) => handleComboChange('tier1Refill', parseFloat(e.target.value))}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none"
        />

        <span className="flex items-center text-zinc-300">Tier 2 (x5 - x7)</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={comboConfig.tier2Refill}
          onChange={(e) => handleComboChange('tier2Refill', parseFloat(e.target.value))}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none"
        />

        <span className="flex items-center text-zinc-300">Tier 3 (x8+)</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={comboConfig.tier3Refill}
          onChange={(e) => handleComboChange('tier3Refill', parseFloat(e.target.value))}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none"
        />
      </div>
    </div>
  );
};
