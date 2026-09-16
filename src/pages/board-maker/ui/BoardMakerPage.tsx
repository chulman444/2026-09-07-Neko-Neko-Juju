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
  const activeLayer = useBoardMakerStore((state) => state.activeLayer);
  const inspectedStack = useBoardMakerStore((state) => state.inspectedStack);
  const heatmapMode = useBoardMakerStore((state) => state.heatmapMode);

  const setDimensions = useBoardMakerStore((state) => state.setDimensions);
  const setSeed = useBoardMakerStore((state) => state.setSeed);
  const rerollSeed = useBoardMakerStore((state) => state.rerollSeed);
  const generateBlankBoard = useBoardMakerStore((state) => state.generateBlankBoard);
  const fillFromSeed = useBoardMakerStore((state) => state.fillFromSeed);
  const fillRandomSum10s = useBoardMakerStore((state) => state.fillRandomSum10s);
  const setSelectedBrush = useBoardMakerStore((state) => state.setSelectedBrush);
  const setActiveLayer = useBoardMakerStore((state) => state.setActiveLayer);
  const setInspectedStack = useBoardMakerStore((state) => state.setInspectedStack);
  const clearStackAt = useBoardMakerStore((state) => state.clearStackAt);
  const removeTileAtDepth = useBoardMakerStore((state) => state.removeTileAtDepth);
  const insertTileAtDepth = useBoardMakerStore((state) => state.insertTileAtDepth);
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

  // Determine available layers for selector
  const maxExistingLayer = Object.values(bmStacks).reduce((max, s) => Math.max(max, s.length), 0);
  const layerOptionsCount = Math.max(4, maxExistingLayer + 2);
  const availableLayers = Array.from({ length: layerOptionsCount }, (_, i) => i);

  // Determine tile value to insert when clicking [+]
  const activeInsertValue =
    typeof selectedBrush === 'number' && selectedBrush >= 1 && selectedBrush <= 9
      ? selectedBrush
      : 1;

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

          {/* Layer Selector */}
          <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-900/10 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                <span>📚 Mode / Layer:</span>
                <span className="font-bold text-amber-950 dark:text-zinc-200">
                  {activeLayer === 'surface'
                    ? 'Surface (Top of stacks)'
                    : `Active Layer ${activeLayer}`}
                </span>
              </span>
              <span className="text-[10px] text-zinc-400">
                {activeLayer === 'surface'
                  ? 'Numbers push new tiles'
                  : 'Numbers override at this layer'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveLayer('surface')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  activeLayer === 'surface'
                    ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <span>⛰️ Surface</span>
              </button>

              <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5" />

              {availableLayers.map((layerNum) => (
                <button
                  key={layerNum}
                  type="button"
                  onClick={() => setActiveLayer(layerNum)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeLayer === layerNum
                      ? 'bg-amber-600 text-white shadow ring-2 ring-amber-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {layerNum === 0 ? 'L0 (Base)' : `L${layerNum}`}
                </button>
              ))}
            </div>
          </div>

          {/* Brush & Tool Palette */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-900/10 dark:border-zinc-700">
            {/* Number Brushes (1-9) */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-zinc-500 mr-1">Tile:</span>
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
                      ? 'shadow ring-2 ring-amber-500 scale-105'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  title={`Brush ${num} (Key: ${num})`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Visual separator */}
            <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

            {/* Special Action Brushes (0, -, +) */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-zinc-500 mr-1">Action:</span>
              <button
                type="button"
                onClick={() => setSelectedBrush(0)}
                className={`px-2 py-1 h-6 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  selectedBrush === 0
                    ? 'bg-rose-600 text-white shadow ring-2 ring-rose-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                title="Brush 0: Pop / Erase layer (Key: 0, or Right-Click)"
              >
                <span>0</span>
                <span className="text-[10px] font-normal opacity-80">Pop</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBrush('-')}
                className={`w-6 h-6 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  selectedBrush === '-'
                    ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                title="Brush -: Decrement tile 1-9 (Key: -)"
              >
                -
              </button>

              <button
                type="button"
                onClick={() => setSelectedBrush('+')}
                className={`w-6 h-6 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  selectedBrush === '+'
                    ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                title="Brush +: Increment tile 1-9 (Key: + or =)"
              >
                +
              </button>
            </div>

            {/* Depth Heatmap Toggle */}
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
              <span>{heatmapMode ? 'Heatmap: ON' : 'Heatmap'}</span>
            </button>
          </div>

          {/* Sub Header & Interaction Hints */}
          <div className="flex justify-between items-center text-[11px] text-zinc-500">
            <span>
              💡 Draw: Click | Pan: Middle-drag | Inspect: Ctrl+Click | Brush: Wheel / Keys
            </span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
              {bmCols} × {bmRows}
            </span>
          </div>

          {/* Stack Inspector UI */}
          {inspectedStack && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-100/70 dark:bg-zinc-900 border border-amber-500/40 dark:border-zinc-700 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔍</span>
                  <span className="text-xs font-bold text-amber-950 dark:text-zinc-100">
                    Stack Inspector: Cell ({inspectedStack.col}, {inspectedStack.row})
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    ({inspectedStack.stack.length}{' '}
                    {inspectedStack.stack.length === 1 ? 'tile' : 'tiles'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => clearStackAt(inspectedStack.col, inspectedStack.row)}
                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition cursor-pointer"
                  >
                    Clear Entire Stack
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedStack(null)}
                    className="text-xs font-bold w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 flex items-center justify-center transition cursor-pointer"
                    title="Close Inspector"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Horizontal Tiles Row: Surface -> Bottom */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-1 bg-white/70 dark:bg-zinc-950/50 rounded-lg border border-amber-900/10 dark:border-zinc-800">
                {inspectedStack.stack.length === 0 ? (
                  <div className="flex items-center gap-3 py-2 px-3 text-xs text-zinc-500">
                    <span>Cell is currently empty.</span>
                    <button
                      type="button"
                      onClick={() =>
                        insertTileAtDepth(
                          inspectedStack.col,
                          inspectedStack.row,
                          0,
                          activeInsertValue
                        )
                      }
                      className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                    >
                      + Insert Tile ({activeInsertValue})
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Insert button on top of surface tile */}
                    <button
                      type="button"
                      onClick={() =>
                        insertTileAtDepth(
                          inspectedStack.col,
                          inspectedStack.row,
                          inspectedStack.stack.length,
                          activeInsertValue
                        )
                      }
                      className="w-5 h-8 rounded border border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center justify-center transition cursor-pointer shrink-0"
                      title={`Insert tile (${activeInsertValue}) on top of surface`}
                    >
                      +
                    </button>

                    {/* Iterate from surface tile down to bottom tile */}
                    {Array.from(
                      { length: inspectedStack.stack.length },
                      (_, idx) => inspectedStack.stack.length - 1 - idx
                    ).map((z) => {
                      const tileVal = inspectedStack.stack[z]!;
                      const isSurface = z === inspectedStack.stack.length - 1;
                      const isBase = z === 0;
                      const isActive = activeLayer === 'surface' ? isSurface : activeLayer === z;

                      return (
                        <React.Fragment key={z}>
                          {/* Tile Card */}
                          <div
                            className={`relative flex flex-col items-center justify-between p-1.5 rounded-lg w-16 h-20 border shrink-0 transition ${
                              isActive
                                ? 'ring-2 ring-sky-500 border-sky-400 shadow-md bg-sky-50/70 dark:bg-sky-950/40'
                                : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                            }`}
                          >
                            {/* Layer tag & Delete button */}
                            <div className="w-full flex items-center justify-between text-[10px]">
                              <span
                                className={`font-bold px-1 rounded ${
                                  isSurface
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : isBase
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {isSurface ? 'Surface' : isBase ? 'Base (0)' : `L${z}`}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  removeTileAtDepth(inspectedStack.col, inspectedStack.row, z)
                                }
                                className="w-4 h-4 rounded text-[10px] font-bold text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition cursor-pointer"
                                title={`Delete tile at Layer ${z}`}
                              >
                                ✕
                              </button>
                            </div>

                            {/* Tile Value Badge */}
                            <div
                              style={{
                                backgroundColor: BM_COLOR_PALETTE[tileVal] || '#3b82f6',
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
                            >
                              {tileVal}
                            </div>

                            {/* Active Indicator */}
                            <span
                              className={`text-[9px] font-bold ${
                                isActive
                                  ? 'text-sky-600 dark:text-sky-400 animate-pulse'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {isActive
                                ? '● Active'
                                : `Depth ${inspectedStack.stack.length - 1 - z}`}
                            </span>
                          </div>

                          {/* Insert button between tiles or at base */}
                          <button
                            type="button"
                            onClick={() =>
                              insertTileAtDepth(
                                inspectedStack.col,
                                inspectedStack.row,
                                z,
                                activeInsertValue
                              )
                            }
                            className="w-5 h-8 rounded border border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center justify-center transition cursor-pointer shrink-0"
                            title={`Insert tile (${activeInsertValue}) below Layer ${z}`}
                          >
                            +
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}

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
