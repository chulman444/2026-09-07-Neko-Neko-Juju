import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TimerBar } from '@/shared/ui';
import { GameBoardWidget, PannableContainer } from '@/widgets/game-board';
import { useBoardStore, calculateBoardMetrics, type TileCoord } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';
import { DevHotkeys } from '@/features/dev-hotkeys';
import { Link } from '@/shared/lib/router';
import { useGameSessionStore } from '@/entities/game-session';
import { useItemStore } from '@/entities/item';
import { useGameSessionDriver } from '../model/useGameSessionDriver';
import { FooterConsole } from '@/widgets/footer-console';
import { SettingsHeaderButton, PlayerSettingsModal } from '@/widgets/player-settings';
import { ComboBar } from './ComboBar';
import { HintBar } from './HintBar';
import { SidePanel } from './SidePanel';
import { SelectionSumHUD } from './SelectionSumHUD';
import type { SelectionMeta } from '@/widgets/game-board';

export const GamePage: React.FC = () => {
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [showItemArea, setShowItemArea] = useState<boolean>(true);

  // Mount 60fps simulation driver that ticks the store
  useGameSessionDriver();

  // Board Store Selectors & Actions
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const initialMatrix = useBoardStore((state) => state.initialMatrix);
  const generateNewBoard = useBoardStore((state) => state.generateNewBoard);
  const restartCurrentBoard = useBoardStore((state) => state.restartCurrentBoard);

  // Item Store Selectors
  const isToggled = useItemStore((state) => state.isToggled);
  const targetTile = useItemStore((state) => state.targetTile);
  const handleBoardTileClick = useItemStore((state) => state.handleBoardTileClick);

  // Solver Store Selectors
  const combinations = useSolverStore((state) => state.combinations);

  // Initial solver recalculation on mount
  useEffect(() => {
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  }, []);

  // Game Session Selectors (Only what GamePage itself needs)
  const score = useGameSessionStore((state) => state.score);
  const clearedTiles = useGameSessionStore((state) => state.clearedTiles);
  const countdown = useGameSessionStore((state) => state.countdown);
  const maxCountdown = useGameSessionStore((state) => state.maxCountdown);
  const isPaused = useGameSessionStore((state) => state.isPaused);
  const isPhase1Over = useGameSessionStore((state) => state.isPhase1Over);
  const retryAllowed = useGameSessionStore((state) => state.retryAllowed);
  const highlightedTiles = useGameSessionStore((state) => state.highlightedTiles);
  const noHintsAvailableMsg = useGameSessionStore((state) => state.noHintsAvailableMsg);

  // Store Actions
  const registerMatch = useGameSessionStore((state) => state.registerMatch);
  const removeClearedTiles = useGameSessionStore((state) => state.removeClearedTiles);
  const resetSession = useGameSessionStore((state) => state.resetSession);

  const handleTilesCleared = useCallback(
    (tiles: TileCoord[], _sum: number, actualCount?: number) => {
      const matrix = useBoardStore.getState().matrix;
      const calculatedCount = tiles.filter((t) => (matrix[t.row]?.[t.col] ?? 0) > 0).length;
      const nonZeroCount = actualCount ?? (calculatedCount > 0 ? calculatedCount : tiles.length);
      registerMatch(nonZeroCount, tiles.length);
      removeClearedTiles(tiles);
    },
    [registerMatch, removeClearedTiles]
  );

  const handleRetryGame = useCallback(() => {
    restartCurrentBoard();
    resetSession();
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  }, [restartCurrentBoard, resetSession]);

  const handleNewGame = useCallback(() => {
    generateNewBoard();
    resetSession();
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  }, [generateNewBoard, resetSession]);

  const handleTileClick = useCallback(
    (tile: TileCoord): boolean => {
      if (!isToggled) return false;
      const success = handleBoardTileClick(tile, false);
      if (success) {
        useSolverStore
          .getState()
          .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
        return true;
      }
      return false;
    },
    [isToggled, handleBoardTileClick]
  );

  const handleTileMutated = useCallback(() => {
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  }, []);

  const handleSelectionChange = useCallback(
    (tiles: TileCoord[], sum: number, _isValid: boolean, meta?: SelectionMeta) => {
      useGameSessionStore.getState().setSelection({
        selectedTiles: tiles,
        selectedSum: sum,
        diagonalSum: meta?.diagonalSum ?? 0,
        isSquareSelection: meta?.isSquare ?? false,
        activeSelectionType: meta?.selectionType ?? null,
      });
    },
    []
  );

  // Derived Board & Clearable Metrics
  const totalTiles = cols * rows;
  const expectedSum = cols * rows * 5;
  const remainingTiles = Math.max(0, totalTiles - clearedTiles);

  const boardMetrics = useMemo(() => calculateBoardMetrics(initialMatrix), [initialMatrix]);
  const totalSum = boardMetrics.totalSum;
  const averageTile = boardMetrics.averageTile;
  const zScore = boardMetrics.zScore;

  const statDifficulty = useMemo(() => {
    if (zScore <= -0.8) {
      return {
        label: 'Easy',
        color: 'text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500',
      };
    }
    if (zScore >= 0.8) {
      return {
        label: 'Hard',
        color: 'text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-500',
      };
    }
    return {
      label: 'Medium',
      color: 'text-amber-800/90 dark:text-amber-300',
      dot: 'bg-amber-400 dark:bg-amber-500',
    };
  }, [zScore]);

  const { clearableTileCount, clearableCombosCount } = useMemo(() => {
    const activeClearable = combinations.filter((c) => c.isActive && c.blockers.length === 0);
    const uniqueCoords = new Set<string>();
    for (const combo of activeClearable) {
      for (const tile of combo.required) {
        uniqueCoords.add(`${tile.row},${tile.col}`);
      }
    }
    return {
      clearableTileCount: uniqueCoords.size,
      clearableCombosCount: activeClearable.length,
    };
  }, [combinations]);

  return (
    <div className="flex flex-col items-center w-full min-h-screen px-4 py-6 select-none relative">
      <DevHotkeys onTileMutated={handleTileMutated} />
      {/* Game Header Bar */}
      <header className="flex flex-wrap items-start justify-between w-full max-w-[720px] gap-4 mb-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-900/10 dark:border-zinc-700 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-900/15 dark:border-zinc-700 bg-amber-50/50 hover:bg-amber-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-amber-950 dark:text-zinc-200 transition cursor-pointer"
            >
              ← Home
            </Link>
            <span className="text-xl font-black tracking-tight text-neko-primary">
              Neko Neko Juju
            </span>
          </div>
          {/* 3-Part HUD Container */}
          <div className="flex flex-col bg-amber-50/70 dark:bg-zinc-800/70 border border-amber-200/80 dark:border-zinc-700 rounded-xl p-2.5 shadow-xs font-mono text-xs gap-1.5 min-w-[290px]">
            {/* Top Row: Left (Score Cleared & Span Hover) | Right (Clearable Moves & Combos) */}
            <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-amber-900/10 dark:border-zinc-700/80">
              {/* Left: Score / Cleared */}
              <div
                className="flex items-center gap-1.5 cursor-help"
                title={`Span Score: ${score} pts • Cleared: ${clearedTiles} of ${totalTiles} tiles`}
              >
                <span className="text-amber-800/80 dark:text-zinc-400 font-sans font-semibold">
                  Score:
                </span>
                <span className="text-sm font-black text-amber-950 dark:text-amber-200 font-mono">
                  {clearedTiles}
                </span>
                <span className="text-[10px] text-amber-700/70 dark:text-zinc-400 font-sans">
                  cleared
                </span>
              </div>

              {/* Right: How many left (Clearable tiles & combinations) */}
              <div
                className="flex items-center gap-1.5 text-right font-mono cursor-help"
                title={`${remainingTiles} tiles remaining on board • ${clearableTileCount} tiles matchable across ${clearableCombosCount} combinations`}
              >
                <span
                  className={`text-xs font-bold ${clearableTileCount === 0 ? 'text-rose-500 animate-pulse' : 'text-amber-950 dark:text-amber-100'}`}
                >
                  {clearableTileCount}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans">
                  clearable
                </span>
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                  ({clearableCombosCount} {clearableCombosCount === 1 ? 'combo' : 'combos'})
                </span>
              </div>
            </div>

            {/* Bottom Row: Below it is size & total tiles (as big as top row fonts), and difficulty with total & exp sum */}
            <div className="flex items-center justify-between gap-3 pt-0.5 font-mono text-xs">
              {/* Left: Size & Total Tiles */}
              <div
                className="flex items-center gap-1.5 cursor-help"
                title={`Board Size: ${cols} columns × ${rows} rows (${totalTiles} total tiles)`}
              >
                <span className="text-amber-800/80 dark:text-zinc-400 font-sans font-semibold">
                  Size:
                </span>
                <span className="text-sm font-black text-amber-950 dark:text-amber-200 font-mono">
                  {cols}×{rows}
                </span>
                <span className="text-xs font-bold text-amber-900/80 dark:text-zinc-300 font-mono">
                  ({totalTiles} tiles)
                </span>
              </div>

              {/* Right: Difficulty with total sum and exp sum */}
              <div
                className="flex items-center gap-1.5 text-right font-mono cursor-help"
                title={`Statistical Difficulty: ${statDifficulty.label} (Z-Score: ${zScore > 0 ? '+' : ''}${zScore.toFixed(2)}, Avg: ${averageTile.toFixed(2)}) • Generated Board Sum: ${totalSum} • Expected Uniform Sum: ${expectedSum}`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${statDifficulty.dot}`} />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider font-sans ${statDifficulty.color}`}
                >
                  {statDifficulty.label}
                </span>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
                  {totalSum}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                  / exp {expectedSum}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center TimerBar, HintBar & ComboBar */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[200px]">
          <div
            className={`transition-all duration-500 ${isPhase1Over ? 'opacity-50 grayscale' : ''}`}
          >
            <TimerBar countdown={countdown} maxCountdown={maxCountdown} isPaused={isPaused} />
          </div>
          <HintBar />
          <ComboBar />
          <SelectionSumHUD />
          {noHintsAvailableMsg && (
            <div className="text-[10px] font-bold text-zinc-500 bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 animate-in fade-in duration-200">
              {noHintsAvailableMsg}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <SettingsHeaderButton />
          <button
            type="button"
            onClick={() => setShowItemArea((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
              showItemArea
                ? 'bg-amber-200/80 text-amber-950 border-amber-400 dark:bg-zinc-700 dark:text-white dark:border-zinc-500 shadow-sm'
                : 'border-amber-900/20 bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
            }`}
            title={showItemArea ? 'Hide footer console' : 'Show footer console'}
          >
            <span>🎒 Console</span>
            <span className="text-[10px] opacity-75">{showItemArea ? '▲' : '▼'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSidePanel((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
              showSidePanel
                ? 'bg-amber-200/80 text-amber-950 border-amber-400 dark:bg-zinc-700 dark:text-white dark:border-zinc-500'
                : 'border-amber-900/20 bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
            }`}
          >
            🛠️ Dev Tools
          </button>
          {retryAllowed && (
            <button
              type="button"
              onClick={handleRetryGame}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-600/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition cursor-pointer"
              title="Restart current board with the same seed"
            >
              ↺ Retry
            </button>
          )}
          <button
            type="button"
            onClick={handleNewGame}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neko-primary/30 bg-neko-primary/10 hover:bg-neko-primary/20 text-neko-primary transition cursor-pointer"
            title="Start a new game with a fresh seed"
          >
            ✨ New Game
          </button>
        </div>
      </header>

      {/* Main Play Area with Pannable Container */}
      <main className="relative flex items-center justify-center w-full max-w-7xl overflow-hidden pb-40">
        <PannableContainer className="w-full min-h-[500px]">
          <GameBoardWidget
            interactive={!isPaused}
            highlightedTiles={highlightedTiles}
            targetTile={targetTile}
            isItemActive={isToggled}
            onTilesCleared={handleTilesCleared}
            onSelectionChange={handleSelectionChange}
            onTileClick={handleTileClick}
            className={isPaused ? 'opacity-80' : ''}
          />
        </PannableContainer>
      </main>

      {/* Floating Mechanical Footer Console */}
      <FooterConsole
        isCollapsed={!showItemArea}
        onToggleCollapse={() => setShowItemArea((prev) => !prev)}
      />

      {/* Floating Edge Trigger when SidePanel is closed */}
      {!showSidePanel && (
        <button
          type="button"
          onClick={() => setShowSidePanel(true)}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-40 bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 p-2.5 rounded-l-xl border-l border-y border-zinc-700 shadow-xl cursor-pointer transition flex flex-col items-center gap-1 group"
          title="Open Development Tools"
          aria-label="Open Dev Tools Side Panel"
        >
          <span className="text-sm group-hover:scale-110 transition-transform">🛠️</span>
          <span className="text-[10px] font-bold text-zinc-300 [writing-mode:vertical-rl] tracking-wider uppercase">
            Tools
          </span>
        </button>
      )}

      {/* Full-Height Viewport Docked Side Panel */}
      <SidePanel isOpen={showSidePanel} onClose={() => setShowSidePanel(false)} />

      {/* Player Settings Modal */}
      <PlayerSettingsModal onOpenDevTools={() => setShowSidePanel(true)} />
    </div>
  );
};
