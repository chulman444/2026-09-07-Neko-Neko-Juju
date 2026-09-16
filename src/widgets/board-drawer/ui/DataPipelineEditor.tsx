import React, { useState } from 'react';
import { useBoardMakerStore } from '@/entities/board-maker';
import { useBoardStore } from '@/entities/board';
import {
  exportFormat1DArray,
  exportFormatJsonObject,
  exportFormatTextMatrix,
  parseAnyBoardData,
} from '@/features/import-export-board';

export const DataPipelineEditor: React.FC = () => {
  const bmCols = useBoardMakerStore((state) => state.cols);
  const bmRows = useBoardMakerStore((state) => state.rows);
  const bmMatrix = useBoardMakerStore((state) => state.matrix);
  const bmStacks = useBoardMakerStore((state) => state.stacks);
  const setBoard = useBoardMakerStore((state) => state.setBoard);

  const [spaceType, setSpaceType] = useState<'space' | 'tab'>('space');
  const [spaceWidth, setSpaceWidth] = useState(1);
  const [dataBox, setDataBox] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const getFlatNumbers = (): number[] => {
    const flat: number[] = [];
    for (let r = 0; r < bmRows; r++) {
      for (let c = 0; c < bmCols; c++) {
        flat.push(bmMatrix[r]?.[c] ?? 0);
      }
    }
    return flat;
  };

  const handleExport1DArray = () => {
    setDataBox(exportFormat1DArray(getFlatNumbers()));
    showStatus('Exported 1D Array to sandbox');
  };

  const handleExportJsonObject = () => {
    setDataBox(exportFormatJsonObject(bmCols, bmRows, getFlatNumbers(), bmStacks));
    showStatus('Exported JSON Object (with stacks) to sandbox');
  };

  const handleExportTextMatrix = () => {
    setDataBox(exportFormatTextMatrix(bmCols, bmRows, getFlatNumbers(), spaceType, spaceWidth));
    showStatus('Exported Text Matrix to sandbox');
  };

  const handleAutoDetectAndLoadToDrawer = () => {
    if (!dataBox.trim()) {
      showStatus('⚠️ Sandbox is empty! Paste board data first.');
      return;
    }
    try {
      const parsed = parseAnyBoardData(dataBox, bmCols, bmRows);
      const newMatrix: number[][] = [];
      for (let r = 0; r < parsed.rows; r++) {
        const row: number[] = [];
        for (let c = 0; c < parsed.cols; c++) {
          row.push(parsed.numbers[r * parsed.cols + c] ?? 0);
        }
        newMatrix.push(row);
      }
      setBoard(newMatrix, parsed.stacks || {});
      showStatus(`Loaded ${parsed.cols}x${parsed.rows} board into Drawer!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showStatus(`⚠️ Failed to parse: ${message}`);
    }
  };

  const handleLoadBoardToTextEditor = () => {
    const gameCols = useBoardStore.getState().cols;
    const gameRows = useBoardStore.getState().rows;
    const gameMatrix = useBoardStore.getState().matrix;
    const gameStacks = useBoardStore.getState().stacks;

    const flat: number[] = [];
    for (let r = 0; r < gameRows; r++) {
      for (let c = 0; c < gameCols; c++) {
        flat.push(gameMatrix[r]?.[c] ?? 0);
      }
    }

    const out = exportFormatJsonObject(gameCols, gameRows, flat, gameStacks);
    setDataBox(out);
    showStatus(`Loaded active Game Board (${gameCols}x${gameRows}) into Sandbox!`);
  };

  const handleExportTextEditorToGameBoard = () => {
    if (!dataBox.trim()) {
      showStatus('⚠️ Sandbox is empty! Paste or export data first.');
      return;
    }
    try {
      const parsed = parseAnyBoardData(dataBox, bmCols, bmRows);
      const newMatrix: number[][] = [];
      for (let r = 0; r < parsed.rows; r++) {
        const row: number[] = [];
        for (let c = 0; c < parsed.cols; c++) {
          row.push(parsed.numbers[r * parsed.cols + c] ?? 0);
        }
        newMatrix.push(row);
      }
      useBoardStore.getState().setMatrix(newMatrix, parsed.stacks || {});
      showStatus(`Exported layout (${parsed.cols}x${parsed.rows}) to Game Board!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showStatus(`⚠️ Failed to export: ${message}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-amber-50/80 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-zinc-700 shadow-sm text-left">
      <h2 className="text-base font-bold text-amber-950 dark:text-zinc-100 flex items-center justify-between m-0">
        <span>2. Data Pipeline (Import / Export)</span>
        {statusMessage && (
          <span className="text-xs font-normal text-amber-700 dark:text-amber-300 animate-pulse">
            {statusMessage}
          </span>
        )}
      </h2>

      {/* Text formatting config */}
      <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-amber-900/10 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">
          Whitespace Separator (Text format):
        </span>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="bmSpaceType"
              value="space"
              checked={spaceType === 'space'}
              onChange={() => setSpaceType('space')}
              className="accent-amber-600 cursor-pointer"
            />
            <span>Space</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="bmSpaceType"
              value="tab"
              checked={spaceType === 'tab'}
              onChange={() => setSpaceType('tab')}
              className="accent-amber-600 cursor-pointer"
            />
            <span>Tab</span>
          </label>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-zinc-500">Width:</span>
            <input
              type="number"
              min={1}
              max={8}
              value={spaceWidth}
              onChange={(e) => setSpaceWidth(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-12 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center text-xs"
            />
          </div>
        </div>
      </div>

      {/* Raw IO String Sandbox */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Raw IO String Sandbox
        </label>
        <textarea
          id="bmDataBox"
          placeholder="Paste JSON or whitespace matrix here to load, or click export buttons below..."
          className="w-full h-48 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs text-zinc-800 dark:text-zinc-200 resize-none outline-none focus:ring-2 focus:ring-amber-500"
          value={dataBox}
          onChange={(e) => setDataBox(e.target.value)}
        />
      </div>

      {/* Export & Auto Detect Actions */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <button
          type="button"
          onClick={handleExport1DArray}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-200/80 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
        >
          Export (2-1): 1D Array
        </button>
        <button
          type="button"
          onClick={handleExportJsonObject}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-200/80 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
        >
          Export (2-2): JSON Object
        </button>
        <button
          type="button"
          onClick={handleExportTextMatrix}
          className="col-span-2 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-200/80 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
        >
          Export (2-3): Text Matrix with Breaks
        </button>
        <button
          type="button"
          onClick={handleAutoDetectAndLoadToDrawer}
          className="col-span-2 px-3 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-sm transition cursor-pointer"
        >
          🚀 Auto-Detect &amp; Load to Drawer
        </button>
      </div>

      {/* Game Board Sync Buttons */}
      <div className="flex gap-2 mt-2 pt-2 border-t border-amber-900/10 dark:border-zinc-700">
        <button
          type="button"
          onClick={handleLoadBoardToTextEditor}
          className="flex-1 px-3 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition cursor-pointer"
        >
          📥 Load from Game Board
        </button>
        <button
          type="button"
          onClick={handleExportTextEditorToGameBoard}
          className="flex-1 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
        >
          📤 Export to Game Board
        </button>
      </div>
    </div>
  );
};
