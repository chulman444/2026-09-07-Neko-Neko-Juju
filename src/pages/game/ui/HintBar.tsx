import React from 'react';
import { useGameSessionStore } from '@/entities/game-session';

export interface HintBarProps {
  hintsRemaining?: number;
  hintCountdown?: number;
  hintInterval?: number;
  hasStarted?: boolean;
  isPhase1Over?: boolean;
}

export const HintBar: React.FC<HintBarProps> = (props) => {
  const storeHintsRemaining = useGameSessionStore((state) => state.hintsRemaining);
  const storeHintCountdown = useGameSessionStore((state) => state.hintCountdown);
  const storeHintInterval = useGameSessionStore((state) => state.freeHintInterval);
  const storeHasStarted = useGameSessionStore((state) => state.hintPhaseStarted);
  const storeIsPhase1Over = useGameSessionStore((state) => state.isPhase1Over);

  const hintsRemaining = props.hintsRemaining ?? storeHintsRemaining;
  const hintCountdown = props.hintCountdown ?? storeHintCountdown;
  const hintInterval = props.hintInterval ?? storeHintInterval;
  const hasStarted = props.hasStarted ?? storeHasStarted;
  const isPhase1Over = props.isPhase1Over ?? storeIsPhase1Over;

  // If game is still on initial standby before the first depletion, the bar stays full at 100%.
  // Once started, it displays the active or paused countdown percentage.
  const widthPct =
    !hasStarted && !isPhase1Over
      ? 100
      : hintInterval > 0
        ? Math.max(0, Math.min(100, (hintCountdown / hintInterval) * 100))
        : 0;

  // Badge only renders for x3 and x2 (hintsRemaining > 1).
  // For the final hint (hintsRemaining === 1) or when over, no badge is rendered.
  const showBadge = hintsRemaining > 1;

  return (
    <div
      className={`flex items-center gap-2 bg-white border-[2.5px] border-[#4a3422] rounded-xl px-3 py-1.5 cursor-default select-none shadow-[0_2px_0px_#edd4b2] transition-opacity duration-300 ${
        isPhase1Over ? 'opacity-50 grayscale' : ''
      }`}
      aria-label="Hint Countdown Bar"
    >
      {/* Left Slot: Dedicated fixed-width anchor ensuring the progress bar never shifts or left-aligns */}
      <div className="w-[36px] flex items-center justify-center shrink-0">
        {showBadge ? (
          <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white leading-none shadow-xs">
            x{hintsRemaining}
          </span>
        ) : (
          <span className="w-6 inline-block" />
        )}
      </div>

      {/* Progress Bar Track: Fixed 180px width matching TimerBar */}
      <div className="relative w-[180px] h-4 border-2 border-[#4a3422] rounded-md overflow-hidden bg-zinc-200 shrink-0">
        <div
          className="absolute top-0 left-0 h-full will-change-[width] transition-colors duration-200 bg-amber-400"
          style={{ width: `${widthPct}%` }}
        />
      </div>

      {/* Right Slot: Seconds or Ready text */}
      <span className="font-bold text-[0.85rem] min-w-[36px] text-right text-[#4a3422] shrink-0">
        {isPhase1Over ? '0s' : !hasStarted ? 'Ready' : `${Math.ceil(hintCountdown)}s`}
      </span>
    </div>
  );
};
