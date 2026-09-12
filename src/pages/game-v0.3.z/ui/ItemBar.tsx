import React from 'react';
import { useItemStore } from '@/entities/item';

export const ItemBar: React.FC = () => {
  const counts = useItemStore((state) => state.counts);
  const activeItem = useItemStore((state) => state.activeItem);
  const isToggled = useItemStore((state) => state.isToggled);
  const currentRolledNumber = useItemStore((state) => state.currentRolledNumber);
  const randomChooseOptions = useItemStore((state) => state.randomChooseOptions);
  const selectedChooseNumber = useItemStore((state) => state.selectedChooseNumber);

  const toggleItem = useItemStore((state) => state.toggleItem);
  const untoggle = useItemStore((state) => state.untoggle);
  const rollRandomNumber = useItemStore((state) => state.rollRandomNumber);
  const rollRandomChoose = useItemStore((state) => state.rollRandomChoose);
  const selectChooseNumber = useItemStore((state) => state.selectChooseNumber);
  const triggerHintItem = useItemStore((state) => state.triggerHintItem);

  const isRandomNumberActive = isToggled && activeItem === 'randomNumber';
  const isRandomChooseActive = isToggled && activeItem === 'randomChoose';
  const activeNumber = isRandomNumberActive ? currentRolledNumber : selectedChooseNumber;

  return (
    <div className="flex flex-col items-center w-full max-w-[720px] mb-4 gap-2">
      {/* Item Action Bar Cards */}
      <div className="flex flex-wrap items-stretch justify-center w-full gap-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-900/10 dark:border-zinc-700 p-3 rounded-2xl shadow-sm">
        {/* Item 1: Random Number */}
        <div
          className={`flex flex-col justify-between flex-1 min-w-[170px] p-2.5 rounded-xl border transition ${
            isRandomNumberActive
              ? 'bg-amber-100/70 dark:bg-amber-950/40 border-amber-500 shadow-sm'
              : 'bg-amber-50/50 dark:bg-zinc-800/60 border-amber-200/60 dark:border-zinc-700 hover:border-amber-300'
          }`}
        >
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

          {/* Toggle Check Button */}
          <button
            type="button"
            onClick={() => toggleItem('randomNumber')}
            disabled={counts.randomNumber <= 0 && currentRolledNumber === null}
            className={`w-full py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isRandomNumberActive
                ? 'bg-amber-500 text-white shadow'
                : 'bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-600 text-amber-950 dark:text-zinc-200 hover:bg-amber-100/50'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span>{isRandomNumberActive ? '✓ Toggled' : 'Toggle Check'}</span>
          </button>

          {/* Active Controls if Toggled */}
          {isRandomNumberActive && (
            <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-amber-300/60 dark:border-amber-900/40">
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">
                Rolled: <strong className="text-sm font-mono font-black">{currentRolledNumber}</strong>
              </span>
              <button
                type="button"
                onClick={() => rollRandomNumber(false)}
                disabled={counts.randomNumber <= 0}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer disabled:opacity-40"
                title="Reroll another number (consumes 1 item)"
              >
                Reroll (-1)
              </button>
            </div>
          )}
        </div>

        {/* Item 2: Random Choose */}
        <div
          className={`flex flex-col justify-between flex-1 min-w-[200px] p-2.5 rounded-xl border transition ${
            isRandomChooseActive
              ? 'bg-amber-100/70 dark:bg-amber-950/40 border-amber-500 shadow-sm'
              : 'bg-amber-50/50 dark:bg-zinc-800/60 border-amber-200/60 dark:border-zinc-700 hover:border-amber-300'
          }`}
        >
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
                  ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
              }`}
              title={`${counts.randomChoose} items remaining`}
            >
              ×{counts.randomChoose}
            </span>
          </div>

          {/* Toggle Check Button */}
          <button
            type="button"
            onClick={() => toggleItem('randomChoose')}
            disabled={counts.randomChoose <= 0 && randomChooseOptions === null}
            className={`w-full py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isRandomChooseActive
                ? 'bg-amber-500 text-white shadow'
                : 'bg-white dark:bg-zinc-800 border border-amber-900/20 dark:border-zinc-600 text-amber-950 dark:text-zinc-200 hover:bg-amber-100/50'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span>{isRandomChooseActive ? '✓ Toggled' : 'Toggle Check'}</span>
          </button>

          {/* Active Options if Toggled */}
          {isRandomChooseActive && randomChooseOptions && (
            <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-amber-300/60 dark:border-amber-900/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-900/80 dark:text-amber-300">
                  Pick 1 of 3 numbers:
                </span>
                <button
                  type="button"
                  onClick={() => rollRandomChoose(false)}
                  disabled={counts.randomChoose <= 0}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer disabled:opacity-40"
                  title="Reroll 3 new options (consumes 1 item)"
                >
                  Reroll (-1)
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {randomChooseOptions.map((opt, i) => (
                  <button
                    key={`${i}-${opt}`}
                    type="button"
                    onClick={() => selectChooseNumber(opt)}
                    className={`py-1 text-center font-mono font-bold text-xs rounded transition cursor-pointer border ${
                      selectedChooseNumber === opt
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                        : 'bg-white dark:bg-zinc-800 text-amber-950 dark:text-zinc-200 border-amber-200 dark:border-zinc-700 hover:bg-amber-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Item 3: Hint Item */}
        <div className="flex flex-col justify-between flex-1 min-w-[140px] p-2.5 rounded-xl border border-amber-200/60 dark:border-zinc-700 bg-amber-50/50 dark:bg-zinc-800/60 hover:border-amber-300 transition">
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
            className="w-full py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>💡 Trigger Hint</span>
          </button>
        </div>
      </div>

      {/* Active Item Banner when Toggled */}
      {isToggled && activeNumber !== null && (
        <div className="flex items-center justify-between w-full px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>
              Item Mode Active: Click any tile on the board to change its value to{' '}
              <strong className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                {activeNumber}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={untoggle}
            className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shrink-0 ml-2"
          >
            ✕ Untoggle (Select Mode)
          </button>
        </div>
      )}
    </div>
  );
};
