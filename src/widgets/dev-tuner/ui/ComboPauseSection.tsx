import React from 'react';
import { useGameSessionStore } from '@/entities/game-session';

export const ComboPauseSection: React.FC = () => {
  const comboConfig = useGameSessionStore((state) => state.comboConfig);
  const setComboConfig = useGameSessionStore((state) => state.setComboConfig);

  const handleToggle = () => {
    setComboConfig({
      ...comboConfig,
      pauseTimerOnCombo: !comboConfig.pauseTimerOnCombo,
    });
  };

  return (
    <div>
      <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
        Combo Modifiers
      </h4>
      <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <label className="flex items-center gap-3 text-sm text-zinc-200 cursor-pointer">
          <input
            type="checkbox"
            checked={comboConfig.pauseTimerOnCombo}
            onChange={handleToggle}
            className="accent-amber-500 rounded border-zinc-700 bg-zinc-800 w-4 h-4"
          />
          <span>Pause Timer During Combo</span>
        </label>
      </div>
    </div>
  );
};
