import React, { useState } from 'react';
import { useBoardStore } from '@/entities/board';
import { useDifficultyStore } from '@/entities/difficulty';
import {
  useMacroLoopStore,
  type MacroBoardConfig,
  type MacroBoardSizeTier,
  type MacroDifficultyTier,
} from '@/entities/macro-loop';

export interface MacroLoopManagerWidgetProps {
  className?: string;
  onPlayBoard?: (config: MacroBoardConfig) => void;
  onLoadIntoGenerator?: () => void;
  onSwitchTab?: (tab: 'generator' | 'tuner' | 'solver' | 'macro-loop' | 'items') => void;
}

export const MacroLoopManagerWidget: React.FC<MacroLoopManagerWidgetProps> = ({
  className = '',
  onPlayBoard,
  onLoadIntoGenerator,
  onSwitchTab,
}) => {
  const {
    boards,
    currentPlayIndex,
    editingBoardIndex,
    totalRiskMeter,
    accumulatedSolidBlocks,
    startEditing,
    saveEditing,
    cancelEditing,
    addBoard,
    playBoard,
    addAccumulatedBlock,
    removeAccumulatedBlock,
    clearAccumulatedBlocks,
    resetMacroLoop,
  } = useMacroLoopStore();

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  const isEditingAny = editingBoardIndex !== null;

  // Handle Edit in Board Generator
  const handleStartEditing = (index: number) => {
    const board = boards[index];
    if (!board) return;

    startEditing(index);

    // Sync board config into generator / session stores
    useBoardStore.getState().setSelectedSizeTier(board.sizeTier);
    useDifficultyStore.getState().setSelectedDifficultyTier(board.difficultyTier);
    useBoardStore.getState().setSeed(board.seed);

    showFeedback(`Board #${index + 1} locked for editing in Generator`);
    if (onSwitchTab) {
      onSwitchTab('generator');
    }
  };

  // Handle Save from Board Generator
  const handleSaveEditing = () => {
    const currentSize = useBoardStore.getState().selectedSizeTier as MacroBoardSizeTier;
    const currentDiff = useDifficultyStore.getState().selectedDifficultyTier as MacroDifficultyTier;
    const currentSeed = useBoardStore.getState().seed;

    saveEditing({
      sizeTier: currentSize,
      difficultyTier: currentDiff,
      seed: currentSeed,
    });

    showFeedback('Saved new board configuration!');
  };

  // Handle Play Board
  const handlePlayBoard = (index: number) => {
    const board = boards[index];
    if (!board) return;

    playBoard(index);
    useBoardStore.getState().setSelectedSizeTier(board.sizeTier);
    useDifficultyStore.getState().setSelectedDifficultyTier(board.difficultyTier);
    useBoardStore.getState().setSeed(board.seed);

    if (onPlayBoard) {
      onPlayBoard(board);
    } else if (onLoadIntoGenerator) {
      onLoadIntoGenerator();
    }

    showFeedback(`Started playing Board #${index + 1} (${board.boardType.toUpperCase()})`);
  };

  // Quick Block Testing Helpers
  const handleAddArtBlock = () => {
    const randomVal = Math.floor(Math.random() * 9) + 1;
    addAccumulatedBlock({
      originalValue: randomVal,
      sourceBoardIndex: currentPlayIndex + 1,
      originalPosition: { col: 0, row: 0 },
    });
    showFeedback(`Added Art Block (Val: ${randomVal})`);
  };

  const handleAddRandomBlock = () => {
    const randomVal = Math.floor(Math.random() * 9) + 1;
    addAccumulatedBlock({
      originalValue: randomVal,
      sourceBoardIndex: currentPlayIndex + 1,
    });
    showFeedback(`Added Random Block (Val: ${randomVal})`);
  };

  const riskBoardsCount = boards.filter((b) => b.boardType === 'risk').length;
  const rewardBoardsCount = boards.filter((b) => b.boardType === 'reward').length;

  return (
    <div
      className={`bg-zinc-900 text-zinc-100 border border-zinc-700/80 rounded-xl shadow-lg flex flex-col max-h-[700px] select-none text-xs ${className}`.trim()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700/80 bg-zinc-950/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-lg shadow-inner">
            🔄
          </div>
          <div>
            <h2 className="font-bold text-sm text-zinc-100">Macro Loop (Set 1)</h2>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>
                Boards: {riskBoardsCount} Risk + {rewardBoardsCount} Reward
              </span>
              <span className="border-l border-zinc-700 pl-2">
                Total Risk Meter:{' '}
                <strong className="text-rose-400 font-mono font-bold">{totalRiskMeter}</strong>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => addBoard()}
          disabled={isEditingAny}
          className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded-md transition shadow cursor-pointer"
          title="Append a new board to the timeline sequence"
        >
          + Add Board
        </button>
      </div>

      {feedbackMessage && (
        <div className="mx-4 mt-3 p-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded text-center transition animate-in fade-in">
          {feedbackMessage}
        </div>
      )}

      {/* Timeline Container */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {boards.map((board, idx) => {
          const isPlayed = !!board.result || idx < currentPlayIndex;
          const isEditingThis = editingBoardIndex === idx;
          const isCurrentActive = idx === currentPlayIndex;
          const isReward = board.boardType === 'reward';

          // Visual styles based on state
          let borderTimelineColor = 'border-zinc-700';
          let dotColor = 'bg-zinc-600 border-zinc-500';
          let cardContainerClass = 'bg-zinc-800/80 border-zinc-700/70 opacity-80';

          if (isEditingThis) {
            borderTimelineColor = 'border-sky-500';
            dotColor = 'bg-sky-500 border-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.5)]';
            cardContainerClass =
              'bg-sky-950/20 border-2 border-sky-500/60 shadow-md ring-2 ring-sky-500/20';
          } else if (isPlayed) {
            borderTimelineColor = 'border-emerald-500/40';
            dotColor = 'bg-emerald-500 border-emerald-400';
            cardContainerClass = 'bg-emerald-950/15 border border-emerald-500/30 opacity-90';
          } else if (isReward) {
            borderTimelineColor = 'border-purple-500/50';
            dotColor = 'bg-purple-500 border-purple-400';
            cardContainerClass = 'bg-purple-950/20 border border-purple-500/40 border-dashed';
          } else if (isCurrentActive) {
            borderTimelineColor = 'border-amber-500/50';
            dotColor = 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.4)]';
            cardContainerClass = 'bg-zinc-800 border-amber-500/50 ring-1 ring-amber-500/30';
          }

          return (
            <div
              key={`${idx}-${board.seed}`}
              className={`relative pl-6 border-l-2 ${borderTimelineColor} pb-2`}
            >
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-zinc-900 border-2 flex items-center justify-center ${dotColor}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isEditingThis ? 'animate-ping bg-sky-400' : 'bg-current'}`}
                />
              </div>

              {/* Card Body */}
              <div className={`rounded-lg p-3 ${cardContainerClass}`}>
                {/* Card Top Row: Title, Badge, Play Button */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isReward
                          ? 'text-purple-400'
                          : isPlayed
                            ? 'text-emerald-400'
                            : isEditingThis
                              ? 'text-sky-300'
                              : isCurrentActive
                                ? 'text-amber-300'
                                : 'text-zinc-300'
                      }`}
                    >
                      {isReward ? '👑 Reward Board' : `⚡ Risk Board ${idx + 1}`}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                        isEditingThis
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 animate-pulse'
                          : isPlayed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isCurrentActive
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {isEditingThis
                        ? 'Editing'
                        : isPlayed
                          ? 'Played'
                          : isCurrentActive
                            ? 'Active'
                            : 'Upcoming'}
                    </span>
                  </div>

                  {/* Play Button */}
                  <button
                    type="button"
                    onClick={() => handlePlayBoard(idx)}
                    disabled={isEditingAny}
                    className={`text-[10px] px-3 py-1 rounded border shadow-sm font-semibold transition cursor-pointer flex items-center gap-1 ${
                      isEditingAny
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-500 opacity-50 cursor-not-allowed'
                        : isCurrentActive
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 font-bold'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-600'
                    }`}
                    title={
                      isEditingAny
                        ? 'Disabled while editing a board'
                        : `Force start game session for Board #${idx + 1}`
                    }
                  >
                    <span>▶</span>
                    <span>Play</span>
                  </button>
                </div>

                {/* Card Middle Row: Parameters & Edit Button */}
                <div
                  className={`flex items-center justify-between mb-2 ${isEditingThis ? 'pb-2 border-b border-sky-500/20' : ''}`}
                >
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
                    <span className="bg-zinc-900 border border-zinc-700 px-1 py-0.5 rounded capitalize">
                      Size: {board.sizeTier}
                    </span>
                    <span className="bg-zinc-900 border border-zinc-700 px-1 py-0.5 rounded capitalize">
                      Diff: {board.difficultyTier}
                    </span>
                    <span className="bg-zinc-900 border border-zinc-700 px-1 py-0.5 rounded">
                      Seed: {board.seed}
                    </span>
                  </div>

                  {/* Edit Button (when not currently editing this card) */}
                  {!isEditingThis && (
                    <button
                      type="button"
                      onClick={() => handleStartEditing(idx)}
                      disabled={isEditingAny}
                      className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
                        isEditingAny
                          ? 'border-zinc-700 text-zinc-500 opacity-50 cursor-not-allowed'
                          : 'border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                      }`}
                      title="Lock timeline slot and edit in Board Generator"
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {/* Active Editing State Controls */}
                {isEditingThis && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-sky-400 font-semibold animate-pulse flex items-center gap-1">
                      <span>🛠️</span>
                      <span>Modify in Generator Tab...</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="text-[10px] px-3 py-1 rounded border border-sky-500/40 text-sky-300 font-semibold hover:bg-sky-500/20 transition shadow-sm cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditing}
                        className="text-[10px] px-3 py-1 rounded bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold transition shadow-sm border border-sky-400 cursor-pointer"
                      >
                        Save New Config
                      </button>
                    </div>
                  </div>
                )}

                {/* History Results Breakdown (if played) */}
                {board.result && (
                  <div className="mt-2 text-[10px] bg-zinc-950/60 border border-zinc-800 rounded px-2.5 py-1.5 flex items-center justify-between shadow-inner">
                    <span className="text-zinc-400 font-semibold">Played Result:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400 font-mono">
                        +{board.result.phase1Score} RM
                      </span>
                      <span className="text-zinc-600">|</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {board.result.leftoverBlocksCount} Leftovers
                      </span>
                    </div>
                  </div>
                )}

                {/* Reward Board Incoming Blocks Context */}
                {isReward && !board.result && (
                  <div className="mt-2 text-[10px] bg-zinc-950/60 border border-purple-500/30 rounded px-2.5 py-1.5 flex items-center justify-between shadow-inner">
                    <span className="text-purple-300 font-medium">Incoming Solid Blocks:</span>
                    <span className="font-bold text-zinc-100 font-mono">
                      {accumulatedSolidBlocks.length} from previous boards
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Testing Actions Area */}
      <div className="p-4 border-t border-zinc-700/80 bg-zinc-950/60 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🧱</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Solid Blocks ({accumulatedSolidBlocks.length})
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddArtBlock}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
              title="Inject a test solid block"
            >
              <span>➕</span>
              <span>+ Add Art Block</span>
            </button>
            <button
              type="button"
              onClick={handleAddRandomBlock}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
              title="Inject a random test block"
            >
              <span>🎲</span>
              <span>Random</span>
            </button>
            {accumulatedSolidBlocks.length > 0 && (
              <button
                type="button"
                onClick={clearAccumulatedBlocks}
                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 rounded text-[10px] font-medium transition cursor-pointer"
                title="Clear accumulated blocks"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Blocks Chips (if any) */}
        {accumulatedSolidBlocks.length > 0 && (
          <div className="max-h-20 overflow-y-auto rounded bg-zinc-900/80 p-1.5 flex flex-wrap gap-1 border border-zinc-800">
            {accumulatedSolidBlocks.map((block, idx) => (
              <span
                key={`${block.sourceBoardIndex}-${block.originalValue}-${idx}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300"
              >
                <span className="text-amber-400 font-bold">B{block.sourceBoardIndex}</span>:
                <span>Val {block.originalValue}</span>
                <button
                  type="button"
                  onClick={() => removeAccumulatedBlock(idx)}
                  className="text-zinc-500 hover:text-rose-400 font-bold ml-0.5 cursor-pointer"
                  title="Remove block"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={resetMacroLoop}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition text-center cursor-pointer underline"
        >
          Reset Macro Loop Timeline to Defaults
        </button>
      </div>
    </div>
  );
};
