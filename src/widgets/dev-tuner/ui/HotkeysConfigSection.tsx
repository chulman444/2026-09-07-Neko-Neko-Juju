import React from 'react';
import { DevHotkeysToggle } from '@/features/dev-hotkeys';

export const HotkeysConfigSection: React.FC = () => {
  return (
    <div>
      <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
        Dev Hotkeys
      </h4>
      <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <DevHotkeysToggle />
      </div>
    </div>
  );
};
