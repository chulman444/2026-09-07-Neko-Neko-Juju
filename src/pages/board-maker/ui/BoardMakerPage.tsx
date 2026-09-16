import React, { useState } from 'react';
import { useBoardMakerStore } from '@/entities/board-maker';
import { useBoardStore } from '@/entities/board';
import { DrawerCanvas, DataPipelineEditor } from '@/widgets/board-drawer';
import { Link } from '@/shared/lib/router';
import { BM_COLOR_PALETTE } from '@/shared/config';

export const BoardMakerPage: React.FC = () => {
  const bmCols = useBoardMakerStore((state) => state.cols);
  const bmRows = useBoardMakerStore((state) => state.rows);
  const bmMatrix = useBoardMakerStore((state) => state.matrix);
  const bmStacks = useBoardMakerStore((state) => state.stacks);
  const bmSeed = useBoardMakerStore((state) => state.seed);
  const selectedBrush = useBoardMakerStore((state) => state.selectedBrush);
  const heatmapMode = useBoardMakerStore((state) => state.heatmapMode);

  const setDimensions = useBoardMakerStore((state) => state.setDimensions);
  const setSeed = useBoardMakerStore((state) => state.setSeed);
  const rerollSeed = useBoardMakerStore((state) => state.rerollSeed);
  const generateBlankBoard = useBoardMakerStore((state) => state.generateBlankBoard);
  const fillFromSeed = useBoardMakerStore((state) => state.fillFromSeed);
  const fillRandomSum10s = useBoardMakerStore((state) => state.fillRandomSum10s);
  const setSelectedBrush = useBoardMakerStore((state) => state.setSelectedBrush);
  const toggleHeatmapMode = useBoardMakerStore((state) => state.toggleHeatmapMode);
  const setBoard = useBoardMakerStore((state) => state.setBoard);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLoadBoardToDrawer = () => {
    const gameMatrix = useBoardStore.getState().matrix;
    const gameStacks = useBoardStore.getState().stacks;
    const gameCols = useBoardStore.getState().cols;
    const gameRows = useBoardStore.getState().rows;

    setBoard(gameMatrix, gameStacks);
    showNotification(`Loaded Game Board (${gameCols}x${gameRows}) into Drawer!`);
  };

  const handleExportDrawerToGameBoard = () => {
    useBoardStore.getState().setMatrix(bmMatrix, bmStacks);
    showNotification(`Exported Drawer layout (${bmCols}x${bmRows}) to Game Board!`);
  };

  return (
    <div className="w-full flex-1 min-h-screen bg-amber-50/40 dark:bg-zinc-950 p-4 md:p-6 flex flex-col items-center">
      {/* Top Bar Header */}
      <header className="w-full max-w-6xl flex items-center justify-between mb-4 pb-3 border-b border-amber-900/10 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <h1 className="text-xl font-bold text-amber-950 dark:text-zinc-100 m-0">
              Board Maker &amp; Layer Editor
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notification && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 animate-pulse">
              {notification}
            </span>
          )}
          <Link
            href="/game"
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-neko-primary text-white hover:opacity-90 transition shadow-sm"
          >
            Play Game →
          </Link>
        </div>
      </header>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl h-fit">
        {/* Left Column: Grid Configuration & Drawer */}
        <div className="flex flex-col gap-3 p-5 rounded-2xl bg-amber-50/80 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-zinc-700 shadow-sm text-left">
          <h2 className="text-base font-bold text-amber-950 dark:text-zinc-100 m-0">
            1. Grid Configuration &amp; Drawer
          </h2>

          {/* Dimension Controls */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-amber-900/10 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <label htmlFor="bmInputCols" className="text-xs font-semibold text-zinc-500">
                Cols (N):
              </label>
              <input
                id="bmInputCols"
                type="number"
                min={1}
                max={50}
                value={bmCols}
                onChange={(e) =>
                  setDimensions(Math.max(1, parseInt(e.target.value, 10) || 1), bmRows)
                }
                className="w-14 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center text-xs font-bold"
              />
            </div>
            <span className="font-bold text-zinc-400">×</span>
            <div className="flex items-center gap-2">
              <label htmlFor="bmInputRows" className="text-xs font-semibold text-zinc-500">
                Rows (M):
              </label>
              <input
                id="bmInputRows"
                type="number"
                min={1}
                max={50}
                value={bmRows}
                onChange={(e) =>
                  setDimensions(bmCols, Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="w-14 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center text-xs font-bold"
              />
            </div>
            <button
              type="button"
              onClick={() => generateBlankBoard()}
              className="ml-auto px-3 py-1 text-xs font-bold rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              Clear Blank
            </button>
          </div>

          {/* Seed Controls */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <label htmlFor="bmInputSeed" className="text-xs font-semibold text-zinc-500">
                Seed:
              </label>
              <input
                id="bmInputSeed"
                type="text"
                value={bmSeed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs font-bold text-amber-700 dark:text-amber-400"
              />
            </div>
            <div className="flex items-end gap-1.5 pt-4">
              <button
                type="button"
                onClick={rerollSeed}
                title="Reroll Seed"
                className="px-2.5 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-amber-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                🎲
              </button>
              <button
                type="button"
                onClick={() => fillFromSeed()}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 transition cursor-pointer"
              >
                Fill from Seed
              </button>
            </div>
          </div>

          {/* Random Sum 10s */}
          <button
            type="button"
            onClick={() => fillRandomSum10s()}
            className="w-full py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-amber-100/60 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            🎲 All Random (Sum 10s)
          </button>

          {/* Brush & Tool Palette */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-900/10 dark:border-zinc-700">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-zinc-500 mr-1">Brush:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedBrush(num)}
                  style={{
                    backgroundColor: selectedBrush === num ? BM_COLOR_PALETTE[num] : undefined,
                    color: selectedBrush === num ? '#ffffff' : undefined,
                  }}
                  className={`w-6 h-6 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    selectedBrush === num
                      ? 'shadow ring-2 ring-amber-500'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleHeatmapMode}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                heatmapMode
                  ? 'bg-purple-600 text-white shadow ring-2 ring-purple-400'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300'
              }`}
            >
              <span>🎨</span>
              <span>{heatmapMode ? 'Heatmap: ON' : 'Depth Heatmap'}</span>
            </button>
          </div>

          {/* Sub Header & Dimensions */}
          <div className="flex justify-between items-center text-[11px] text-zinc-500">
            <span>💡 Left-click: Add layer (push) | Right-click: Pop layer | Wheel: ±1</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
              {bmCols} × {bmRows}
            </span>
          </div>

          {/* Drawer Canvas */}
          <DrawerCanvas />

          {/* Drawer Sync Actions */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleLoadBoardToDrawer}
              className="flex-1 px-3 py-2.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition cursor-pointer"
            >
              📥 Load from Game Board
            </button>
            <button
              type="button"
              onClick={handleExportDrawerToGameBoard}
              className="flex-1 px-3 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
            >
              📤 Export to Game Board
            </button>
          </div>
        </div>

        {/* Right Column: Data Pipeline */}
        <DataPipelineEditor />
      </div>
    </div>
  );
};
