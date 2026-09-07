import React, { useState, useCallback } from 'react';
import { TimerBar } from '@/shared/ui';
import { GameBoardWidget } from '@/widgets/game-board';
import { useBoardStore, type TileCoord } from '@/entities/board';
import { useGameTimer } from '../model/useGameTimer';

export const GamePage: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const generateNewBoard = useBoardStore((state) => state.generateNewBoard);

  const {
    countdown,
    initialCountdown,
    defeatThreshold,
    isPaused,
    isDefeated,
    togglePause,
    addTime,
    reset: resetTimer,
  } = useGameTimer({
    initialCountdown: 60,
    defeatThreshold: 15,
    autoStart: true,
  });

  const handleTilesCleared = useCallback(
    (tiles: TileCoord[], _sum: number) => {
      // Award score based on tiles cleared (10 points per tile)
      const points = tiles.length * 10;
      setScore((prev) => prev + points);
      // Small bonus time reward (+1.5 seconds per tile cleared)
      addTime(tiles.length * 1.5);
    },
    [addTime]
  );

  const handleResetGame = useCallback(() => {
    generateNewBoard();
    setScore(0);
    resetTimer();
  }, [generateNewBoard, resetTimer]);

  return (
    <div className="flex flex-col items-center w-full min-h-[calc(100vh-60px)] px-4 py-6 select-none">
      {/* Game Header Bar */}
      <header className="flex flex-wrap items-center justify-between w-full max-w-[720px] gap-4 mb-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-900/10 dark:border-zinc-700 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-neko-primary">
            Neko Neko Juju
          </span>
          <div className="text-sm font-semibold px-3 py-1 bg-amber-50 dark:bg-zinc-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-zinc-700 rounded-lg">
            Score: <span className="font-bold">{score}</span>
          </div>
        </div>

        {/* Center TimerBar */}
        <div className="flex items-center">
          <TimerBar
            countdown={countdown}
            initialCountdown={initialCountdown}
            defeatThreshold={defeatThreshold}
            isPaused={isPaused}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePause}
            disabled={isDefeated}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-900/20 bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
      <main className="relative flex flex-col items-center justify-center">
        {isDefeated && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs rounded-xl text-white">
            <h2 className="text-2xl font-bold mb-2 text-red-400">Time's Up!</h2>
            <p className="text-sm text-zinc-300 mb-4">Final Score: {score}</p>
            <button
              type="button"
              onClick={handleResetGame}
              className="px-5 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl transition cursor-pointer"
            >
              Play Again
            </button>
          </div>
        )}

        <GameBoardWidget
          interactive={!isPaused && !isDefeated}
          onTilesCleared={handleTilesCleared}
          className={isPaused || isDefeated ? 'opacity-80' : ''}
        />
      </main>
    </div>
  );
};
