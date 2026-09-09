import React, { useState } from 'react';
import type { TileCoord } from '@/entities/board';
import { SolverPanelWidget } from '@/widgets/solver-panel';
import type { SolverCombination } from '@/features/look-ahead-solver';
import type { ComboConfig } from '../model/useComboSystem';
import { DevTuner } from './DevTuner';

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
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
  retryAllowed,
  onRetryAllowedChange,
  onLoadSeed,
  onRollNewSeed,
  onHighlightTiles,
  onClearMatch,
  defaultTab = 'tuner',
}) => {
  const [activeTab, setActiveTab] = useState<'tuner' | 'solver'>(defaultTab);

  if (!isOpen) return null;

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

      {/* Orchestrated Tool Content Area */}
      <div className="flex-1 overflow-y-auto p-4 text-zinc-200">
        {activeTab === 'tuner' ? (
          <DevTuner
            comboConfig={comboConfig}
            onComboChange={onComboChange}
            maxCountdown={maxCountdown}
            onMaxCountdownChange={onMaxCountdownChange}
            baseSecondsPerTile={baseSecondsPerTile}
            onBaseSecondsPerTileChange={onBaseSecondsPerTileChange}
            retryAllowed={retryAllowed}
            onRetryAllowedChange={onRetryAllowedChange}
            onLoadSeed={onLoadSeed}
            onRollNewSeed={onRollNewSeed}
          />
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
