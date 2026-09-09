import React, { useState } from 'react';
import type { TileCoord } from '@/entities/board';
import { SolverPanelWidget } from '@/widgets/solver-panel';
import type { SolverCombination } from '@/features/look-ahead-solver';
import type { ComboConfig } from '../model/useComboSystem';

export interface SidePanelProps {
  onClose: () => void;
  comboConfig: ComboConfig;
  onComboChange: (newConfig: ComboConfig) => void;
  maxCountdown: number;
  onMaxCountdownChange: (max: number) => void;
  baseSecondsPerTile: number;
  onBaseSecondsPerTileChange: (sec: number) => void;
  onHighlightTiles?: (tiles: TileCoord[]) => void;
  onClearMatch?: (match: SolverCombination) => void;
  defaultTab?: 'tuner' | 'solver';
}

export const SidePanel: React.FC<SidePanelProps> = ({
  onClose,
  comboConfig,
  onComboChange,
  maxCountdown,
  onMaxCountdownChange,
  baseSecondsPerTile,
  onBaseSecondsPerTileChange,
  onHighlightTiles,
  onClearMatch,
  defaultTab = 'tuner',
}) => {
  const [activeTab, setActiveTab] = useState<'tuner' | 'solver'>(defaultTab);

  const handleComboChange = (key: keyof ComboConfig, value: number) => {
    onComboChange({ ...comboConfig, [key]: value });
  };

  return (
    <aside className="w-full max-w-md lg:w-96 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-amber-900/15 dark:border-zinc-700 rounded-2xl shadow-xl flex flex-col overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Top Tab Bar Header */}
      <div className="flex items-center justify-between p-3 border-b border-amber-900/10 dark:border-zinc-800 bg-amber-50/50 dark:bg-zinc-900/60">
        <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-zinc-800 rounded-xl border border-amber-900/10 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setActiveTab('tuner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tuner'
                ? 'bg-neko-primary text-white shadow-sm font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            ⚙️ Dev Tuner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'solver'
                ? 'bg-neko-primary text-white shadow-sm font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            🔍 Look-Ahead Solver
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-black/5 dark:hover:bg-zinc-800 transition cursor-pointer text-sm font-bold leading-none"
          title="Close Side Panel"
        >
          ✕
        </button>
      </div>

      {/* Tab Body Content */}
      <div className="p-4 max-h-[75vh] overflow-y-auto">
        {activeTab === 'tuner' ? (
          <div className="flex flex-col gap-4 text-zinc-800 dark:text-zinc-200 text-sm">
            {/* Game Timer Config */}
            <div>
              <h4 className="font-bold text-[11px] text-amber-900/70 dark:text-amber-400/80 uppercase tracking-wider mb-2">
                Game Timer
              </h4>
              <div className="grid grid-cols-2 gap-2 items-center bg-amber-50/50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-amber-900/10 dark:border-zinc-700">
                <span className="text-xs font-medium">Max Timer Cap (s)</span>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={maxCountdown}
                  onChange={(e) => onMaxCountdownChange(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-700 rounded px-2 py-1 text-right text-xs font-mono"
                />
              </div>
            </div>

            {/* Combo System Config */}
            <div>
              <h4 className="font-bold text-[11px] text-amber-900/70 dark:text-amber-400/80 uppercase tracking-wider mb-2">
                Combo Drain Speed
              </h4>
              <div className="flex flex-col gap-3 bg-amber-50/50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-amber-900/10 dark:border-zinc-700">
                <label className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span>Drain Exponent</span>
                    <span className="font-mono font-bold text-neko-primary">{comboConfig.drainExponent.toFixed(2)}</span>
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
                    <span>Drain Multiplier</span>
                    <span className="font-mono font-bold text-neko-primary">{comboConfig.multiplier.toFixed(1)}</span>
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
                    <span>Fixed Min Drain (%/s)</span>
                    <span className="font-mono font-bold text-neko-primary">{comboConfig.fixedMinimalDrain}</span>
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
              <h4 className="font-bold text-[11px] text-amber-900/70 dark:text-amber-400/80 uppercase tracking-wider mb-2">
                Timer Refills (Seconds)
              </h4>
              <div className="grid grid-cols-2 gap-2 bg-amber-50/50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-amber-900/10 dark:border-zinc-700 text-xs">
                <span className="flex items-center">Base Refill / Tile</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={baseSecondsPerTile}
                  onChange={(e) => onBaseSecondsPerTileChange(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-700 rounded px-2 py-1 text-right font-mono"
                />

                <span className="flex items-center">Tier 1 (x1 - x4)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={comboConfig.tier1Refill}
                  onChange={(e) => handleComboChange('tier1Refill', parseFloat(e.target.value))}
                  className="bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-700 rounded px-2 py-1 text-right font-mono"
                />

                <span className="flex items-center">Tier 2 (x5 - x7)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={comboConfig.tier2Refill}
                  onChange={(e) => handleComboChange('tier2Refill', parseFloat(e.target.value))}
                  className="bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-700 rounded px-2 py-1 text-right font-mono"
                />

                <span className="flex items-center">Tier 3 (x8+)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={comboConfig.tier3Refill}
                  onChange={(e) => handleComboChange('tier3Refill', parseFloat(e.target.value))}
                  className="bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-700 rounded px-2 py-1 text-right font-mono"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <SolverPanelWidget
              onHighlightTiles={onHighlightTiles}
              onClearMatch={onClearMatch}
              className="w-full border-0 shadow-none p-0 bg-transparent"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
