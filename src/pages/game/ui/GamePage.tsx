import React, { useState, useCallback, useEffect } from 'react';
import { GameBoardWidget, PannableContainer, useGameOrchestrator } from '@/widgets/game-board';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';
import { DevHotkeys } from '@/features/dev-hotkeys';
import { useSelectionStore } from '@/features/select-tiles';
import { useBoardHintsStore } from '@/features/board-hints';
import { useGameSessionStore } from '@/entities/game-session';
import { useItemStore } from '@/entities/item';
import { useCoreItemsStore } from '@/features/core-items';
import { useGameConfigStore } from '@/entities/game-config';
import { useMacroLoopStore } from '@/entities/macro-loop';
import { useDifficultyStore } from '@/entities/difficulty';
import { useBoardGenConfigStore } from '@/features/board-generator';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useBoardGeneratorActions } from '@/widgets/board-generator';
import { useGameSessionDriver } from '../model/useGameSessionDriver';
import { FooterConsole } from '@/widgets/footer-console';
import { TrackballControl } from '@/features/trackball-pan';
import { PlayerSettingsModal } from '@/widgets/player-settings';
import { GameHeaderBar } from './GameHeaderBar';
import { SidePanel } from './SidePanel';
import type { SelectionMeta } from '@/widgets/game-board';

