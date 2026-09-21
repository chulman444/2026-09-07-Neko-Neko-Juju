import React from 'react';
import { useItemStore } from '@/entities/item';
import { useCoreItemsStore } from '../model/coreItemsStore';

export const RandomNumberOverlay: React.FC = () => {
  const isToggled = useItemStore((state) => state.isToggled);
  const activeItem = useItemStore((state) => state.activeItem);
  const activeItemStage = useItemStore((state) => state.activeItemStage);
  const untoggle = useCoreItemsStore((state) => state.untoggle);

  if (!isToggled || activeItem !== 'randomNumber') return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/50 shadow-md animate-in fade-in duration-150 text-xs text-amber-950 dark:text-amber-200 backdrop-blur-md">
      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
      <span className="font-medium">
        🎲 Click tile to roll (
        {activeItemStage === 2 ? 'Stage 2: Multi-Use' : 'Stage 1: Single Use'})
      </span>
      <button
        type="button"
        onClick={untoggle}
        className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer ml-1"
      >
        ✕ Disarm
      </button>
    </div>
  );
};

export const RandomChooseOverlay: React.FC = () => {
  const isToggled = useItemStore((state) => state.isToggled);
  const activeItem = useItemStore((state) => state.activeItem);
  const activeItemStage = useItemStore((state) => state.activeItemStage);
  const counts = useItemStore((state) => state.counts);
  const targetTile = useCoreItemsStore((state) => state.targetTile);
  const randomChooseOptions = useCoreItemsStore((state) => state.randomChooseOptions);
  const confirmRandomChoose = useCoreItemsStore((state) => state.confirmRandomChoose);
  const cancelTargetTile = useCoreItemsStore((state) => state.cancelTargetTile);
  const untoggle = useCoreItemsStore((state) => state.untoggle);

  if (!isToggled || activeItem !== 'randomChoose') return null;

  if (targetTile && randomChooseOptions) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-zinc-900 border-2 border-purple-500 shadow-xl animate-in fade-in zoom-in-95 duration-150 text-xs text-purple-950 dark:text-purple-100 backdrop-blur-md">
        <span className="font-bold flex items-center gap-1">
          🎯 Col {targetTile.col + 1}, Row {targetTile.row + 1}:
        </span>
        <div className="flex items-center gap-1.5">
          {randomChooseOptions.map((opt, i) => (
            <button
              key={`${i}-${opt}`}
              type="button"
              onClick={() => confirmRandomChoose(opt, false)}
              className="px-2.5 py-1 rounded-lg font-mono text-sm font-black bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border border-purple-400 hover:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950 hover:scale-110 active:scale-95 shadow-sm transition cursor-pointer"
              title={`Replace target tile with ${opt}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={cancelTargetTile}
          disabled={counts.randomChoose <= 0}
          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
            counts.randomChoose <= 0
              ? 'opacity-40 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 cursor-pointer'
          }`}
          title={
            counts.randomChoose <= 0
              ? 'No Random Choose items remaining to reroll'
              : 'Reselect another tile (-1 🎰)'
          }
        >
          Change Tile
        </button>
        <button
          type="button"
          onClick={untoggle}
          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer"
          title="Cancel item use"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/50 shadow-md animate-in fade-in duration-150 text-xs text-purple-950 dark:text-purple-200 backdrop-blur-md">
      <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-ping shrink-0" />
      <span className="font-medium">
        🎰 Click target tile on board (
        {activeItemStage === 2 ? 'Stage 2: Multi-Use' : 'Stage 1: Single Use'})
      </span>
      <button
        type="button"
        onClick={untoggle}
        className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer ml-1"
      >
        ✕ Disarm
      </button>
    </div>
  );
};

export const OmnitileOverlay: React.FC = () => {
  const isToggled = useItemStore((state) => state.isToggled);
  const activeItem = useItemStore((state) => state.activeItem);
  const activeItemStage = useItemStore((state) => state.activeItemStage);
  const untoggle = useCoreItemsStore((state) => state.untoggle);

  if (!isToggled || activeItem !== 'omnitile') return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/50 shadow-md animate-in fade-in duration-150 text-xs text-amber-950 dark:text-amber-200 backdrop-blur-md">
      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
      <span className="font-medium">
        ⭐ Click tile to convert to Omnitile (*) (
        {activeItemStage === 2 ? 'Stage 2: Multi-Use' : 'Stage 1: Single Use'})
      </span>
      <button
        type="button"
        onClick={untoggle}
        className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer ml-1"
      >
        ✕ Disarm
      </button>
    </div>
  );
};
