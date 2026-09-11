import React from 'react';
import { useGameSessionStore, type ComboConfig } from '@/entities/game-session';

export const ComboDrainSection: React.FC = () => {
  const comboConfig = useGameSessionStore((state) => state.comboConfig);
  const setComboConfig = useGameSessionStore((state) => state.setComboConfig);

  const handleComboChange = (key: keyof ComboConfig, value: number) => {
    setComboConfig({ ...comboConfig, [key]: value });
  };

  return (
    <div>
      <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
        Combo Drain Speed
      </h4>
      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-300">Drain Exponent</span>
            <span className="font-mono font-bold text-amber-400">{comboConfig.drainExponent.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={comboConfig.drainExponent}
            onChange={(e) => handleComboChange('drainExponent', parseFloat(e.target.value))}
            className="accent-amber-500 cursor-pointer"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-300">Drain Multiplier</span>
            <span className="font-mono font-bold text-amber-400">{comboConfig.multiplier.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={comboConfig.multiplier}
            onChange={(e) => handleComboChange('multiplier', parseFloat(e.target.value))}
            className="accent-amber-500 cursor-pointer"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-300">Fixed Min Drain (%/s)</span>
            <span className="font-mono font-bold text-amber-400">{comboConfig.fixedMinimalDrain}</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={comboConfig.fixedMinimalDrain}
            onChange={(e) => handleComboChange('fixedMinimalDrain', parseFloat(e.target.value))}
            className="accent-amber-500 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
