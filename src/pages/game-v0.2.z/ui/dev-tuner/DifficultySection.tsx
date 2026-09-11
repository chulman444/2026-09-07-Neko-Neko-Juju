import React from 'react';
import { useBoardStore } from '@/entities/board';
import { useGameSessionStore, type DifficultyTier } from '../../model/gameSessionStore';
import { useDevTunerActions } from '../../model/useDevTunerActions';
import { BoardMetricsCard } from './BoardMetricsCard';
import { TileDistributionChart } from './TileDistributionChart';

const DIFFICULTY_TIERS: readonly DifficultyTier[] = ['easy', 'medium', 'hard', 'any'] as const;

export const DifficultySection: React.FC = () => {
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const activeTilt = useBoardStore((state) => state.activeTilt);

  const selectedDifficultyTier = useGameSessionStore((state) => state.selectedDifficultyTier);
  const difficultyTiltRanges = useGameSessionStore((state) => state.difficultyTiltRanges);
  const difficultyNoiseSpread = useGameSessionStore((state) => state.difficultyNoiseSpread);

  const setSelectedDifficultyTier = useGameSessionStore((state) => state.setSelectedDifficultyTier);
  const setDifficultyTiltRange = useGameSessionStore((state) => state.setDifficultyTiltRange);
  const setDifficultyNoiseSpread = useGameSessionStore((state) => state.setDifficultyNoiseSpread);

  const { applyDifficultyOnly } = useDevTunerActions();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          Game Difficulty
        </h4>
        <span className="text-[10px] font-mono text-zinc-400">
          Active Tilt:{' '}
          <span className="text-amber-400 font-bold">
            {activeTilt !== undefined
              ? activeTilt > 0
                ? `+${activeTilt}%`
                : `${activeTilt}%`
              : '0% (Flat)'}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        {/* Live Board Metrics Card */}
        <BoardMetricsCard />

        {/* Mini Bar Chart for 1..9 distribution */}
        <TileDistributionChart />

        {/* 4 Difficulty Tiers with Radio Buttons */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Difficulty Tiers (Tilt %)
            </span>
            <span className="text-[10px] text-zinc-400">
              Slope: +% boosts 1-3, -% boosts 7-9
            </span>
          </div>
          {DIFFICULTY_TIERS.map((tier) => {
            const [minTilt, maxTilt] = difficultyTiltRanges[tier];
            const isSelected = selectedDifficultyTier === tier;
            const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

            // Estimated sum for current board dimensions
            const totalTiles = cols * rows;
            const lowTilt = Math.min(minTilt, maxTilt);
            const highTilt = Math.max(minTilt, maxTilt);
            const minAvg = 5.0 - 0.15 * highTilt;
            const maxAvg = 5.0 - 0.15 * lowTilt;
            const minSum = Math.round(totalTiles * minAvg);
            const maxSum = Math.round(totalTiles * maxAvg);

            return (
              <label
                key={tier}
                className={`flex flex-col gap-1 px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-zinc-850/40 border-zinc-750 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="difficultyTier"
                      checked={isSelected}
                      onChange={() => setSelectedDifficultyTier(tier)}
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
                      step="0.5"
                      min="-10"
                      max="10"
                      value={minTilt}
                      onChange={(e) =>
                        setDifficultyTiltRange(tier, 0, parseFloat(e.target.value) || 0)
                      }
                      className="w-14 bg-zinc-850 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                    <span>%</span>
                    <span>Max:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="-10"
                      max="10"
                      value={maxTilt}
                      onChange={(e) =>
                        setDifficultyTiltRange(tier, 1, parseFloat(e.target.value) || 0)
                      }
                      className="w-14 bg-zinc-850 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                    <span>%</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="text-[10px] font-mono text-zinc-400 pl-5">
                    Exp. Sum for {cols}×{rows}: <span className="text-amber-300">~{minSum}–{maxSum}</span> (Avg {minAvg.toFixed(2)}–{maxAvg.toFixed(2)})
                  </div>
                )}
              </label>
            );
          })}
        </div>

        {/* Gaussian Noise Spread Tuning */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Noise Spread (Gaussian σ)
            </span>
            <span className="text-[10px] font-mono text-amber-400/90 font-bold">
              {difficultyNoiseSpread <= 0.005
                ? 'Clean Line'
                : difficultyNoiseSpread <= 0.025
                  ? 'Natural Scatter'
                  : 'Chaotic Wobble'}
            </span>
          </div>

          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">
                Noise Scatter (σ):{' '}
                <span className="text-[10px] text-zinc-400">
                  {difficultyNoiseSpread === 0 ? 'Disabled' : `±${(difficultyNoiseSpread * 100).toFixed(1)}%`}
                </span>
              </span>
              <span className="font-mono font-bold text-amber-400">
                {(difficultyNoiseSpread * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.05"
              step="0.005"
              value={difficultyNoiseSpread}
              onChange={(e) => setDifficultyNoiseSpread(parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Apply Difficulty Action Button */}
        <button
          type="button"
          onClick={applyDifficultyOnly}
          className="w-full py-1.5 text-xs font-bold rounded-lg bg-zinc-750 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-600 transition cursor-pointer flex items-center justify-center gap-1.5"
          title="Roll and apply difficulty tilt & Gaussian noise to current board without resizing"
        >
          <span>🎲</span>
          <span>Apply Difficulty to Current Board</span>
        </button>
      </div>
    </div>
  );
};
