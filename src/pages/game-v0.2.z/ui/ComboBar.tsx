import React from 'react';
import { useGameSessionStore } from '@/entities/game-session';

export interface ComboBarProps {
  comboCount?: number;
  comboPct?: number;
}

export const ComboBar: React.FC<ComboBarProps> = (props) => {
  const storeComboCount = useGameSessionStore((state) => state.comboCount);
  const storeComboPct = useGameSessionStore((state) => state.comboPct);

  const comboCount = props.comboCount ?? storeComboCount;
  const comboPct = props.comboPct ?? storeComboPct;

  if (comboCount === 0) {
    return <div className="h-6" aria-hidden="true" />; // Placeholder to prevent layout shift
  }

  // Determine color based on combo tiers
  let activeColor = '#60a5fa'; // Blue for tier 1 (1-4)
  if (comboCount >= 8) {
    activeColor = '#ef4444'; // Red for tier 3 (8+)
  } else if (comboCount >= 5) {
    activeColor = '#f59e0b'; // Amber for tier 2 (5-7)
  }

  return (
    <div className="flex items-center gap-2 h-6 animate-in fade-in zoom-in duration-200">
      <span className="font-black text-[15px] drop-shadow-sm" style={{ color: activeColor }}>
        COMBO x{comboCount}
      </span>
      <div className="relative w-28 h-2.5 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50 shadow-inner">
        <div
          className="absolute top-0 left-0 h-full will-change-[width]"
          style={{
            backgroundColor: activeColor,
            width: `${Math.max(0, Math.min(100, comboPct))}%`,
          }}
        />
      </div>
    </div>
  );
};
