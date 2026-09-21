import React, { useMemo } from 'react';
import { TimerBar } from '@/shared/ui';
import { Link } from '@/shared/lib/router';
import { useBoardStore, calculateBoardMetrics } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useGameSessionStore } from '@/entities/game-session';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useGameConfigStore } from '@/entities/game-config';
import { useHintStore } from '@/features/free-triggered-hint';
import { SettingsHeaderButton } from '@/widgets/player-settings';
import { ComboBar } from './ComboBar';
import { HintBar } from './HintBar';
import { SelectionSumHUD } from './SelectionSumHUD';
import { TitleCheatInput } from './TitleCheatInput';

export interface GameHeaderBarProps {
  showSidePanel: boolean;
  setShowSidePanel: React.Dispatch<React.SetStateAction<boolean>>;
  showItemArea: boolean;
  setShowItemArea: React.Dispatch<React.SetStateAction<boolean>>;
  onRetryGame: () => void;
  onNewGame: () => void;
  onNextBoard: () => void;
}

export const GameHeaderBar: React.FC<GameHeaderBarProps> = ({
  showSidePanel,
  setShowSidePanel,
  showItemArea,
  setShowItemArea,
  onRetryGame,
  onNewGame,
  onNextBoard,
}) => {
  // Feature Flags from Game Config Store
  const enableItems = useGameConfigStore((state) => state.enableItems);
  const enableDevTools = useGameConfigStore((state) => state.enableDevTools);
  const enableCombos = useGameConfigStore((state) => state.enableCombos);
  const enableHints = useGameConfigStore((state) => state.enableHints);
  const enableTimer = useGameConfigStore((state) => state.enableTimer);
  const enableSelectionHUD = useGameConfigStore((state) => state.enableSelectionHUD);

  // Board Store Selectors
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const initialMatrix = useBoardStore((state) => state.initialMatrix);

  // Solver Store Selectors
  const combinations = useSolverStore((state) => state.combinations);

  // Game Session & Timer Selectors
  const score = useGameSessionStore((state) => state.score);
  const clearedTiles = useGameSessionStore((state) => state.clearedTiles);
  const countdown = useSurvivalTimerStore((state) => state.countdown);
  const maxCountdown = useSurvivalTimerStore((state) => state.maxCountdown);
  const isPaused = useGameSessionStore((state) => state.isPaused);
  const retryAllowed = useGameSessionStore((state) => state.retryAllowed);
  const isPhase1Over = usePhaseProgressionStore((state) => state.isPhase1Over);
  const noHintsAvailableMsg = useHintStore((state) => state.noHintsAvailableMsg);

  // Derived Board & Clearable Metrics
  const totalTiles = cols * rows;
  const expectedSum = cols * rows * 5;
  const remainingTiles = Math.max(0, totalTiles - clearedTiles);
  const isBoardCleared = totalTiles > 0 && remainingTiles === 0;

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
    <header className="flex flex-wrap items-start justify-between w-full max-w-[720px] gap-4 mb-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-900/10 dark:border-zinc-700 p-4 rounded-2xl shadow-sm">
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-900/15 dark:border-zinc-700 bg-amber-50/50 hover:bg-amber-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-amber-950 dark:text-zinc-200 transition cursor-pointer"
          >
            ← Home
          </Link>
          <TitleCheatInput onCheatSuccess={() => setShowSidePanel(true)} />
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

          {/* Bottom Row: Size & Total Tiles, and Difficulty with total & exp sum */}
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

      {/* Center TimerBar, HintBar, ComboBar & SelectionSumHUD */}
      <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[200px]">
        {enableTimer && (
          <div
            className={`transition-all duration-500 ${isPhase1Over ? 'opacity-50 grayscale' : ''}`}
          >
            <TimerBar countdown={countdown} maxCountdown={maxCountdown} isPaused={isPaused} />
          </div>
        )}
        {enableHints && <HintBar />}
        {enableCombos && <ComboBar />}
        {enableSelectionHUD && <SelectionSumHUD />}
        {isBoardCleared ? (
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 animate-in fade-in duration-200 shadow-xs">
            🎉 Board Cleared!
          </div>
        ) : (
          enableHints &&
          noHintsAvailableMsg && (
            <div className="text-[10px] font-bold text-zinc-500 bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 animate-in fade-in duration-200">
              {noHintsAvailableMsg}
            </div>
          )
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <SettingsHeaderButton />
        {enableItems && (
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
        )}
        {enableDevTools && (
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
        )}
        {(isPhase1Over || isBoardCleared) && (
          <button
            type="button"
            onClick={onNextBoard}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 transition cursor-pointer shadow flex items-center gap-1.5 animate-pulse"
            title="Advance to next board in Macro Loop playlist"
          >
            <span>⏭️</span>
            <span>Next Board</span>
          </button>
        )}
        {retryAllowed && (
          <button
            type="button"
            onClick={onRetryGame}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-600/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition cursor-pointer"
            title="Restart current board with the same seed"
          >
            ↺ Retry
          </button>
        )}
        <button
          type="button"
          onClick={onNewGame}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neko-primary/30 bg-neko-primary/10 hover:bg-neko-primary/20 text-neko-primary transition cursor-pointer"
          title="Start a new game with a fresh seed"
        >
          ✨ New Game
        </button>
      </div>
    </header>
  );
};
