import React, { useState } from 'react';
import { useBoardStore, calculateBoardMetrics, generateLinearTileWeights } from '@/entities/board';
import { useSolverStore, type HintAlgorithmMode } from '@/features/look-ahead-solver';
import { useGameSessionStore, type ComboConfig } from '../model/gameSessionStore';

function sampleNormal(mean: number, stdDev: number): number {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

export const DevTuner: React.FC = () => {
  // Board Store
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const matrix = useBoardStore((state) => state.matrix);
  const activeTilt = useBoardStore((state) => state.activeTilt);
  const setDimensions = useBoardStore((state) => state.setDimensions);
  const setTileWeights = useBoardStore((state) => state.setTileWeights);
  const currentSeed = useBoardStore((state) => state.seed);
  const seedHistory = useBoardStore((state) => state.seedHistory);
  const setBoardSeed = useBoardStore((state) => state.setSeed);
  const generateNewBoard = useBoardStore((state) => state.generateNewBoard);

  // Solver Store State & Actions
  const hintMode = useSolverStore((state) => state.hintMode);
  const setHintMode = useSolverStore((state) => state.setHintMode);

  // Game Session Store State
  const maxCountdown = useGameSessionStore((state) => state.maxCountdown);
  const timerMultiplier = useGameSessionStore((state) => state.timerMultiplier);
  const boardSizeRanges = useGameSessionStore((state) => state.boardSizeRanges);
  const selectedSizeTier = useGameSessionStore((state) => state.selectedSizeTier);
  const tierAspectConfigs = useGameSessionStore((state) => state.tierAspectConfigs);
  const rollSeedOnGenerate = useGameSessionStore((state) => state.rollSeedOnGenerate);
  const selectedDifficultyTier = useGameSessionStore((state) => state.selectedDifficultyTier);
  const difficultyTiltRanges = useGameSessionStore((state) => state.difficultyTiltRanges);
  const difficultyNoiseSpread = useGameSessionStore((state) => state.difficultyNoiseSpread);
  const maxFreeHints = useGameSessionStore((state) => state.maxFreeHints);
  const freeHintInterval = useGameSessionStore((state) => state.freeHintInterval);
  const baseSecondsPerTile = useGameSessionStore((state) => state.baseSecondsPerTile);
  const retryAllowed = useGameSessionStore((state) => state.retryAllowed);
  const comboConfig = useGameSessionStore((state) => state.comboConfig);
  const isPaused = useGameSessionStore((state) => state.isPaused);

  // Game Session Store Actions
  const setMaxCountdown = useGameSessionStore((state) => state.setMaxCountdown);
  const setTimerMultiplier = useGameSessionStore((state) => state.setTimerMultiplier);
  const setBoardSizeRange = useGameSessionStore((state) => state.setBoardSizeRange);
  const setSelectedSizeTier = useGameSessionStore((state) => state.setSelectedSizeTier);
  const setTierRatioMean = useGameSessionStore((state) => state.setTierRatioMean);
  const setTierRatioSpread = useGameSessionStore((state) => state.setTierRatioSpread);
  const setRollSeedOnGenerate = useGameSessionStore((state) => state.setRollSeedOnGenerate);
  const setSelectedDifficultyTier = useGameSessionStore((state) => state.setSelectedDifficultyTier);
  const setDifficultyTiltRange = useGameSessionStore((state) => state.setDifficultyTiltRange);
  const setDifficultyNoiseSpread = useGameSessionStore((state) => state.setDifficultyNoiseSpread);
  const setMaxFreeHints = useGameSessionStore((state) => state.setMaxFreeHints);
  const setFreeHintInterval = useGameSessionStore((state) => state.setFreeHintInterval);
  const setBaseSecondsPerTile = useGameSessionStore((state) => state.setBaseSecondsPerTile);
  const setRetryAllowed = useGameSessionStore((state) => state.setRetryAllowed);
  const setComboConfig = useGameSessionStore((state) => state.setComboConfig);
  const resetSession = useGameSessionStore((state) => state.resetSession);
  const togglePause = useGameSessionStore((state) => state.togglePause);

  const [customSeedInput, setCustomSeedInput] = useState<string>('');

  const handleComboChange = (key: keyof ComboConfig, value: number) => {
    setComboConfig({ ...comboConfig, [key]: value });
  };

  const handleUpdateDimensions = (nextCols: number, nextRows: number) => {
    const clampedCols = Math.min(20, Math.max(3, nextCols));
    const clampedRows = Math.min(20, Math.max(3, nextRows));
    setDimensions(clampedCols, clampedRows);

    // Auto-calculate and set initial timer cap for the new board size
    const calculatedTimer = Math.max(1, Math.round(clampedCols * clampedRows * timerMultiplier));
    setMaxCountdown(calculatedTimer);

    resetSession();
    useSolverStore.getState().recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

  const handleGenerateBoardSize = () => {
    const [minVal, maxVal] = boardSizeRanges[selectedSizeTier];
    const low = Math.min(minVal, maxVal);
    const high = Math.max(minVal, maxVal);
    // The tier range bounds the longest side of the board
    const longestSide = Math.floor(Math.random() * (high - low + 1)) + low;

    const { ratioMean, ratioSpread } = tierAspectConfigs[selectedSizeTier];
    // Sample aspect ratio from normal distribution (bell curve)
    const sampledRatio = Math.max(0.3, Math.min(3.0, sampleNormal(ratioMean, ratioSpread)));

    let nextCols: number;
    let nextRows: number;

    if (sampledRatio >= 1.0) {
      // Wide or Square: Cols is the longest side, rows scales down from it
      nextCols = longestSide;
      nextRows = Math.max(3, Math.round(longestSide / sampledRatio));
    } else {
      // Tall: Rows is the longest side, cols scales down from it
      nextRows = longestSide;
      nextCols = Math.max(3, Math.round(longestSide * sampledRatio));
    }

    // Clamp both dimensions to [3, 20]
    nextCols = Math.min(20, Math.max(3, nextCols));
    nextRows = Math.min(20, Math.max(3, nextRows));

    // Roll difficulty tilt within selected difficulty tier range
    const [minTilt, maxTilt] = difficultyTiltRanges[selectedDifficultyTier];
    const lowTilt = Math.min(minTilt, maxTilt);
    const highTilt = Math.max(minTilt, maxTilt);
    const rolledTilt = Math.round((lowTilt + Math.random() * (highTilt - lowTilt)) * 10) / 10;
    const weights = generateLinearTileWeights(rolledTilt, difficultyNoiseSpread);
    setTileWeights(weights, rolledTilt);

    if (rollSeedOnGenerate) {
      generateNewBoard();
    }

    handleUpdateDimensions(nextCols, nextRows);
  };

  const handleApplyDifficultyOnly = () => {
    const [minTilt, maxTilt] = difficultyTiltRanges[selectedDifficultyTier];
    const lowTilt = Math.min(minTilt, maxTilt);
    const highTilt = Math.max(minTilt, maxTilt);
    const rolledTilt = Math.round((lowTilt + Math.random() * (highTilt - lowTilt)) * 10) / 10;
    const weights = generateLinearTileWeights(rolledTilt, difficultyNoiseSpread);
    setTileWeights(weights, rolledTilt);
    resetSession();
    useSolverStore.getState().recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

  const boardMetrics = calculateBoardMetrics(matrix);

  const handleRevertTimerCap = () => {
    const calculated = Math.max(1, Math.round(cols * rows * timerMultiplier));
    setMaxCountdown(calculated);
  };

  const handleLoadSeed = (seedToLoad: string) => {
    setBoardSeed(seedToLoad);
    resetSession();
    useSolverStore.getState().recalculate(useBoardStore.getState().matrix, seedToLoad);
  };

  const handleRollNewSeed = () => {
    generateNewBoard();
    resetSession();
    useSolverStore.getState().recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
  };

  const handleLoadCustomSeed = () => {
    const trimmed = customSeedInput.trim();
    if (trimmed) {
      handleLoadSeed(trimmed);
      setCustomSeedInput('');
    }
  };

  return (
    <div className="flex flex-col gap-4 text-sm select-none">
      {/* Board Size Config */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
            Board Size
          </h4>
          <span className="text-[10px] font-mono text-zinc-400">
            Current: <span className="text-amber-400 font-bold">{cols} × {rows}</span> ({cols * rows} tiles)
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
                  onChange={(e) => handleUpdateDimensions(parseInt(e.target.value, 10) || 3, rows)}
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
                  onChange={(e) => handleUpdateDimensions(cols, parseInt(e.target.value, 10) || 3)}
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
            {(['small', 'medium', 'large', 'any'] as const).map((tier) => {
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
              onClick={handleGenerateBoardSize}
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              title="Generate a board using the selected size tier and aspect ratio bell curve"
            >
              <span>🎲</span>
              <span>Generate Board</span>
            </button>

            <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0" title="Also roll a new random seed when generating">
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
                  Auto: round({cols}×{rows}×{timerMultiplier.toFixed(2)}) = {Math.round(cols * rows * timerMultiplier)}s
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
                  onClick={handleRevertTimerCap}
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

      {/* Game Difficulty & Tile Distribution */}
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
          <div className="grid grid-cols-3 gap-2 bg-zinc-850/80 p-2.5 rounded-lg border border-zinc-750 text-center font-mono">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-sans">Board Sum</span>
              <span className="text-xs font-bold text-amber-300">
                {boardMetrics.totalSum}{' '}
                <span className="text-[9px] text-zinc-500 font-normal">
                  (exp: {cols * rows * 5})
                </span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-sans">Avg Tile (X̄)</span>
              <span className="text-xs font-bold text-zinc-200">
                {boardMetrics.averageTile.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-sans">Z-Score</span>
              <span
                className={`text-xs font-bold ${
                  boardMetrics.zScore <= -1.2
                    ? 'text-emerald-400'
                    : boardMetrics.zScore >= 1.2
                      ? 'text-rose-400'
                      : 'text-amber-400'
                }`}
                title="Negative Z: high clearability (abundant 1-3). Positive Z: hard (choked with 7-9)."
              >
                {boardMetrics.zScore > 0
                  ? `+${boardMetrics.zScore.toFixed(2)}`
                  : boardMetrics.zScore.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Mini Bar Chart for 1..9 distribution */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span>Tile Frequency (1 → 9)</span>
              <span>{boardMetrics.totalTiles} tiles total</span>
            </div>
            <div className="grid grid-cols-9 gap-1 h-14 items-end bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-750/70">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const count = boardMetrics.counts[digit] ?? 0;
                const pct = boardMetrics.totalTiles > 0 ? (count / boardMetrics.totalTiles) * 100 : 0;
                const barHeight = Math.min(100, Math.max(8, Math.round((pct / 25) * 100)));
                return (
                  <div key={digit} className="flex flex-col items-center h-full justify-end group relative">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        digit <= 3
                          ? 'bg-emerald-500/70 group-hover:bg-emerald-400'
                          : digit <= 6
                            ? 'bg-amber-500/70 group-hover:bg-amber-400'
                            : 'bg-rose-500/70 group-hover:bg-rose-400'
                      }`}
                      style={{ height: `${barHeight}%` }}
                      title={`${digit}: ${count} tiles (${pct.toFixed(1)}%)`}
                    />
                    <span className="text-[10px] font-bold font-mono text-zinc-300 mt-1">{digit}</span>
                    <span className="text-[8px] font-mono text-zinc-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

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
            {(['easy', 'medium', 'hard', 'any'] as const).map((tier) => {
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
            onClick={handleApplyDifficultyOnly}
            className="w-full py-1.5 text-xs font-bold rounded-lg bg-zinc-750 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-600 transition cursor-pointer flex items-center justify-center gap-1.5"
            title="Roll and apply difficulty tilt & Gaussian noise to current board without resizing"
          >
            <span>🎲</span>
            <span>Apply Difficulty to Current Board</span>
          </button>
        </div>
      </div>

      {/* Phase 1 Hints Config */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Phase 1 Hints
        </h4>
        <div className="grid grid-cols-2 gap-3 items-center bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
          <span className="text-xs font-medium text-zinc-300">Max Free Hints (N)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={maxFreeHints}
            onChange={(e) => setMaxFreeHints(parseInt(e.target.value, 10) || 0)}
            className="bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
          />

          <span className="text-xs font-medium text-zinc-300">Hint Interval (T, s)</span>
          <input
            type="number"
            min="1"
            step="1"
            value={freeHintInterval}
            onChange={(e) => setFreeHintInterval(parseFloat(e.target.value) || 0)}
            className="bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
          />

          <span className="text-xs font-medium text-zinc-300">Reward Per Tile (s)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={baseSecondsPerTile}
            onChange={(e) => setBaseSecondsPerTile(parseFloat(e.target.value) || 0)}
            className="bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Combo System Config */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Combo Drain Speed
        </h4>
        <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Drain Exponent</span>
              <span className="font-mono font-bold text-amber-400">{comboConfig.drainExponent.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={comboConfig.drainExponent}
              onChange={(e) => handleComboChange('drainExponent', parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Drain Multiplier</span>
              <span className="font-mono font-bold text-amber-400">{comboConfig.multiplier.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={comboConfig.multiplier}
              onChange={(e) => handleComboChange('multiplier', parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Fixed Min Drain (%/s)</span>
              <span className="font-mono font-bold text-amber-400">{comboConfig.fixedMinimalDrain}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={comboConfig.fixedMinimalDrain}
              onChange={(e) => handleComboChange('fixedMinimalDrain', parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Combo Reward Refill Tiers */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Combo Timer Refill (Seconds)
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
          <span className="flex items-center text-zinc-300">Tier 1 (x1 - x4)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={comboConfig.tier1Refill}
            onChange={(e) => handleComboChange('tier1Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none"
          />

          <span className="flex items-center text-zinc-300">Tier 2 (x5 - x7)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={comboConfig.tier2Refill}
            onChange={(e) => handleComboChange('tier2Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none"
          />

          <span className="flex items-center text-zinc-300">Tier 3 (x8+)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={comboConfig.tier3Refill}
            onChange={(e) => handleComboChange('tier3Refill', parseFloat(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-right font-mono text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Gameplay & Simulation Options */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Gameplay & Simulation Options
        </h4>
        <div className="flex flex-col gap-2.5 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-700/60">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-zinc-200">Simulation Pause</span>
              <span className="text-[10px] text-zinc-400">
                Freeze timer countdown and simulation (dev only).
              </span>
            </div>
            <button
              type="button"
              onClick={togglePause}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer shrink-0 ${
                isPaused
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-extrabold shadow-sm'
                  : 'bg-zinc-700 hover:bg-zinc-650 text-zinc-200 border-zinc-600'
              }`}
            >
              {isPaused ? '▶ Resume Simulation' : '⏸ Pause Simulation'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-zinc-200">Allow Retry Button</span>
              <span className="text-[10px] text-zinc-400">
                When disabled, hides the Retry button from the main header.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={retryAllowed}
                onChange={(e) => setRetryAllowed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>
      </div>


      {/* Hint Algorithm Mode */}
      <div>
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
          Hint Algorithm Mode
        </h4>
        <div className="flex flex-col gap-2.5 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">Algorithm</span>
            <select
              value={hintMode}
              onChange={(e) => setHintMode(e.target.value as HintAlgorithmMode)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="default">Default (On-the-fly)</option>
              <option value="all_combinations">All Combinations (Dev)</option>
            </select>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            {hintMode === 'default'
              ? '⚡ Fast on-the-fly solver evaluating only clearable moves without cascade lag.'
              : '🔬 Evaluates all combinations (clearable + blocked) on initial seed and cascades in O(1).'}
          </p>
        </div>
      </div>

      {/* Seed Management & History */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
            Seed Management & History
          </h4>
          <span className="text-[10px] font-mono text-zinc-400">
            Active: <span className="text-amber-400 font-bold">{currentSeed}</span>
          </span>
        </div>

        <div className="flex flex-col gap-2.5 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
          {/* Custom Seed Input & Quick Actions */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Enter seed string..."
              value={customSeedInput}
              onChange={(e) => setCustomSeedInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadCustomSeed()}
              className="flex-1 min-w-0 bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={!customSeedInput.trim()}
              onClick={handleLoadCustomSeed}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
            >
              Load
            </button>
            <button
              type="button"
              onClick={handleRollNewSeed}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-750 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition cursor-pointer shrink-0"
              title="Generate a brand-new random seed"
            >
              🎲 Roll
            </button>
          </div>

          {/* Played Seeds List */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
              <span>Played Seeds ({seedHistory.length})</span>
            </div>
            <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
              {seedHistory.map((s, idx) => {
                const isActive = s === currentSeed;
                return (
                  <div
                    key={`${s}-${idx}`}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                        : 'bg-zinc-850/60 border-zinc-750 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span>{s}</span>
                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 uppercase font-sans">
                          Active
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadSeed(s)}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-zinc-750 hover:bg-amber-500 hover:text-zinc-950 border border-zinc-600 text-zinc-200 transition cursor-pointer"
                      title={`Restart board with seed ${s}`}
                    >
                      ↺ Retry
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
