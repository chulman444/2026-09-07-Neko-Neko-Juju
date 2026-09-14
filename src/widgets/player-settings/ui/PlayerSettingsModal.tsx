import React, { useEffect, useCallback } from 'react';
import { usePlayerStore, type CheckerboardMode } from '@/entities/player';
import { useBoardStore } from '@/entities/board';

export interface PlayerSettingsModalProps {
  onOpenDevTools?: () => void;
  className?: string;
}

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
  onOpenDevTools,
  className = '',
}) => {
  const isSettingsOpen = usePlayerStore((state) => state.isSettingsOpen);
  const setIsSettingsOpen = usePlayerStore((state) => state.setIsSettingsOpen);

  // Player Store Preferences
  const checkerboardMode = usePlayerStore((state) => state.checkerboardMode);
  const setCheckerboardMode = usePlayerStore((state) => state.setCheckerboardMode);
  const checkerColors = usePlayerStore((state) => state.checkerColors);
  const inversePan = usePlayerStore((state) => state.inversePan);
  const setInversePan = usePlayerStore((state) => state.setInversePan);
  const panSensitivity = usePlayerStore((state) => state.panSensitivity);
  const setPanSensitivity = usePlayerStore((state) => state.setPanSensitivity);

  // Board Store Matrix Rotation
  const cols = useBoardStore((state) => state.cols);
  const rows = useBoardStore((state) => state.rows);
  const isBoardRotated = useBoardStore((state) => state.isBoardRotated);
  const rotateBoardMatrix = useBoardStore((state) => state.rotateBoardMatrix);

  const handleClose = useCallback(() => {
    setIsSettingsOpen(false);
  }, [setIsSettingsOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, handleClose]);

  if (!isSettingsOpen) return null;

  const handleDevOptionsClick = () => {
    handleClose();
    onOpenDevTools?.();
  };

  const checkerModes: { id: CheckerboardMode; label: string; desc: string }[] = [
    {
      id: '2-color',
      label: '2-Color Checker',
      desc: 'Alternating diagonal pattern: (r + c) % 2. Instantly distinguishes diagonals.',
    },
    {
      id: 'off',
      label: 'Off (Solid)',
      desc: 'Solid flat canvas background.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`bg-white dark:bg-zinc-900 border border-amber-900/20 dark:border-zinc-700 shadow-2xl rounded-2xl w-full max-w-md p-5 text-zinc-800 dark:text-zinc-100 flex flex-col gap-4 select-none ${className}`.trim()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2
              id="player-settings-title"
              className="text-base font-extrabold text-amber-950 dark:text-amber-200"
            >
              Player Settings
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onOpenDevTools && (
              <button
                type="button"
                onClick={handleDevOptionsClick}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-900/20 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                title="Open Developer Settings side panel"
              >
                🛠️ Dev Options
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer font-bold leading-none text-base"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Trackball & Pan Controls */}
          <div className="flex flex-col gap-2.5 bg-amber-50/50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-amber-900/10 dark:border-zinc-700/70">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
              Trackball & Pan
            </h3>

            <label className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Trackball Sensitivity
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {panSensitivity.toFixed(1)}x
                </span>
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

            <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-amber-900/10 dark:border-zinc-700/50">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Inverse Pan Movement
              </span>
              <input
                type="checkbox"
                checked={inversePan}
                onChange={(e) => setInversePan(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              {inversePan
                ? 'Trackball feel: dragging right rolls viewport right.'
                : 'Direct feel: dragging right moves canvas right.'}
            </p>
          </div>

          {/* Grid & Checkerboard Style */}
          <div className="flex flex-col gap-2.5 bg-amber-50/50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-amber-900/10 dark:border-zinc-700/70">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
              Grid & Diagonal Checkerboard
            </h3>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-zinc-900/80 rounded-lg border border-amber-900/15 dark:border-zinc-700/50">
              {checkerModes.map((m) => {
                const isActive = checkerboardMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCheckerboardMode(m.id)}
                    className={`px-2 py-1.5 rounded text-xs font-semibold transition cursor-pointer text-center ${
                      isActive
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              {checkerModes.find((m) => m.id === checkerboardMode)?.desc}
            </p>

            {checkerboardMode !== 'off' && (
              <div className="flex items-center justify-between pt-1 border-t border-amber-900/10 dark:border-zinc-700/50">
                <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  Palette Swatches
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded border border-zinc-400/80 shadow-inner flex items-center justify-center text-[9px] font-bold text-zinc-800"
                    style={{ backgroundColor: checkerColors[0] }}
                    title={`Color 0: ${checkerColors[0]}`}
                  >
                    0
                  </div>
                  <div
                    className="w-5 h-5 rounded border border-zinc-400/80 shadow-inner flex items-center justify-center text-[9px] font-bold text-zinc-800"
                    style={{ backgroundColor: checkerColors[1] }}
                    title={`Color 1: ${checkerColors[1]}`}
                  >
                    1
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Board Orientation */}
          <div className="flex flex-col gap-2.5 bg-amber-50/50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-amber-900/10 dark:border-zinc-700/70">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
              Board Orientation
            </h3>

            <button
              type="button"
              onClick={rotateBoardMatrix}
              className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-500/30 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🔄 Rotate Board Orientation (Rows ↔ Cols)</span>
            </button>

            <div className="flex items-center justify-between pt-1 border-t border-amber-900/10 dark:border-zinc-700/50 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Current Grid Layout</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                  isBoardRotated
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    : 'bg-zinc-200 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {isBoardRotated ? 'Rotated' : 'Standard'} ({cols} × {rows})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
