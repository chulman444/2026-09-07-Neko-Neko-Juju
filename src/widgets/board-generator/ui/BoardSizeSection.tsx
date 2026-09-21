import React from 'react';
import { useBoardStore, type BoardSizeTier } from '@/entities/board';
import { useBoardGenConfigStore } from '@/features/board-generator';
import { useDifficultyStore } from '@/entities/difficulty';
import { useGameSessionStore } from '@/entities/game-session';
import { useBoardGeneratorActions } from '../model/useBoardGeneratorActions';

const SIZE_TIERS: readonly BoardSizeTier[] = ['small', 'medium', 'large', 'any'] as const;

export const BoardSizeSection: React.FC = () => {
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);

  const maxCountdown = useGameSessionStore((state) => state.maxCountdown);
  const timerMultiplier = useDifficultyStore((state) => state.timerMultiplier);
  const boardSizeRanges = useBoardGenConfigStore((state) => state.boardSizeRanges);
  const selectedSizeTier = useBoardGenConfigStore((state) => state.selectedSizeTier);
  const tierAspectConfigs = useBoardGenConfigStore((state) => state.tierAspectConfigs);
  const rollSeedOnGenerate = useBoardGenConfigStore((state) => state.rollSeedOnGenerate);

  const setMaxCountdown = useGameSessionStore((state) => state.setMaxCountdown);
  const setTimerMultiplier = useDifficultyStore((state) => state.setTimerMultiplier);
  const setBoardSizeRange = useBoardGenConfigStore((state) => state.setBoardSizeRange);
  const setSelectedSizeTier = useBoardGenConfigStore((state) => state.setSelectedSizeTier);
  const setTierRatioMean = useBoardGenConfigStore((state) => state.setTierRatioMean);
  const setTierRatioSpread = useBoardGenConfigStore((state) => state.setTierRatioSpread);
  const setRollSeedOnGenerate = useBoardGenConfigStore((state) => state.setRollSeedOnGenerate);

  const { updateDimensions, generateBoard, revertTimerCap } = useBoardGeneratorActions();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          Board Size
        </h4>
        <span className="text-[10px] font-mono text-zinc-400">
          Current:{' '}
          <span className="text-amber-400 font-bold">
            {cols} × {rows}
          </span>{' '}
          ({cols * rows} tiles)
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        {/* Editable Dimensions (N x M) */}
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-700/60">
          <span className="text-xs font-semibold text-zinc-200">Dimensions (N × M)</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-300">
            <label className="flex items-center gap-1">
              <span className="text-zinc-400 text-[11px]">Cols:</span>
              <input
                type="number"
                min="3"
                max="20"
                value={cols}
                onChange={(e) => updateDimensions(parseInt(e.target.value, 10) || 3, rows)}
                className="w-12 bg-zinc-850 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
            <span className="text-zinc-500 font-bold">×</span>
            <label className="flex items-center gap-1">
              <span className="text-zinc-400 text-[11px]">Rows:</span>
              <input
                type="number"
                min="3"
                max="20"
                value={rows}
                onChange={(e) => updateDimensions(cols, parseInt(e.target.value, 10) || 3)}
                className="w-12 bg-zinc-850 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
          </div>
        </div>

        {/* 4 Tiers with Radio Buttons */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Size Tiers
          </span>
          {SIZE_TIERS.map((tier) => {
            const [minVal, maxVal] = boardSizeRanges[tier];
            const isSelected = selectedSizeTier === tier;
            const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
            return (
              <label
                key={tier}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-zinc-850/40 border-zinc-750 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="boardSizeTier"
                    checked={isSelected}
                    onChange={() => setSelectedSizeTier(tier)}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs">{tierLabel}</span>
                </div>

                <div
                  className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 font-normal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Min:</span>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={minVal}
                    onChange={(e) => setBoardSizeRange(tier, 0, parseInt(e.target.value, 10) || 3)}
                    className="w-12 bg-zinc-850 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <span>Max:</span>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={maxVal}
                    onChange={(e) => setBoardSizeRange(tier, 1, parseInt(e.target.value, 10) || 3)}
                    className="w-12 bg-zinc-850 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </label>
            );
          })}
        </div>

        {/* Aspect Ratio Bell Curve Tuning */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Aspect Ratio (Bell Curve)
            </span>
            <span className="text-[10px] font-mono text-amber-400/90 font-bold uppercase">
              {selectedSizeTier} preset
            </span>
          </div>

          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">
                Ratio Mean (μ):{' '}
                <span className="text-[10px] text-zinc-400">
                  {tierAspectConfigs[selectedSizeTier].ratioMean < 0.95
                    ? 'Tall'
                    : tierAspectConfigs[selectedSizeTier].ratioMean > 1.05
                      ? 'Wide'
                      : 'Square'}
                </span>
              </span>
              <span className="font-mono font-bold text-amber-400">
                {tierAspectConfigs[selectedSizeTier].ratioMean.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="2.0"
              step="0.05"
              value={tierAspectConfigs[selectedSizeTier].ratioMean}
              onChange={(e) => setTierRatioMean(selectedSizeTier, parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">
                Ratio Spread (σ):{' '}
                <span className="text-[10px] text-zinc-400">
                  {tierAspectConfigs[selectedSizeTier].ratioSpread <= 0.15
                    ? 'Tight'
                    : tierAspectConfigs[selectedSizeTier].ratioSpread >= 0.4
                      ? 'Diverse'
                      : 'Balanced'}
                </span>
              </span>
              <span className="font-mono font-bold text-amber-400">
                {tierAspectConfigs[selectedSizeTier].ratioSpread.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={tierAspectConfigs[selectedSizeTier].ratioSpread}
              onChange={(e) => setTierRatioSpread(selectedSizeTier, parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Generate Action Bar */}
        <div className="flex items-center gap-3 pt-2 border-t border-zinc-700/60">
          <button
            type="button"
            onClick={generateBoard}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            title="Generate a board using the selected size tier and aspect ratio bell curve"
          >
            <span>🎲</span>
            <span>Generate Board</span>
          </button>

          <label
            className="flex items-center gap-1.5 cursor-pointer select-none shrink-0"
            title="Also roll a new random seed when generating"
          >
            <input
              type="checkbox"
              checked={rollSeedOnGenerate}
              onChange={(e) => setRollSeedOnGenerate(e.target.checked)}
              className="accent-amber-500 cursor-pointer rounded"
            />
            <span className="text-xs font-medium text-zinc-300">Roll seed</span>
          </label>
        </div>

        {/* Timer Multiplier and Cap Calculation */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-700/60">
          <div className="flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-zinc-300 font-medium">Timer Multiplier</span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {timerMultiplier.toFixed(3)}s / tile (default: ~0.118)
              </span>
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={Number(timerMultiplier.toFixed(3))}
              onChange={(e) => setTimerMultiplier(parseFloat(e.target.value) || 0)}
              className="w-20 bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-zinc-300 font-medium">Initial Timer Cap (s)</span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Auto: round({cols}×{rows}×{timerMultiplier.toFixed(2)}) ={' '}
                {Math.round(cols * rows * timerMultiplier)}s
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                step="1"
                value={maxCountdown}
                onChange={(e) => setMaxCountdown(parseFloat(e.target.value) || 1)}
                className="w-16 bg-zinc-850 border border-zinc-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={revertTimerCap}
                className="px-2 py-1 text-xs font-bold rounded-lg bg-zinc-750 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 border border-zinc-600 transition cursor-pointer"
                title="Revert / calculate timer cap based on current dimensions and multiplier"
              >
                ↺ Revert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
