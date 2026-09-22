import React from 'react';
import { TimerBar } from '@/shared/ui';
import { Link } from '@/shared/lib/router';
import { useBoardStore } from '@/entities/board';
import { useGameSessionStore } from '@/entities/game-session';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useGameConfigStore } from '@/entities/game-config';
import { useBoardHintsStore } from '@/features/board-hints';
import { SettingsHeaderButton } from '@/widgets/player-settings';
import { ComboBar } from './ComboBar';
import { HintBar } from './HintBar';
import { SelectionSumHUD } from './SelectionSumHUD';
import { TitleCheatInput } from './TitleCheatInput';
import { HeaderStatusHUD } from './HeaderStatusHUD';

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
  const enableTimer = useGameConfigStore((state) => state.enableTimer);
  const enableSelectionHUD = useGameConfigStore((state) => state.enableSelectionHUD);

  // Board & Session Selectors
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const clearedTiles = useGameSessionStore((state) => state.clearedTiles);
  const countdown = useSurvivalTimerStore((state) => state.countdown);
  const maxCountdown = useSurvivalTimerStore((state) => state.maxCountdown);
  const isPaused = useGameSessionStore((state) => state.isPaused);
  const retryAllowed = useGameSessionStore((state) => state.retryAllowed);
  const isPhase1Over = usePhaseProgressionStore((state) => state.isPhase1Over);
  const noHintsAvailableMsg = useBoardHintsStore((state) => state.noHintsAvailableMsg);

  // Derived Board Status
  const totalTiles = cols * rows;
  const remainingTiles = Math.max(0, totalTiles - clearedTiles);
  const isBoardCleared = totalTiles > 0 && remainingTiles === 0;

  return (
    <header className="flex flex-wrap items-start justify-between w-full max-w-[720px] gap-4 mb-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-900/10 dark:border-zinc-700 p-4 rounded-2xl shadow-sm">
      {/* Left Column: Home link, Cheat trigger & Status HUD */}
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
        <HeaderStatusHUD />
      </div>

      {/* Center Column: TimerBar, HintBar, ComboBar & SelectionSumHUD */}
      <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[200px]">
        {enableTimer && (
          <div
            className={`transition-all duration-500 ${isPhase1Over ? 'opacity-50 grayscale' : ''}`}
          >
            <TimerBar countdown={countdown} maxCountdown={maxCountdown} isPaused={isPaused} />
          </div>
        )}
        <HintBar />
        {enableCombos && <ComboBar />}
        {enableSelectionHUD && <SelectionSumHUD />}
        {isBoardCleared ? (
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 animate-in fade-in duration-200 shadow-xs">
            🎉 Board Cleared!
          </div>
        ) : (
          noHintsAvailableMsg && (
            <div className="text-[10px] font-bold text-zinc-500 bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 animate-in fade-in duration-200">
              {noHintsAvailableMsg}
            </div>
          )
        )}
      </div>

      {/* Right Column: Game & Dev Controls */}
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
