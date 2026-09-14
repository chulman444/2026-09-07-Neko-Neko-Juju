import React, { useState, useCallback, useEffect } from 'react';
import { TimerBar } from '@/shared/ui';
import { GameBoardWidget } from '@/widgets/game-board';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';
import { Link } from '@/shared/lib/router';
import { useGameTimer } from '../model/useGameTimer';
import { useComboSystem } from '../model/useComboSystem';
import { ComboBar } from './ComboBar';
import { SidePanel } from './SidePanel';

export const GamePage: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [maxCountdown, setMaxCountdown] = useState<number>(60);
  const [baseSecondsPerTile, setBaseSecondsPerTile] = useState<number>(0);
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [highlightedTiles, setHighlightedTiles] = useState<TileCoord[]>([]);
  const [retryAllowed, setRetryAllowed] = useState<boolean>(true);

  const generateNewBoard = useBoardStore((state) => state.generateNewBoard);
  const restartCurrentBoard = useBoardStore((state) => state.restartCurrentBoard);
  const setBoardSeed = useBoardStore((state) => state.setSeed);
  const cascadeSolverTiles = useSolverStore((state) => state.cascadeTiles);

  // Initial calculation of solver engine on mount
  useEffect(() => {
    useSolverStore.getState().recalculate(useBoardStore.getState().matrix);
  }, []);

  const {
    countdown,
    isPaused,
    togglePause,
    addTime,
    reset: resetTimer,
  } = useGameTimer({
    initialCountdown: maxCountdown,
    maxCountdown,
    autoStart: true,
  });

  const {
    comboCount,
    comboPct,
    config: comboConfig,
    setConfig: setComboConfig,
    registerMatch,
    resetCombo,
    setPaused: setComboPaused,
  } = useComboSystem();

  // Keep combo system pause state in sync with game timer pause state (continues running even if timer is depleted)
  useEffect(() => {
    setComboPaused(isPaused);
  }, [isPaused, setComboPaused]);

  const handleTilesCleared = useCallback(
    (tiles: TileCoord[], _sum: number) => {
      // Base score
      const points = tiles.length * 10;
      setScore((prev) => prev + points);

      // Update combo system and get the bonus time for the main timer
      const comboBonusTime = registerMatch();

      // Award time: base reward per tile + combo bonus
      addTime(tiles.length * baseSecondsPerTile + comboBonusTime);

      // Cascade in solver store
      cascadeSolverTiles(tiles.map((t) => ({ row: t.row, col: t.col })));
    },
    [addTime, registerMatch, baseSecondsPerTile, cascadeSolverTiles]
  );

  const handleRetryGame = useCallback(() => {
    restartCurrentBoard();
    setScore(0);
    resetTimer(maxCountdown);
    resetCombo();
    setHighlightedTiles([]);
    useSolverStore.getState().recalculate(useBoardStore.getState().matrix);
  }, [restartCurrentBoard, resetTimer, resetCombo, maxCountdown]);

  const handleNewGame = useCallback(() => {
    generateNewBoard();
    setScore(0);
    resetTimer(maxCountdown);
    resetCombo();
    setHighlightedTiles([]);
    useSolverStore.getState().recalculate(useBoardStore.getState().matrix);
  }, [generateNewBoard, resetTimer, resetCombo, maxCountdown]);

  const handleLoadSeed = useCallback(
    (seedToLoad: string) => {
      setBoardSeed(seedToLoad);
      setScore(0);
      resetTimer(maxCountdown);
      resetCombo();
      setHighlightedTiles([]);
      useSolverStore.getState().recalculate(useBoardStore.getState().matrix);
    },
    [setBoardSeed, resetTimer, resetCombo, maxCountdown]
  );

  return (
    <div className="flex flex-col items-center w-full min-h-screen px-4 py-6 select-none relative">
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
          <div className="text-sm font-semibold px-3 py-1 bg-amber-50 dark:bg-zinc-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-zinc-700 rounded-lg">
            Score: <span className="font-bold">{score}</span>
          </div>
        </div>

        {/* Center TimerBar & ComboBar */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[200px]">
          <TimerBar countdown={countdown} maxCountdown={maxCountdown} isPaused={isPaused} />
          <ComboBar comboCount={comboCount} comboPct={comboPct} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            onClick={togglePause}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-900/20 bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 transition cursor-pointer"
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
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

      {/* Main Play Area */}
      <main className="flex items-center justify-center w-full max-w-7xl">
        <GameBoardWidget
          interactive={!isPaused}
          highlightedTiles={highlightedTiles}
          onTilesCleared={handleTilesCleared}
          className={isPaused ? 'opacity-80' : ''}
        />
      </main>

      {/* Floating Edge Trigger when SidePanel is closed */}
      {!showSidePanel && (
        <button
          type="button"
          onClick={() => setShowSidePanel(true)}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-40 bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 p-2.5 rounded-l-xl border-l border-y border-zinc-700 shadow-xl cursor-pointer transition flex flex-col items-center gap-1 group"
          title="Open Development Tools"
          aria-label="Open Dev Tools Side Panel"
        >
          <span className="text-sm group-hover:scale-110 transition-transform">⚙️</span>
          <span className="text-[10px] font-bold text-zinc-300 [writing-mode:vertical-rl] tracking-wider uppercase">
            Tools
          </span>
        </button>
      )}

      {/* Full-Height Viewport Docked Side Panel */}
      <SidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        comboConfig={comboConfig}
        onComboChange={setComboConfig}
        maxCountdown={maxCountdown}
        onMaxCountdownChange={setMaxCountdown}
        baseSecondsPerTile={baseSecondsPerTile}
        onBaseSecondsPerTileChange={setBaseSecondsPerTile}
        retryAllowed={retryAllowed}
        onRetryAllowedChange={setRetryAllowed}
        onLoadSeed={handleLoadSeed}
        onRollNewSeed={handleNewGame}
        onHighlightTiles={setHighlightedTiles}
        onClearMatch={(match) => {
          const coords: TileCoord[] = match.required.map((t) => ({ col: t.col, row: t.row }));
          handleTilesCleared(coords, 10);
        }}
      />
    </div>
  );
};
