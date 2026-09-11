import React, { useState } from 'react';
import type { TileCoord } from '@/entities/board';
import { BoardGeneratorWidget } from '@/widgets/board-generator';
import { DevTunerWidget } from '@/widgets/dev-tuner';
import { SolverPanelWidget } from '@/widgets/solver-panel';
import type { SolverCombination } from '@/features/look-ahead-solver';
import { useGameSessionStore } from '@/entities/game-session';

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'generator' | 'tuner' | 'solver';
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  defaultTab = 'generator',
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'tuner' | 'solver'>(defaultTab);
  const setHighlightedTiles = useGameSessionStore((state) => state.setHighlightedTiles);
  const registerMatch = useGameSessionStore((state) => state.registerMatch);
  const removeClearedTiles = useGameSessionStore((state) => state.removeClearedTiles);

  if (!isOpen) return null;

  const handleClearMatch = (match: SolverCombination) => {
    const coords: TileCoord[] = match.required.map((t) => ({ col: t.col, row: t.row }));
    registerMatch(coords.length);
    removeClearedTiles(coords);
  };

  const handleTabWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <aside
      className="fixed top-0 right-0 h-screen w-[380px] md:w-[420px] max-w-[92vw] z-50 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-700/80 shadow-2xl flex flex-col select-none transition-transform duration-300 ease-out"
      aria-label="Development Tools Side Panel"
    >
      {/* Pinned Top Tab Bar Header */}
      <header className="flex items-center justify-between px-3 py-3 border-b border-zinc-700/80 bg-zinc-950/70 shrink-0 gap-2">
        <div
          onWheel={handleTabWheel}
          className="flex items-center gap-1.5 p-1 bg-zinc-800/80 rounded-xl border border-zinc-700 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1 min-w-0"
        >
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-amber-500 text-white shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🎲 Board Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tuner')}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer text-base font-bold leading-none shrink-0"
          title="Close Side Panel"
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      {/* Orchestrated Tool Content Area */}
      <div className="flex-1 overflow-y-auto p-4 text-zinc-200">
        {activeTab === 'generator' ? (
          <BoardGeneratorWidget />
        ) : activeTab === 'tuner' ? (
          <DevTunerWidget />
        ) : (
          <div className="w-full">
            <SolverPanelWidget
              onHighlightTiles={setHighlightedTiles}
              onClearMatch={handleClearMatch}
              className="w-full border-0 shadow-none p-0 bg-transparent"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
