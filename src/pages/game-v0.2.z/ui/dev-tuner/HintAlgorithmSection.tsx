import React from 'react';
import { useSolverStore, type HintAlgorithmMode } from '@/features/look-ahead-solver';

export const HintAlgorithmSection: React.FC = () => {
  const hintMode = useSolverStore((state) => state.hintMode);
  const setHintMode = useSolverStore((state) => state.setHintMode);

  return (
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
  );
};
