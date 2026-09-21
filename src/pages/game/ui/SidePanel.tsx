import React, { useState } from 'react';
import type { TileCoord } from '@/entities/board';
import { BoardGeneratorWidget, useBoardGeneratorActions } from '@/widgets/board-generator';
import { DevTunerWidget } from '@/widgets/dev-tuner';
import { SolverPanelWidget } from '@/widgets/solver-panel';
import { ItemsPanelWidget } from '@/widgets/items-panel';
import { MacroLoopManagerWidget } from '@/widgets/macro-loop-manager';
import type { SolverCombination } from '@/features/look-ahead-solver';
import { useGameSessionStore } from '@/entities/game-session';
import { useComboStore } from '@/features/combo-system';
import { useGameConfigStore } from '@/entities/game-config';
import { Link } from '@/shared/lib/router';

export type SidePanelTab = 'generator' | 'tuner' | 'solver' | 'items' | 'macro-loop';

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SidePanelTab;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, defaultTab = 'tuner' }) => {
  const [activeTab, setActiveTab] = useState<SidePanelTab>(defaultTab);
  const { generateBoard } = useBoardGeneratorActions();
  const enableItems = useGameConfigStore((state) => state.enableItems);
  const setHighlightedTiles = useGameSessionStore((state) => state.setHighlightedTiles);
  const registerMatch = useGameSessionStore((state) => state.registerMatch);
  const removeClearedTiles = useGameSessionStore((state) => state.removeClearedTiles);

  if (!isOpen) return null;

  const currentTab = !enableItems && activeTab === 'items' ? 'tuner' : activeTab;

  const handleClearMatch = (match: SolverCombination) => {
    const coords: TileCoord[] = match.required.map((t) => ({ col: t.col, row: t.row }));
    const { scoreMultiplier, addTime } = useComboStore
      .getState()
      .registerMatch(coords.length, coords.length);
    registerMatch(coords.length, coords.length, scoreMultiplier, addTime);
    removeClearedTiles(coords);
  };

  const handleTabWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <aside
      className="fixed top-0 right-0 h-screen w-[380px] md:w-[420px] max-w-[92vw] z-50 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-700/80 shadow-2xl flex flex-col select-none transition-transform duration-300 ease-out overscroll-contain"
      aria-label="Development Tools Side Panel"
    >
      {/* Pinned Top Tab Bar Header */}
      <header className="flex items-center justify-between px-3 py-3 border-b border-zinc-700/80 bg-zinc-950/70 shrink-0 gap-2">
        <div
          onWheel={handleTabWheel}
          className="flex items-center gap-1.5 p-1 bg-zinc-800/80 rounded-xl border border-zinc-700 overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1 min-w-0"
        >
          <button
            type="button"
            onClick={() => setActiveTab('tuner')}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentTab === 'tuner'
                ? 'bg-amber-500 text-white shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⚙️ Dev Tuner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentTab === 'generator'
                ? 'bg-amber-500 text-white shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🎲 Board Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solver')}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentTab === 'solver'
                ? 'bg-amber-500 text-white shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🔍 Look-Ahead Solver
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('macro-loop')}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentTab === 'macro-loop'
                ? 'bg-amber-500 text-white shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🔄 Macro Loop
          </button>
          {enableItems && (
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentTab === 'items'
                  ? 'bg-amber-500 text-white shadow font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🎒 Items
            </button>
          )}
          <Link
            href="/board-maker"
            className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition cursor-pointer flex items-center gap-1"
            title="Open Board Maker & Layer Editor"
          >
            <span>🛠️</span>
            <span>Board Maker</span>
          </Link>
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
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 text-zinc-200">
        {currentTab === 'generator' ? (
          <BoardGeneratorWidget />
        ) : currentTab === 'tuner' ? (
          <DevTunerWidget />
        ) : currentTab === 'items' ? (
          <ItemsPanelWidget />
        ) : currentTab === 'macro-loop' ? (
          <MacroLoopManagerWidget
            onPlayBoard={() => generateBoard()}
            onLoadIntoGenerator={generateBoard}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
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
