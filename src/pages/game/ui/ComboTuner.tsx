import React, { useState } from 'react';
import type { ComboConfig } from '../model/useComboSystem';

interface ComboTunerProps {
  config: ComboConfig;
  onChange: (newConfig: ComboConfig) => void;
}

export const ComboTuner: React.FC<ComboTunerProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof ComboConfig, value: number) => {
    onChange({ ...config, [key]: value });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-zinc-800 text-zinc-200 p-2.5 rounded-lg text-xs font-bold border border-zinc-700 shadow-xl cursor-pointer hover:bg-zinc-700 transition z-50"
      >
        ⚙️ Tune Combo
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 bg-zinc-900/95 backdrop-blur-md text-zinc-200 p-4 rounded-xl text-sm border border-zinc-700 shadow-2xl z-50 select-none">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-amber-400">Combo Tuning</h3>
        <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer text-lg leading-none">
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>Drain Exponent</span>
            <span className="font-mono text-xs">{config.drainExponent.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={config.drainExponent}
            onChange={(e) => handleChange('drainExponent', parseFloat(e.target.value))}
            className="accent-amber-500 cursor-pointer"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>Drain Multiplier</span>
            <span className="font-mono text-xs">{config.multiplier.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={config.multiplier}
            onChange={(e) => handleChange('multiplier', parseFloat(e.target.value))}
            className="accent-amber-500 cursor-pointer"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>Fixed Min Drain (%/s)</span>
            <span className="font-mono text-xs">{config.fixedMinimalDrain}</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={config.fixedMinimalDrain}
            onChange={(e) => handleChange('fixedMinimalDrain', parseFloat(e.target.value))}
            className="accent-amber-500 cursor-pointer"
          />
        </label>

        <hr className="border-zinc-700 my-1" />
        <h4 className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">Main Timer Refill (Seconds)</h4>

        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-xs">Tier 1 (x1 - x4)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={config.tier1Refill}
            onChange={(e) => handleChange('tier1Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-xs">Tier 2 (x5 - x7)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={config.tier2Refill}
            onChange={(e) => handleChange('tier2Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-xs">Tier 3 (x8+)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={config.tier3Refill}
            onChange={(e) => handleChange('tier3Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full text-xs"
          />
        </div>
      </div>
    </div>
  );
};
