import React, { useState } from 'react';
import { useBoardStore } from '@/entities/board';
import { useSolverStore, type HintAlgorithmMode } from '@/features/look-ahead-solver';
import { useGameSessionStore, type ComboConfig } from '../model/gameSessionStore';

export const DevTuner: React.FC = () => {
  // Board Store
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const setDimensions = useBoardStore((state) => state.setDimensions);
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

  const handleGenerateBoardSize = (min: number, max: number) => {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    const baseSize = Math.floor(Math.random() * (high - low + 1)) + low;
    // Probabilistic aspect ratio sampled from triangular distribution centered at 1.7 (spanning 1.3 to 2.1)
    const ratioJitter = (Math.random() + Math.random() - 1) * 0.4;
    const sampledRatio = 1.7 + ratioJitter;
    const nextCols = Math.min(20, Math.max(3, Math.round(baseSize * sampledRatio)));
    const nextRows = baseSize;

    handleUpdateDimensions(nextCols, nextRows);
  };

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

          {/* Tiers */}
          <div className="flex flex-col gap-2">
            {(['small', 'medium', 'large'] as const).map((tier) => {
              const [minVal, maxVal] = boardSizeRanges[tier];
              const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
              return (
                <div key={tier} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-300 w-16">{tierLabel}</span>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
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
                  <button
                    type="button"
                    onClick={() => handleGenerateBoardSize(minVal, maxVal)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition cursor-pointer shrink-0"
                    title={`Generate random ${tierLabel} board maintaining seed string`}
                  >
                    🎲 {tierLabel}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Randomize Any Size */}
          <button
            type="button"
            onClick={() => handleGenerateBoardSize(3, 20)}
            className="w-full py-1.5 text-xs font-bold rounded-lg bg-zinc-750 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition cursor-pointer"
            title="Pick random base size from 3 to 20 with ~1.7:1 probabilistic aspect ratio"
          >
            🎲 Randomize Any Size (3-20)
          </button>

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
