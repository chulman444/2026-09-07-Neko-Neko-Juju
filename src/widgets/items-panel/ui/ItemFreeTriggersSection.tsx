import React from 'react';
import { useItemStore } from '@/entities/item';

export const ItemFreeTriggersSection: React.FC = () => {
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

  const isRandomNumberToggled = isToggled && activeItem === 'randomNumber';
  const isRandomChooseToggled = isToggled && activeItem === 'randomChoose';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          ⚡ Free Item Triggers & Toggle Check
        </h4>
        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60">
          Free Dev Mode (0 cost)
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        {/* Active Mode Status Banner */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/80">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isToggled ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs font-semibold text-zinc-200">
              Current Mode:{' '}
              <strong className={isToggled ? 'text-amber-400' : 'text-emerald-400'}>
                {isToggled ? `Item Placement (${activeItem})` : 'Select Mode (Match 10)'}
              </strong>
            </span>
          </div>
          {isToggled && (
            <button
              type="button"
              onClick={untoggle}
              className="text-[11px] px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold transition cursor-pointer"
            >
              Untoggle (Select Mode)
            </button>
          )}
        </div>

        {/* 1. Free Random Number Item */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRandomNumberToggled}
                onChange={() => toggleItem('randomNumber')}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-zinc-200">
                🎲 Random Number (Toggle Check)
              </span>
            </label>
            {isRandomNumberToggled && (
              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/50">
                ACTIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => rollRandomNumber(true)}
              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition cursor-pointer"
            >
              🎲 Free Roll (No cost)
            </button>
            {currentRolledNumber !== null && (
              <div className="px-3 py-1 bg-amber-500 text-zinc-950 font-mono font-black text-sm rounded-lg shadow">
                {currentRolledNumber}
              </div>
            )}
          </div>
        </div>

        {/* 2. Free Random Choose Item */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRandomChooseToggled}
                onChange={() => toggleItem('randomChoose')}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-zinc-200">
                🎰 Random Choose (Toggle Check)
              </span>
            </label>
            {isRandomChooseToggled && (
              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/50">
                ACTIVE
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => rollRandomChoose(true)}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition cursor-pointer"
          >
            🎰 Free Choose 3 Options (No cost)
          </button>

          {randomChooseOptions && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] text-zinc-400 font-semibold">
                Click an option to select active number:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {randomChooseOptions.map((opt, i) => (
                  <button
                    key={`${i}-${opt}`}
                    type="button"
                    onClick={() => selectChooseNumber(opt)}
                    className={`py-1 text-center font-mono font-bold text-xs rounded-md transition cursor-pointer border ${
                      selectedChooseNumber === opt
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Free Hint Item */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">💡 Hint Item</span>
            <span className="text-[10px] text-zinc-400">Instant trigger</span>
          </div>
          <button
            type="button"
            onClick={() => triggerHintItem(true)}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 transition cursor-pointer"
          >
            💡 Free Trigger Hint (No cost)
          </button>
        </div>
      </div>
    </div>
  );
};
