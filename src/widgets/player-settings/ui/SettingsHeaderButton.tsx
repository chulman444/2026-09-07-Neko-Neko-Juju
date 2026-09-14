import React from 'react';
import { usePlayerStore } from '@/entities/player';

export interface SettingsHeaderButtonProps {
  className?: string;
}

export const SettingsHeaderButton: React.FC<SettingsHeaderButtonProps> = ({ className = '' }) => {
  const isSettingsOpen = usePlayerStore((state) => state.isSettingsOpen);
  const toggleSettings = usePlayerStore((state) => state.toggleSettings);

  return (
    <button
      type="button"
      onClick={toggleSettings}
      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1.5 group ${
        isSettingsOpen
          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
          : 'border-amber-900/20 bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
      } ${className}`.trim()}
      title={isSettingsOpen ? 'Close Player Settings' : 'Open Player Settings'}
      aria-label="Settings"
    >
      <span className="inline-block transition-transform duration-200 group-hover:rotate-45">
        ⚙️
      </span>
      <span>Settings</span>
    </button>
  );
};
