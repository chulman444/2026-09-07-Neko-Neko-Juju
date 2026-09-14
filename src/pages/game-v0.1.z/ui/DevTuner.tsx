import React, { useState } from 'react';
import { useBoardStore } from '@/entities/board';
import type { ComboConfig } from '../model/useComboSystem';

export interface DevTunerProps {
  comboConfig: ComboConfig;
  onComboChange: (newConfig: ComboConfig) => void;
  maxCountdown: number;
  onMaxCountdownChange: (max: number) => void;
  baseSecondsPerTile: number;
  onBaseSecondsPerTileChange: (sec: number) => void;
  retryAllowed: boolean;
  onRetryAllowedChange: (allowed: boolean) => void;
  onLoadSeed: (seed: string) => void;
  onRollNewSeed: () => void;
}

export const DevTuner: React.FC<DevTunerProps> = ({
  comboConfig,
  onComboChange,
  maxCountdown,
  onMaxCountdownChange,
  baseSecondsPerTile,
  onBaseSecondsPerTileChange,
  retryAllowed,
  onRetryAllowedChange,
  onLoadSeed,
  onRollNewSeed,
}) => {
  const currentSeed = useBoardStore((state) => state.seed);
  const seedHistory = useBoardStore((state) => state.seedHistory);
  const [customSeedInput, setCustomSeedInput] = useState<string>('');

  const handleComboChange = (key: keyof ComboConfig, value: number) => {
    onComboChange({ ...comboConfig, [key]: value });
  };

  const handleLoadCustomSeed = () => {
    const trimmed = customSeedInput.trim();
    if (trimmed) {
      onLoadSeed(trimmed);
      setCustomSeedInput('');
    }
  };

  return (
    <div className="flex flex-col gap-4 text-sm select-none">
      {/* Game Timer Config */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Game Timer
        </h4>
        <div className="grid grid-cols-2 gap-2 items-center bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
          <span className="text-xs font-medium text-zinc-300">Max Timer Cap (s)</span>
          <input
            type="number"
            min="5"
            step="5"
            value={maxCountdown}
            onChange={(e) => onMaxCountdownChange(Math.max(1, parseFloat(e.target.value) || 0))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Combo System Config */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Combo Drain Speed
        </h4>
        <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Drain Exponent</span>
              <span className="font-mono font-bold text-amber-400">
                {comboConfig.drainExponent.toFixed(2)}
              </span>
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
              <span className="font-mono font-bold text-amber-400">
                {comboConfig.multiplier.toFixed(1)}
              </span>
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
              <span className="font-mono font-bold text-amber-400">
                {comboConfig.fixedMinimalDrain}
              </span>
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

      {/* Timer Refills Config */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Timer Refills (Seconds)
        </h4>
        <div className="grid grid-cols-2 gap-2 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70 text-xs">
          <span className="flex items-center text-zinc-300">Base Refill / Tile</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={baseSecondsPerTile}
            onChange={(e) =>
              onBaseSecondsPerTileChange(Math.max(0, parseFloat(e.target.value) || 0))
            }
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none"
          />

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

      {/* Gameplay & Export Options */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Gameplay & Export Options
        </h4>
        <div className="flex items-center justify-between bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
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
              onChange={(e) => onRetryAllowedChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* Seed Management & History */}
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
              placeholder="Custom seed..."
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
              onClick={onRollNewSeed}
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
                      onClick={() => onLoadSeed(s)}
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
    </div>
  );
};
