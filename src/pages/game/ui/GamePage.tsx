import React, { useState, useCallback, useEffect } from 'react';
import { TimerBar } from '@/shared/ui';
import { GameBoardWidget } from '@/widgets/game-board';
import { SolverPanelWidget } from '@/widgets/solver-panel';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useGameTimer } from '../model/useGameTimer';
import { useComboSystem } from '../model/useComboSystem';
import { ComboBar } from './ComboBar';
import { DevTuner } from './DevTuner';

export const GamePage: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [maxCountdown, setMaxCountdown] = useState<number>(60);
  const [baseSecondsPerTile, setBaseSecondsPerTile] = useState<number>(0);
  const [showSolverPanel, setShowSolverPanel] = useState<boolean>(false);
  const [highlightedTiles, setHighlightedTiles] = useState<TileCoord[]>([]);

  const generateNewBoard = useBoardStore((state) => state.generateNewBoard);
  const cascadeSolverTiles = useSolverStore((state) => state.cascadeTiles);

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

  const handleResetGame = useCallback(() => {
    generateNewBoard();
    setScore(0);
    resetTimer(maxCountdown);
    resetCombo();
    setHighlightedTiles([]);
  }, [generateNewBoard, resetTimer, resetCombo, maxCountdown]);

  return (
    <div className="flex flex-col items-center w-full min-h-[calc(100vh-60px)] px-4 py-6 select-none relative">
      {/* Game Header Bar */}
      <header className="flex flex-wrap items-start justify-between w-full max-w-[720px] gap-4 mb-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-900/10 dark:border-zinc-700 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col items-start gap-3">
          <span className="text-xl font-black tracking-tight text-neko-primary">
            Neko Neko Juju
          </span>
          <div className="text-sm font-semibold px-3 py-1 bg-amber-50 dark:bg-zinc-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-zinc-700 rounded-lg">
            Score: <span className="font-bold">{score}</span>
          </div>
        </div>

        {/* Center TimerBar & ComboBar */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[200px]">
          <TimerBar
            countdown={countdown}
            maxCountdown={maxCountdown}
            isPaused={isPaused}
          />
          <ComboBar comboCount={comboCount} comboPct={comboPct} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePause}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-900/20 bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 transition cursor-pointer"
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            type="button"
            onClick={handleResetGame}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neko-primary/30 bg-neko-primary/10 hover:bg-neko-primary/20 text-neko-primary transition cursor-pointer"
          >
            🔄 Restart
          </button>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="relative flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full max-w-7xl">
        <div className="flex flex-col items-center">
          <GameBoardWidget
            interactive={!isPaused}
            highlightedTiles={highlightedTiles}
            onTilesCleared={handleTilesCleared}
            className={isPaused ? 'opacity-80' : ''}
          />
        </div>

        {showSolverPanel && (
          <SolverPanelWidget
            onClose={() => setShowSolverPanel(false)}
            onHighlightTiles={setHighlightedTiles}
            onClearMatch={(match) => {
              const coords: TileCoord[] = match.required.map((t) => ({ col: t.col, row: t.row }));
              handleTilesCleared(coords, 10);
            }}
          />
        )}
      </main>

      {/* Dev Tools Overlay */}
      <DevTuner 
        comboConfig={comboConfig} 
        onComboChange={setComboConfig}
        maxCountdown={maxCountdown}
        onMaxCountdownChange={setMaxCountdown}
        baseSecondsPerTile={baseSecondsPerTile}
        onBaseSecondsPerTileChange={setBaseSecondsPerTile}
        showSolverPanel={showSolverPanel}
        onToggleSolverPanel={setShowSolverPanel}
      />
    </div>
  );
};
