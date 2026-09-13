import React from 'react';
import { useItemStore } from '@/entities/item';
import { useBoardStore } from '@/entities/board';
import { useSolverStore } from '@/features/look-ahead-solver';

export interface ItemBarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ItemBar: React.FC<ItemBarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const counts = useItemStore((state) => state.counts);
  const activeItem = useItemStore((state) => state.activeItem);
  const isToggled = useItemStore((state) => state.isToggled);
  const toggleCheck = useItemStore((state) => state.toggleCheck);
  const targetTile = useItemStore((state) => state.targetTile);
  const randomChooseOptions = useItemStore((state) => state.randomChooseOptions);

  const toggleItem = useItemStore((state) => state.toggleItem);
  const untoggle = useItemStore((state) => state.untoggle);
  const setToggleCheck = useItemStore((state) => state.setToggleCheck);
  const confirmRandomChoose = useItemStore((state) => state.confirmRandomChoose);
  const cancelTargetTile = useItemStore((state) => state.cancelTargetTile);
  const triggerHintItem = useItemStore((state) => state.triggerHintItem);

  const isRandomNumberActive = isToggled && activeItem === 'randomNumber';
  const isRandomChooseActive = isToggled && activeItem === 'randomChoose';

  const handleSelectAndConfirm = (val: number) => {
    const success = confirmRandomChoose(val, false);
    if (success) {
      useSolverStore
        .getState()
        .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
    }
  };

  // Collapsed View: compact pill with item count indicators + preserves active banners
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center w-full max-w-[720px] mb-3 gap-2 animate-in fade-in duration-150">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 hover:bg-amber-50 dark:hover:bg-zinc-800 border border-amber-900/15 dark:border-zinc-700 shadow-sm text-xs font-bold text-amber-950 dark:text-zinc-200 transition cursor-pointer hover:border-amber-400 group"
          title="Click to expand item area"
        >
          <span className="text-sm">🎒</span>
          <span>Items Area Hidden</span>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            (🎲 ×{counts.randomNumber} · 🎰 ×{counts.randomChoose} · 💡 ×{counts.hint})
          </span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold group-hover:translate-y-0.5 transition-transform ml-1">
            ▼ Expand
          </span>
        </button>

        {/* Active Banner 1: Random Number Armed */}
        {isRandomNumberActive && (
          <div className="flex flex-wrap items-center justify-between w-full px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs shadow-sm gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span>
                🎲 <strong>Random Number Armed:</strong> Click any tile on the board to roll a new number directly on it.
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px] ml-1.5">
                  ({toggleCheck.randomNumber ? 'Multiple Use: stays armed for repeated rolling' : 'Single Use: auto-untoggles after 1 roll'})
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={untoggle}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shrink-0"
            >
              ✕ Untoggle (Select Mode)
            </button>
          </div>
        )}

        {/* Active Banner 2: Random Choose Armed (Awaiting Tile Tap) */}
        {isRandomChooseActive && !targetTile && (
          <div className="flex flex-wrap items-center justify-between w-full px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-950 dark:text-purple-200 text-xs shadow-sm gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping shrink-0" />
              <span>
                🎰 <strong>Random Choose Armed:</strong> Click any tile on the board to mark it as the target.
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px] ml-1.5">
                  ({toggleCheck.randomChoose ? 'Multiple Use active' : 'Single Use'})
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={untoggle}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer shrink-0"
            >
              ✕ Untoggle (Select Mode)
            </button>
          </div>
        )}

        {/* Active Banner 3: Random Choose Target Selected (Choose 1 of 3) */}
        {isRandomChooseActive && targetTile && randomChooseOptions && (
          <div className="flex flex-col w-full p-3.5 rounded-2xl bg-purple-50 dark:bg-zinc-900/90 border-2 border-purple-500/60 shadow-md gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-xs font-bold text-purple-950 dark:text-purple-100">
                  Target tile at <strong>Col {targetTile.col + 1}, Row {targetTile.row + 1}</strong> will be changed! Pick your number:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelTargetTile}
                  disabled={counts.randomChoose <= 0}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    counts.randomChoose <= 0
                      ? 'opacity-40 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer'
                  }`}
                  title={
                    counts.randomChoose <= 0
                      ? 'No Random Choose items remaining to reroll'
                      : 'Change target tile (-1 🎰)'
                  }
                >
                  Change Target Tile
                </button>
                <button
                  type="button"
                  onClick={untoggle}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer"
                >
                  ✕ Cancel & Untoggle
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 w-full">
              {randomChooseOptions.map((opt, i) => (
                <button
                  key={`${i}-${opt}`}
                  type="button"
                  onClick={() => handleSelectAndConfirm(opt)}
                  className="flex-1 max-w-[130px] py-2 px-3 rounded-xl font-mono text-xl font-black bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border-2 border-purple-400 hover:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950/80 hover:scale-105 active:scale-95 shadow-sm transition transform cursor-pointer flex flex-col items-center gap-0.5"
                  title={`Replace target tile with ${opt}`}
                >
                  <span>{opt}</span>
                  <span className="text-[10px] font-sans font-medium text-zinc-400">Choice {i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[720px] mb-4 gap-2 animate-in fade-in duration-150">
      {/* Header bar with collapse toggle */}
      {onToggleCollapse && (
        <div className="flex items-center justify-between w-full px-2 text-xs">
          <span className="font-bold text-amber-950/80 dark:text-zinc-300 flex items-center gap-1.5">
            <span>🎒</span>
            <span>Items & Power-Ups</span>
          </span>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-[11px] text-zinc-500 hover:text-amber-900 dark:hover:text-zinc-200 font-medium flex items-center gap-1 cursor-pointer transition px-2 py-0.5 rounded hover:bg-amber-100/50 dark:hover:bg-zinc-800"
            title="Collapse item area"
          >
            <span>▲ Hide Item Area</span>
          </button>
        </div>
      )}

      {/* Item Action Bar Cards */}
      <div className="flex flex-wrap items-stretch justify-center w-full gap-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-900/10 dark:border-zinc-700 p-3 rounded-2xl shadow-sm">
        {/* Item 1: Random Number */}
        <div
          className={`flex flex-col justify-between flex-1 min-w-[190px] p-2.5 rounded-xl border transition ${
            isRandomNumberActive
              ? 'bg-amber-100/80 dark:bg-amber-950/50 border-amber-500 shadow-sm ring-2 ring-amber-400/30'
              : 'bg-amber-50/50 dark:bg-zinc-800/60 border-amber-200/60 dark:border-zinc-700 hover:border-amber-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎲</span>
                <span className="text-xs font-bold text-amber-950 dark:text-zinc-100">
                  Random Num
                </span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  counts.randomNumber > 0
                    ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                }`}
                title={`${counts.randomNumber} items remaining`}
              >
                ×{counts.randomNumber}
              </span>
            </div>

            {/* Arm Button */}
            <button
              type="button"
              onClick={() => toggleItem('randomNumber')}
              disabled={counts.randomNumber <= 0}
              className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isRandomNumberActive
                  ? 'bg-amber-500 text-white shadow'
                  : 'bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-600 text-amber-950 dark:text-zinc-200 hover:bg-amber-100/50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span>{isRandomNumberActive ? '✓ Armed (Tap Tile)' : 'Use Random Num'}</span>
            </button>
          </div>

          {/* Toggle Check: Multiple Use Switch */}
          <label className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-amber-200/50 dark:border-zinc-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={toggleCheck.randomNumber}
              onChange={(e) => setToggleCheck('randomNumber', e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
            />
            <span className="text-[11px] font-medium text-amber-900/80 dark:text-zinc-300">
              Multiple Use <span className="text-[10px] text-zinc-400">(Stay Armed)</span>
            </span>
          </label>
        </div>

        {/* Item 2: Random Choose */}
        <div
          className={`flex flex-col justify-between flex-1 min-w-[190px] p-2.5 rounded-xl border transition ${
            isRandomChooseActive
              ? 'bg-purple-100/80 dark:bg-purple-950/50 border-purple-500 shadow-sm ring-2 ring-purple-400/30'
              : 'bg-amber-50/50 dark:bg-zinc-800/60 border-amber-200/60 dark:border-zinc-700 hover:border-amber-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎰</span>
                <span className="text-xs font-bold text-amber-950 dark:text-zinc-100">
                  Random Choose
                </span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  counts.randomChoose > 0
                    ? 'bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                }`}
                title={`${counts.randomChoose} items remaining`}
              >
                ×{counts.randomChoose}
              </span>
            </div>

            {/* Arm Button */}
            <button
              type="button"
              onClick={() => toggleItem('randomChoose')}
              disabled={counts.randomChoose <= 0}
              className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isRandomChooseActive
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-600 text-amber-950 dark:text-zinc-200 hover:bg-amber-100/50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span>{isRandomChooseActive ? '✓ Armed (Tap Tile)' : 'Use Random Choose'}</span>
            </button>
          </div>

          {/* Toggle Check: Multiple Use Switch */}
          <label className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-amber-200/50 dark:border-zinc-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={toggleCheck.randomChoose}
              onChange={(e) => setToggleCheck('randomChoose', e.target.checked)}
              className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
            />
            <span className="text-[11px] font-medium text-amber-900/80 dark:text-zinc-300">
              Multiple Use <span className="text-[10px] text-zinc-400">(Stay Armed)</span>
            </span>
          </label>
        </div>

        {/* Item 3: Hint Item */}
        <div className="flex flex-col justify-between flex-1 min-w-[140px] p-2.5 rounded-xl border border-amber-200/60 dark:border-zinc-700 bg-amber-50/50 dark:bg-zinc-800/60 hover:border-amber-300 transition">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">💡</span>
                <span className="text-xs font-bold text-amber-950 dark:text-zinc-100">Hint Item</span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  counts.hint > 0
                    ? 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                }`}
                title={`${counts.hint} hints remaining`}
              >
                ×{counts.hint}
              </span>
            </div>

            <button
              type="button"
              onClick={() => triggerHintItem(false)}
              disabled={counts.hint <= 0}
              className="w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>💡 Trigger Hint</span>
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-amber-200/50 dark:border-zinc-700 text-[11px] text-zinc-400 text-center">
            Instant Hint Use
          </div>
        </div>
      </div>

      {/* Active Banner 1: Random Number Armed */}
      {isRandomNumberActive && (
        <div className="flex flex-wrap items-center justify-between w-full px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs shadow-sm gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span>
              🎲 <strong>Random Number Armed:</strong> Click any tile on the board to roll a new number directly on it.
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] ml-1.5">
                ({toggleCheck.randomNumber ? 'Multiple Use: stays armed for repeated rolling' : 'Single Use: auto-untoggles after 1 roll'})
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={untoggle}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shrink-0"
          >
            ✕ Untoggle (Select Mode)
          </button>
        </div>
      )}

      {/* Active Banner 2: Random Choose Armed (Awaiting Tile Tap) */}
      {isRandomChooseActive && !targetTile && (
        <div className="flex flex-wrap items-center justify-between w-full px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-950 dark:text-purple-200 text-xs shadow-sm gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping shrink-0" />
            <span>
              🎰 <strong>Random Choose Armed:</strong> Click any tile on the board to mark it as the target.
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] ml-1.5">
                ({toggleCheck.randomChoose ? 'Multiple Use active' : 'Single Use'})
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={untoggle}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer shrink-0"
          >
            ✕ Untoggle (Select Mode)
          </button>
        </div>
      )}

      {/* Active Banner 3: Random Choose Target Selected (Choose 1 of 3) */}
      {isRandomChooseActive && targetTile && randomChooseOptions && (
        <div className="flex flex-col w-full p-3.5 rounded-2xl bg-purple-50 dark:bg-zinc-900/90 border-2 border-purple-500/60 shadow-md gap-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="text-xs font-bold text-purple-950 dark:text-purple-100">
                Target tile at <strong>Col {targetTile.col + 1}, Row {targetTile.row + 1}</strong> will be changed! Pick your number:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelTargetTile}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition cursor-pointer"
              >
                Change Target Tile
              </button>
              <button
                type="button"
                onClick={untoggle}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer"
              >
                ✕ Cancel & Untoggle
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 w-full">
            {randomChooseOptions.map((opt, i) => (
              <button
                key={`${i}-${opt}`}
                type="button"
                onClick={() => handleSelectAndConfirm(opt)}
                className="flex-1 max-w-[130px] py-2 px-3 rounded-xl font-mono text-xl font-black bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border-2 border-purple-400 hover:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950/80 hover:scale-105 active:scale-95 shadow-sm transition transform cursor-pointer flex flex-col items-center gap-0.5"
                title={`Replace target tile with ${opt}`}
              >
                <span>{opt}</span>
                <span className="text-[10px] font-sans font-medium text-zinc-400">Choice {i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