export const GamePage: React.FC = () => {
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [showItemArea, setShowItemArea] = useState<boolean>(true);

  // Mount 60fps simulation driver that ticks the store
  useGameSessionDriver();

  // Feature Flags from Game Config Store
  const enableItems = useGameConfigStore((state) => state.enableItems);
  const enableDevTools = useGameConfigStore((state) => state.enableDevTools);
  const enableCombos = useGameConfigStore((state) => state.enableCombos);
  const enableFreeTriggeredHint = useGameConfigStore((state) => state.enableFreeTriggeredHint);
  const enableTimer = useGameConfigStore((state) => state.enableTimer);

  // Board Store Actions
  const generateNewBoard = useBoardStore((state) => state.generateNewBoard);
  const restartCurrentBoard = useBoardStore((state) => state.restartCurrentBoard);

  // Item Store Selectors
  const isToggled = useItemStore((state) => state.isToggled);
  const targetTile = useCoreItemsStore((state) => state.targetTile);
  const handleBoardTileClick = useCoreItemsStore((state) => state.handleBoardTileClick);

  // Initial solver recalculation on mount
  useEffect(() => {
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  }, []);

  // Game Session Selectors
  const isPaused = useGameSessionStore((state) => state.isPaused);
  const highlightedTiles = useBoardHintsStore((state) => state.highlightedTiles);

  // Game Orchestration Hook
  const { handleMatch, resetAllSessions } = useGameOrchestrator({
    enableCombos,
    enableTimer,
    enableFreeTriggeredHint: enableTimer && enableFreeTriggeredHint,
  });

  const handleTilesCleared = useCallback(
    (tiles: TileCoord[], _sum: number, actualCount?: number) => {
      handleMatch(tiles, tiles.length, actualCount);
    },
    [handleMatch]
  );

  const handleRetryGame = useCallback(() => {
    restartCurrentBoard();
    resetAllSessions();
  }, [restartCurrentBoard, resetAllSessions]);

  const handleNewGame = useCallback(() => {
    generateNewBoard();
    resetAllSessions();
  }, [generateNewBoard, resetAllSessions]);

  const { generateBoard } = useBoardGeneratorActions();

  const handleNextBoard = useCallback(() => {
    const { phase1Score } = usePhaseProgressionStore.getState();
    const { matrix, cols, rows } = useBoardStore.getState();

    const leftoverTiles: { col: number; row: number; val: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r]?.[c] ?? 0;
        if (val > 0) {
          leftoverTiles.push({ col: c, row: r, val });
        }
      }
    }

    const macroStore = useMacroLoopStore.getState();
    macroStore.advanceToNextBoard(phase1Score, leftoverTiles);

    const nextIndex = useMacroLoopStore.getState().currentPlayIndex;
    const nextConfig = useMacroLoopStore.getState().boards[nextIndex];

    if (nextConfig) {
      useBoardGenConfigStore.getState().setSelectedSizeTier(nextConfig.sizeTier);
      useDifficultyStore.getState().setSelectedDifficultyTier(nextConfig.difficultyTier);
      useBoardStore.getState().setSeed(nextConfig.seed);
      generateBoard();
    }
  }, [generateBoard]);

  const handleTileClick = useCallback(
    (tile: TileCoord): boolean => {
      if (!enableItems || !isToggled) return false;
      const success = handleBoardTileClick(tile, false);
      if (success) {
        useSolverStore
          .getState()
          .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
        return true;
      }
      return false;
    },
    [enableItems, isToggled, handleBoardTileClick]
  );

  const handleTileMutated = useCallback(() => {
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  }, []);

  const handleSelectionChange = useCallback(
    (tiles: TileCoord[], sum: number, _isValid: boolean, meta?: SelectionMeta) => {
      useSelectionStore.getState().setSelection({
        selectedTiles: tiles,
        selectedSum: sum,
        diagonalSum: meta?.diagonalSum ?? 0,
        isSquareSelection: meta?.isSquare ?? false,
        activeSelectionType: meta?.selectionType ?? null,
      });
    },
    []
  );

  return (
    <div className="flex flex-col items-center w-full min-h-screen px-4 py-6 select-none relative">
      {enableDevTools && <DevHotkeys onTileMutated={handleTileMutated} />}

      <GameHeaderBar
        showSidePanel={showSidePanel}
        setShowSidePanel={setShowSidePanel}
        showItemArea={showItemArea}
        setShowItemArea={setShowItemArea}
        onRetryGame={handleRetryGame}
        onNewGame={handleNewGame}
        onNextBoard={handleNextBoard}
      />

      {/* Main Play Area with Pannable Container */}
      <main
        className={`relative flex items-center justify-center w-full max-w-7xl overflow-hidden ${
          enableItems ? 'pb-40' : 'pb-8'
        }`}
      >
        <PannableContainer className="w-full min-h-[500px]">
          <GameBoardWidget
            interactive={!isPaused}
            highlightedTiles={highlightedTiles}
            targetTile={enableItems ? targetTile : null}
            isItemActive={enableItems ? isToggled : false}
            onTilesCleared={handleTilesCleared}
            onSelectionChange={handleSelectionChange}
            onTileClick={handleTileClick}
            className={isPaused ? 'opacity-80' : ''}
          />
        </PannableContainer>
      </main>

      {/* Floating Mechanical Footer Console */}
      {enableItems && (
        <FooterConsole
          isCollapsed={!showItemArea}
          onToggleCollapse={() => setShowItemArea((prev) => !prev)}
        />
      )}

      {/* Standalone Trackball Pan Control when Items / FooterConsole are disabled */}
      {!enableItems && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto p-1 rounded-full bg-white/75 dark:bg-zinc-900/75 backdrop-blur-md shadow-xl border border-amber-900/20 dark:border-zinc-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <TrackballControl />
        </div>
      )}

      {/* Floating Edge Trigger attached to viewport right when closed, or to side panel edge when open */}
      {enableDevTools && (
        <button
          type="button"
          onClick={() => setShowSidePanel((prev) => !prev)}
          className={`fixed top-1/2 -translate-y-1/2 z-50 bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 p-2.5 rounded-l-xl border-l border-y border-zinc-700 shadow-xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-1 group ${
            showSidePanel ? 'right-[380px] md:right-[420px]' : 'right-0'
          }`}
          title={showSidePanel ? 'Close Development Tools' : 'Open Development Tools'}
          aria-label={showSidePanel ? 'Close Dev Tools Side Panel' : 'Open Dev Tools Side Panel'}
        >
          <span className="text-sm group-hover:scale-110 transition-transform">
            {showSidePanel ? '▶' : '🛠️'}
          </span>
          <span className="text-[10px] font-bold text-zinc-300 [writing-mode:vertical-rl] tracking-wider uppercase">
            {showSidePanel ? 'Close' : 'Tools'}
          </span>
        </button>
      )}

      {/* Full-Height Viewport Docked Side Panel */}
      {enableDevTools && (
        <SidePanel isOpen={showSidePanel} onClose={() => setShowSidePanel(false)} />
      )}

      {/* Player Settings Modal */}
      <PlayerSettingsModal
        onOpenDevTools={enableDevTools ? () => setShowSidePanel(true) : undefined}
      />
    </div>
  );
};
