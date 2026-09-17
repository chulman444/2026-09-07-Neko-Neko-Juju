import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBoardStore, type TileCoord } from '@/entities/board';
import {
  useSolverStore,
  type SolverCombination,
  type SolverListType,
} from '@/features/look-ahead-solver';

export interface SolverPanelWidgetProps {
  /** Callback when user closes / hides the panel */
  onClose?: () => void;
  /** Callback to notify parent of highlighted tiles (e.g. for canvas rendering) */
  onHighlightTiles?: (tiles: TileCoord[]) => void;
  /** Optional callback when a clearable match is clicked */
  onClearMatch?: (match: SolverCombination) => void;
  /** Additional styling classes */
  className?: string;
}

export const SolverPanelWidget: React.FC<SolverPanelWidgetProps> = ({
  onClose,
  onHighlightTiles,
  onClearMatch,
  className = '',
}) => {
  const matrix = useBoardStore((state) => state.matrix);
  const seed = useBoardStore((state) => state.seed);
  const clearBoardTiles = useBoardStore((state) => state.clearTiles);

  const {
    combinations,
    pages,
    pageSizes,
    recalculate,
    cascadeTiles,
    setPage,
    changePage,
    setPageSize,
  } = useSolverStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Inline edit states
  const [editingPageType, setEditingPageType] = useState<SolverListType | null>(null);
  const [tempPageValue, setTempPageValue] = useState<string>('');
  const [editingSizeType, setEditingSizeType] = useState<SolverListType | null>(null);
  const [tempSizeValue, setTempSizeValue] = useState<string>('');

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Re-run solver engine when board seed changes (e.g. new board / restart) or initially
  useEffect(() => {
    recalculate(matrix);
  }, [seed, recalculate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus inline input automatically
  useEffect(() => {
    if (editingPageType || editingSizeType) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingPageType, editingSizeType]);

  // Partition active combinations
  const clearableMatches = useMemo(
    () => combinations.filter((c) => c.isActive && c.blockers.length === 0),
    [combinations]
  );

  const blockedMatches = useMemo(
    () => combinations.filter((c) => c.isActive && c.blockers.length > 0),
    [combinations]
  );

  const handleMatchMouseEnter = (match: SolverCombination) => {
    if (!onHighlightTiles) return;
    const allCoords: TileCoord[] = [
      ...match.required.map((t) => ({ col: t.col, row: t.row })),
      ...match.blockers.map((t) => ({ col: t.col, row: t.row })),
    ];
    onHighlightTiles(allCoords);
  };

  const handleMatchMouseLeave = () => {
    onHighlightTiles?.([]);
  };

  const handleExecuteClear = (match: SolverCombination) => {
    if (match.blockers.length > 0) return;

    // Clear highlights
    onHighlightTiles?.([]);

    // 1. Cascade in solver
    cascadeTiles(match.required);

    // 2. Clear in board store
    const coords: TileCoord[] = match.required.map((t) => ({ col: t.col, row: t.row }));
    clearBoardTiles(coords);

    // 3. Notify parent if callback provided (to award score/combo)
    onClearMatch?.(match);
  };

  // Wheel pagination
  const handleWheel = (e: React.WheelEvent, type: SolverListType) => {
    e.preventDefault();
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 1 : -1;
    changePage(type, direction);
  };

  const renderPaginationBar = (type: SolverListType, totalItems: number) => {
    const currPage = pages[type];
    const size = pageSizes[type];
    const maxPage = Math.max(1, Math.ceil(totalItems / size));

    const isEditingPage = editingPageType === type;
    const isEditingSize = editingSizeType === type;

    return (
      <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-400 mb-2 select-none">
        <button
          type="button"
          disabled={currPage <= 1}
          onClick={() => changePage(type, -1)}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-200 transition"
        >
          &lt;
        </button>

        <span
          className="cursor-ns-resize px-2 py-0.5 rounded hover:bg-zinc-800/80 transition"
          onWheel={(e) => handleWheel(e, type)}
          title="Scroll mouse wheel to change page"
        >
          Page{' '}
          {isEditingPage ? (
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={maxPage}
              value={tempPageValue}
              onChange={(e) => setTempPageValue(e.target.value)}
              onBlur={() => {
                const parsed = parseInt(tempPageValue, 10);
                if (!isNaN(parsed)) {
                  setPage(type, Math.min(maxPage, Math.max(1, parsed)));
                }
                setEditingPageType(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const parsed = parseInt(tempPageValue, 10);
                  if (!isNaN(parsed)) {
                    setPage(type, Math.min(maxPage, Math.max(1, parsed)));
                  }
                  setEditingPageType(null);
                }
              }}
              className="w-12 bg-black border border-amber-500/80 text-center text-amber-300 rounded outline-none py-0 px-1 font-mono text-xs"
            />
          ) : (
            <span
              onClick={() => {
                setTempPageValue(String(currPage));
                setEditingPageType(type);
              }}
              className="text-amber-400 font-bold underline cursor-pointer hover:text-amber-300"
            >
              {currPage}
            </span>
          )}{' '}
          of <span>{maxPage}</span> (
          {isEditingSize ? (
            <span className="inline-flex items-center">
              showing{' '}
              <input
                ref={inputRef}
                type="number"
                min={5}
                max={1000}
                value={tempSizeValue}
                onChange={(e) => setTempSizeValue(e.target.value)}
                onBlur={() => {
                  const parsed = parseInt(tempSizeValue, 10);
                  if (!isNaN(parsed)) {
                    setPageSize(type, parsed);
                  }
                  setEditingSizeType(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseInt(tempSizeValue, 10);
                    if (!isNaN(parsed)) {
                      setPageSize(type, parsed);
                    }
                    setEditingSizeType(null);
                  }
                }}
                className="w-14 mx-1 bg-black border border-amber-500/80 text-center text-amber-300 rounded outline-none py-0 px-1 font-mono text-xs"
              />
              items
            </span>
          ) : (
            <span
              onClick={() => {
                setTempSizeValue(String(size));
                setEditingSizeType(type);
              }}
              className="text-amber-400 font-bold underline cursor-pointer hover:text-amber-300"
            >
              showing {size} items
            </span>
          )}
          )
        </span>

        <button
          type="button"
          disabled={currPage >= maxPage}
          onClick={() => changePage(type, 1)}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-200 transition"
        >
          &gt;
        </button>
      </div>
    );
  };

  const renderSection = (type: SolverListType, title: string, dataSet: SolverCombination[]) => {
    const totalItems = dataSet.length;
    const size = pageSizes[type];
    const currPage = Math.min(Math.max(1, pages[type]), Math.max(1, Math.ceil(totalItems / size)));
    const startIdx = (currPage - 1) * size;
    const pageSlice = dataSet.slice(startIdx, startIdx + size);

    return (
      <div className="flex flex-col flex-1 min-h-0 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            {title} ({totalItems.toLocaleString()})
          </span>
        </div>

        {renderPaginationBar(type, totalItems)}

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent min-h-[160px] max-h-[300px]">
          {pageSlice.length === 0 ? (
            <div className="text-zinc-500 italic text-xs p-3 text-center">
              No combinations found inside this frame.
            </div>
          ) : (
            pageSlice.map((match) => {
              const isClearable = match.blockers.length === 0;
              return (
                <div
                  key={match.id}
                  onMouseEnter={() => handleMatchMouseEnter(match)}
                  onMouseLeave={handleMatchMouseLeave}
                  onClick={() => isClearable && handleExecuteClear(match)}
                  className={`p-2.5 rounded-lg border-l-4 transition text-xs select-none ${
                    isClearable
                      ? 'bg-zinc-800/90 hover:bg-zinc-750 border-l-emerald-500 hover:translate-x-1 cursor-pointer shadow-sm'
                      : 'bg-zinc-850/70 border-l-rose-500 cursor-not-allowed opacity-70 hover:opacity-90'
                  }`}
                >
                  <div className="font-semibold text-zinc-200">
                    [{match.family}] {match.shape}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 leading-tight">
                    <div>Tiles: {match.required.map((t) => `(${t.row},${t.col})`).join(' ')}</div>
                    <div
                      className={`mt-0.5 font-medium ${
                        isClearable ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isClearable
                        ? '✔ Ready to Clear! Click to Cascade.'
                        : `✖ Blocked by ${match.blockers.length} tile(s).`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Minimized state
  if (isCollapsed) {
    return (
      <div
        className={`bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-3 shadow-xl flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-400 hover:bg-zinc-850 transition ${className}`}
        onClick={() => setIsCollapsed(false)}
        title="Click to expand Solver Panel"
      >
        <span>🔍 Look-Ahead Solver</span>
        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full font-mono text-[10px]">
          {clearableMatches.length} clearable
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(false);
          }}
          className="text-zinc-400 hover:text-white px-1 ml-1"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`flex flex-col w-full max-w-[460px] bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-4 shadow-2xl text-zinc-200 transition-all ${className}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-400">🔍 Look-Ahead Match Solver</span>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded-full">
            {clearableMatches.length} available
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition text-xs font-bold"
            title="Minimize panel"
          >
            —
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-200 transition text-xs font-bold"
              title="Close panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Available Moves Section */}
      {renderSection('clearable', 'Available Moves (No Blockers)', clearableMatches)}

      {/* Blocked Combinations Section */}
      {renderSection('blocked', 'Blocked Combinations', blockedMatches)}
    </aside>
  );
};
