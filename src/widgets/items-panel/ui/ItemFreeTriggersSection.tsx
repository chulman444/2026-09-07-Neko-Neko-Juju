import React from 'react';
import { useItemStore } from '@/entities/item';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useBoardStore } from '@/entities/board';

export const ItemFreeTriggersSection: React.FC = () => {
  const activeItem = useItemStore((state) => state.activeItem);
  const isToggled = useItemStore((state) => state.isToggled);
  const toggleCheck = useItemStore((state) => state.toggleCheck);
  const targetTile = useItemStore((state) => state.targetTile);
  const currentRolledNumber = useItemStore((state) => state.currentRolledNumber);
  const randomChooseOptions = useItemStore((state) => state.randomChooseOptions);
  const selectedChooseNumber = useItemStore((state) => state.selectedChooseNumber);

  const toggleItem = useItemStore((state) => state.toggleItem);
  const untoggle = useItemStore((state) => state.untoggle);
  const setToggleCheck = useItemStore((state) => state.setToggleCheck);
  const rollRandomNumber = useItemStore((state) => state.rollRandomNumber);
  const rollRandomChoose = useItemStore((state) => state.rollRandomChoose);
  const selectChooseNumber = useItemStore((state) => state.selectChooseNumber);
  const triggerHintItem = useItemStore((state) => state.triggerHintItem);
  const triggerShakeItem = useItemStore((state) => state.triggerShakeItem);

  const combinations = useSolverStore((state) => state.combinations);
  const isCalculated = useSolverStore((state) => state.isCalculated);
  const clearableCount = combinations.filter(
    (c) => c.isActive && c.blockers.length === 0
  ).length;
  const isUnsolvable = isCalculated && clearableCount === 0;

  const isRandomNumberToggled = isToggled && activeItem === 'randomNumber';
  const isRandomChooseToggled = isToggled && activeItem === 'randomChoose';
  const isOmnitileToggled = isToggled && activeItem === 'omnitile';

  const handleFreeShake = () => {
    triggerShakeItem(true);
    useSolverStore
      .getState()
      .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

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
              Mode:{' '}
              <strong className={isToggled ? 'text-amber-400' : 'text-emerald-400'}>
                {isToggled ? `Armed (${activeItem})` : 'Select Mode (Match 10)'}
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
            <span className="text-xs font-bold text-zinc-200">
              🎲 Random Number
            </span>
            {isRandomNumberToggled && (
              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/50">
                ARMED (TAP BOARD TILE)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleItem('randomNumber')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                isRandomNumberToggled
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              {isRandomNumberToggled ? '✓ Disarm Random Number' : 'Arm Random Number'}
            </button>
            <button
              type="button"
              onClick={() => rollRandomNumber(true)}
              className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition cursor-pointer"
              title="Test direct PRNG draw"
            >
              Test PRNG Roll
            </button>
            {currentRolledNumber !== null && (
              <div className="px-2.5 py-1 bg-amber-500 text-zinc-950 font-mono font-black text-xs rounded-lg shadow">
                {currentRolledNumber}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-zinc-300 mt-0.5">
            <input
              type="checkbox"
              checked={toggleCheck.randomNumber}
              onChange={(e) => setToggleCheck('randomNumber', e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
            />
            <span>Multiple Use (Stay armed for repeated tile clicking)</span>
          </label>
        </div>

        {/* 2. Free Random Choose Item */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              🎰 Random Choose
            </span>
            {isRandomChooseToggled && (
              <span className="text-[10px] text-purple-400 font-mono font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-600/50">
                {targetTile ? `TARGETED (${targetTile.col + 1}, ${targetTile.row + 1})` : 'ARMED (TAP TILE)'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleItem('randomChoose')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                isRandomChooseToggled
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              {isRandomChooseToggled ? '✓ Disarm Random Choose' : 'Arm Random Choose'}
            </button>
            <button
              type="button"
              onClick={() => rollRandomChoose(true)}
              className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 transition cursor-pointer"
              title="Test direct PRNG draw of 3 options"
            >
              Test PRNG 3
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-zinc-300 mt-0.5">
            <input
              type="checkbox"
              checked={toggleCheck.randomChoose}
              onChange={(e) => setToggleCheck('randomChoose', e.target.checked)}
              className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
            />
            <span>Multiple Use (Stay armed for choosing other tiles)</span>
          </label>

          {randomChooseOptions && (
            <div className="flex flex-col gap-1 mt-1 pt-1.5 border-t border-zinc-700/60">
              <span className="text-[10px] text-zinc-400 font-semibold">
                Available choices:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {randomChooseOptions.map((opt, i) => (
                  <button
                    key={`${i}-${opt}`}
                    type="button"
                    onClick={() => selectChooseNumber(opt)}
                    className={`py-1 text-center font-mono font-bold text-xs rounded-md transition cursor-pointer border ${
                      selectedChooseNumber === opt
                        ? 'bg-purple-600 text-white border-purple-500 shadow'
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

        {/* 3. Free Omnitile Item */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              ⭐ Omnitile (*)
            </span>
            {isOmnitileToggled && (
              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/50">
                ARMED (TAP BOARD TILE)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleItem('omnitile')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                isOmnitileToggled
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              {isOmnitileToggled ? '✓ Disarm Omnitile' : 'Arm Omnitile'}
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-zinc-300 mt-0.5">
            <input
              type="checkbox"
              checked={toggleCheck.omnitile}
              onChange={(e) => setToggleCheck('omnitile', e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
            />
            <span>Multiple Use (Stay armed for placing multiple Omnitiles)</span>
          </label>
        </div>

        {/* 4. Free Shake Item */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">🔀 Shake Board</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isUnsolvable
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-600/60 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {isUnsolvable ? 'DEADLOCK: FREE (0 MOVES)' : `Moves: ${clearableCount}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleFreeShake}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition cursor-pointer"
          >
            🔀 Free Shake Board (Shuffle Live Tiles)
          </button>
        </div>

        {/* 5. Free Hint Item */}
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
