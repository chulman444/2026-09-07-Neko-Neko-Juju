import React from 'react';
import { useGameConfigStore, type GamePreset, type GameFeatureFlags } from '@/entities/game-config';

interface FlagItem {
  key: keyof GameFeatureFlags;
  isSubItem?: boolean;
  requiresKey?: keyof GameFeatureFlags;
  requiresNote?: string;
  warningBadge?: string;
}

interface FlagCategory {
  name: string;
  items: FlagItem[];
  layout?: 'stack' | 'grid';
}

const CATEGORIES: FlagCategory[] = [
  {
    name: 'Timer & Hints',
    layout: 'stack',
    items: [
      { key: 'enableTimer' },
      {
        key: 'enableFreeTriggeredHint',
        isSubItem: true,
        requiresKey: 'enableTimer',
        requiresNote: 'Requires Timer',
      },
      { key: 'enableCombos' },
    ],
  },
  {
    name: 'Mechanics',
    layout: 'grid',
    items: [{ key: 'enableItems' }, { key: 'enableSolidBlocks' }, { key: 'enableBounties' }],
  },
  {
    name: 'UI & Tools',
    layout: 'grid',
    items: [
      { key: 'enableSelectionHUD' },
      {
        key: 'enableDevTools',
        warningBadge: '⚠️ Hides panel',
      },
    ],
  },
];

export const FeatureFlagsSection: React.FC = () => {
  const store = useGameConfigStore();
  const { preset, setPreset, setFlag } = store;

  // Pluck flags manually or iterate
  const flags: Record<keyof GameFeatureFlags, boolean> = {
    enableItems: store.enableItems,
    enableDevTools: store.enableDevTools,
    enableSolidBlocks: store.enableSolidBlocks,
    enableBounties: store.enableBounties,
    enableCombos: store.enableCombos,
    enableFreeTriggeredHint: store.enableFreeTriggeredHint,
    enableTimer: store.enableTimer,
    enableSelectionHUD: store.enableSelectionHUD,
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreset(e.target.value as GamePreset);
  };

  const toggleFlag = (key: keyof GameFeatureFlags) => {
    setFlag(key, !flags[key]);
  };

  const renderFlagItem = (item: FlagItem) => {
    const isRequirementMissing = item.requiresKey ? !flags[item.requiresKey] : false;

    return (
      <label
        key={item.key}
        className={`flex items-center gap-2 group ${
          item.isSubItem ? 'ml-3 pl-2.5 border-l-2 border-zinc-700/70 py-0.5' : ''
        } ${isRequirementMissing ? 'opacity-40 pointer-events-none cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="checkbox"
          checked={flags[item.key]}
          disabled={isRequirementMissing}
          onChange={() => toggleFlag(item.key)}
          className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0 cursor-pointer"
        />
        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors select-none flex items-center gap-1 flex-wrap">
          {item.key}
          {isRequirementMissing && item.requiresNote && (
            <span className="text-[10px] text-zinc-400 italic">({item.requiresNote})</span>
          )}
          {item.warningBadge && (
            <span
              className="text-[10px] text-amber-400 font-semibold px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 whitespace-nowrap"
              title="Warning: Disabling this will immediately hide this Dev Tools panel!"
            >
              {item.warningBadge}
            </span>
          )}
        </span>
      </label>
    );
  };

  return (
    <div className="bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
      <h3 className="font-bold text-zinc-100 mb-3 flex items-center gap-2">
        <span>⚙️</span> Game Mode & Feature Flags
      </h3>

      <div className="flex flex-col gap-4">
        {/* Preset Selector */}
        <div className="flex items-center justify-between">
          <label htmlFor="preset-select" className="text-zinc-300 font-medium text-xs">
            Active Preset Mode
          </label>
          <select
            id="preset-select"
            value={preset}
            onChange={handlePresetChange}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 outline-none focus:border-amber-500"
          >
            <option value="classic">Classic (v0.1)</option>
            <option value="editor">Editor (v0.2)</option>
            <option value="arcade">Arcade (v0.3)</option>
            <option value="roguelite">Roguelite (v0.4)</option>
          </select>
        </div>

        <hr className="border-zinc-700/50" />

        {/* Categorized Live Toggles */}
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((category) => (
            <div key={category.name} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {category.name}
              </span>
              <div
                className={
                  category.layout === 'grid'
                    ? 'grid grid-cols-2 gap-y-2 gap-x-4'
                    : 'flex flex-col gap-2'
                }
              >
                {category.items.map(renderFlagItem)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
