import React, { useState } from 'react';
import type { ComboConfig } from '../model/useComboSystem';

interface DevTunerProps {
  comboConfig: ComboConfig;
  onComboChange: (newConfig: ComboConfig) => void;
  maxCountdown: number;
  onMaxCountdownChange: (max: number) => void;
  baseSecondsPerTile: number;
  onBaseSecondsPerTileChange: (sec: number) => void;
  showSolverPanel?: boolean;
  onToggleSolverPanel?: (show: boolean) => void;
}

export const DevTuner: React.FC<DevTunerProps> = ({ 
  comboConfig, 
  onComboChange, 
  maxCountdown, 
  onMaxCountdownChange,
  baseSecondsPerTile,
  onBaseSecondsPerTileChange,
  showSolverPanel = false,
  onToggleSolverPanel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleComboChange = (key: keyof ComboConfig, value: number) => {
    onComboChange({ ...comboConfig, [key]: value });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-zinc-800 text-zinc-200 p-2.5 rounded-lg text-xs font-bold border border-zinc-700 shadow-xl cursor-pointer hover:bg-zinc-700 transition z-50"
      >
        ⚙️ Dev Tuner
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 bg-zinc-900/95 backdrop-blur-md text-zinc-200 p-4 rounded-xl text-sm border border-zinc-700 shadow-2xl z-50 select-none max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-amber-400">Dev Tuning</h3>
        <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer text-lg leading-none">
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Game Timer Config */}
        <h4 className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">Game Timer</h4>
        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-xs">Max Timer Cap (s)</span>
          <input
            type="number"
            min="5"
            step="5"
            value={maxCountdown}
            onChange={(e) => onMaxCountdownChange(Math.max(1, parseFloat(e.target.value) || 0))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full text-xs font-mono"
          />
        </div>

        <hr className="border-zinc-700 my-1" />

        {/* Combo System Config */}
        <h4 className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">Combo Drain Speed</h4>
        <label className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>Drain Exponent</span>
            <span className="font-mono text-xs">{comboConfig.drainExponent.toFixed(2)}</span>
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
          <div className="flex justify-between">
            <span>Drain Multiplier</span>
            <span className="font-mono text-xs">{comboConfig.multiplier.toFixed(1)}</span>
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
          <div className="flex justify-between">
            <span>Fixed Min Drain (%/s)</span>
            <span className="font-mono text-xs">{comboConfig.fixedMinimalDrain}</span>
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

        <hr className="border-zinc-700 my-1" />
        <h4 className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">Timer Refills (Seconds)</h4>

        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-xs">Base Refill / Tile</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={baseSecondsPerTile}
            onChange={(e) => onBaseSecondsPerTileChange(Math.max(0, parseFloat(e.target.value) || 0))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-xs">Tier 1 (x1 - x4)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={comboConfig.tier1Refill}
            onChange={(e) => handleComboChange('tier1Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full text-xs font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-xs">Tier 2 (x5 - x7)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={comboConfig.tier2Refill}
            onChange={(e) => handleComboChange('tier2Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full text-xs font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-xs">Tier 3 (x8+)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={comboConfig.tier3Refill}
            onChange={(e) => handleComboChange('tier3Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full text-xs font-mono"
          />
        </div>

        <hr className="border-zinc-700 my-1" />
        <h4 className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">Dev Panels</h4>

        <label className="flex items-center justify-between cursor-pointer py-1">
          <span className="text-xs text-amber-300 font-semibold">🔍 Look-Ahead Solver</span>
          <input
            type="checkbox"
            checked={showSolverPanel}
            onChange={(e) => onToggleSolverPanel?.(e.target.checked)}
            className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
