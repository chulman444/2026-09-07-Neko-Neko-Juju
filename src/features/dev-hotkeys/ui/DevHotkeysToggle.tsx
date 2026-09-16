import React from 'react';
import { useDevHotkeysStore } from '../model/devHotkeysStore';

export interface DevHotkeysToggleProps {
  className?: string;
}

export const DevHotkeysToggle: React.FC<DevHotkeysToggleProps> = ({ className = '' }) => {
  const isDevHotkeysEnabled = useDevHotkeysStore((state) => state.isDevHotkeysEnabled);
  const setDevHotkeysEnabled = useDevHotkeysStore((state) => state.setDevHotkeysEnabled);

  return (
    <div className={`flex items-center justify-between ${className}`.trim()}>
      <div className="flex flex-col pr-2">
        <span className="text-xs font-semibold text-zinc-200">Enable Dev Hotkeys</span>
        <span className="text-[10px] text-zinc-400">
          Hover over tiles and press 1–9, Backspace (clear), or R (randomize).
        </span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={isDevHotkeysEnabled}
          onChange={(e) => setDevHotkeysEnabled(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
      </label>
    </div>
  );
};
