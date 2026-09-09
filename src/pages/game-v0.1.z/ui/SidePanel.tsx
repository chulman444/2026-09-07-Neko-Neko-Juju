import React, { useState } from 'react';
import type { TileCoord } from '@/entities/board';
import { SolverPanelWidget } from '@/widgets/solver-panel';
import type { SolverCombination } from '@/features/look-ahead-solver';
import type { ComboConfig } from '../model/useComboSystem';

export interface SidePanelProps {
  isOpen: boolean;
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
  isOpen,
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

  if (!isOpen) return null;

  const handleComboChange = (key: keyof ComboConfig, value: number) => {
    onComboChange({ ...comboConfig, [key]: value });
  };

  return (
    <aside
      className="fixed top-0 right-0 h-screen w-[380px] md:w-[420px] max-w-[92vw] z-50 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-700/80 shadow-2xl flex flex-col select-none transition-transform duration-300 ease-out"
      aria-label="Development Tools Side Panel"
    >
      {/* Pinned Top Tab Bar Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/80 bg-zinc-950/70 shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-800/80 rounded-xl border border-zinc-700">
          <button
            type="button"
            onClick={() => setActiveTab('tuner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tuner'
                ? 'bg-amber-500 text-white shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⚙️ Dev Tuner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'solver'
                ? 'bg-amber-500 text-white shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🔍 Look-Ahead Solver
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer text-base font-bold leading-none"
          title="Close Side Panel"
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      {/* Independent Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 text-zinc-200">
        {activeTab === 'tuner' ? (
          <div className="flex flex-col gap-4 text-sm">
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
                  onChange={(e) => onBaseSecondsPerTileChange(Math.max(0, parseFloat(e.target.value) || 0))}
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
