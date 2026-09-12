import React from 'react';
import { useBoardStore } from '@/entities/board';

export const PanControlsSection: React.FC = () => {
  const inversePan = useBoardStore((state) => state.inversePan);
  const setInversePan = useBoardStore((state) => state.setInversePan);
  const panSensitivity = useBoardStore((state) => state.panSensitivity);
  const setPanSensitivity = useBoardStore((state) => state.setPanSensitivity);
  const panOffset = useBoardStore((state) => state.panOffset);
  const resetPanOffset = useBoardStore((state) => state.resetPanOffset);
  const isPanMode = useBoardStore((state) => state.isPanMode);
  const togglePanMode = useBoardStore((state) => state.togglePanMode);

  return (
    <div>
      <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
        Trackball & Pan Controls
      </h4>
      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-zinc-300 font-medium">Inverse Pan (Trackball)</span>
          <input
            type="checkbox"
            checked={inversePan}
            onChange={(e) => setInversePan(e.target.checked)}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </label>
        <p className="text-[11px] text-zinc-400 leading-tight">
          {inversePan
            ? 'Reverse direction: dragging right rolls viewport right (standard trackball feel).'
            : 'Direct direction: dragging right moves canvas right.'}
        </p>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-300">Trackball Sensitivity</span>
            <span className="font-mono font-bold text-amber-400">{panSensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
            value={panSensitivity}
            onChange={(e) => setPanSensitivity(parseFloat(e.target.value))}
            className="accent-amber-500 cursor-pointer"
          />
        </label>

        <div className="flex items-center justify-between pt-1 border-t border-zinc-700/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-300 font-medium">Pan Mode Active</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                isPanMode ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700/50 text-zinc-400'
              }`}
            >
              {isPanMode ? 'ON' : 'OFF'}
            </span>
          </div>
          <button
            type="button"
            onClick={togglePanMode}
            className="px-2 py-0.5 text-xs bg-zinc-700/70 hover:bg-zinc-600 text-zinc-200 rounded font-medium transition-colors"
          >
            Toggle
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-zinc-700/50">
          <span className="text-xs font-mono text-zinc-400">
            Offset: ({Math.round(panOffset.x)}, {Math.round(panOffset.y)})
          </span>
          <button
            type="button"
            onClick={resetPanOffset}
            className="px-2 py-0.5 text-xs bg-zinc-700/70 hover:bg-zinc-600 text-zinc-200 rounded font-medium transition-colors"
          >
            Reset Pan
          </button>
        </div>
      </div>
    </div>
  );
};
