import React from 'react';
import { useBoardStore, type CheckerboardMode } from '@/entities/board';

export const CheckerboardSection: React.FC = () => {
  const checkerboardMode = useBoardStore((state) => state.checkerboardMode);
  const setCheckerboardMode = useBoardStore((state) => state.setCheckerboardMode);
  const checkerColors = useBoardStore((state) => state.checkerColors);

  const modes: { id: CheckerboardMode; label: string; desc: string }[] = [
    {
      id: '2-color',
      label: '2-Color',
      desc: 'Invariant along both diagonals: (r + c) % 2. Instantly distinguishes 6Δx × 7Δy non-diagonals from true diagonals.',
    },
    {
      id: '3-color',
      label: '3-Color',
      desc: 'Tri-color diagonal bands: (r + c) % 3. Groups parallel anti-diagonals into 3 distinct color families.',
    },
    {
      id: 'off',
      label: 'Off',
      desc: 'Solid flat background fill without alternating checker squares.',
    },
  ];

  return (
    <div>
      <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider mb-2">
        Grid & Diagonal Checkerboard
      </h4>
      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        {/* Mode Selector Buttons */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/60 rounded-lg border border-zinc-700/50">
          {modes.map((m) => {
            const isActive = checkerboardMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setCheckerboardMode(m.id)}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition cursor-pointer text-center ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Mode Explanation */}
        <p className="text-[11px] text-zinc-400 leading-tight">
          {modes.find((m) => m.id === checkerboardMode)?.desc}
        </p>

        {/* Color Palette Swatches */}
        {checkerboardMode !== 'off' && (
          <div className="flex items-center justify-between pt-1 border-t border-zinc-700/50">
            <span className="text-xs text-zinc-300 font-medium">Palette Swatches</span>
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded border border-zinc-600 shadow-inner flex items-center justify-center text-[9px] font-bold text-zinc-800"
                style={{ backgroundColor: checkerColors[0] }}
                title={`Color 0: ${checkerColors[0]}`}
              >
                0
              </div>
              <div
                className="w-5 h-5 rounded border border-zinc-600 shadow-inner flex items-center justify-center text-[9px] font-bold text-zinc-800"
                style={{ backgroundColor: checkerColors[1] }}
                title={`Color 1: ${checkerColors[1]}`}
              >
                1
              </div>
              {checkerboardMode === '3-color' && (
                <div
                  className="w-5 h-5 rounded border border-zinc-600 shadow-inner flex items-center justify-center text-[9px] font-bold text-zinc-800"
                  style={{ backgroundColor: checkerColors[2] }}
                  title={`Color 2: ${checkerColors[2]}`}
                >
                  2
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
