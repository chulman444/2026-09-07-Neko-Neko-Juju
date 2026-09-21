import React, { useState } from 'react';
import { useBoardStore } from '@/entities/board';
import { useItemStore } from '@/entities/item';
import { useCoreItemsStore } from '@/features/core-items';
import { useGameSessionStore } from '@/entities/game-session';
import { useSolverStore } from '@/features/look-ahead-solver';
import { useTrackball } from '../model/useTrackball';
import { MechanicalItemButton } from './MechanicalItemButton';

export interface FooterConsoleProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const FooterConsole: React.FC<FooterConsoleProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  // Session & Board
  const isPaused = useGameSessionStore((state) => state.isPaused);
  const panOffset = useBoardStore((state) => state.panOffset);
  const resetPanOffset = useBoardStore((state) => state.resetPanOffset);
  const isPanMode = useBoardStore((state) => state.isPanMode);
  const togglePanMode = useBoardStore((state) => state.togglePanMode);

  // Trackball Hook
  const {
    knobOffset,
    trackballPadRef,
    handleTrackballPointerDown,
    handleTrackballPointerMove,
    handleTrackballPointerUpOrCancel,
    handleTrackballDoubleClick,
  } = useTrackball();

  // Item Store
  const counts = useItemStore((state) => state.counts);
  const activeItem = useItemStore((state) => state.activeItem);
  const isToggled = useItemStore((state) => state.isToggled);
  const activeItemStage = useItemStore((state) => state.activeItemStage);
  const targetTile = useCoreItemsStore((state) => state.targetTile);
  const randomChooseOptions = useCoreItemsStore((state) => state.randomChooseOptions);

  const toggleItem = useCoreItemsStore((state) => state.toggleItem);
  const untoggle = useCoreItemsStore((state) => state.untoggle);
  const confirmRandomChoose = useCoreItemsStore((state) => state.confirmRandomChoose);
  const cancelTargetTile = useCoreItemsStore((state) => state.cancelTargetTile);
  const triggerHintItem = useCoreItemsStore((state) => state.triggerHintItem);
  const triggerShakeItem = useCoreItemsStore((state) => state.triggerShakeItem);

  // State for momentary visual success flash on Hint & Shake triggers
  const [hintSuccessFlash, setHintSuccessFlash] = useState(false);
  const [shakeSuccessFlash, setShakeSuccessFlash] = useState(false);

  // Unsolvable state for Free Shake
  const combinations = useSolverStore((state) => state.combinations);
  const isCalculated = useSolverStore((state) => state.isCalculated);
  const clearableCount = combinations.filter((c) => c.isActive && c.blockers.length === 0).length;
  const isUnsolvable = isCalculated && clearableCount === 0;

  const isRandomNumberActive = isToggled && activeItem === 'randomNumber';
  const isRandomChooseActive = isToggled && activeItem === 'randomChoose';
  const isOmnitileActive = isToggled && activeItem === 'omnitile';
  const isPanned = Math.abs(panOffset.x) > 1 || Math.abs(panOffset.y) > 1;

  const handleHintClick = () => {
    if (isPaused || counts.hint <= 0) return;
    const success = triggerHintItem(false);
    if (success) {
      setHintSuccessFlash(true);
      setTimeout(() => setHintSuccessFlash(false), 500);
    }
  };

  const handleShakeClick = () => {
    if (isPaused) return;
    if (!isUnsolvable && counts.shake <= 0) return;
    const success = triggerShakeItem(isUnsolvable);
    if (success) {
      setShakeSuccessFlash(true);
      setTimeout(() => setShakeSuccessFlash(false), 500);
      useSolverStore
        .getState()
        .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
    }
  };

  const handleSelectAndConfirm = (val: number) => {
    const success = confirmRandomChoose(val, false);
    if (success) {
      useSolverStore
        .getState()
        .recalculate(useBoardStore.getState().matrix, useBoardStore.getState().seed);
    }
  };

  // If collapsed, show compact floating trigger pill
  if (isCollapsed) {
    return (
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-150 ${className}`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-zinc-900/95 hover:bg-amber-50 dark:hover:bg-zinc-800 border-[2.5px] border-[#4a3422] dark:border-zinc-700 shadow-xl text-xs font-bold text-[#4a3422] dark:text-zinc-200 transition cursor-pointer hover:scale-105 active:scale-95 group backdrop-blur-md"
          title="Open mechanical console"
        >
          <span className="text-sm">🎒</span>
          <span>Footer Console</span>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            (🎲 ×{counts.randomNumber} · 🎰 ×{counts.randomChoose} · ⭐ ×{counts.omnitile} · 💡 ×
            {counts.hint} · 🔀 ×{counts.shake})
          </span>
          {isUnsolvable && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleShakeClick();
              }}
              className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-2 py-0.5 rounded font-black animate-pulse transition"
              title="Click to use Free Shake to break deadlock"
            >
              🔀 FREE SHAKE
            </span>
          )}
          {isPanMode && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                togglePanMode();
              }}
              className="text-[10px] bg-amber-400 dark:bg-amber-700 text-amber-950 dark:text-amber-100 px-1.5 py-0.5 rounded font-black hover:bg-amber-500 transition"
              title="Click to toggle Pan Mode off"
            >
              ✋ Pan ON
            </span>
          )}
          {isPanned && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                resetPanOffset();
              }}
              className="text-[10px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono hover:bg-amber-300 transition"
              title="Click to reset pan"
            >
              ⊙ Pan: {Math.round(panOffset.x)},{Math.round(panOffset.y)}
            </span>
          )}
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold group-hover:-translate-y-0.5 transition-transform ml-1">
            ▲ Expand
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none animate-in fade-in slide-in-from-bottom-3 duration-200 ${className}`}
    >
      {/* Floating Action Banner / Choice Deck (Directly above the console) */}
      <div className="w-full flex justify-center mb-2 pointer-events-auto">
        {/* State A: Random Choose Target Selected - Pick 1 of 3 numbers */}
        {isRandomChooseActive && targetTile && randomChooseOptions && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-zinc-900 border-2 border-purple-500 shadow-xl animate-in fade-in zoom-in-95 duration-150 text-xs text-purple-950 dark:text-purple-100 backdrop-blur-md">
            <span className="font-bold flex items-center gap-1">
              🎯 Col {targetTile.col + 1}, Row {targetTile.row + 1}:
            </span>
            <div className="flex items-center gap-1.5">
              {randomChooseOptions.map((opt, i) => (
                <button
                  key={`${i}-${opt}`}
                  type="button"
                  onClick={() => handleSelectAndConfirm(opt)}
                  className="px-2.5 py-1 rounded-lg font-mono text-sm font-black bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border border-purple-400 hover:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950 hover:scale-110 active:scale-95 shadow-sm transition cursor-pointer"
                  title={`Replace target tile with ${opt}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={cancelTargetTile}
              disabled={counts.randomChoose <= 0}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                counts.randomChoose <= 0
                  ? 'opacity-40 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                  : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 cursor-pointer'
              }`}
              title={
                counts.randomChoose <= 0
                  ? 'No Random Choose items remaining to reroll'
                  : 'Reselect another tile (-1 🎰)'
              }
            >
              Change Tile
            </button>
            <button
              type="button"
              onClick={untoggle}
              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer"
              title="Cancel item use"
            >
              ✕
            </button>
          </div>
        )}

        {/* State B: Random Number Armed - Awaiting Tile Tap */}
        {isRandomNumberActive && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/50 shadow-md animate-in fade-in duration-150 text-xs text-amber-950 dark:text-amber-200 backdrop-blur-md">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span className="font-medium">
              🎲 Click tile to roll (
              {activeItemStage === 2 ? 'Stage 2: Multi-Use' : 'Stage 1: Single Use'})
            </span>
            <button
              type="button"
              onClick={untoggle}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer ml-1"
            >
              ✕ Disarm
            </button>
          </div>
        )}

        {/* State C: Random Choose Armed - Awaiting Target Tile Tap */}
        {isRandomChooseActive && !targetTile && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/50 shadow-md animate-in fade-in duration-150 text-xs text-purple-950 dark:text-purple-200 backdrop-blur-md">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-ping shrink-0" />
            <span className="font-medium">
              🎰 Click target tile on board (
              {activeItemStage === 2 ? 'Stage 2: Multi-Use' : 'Stage 1: Single Use'})
            </span>
            <button
              type="button"
              onClick={untoggle}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer ml-1"
            >
              ✕ Disarm
            </button>
          </div>
        )}

        {/* State D: Omnitile Armed - Awaiting Tile Tap */}
        {isOmnitileActive && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/50 shadow-md animate-in fade-in duration-150 text-xs text-amber-950 dark:text-amber-200 backdrop-blur-md">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span className="font-medium">
              ⭐ Click tile to convert to Omnitile (*) (
              {activeItemStage === 2 ? 'Stage 2: Multi-Use' : 'Stage 1: Single Use'})
            </span>
            <button
              type="button"
              onClick={untoggle}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer ml-1"
            >
              ✕ Disarm
            </button>
          </div>
        )}

        {/* State E: Panning Mode Active Banner */}
        {isPanMode && !isRandomNumberActive && !isRandomChooseActive && !isOmnitileActive && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/60 shadow-md animate-in fade-in duration-150 text-xs text-amber-950 dark:text-amber-200 backdrop-blur-md">
            <span className="font-bold flex items-center gap-1">✋ Pan Mode Active:</span>
            <span>Drag anywhere with Left, Middle, or Right click to pan board</span>
            <button
              type="button"
              onClick={togglePanMode}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer ml-1"
            >
              ✕ Exit Pan
            </button>
          </div>
        )}
      </div>

      {/* Main Floating Console Deck */}
      <div className="relative flex flex-col items-center justify-between bg-[#fff9f1]/95 dark:bg-zinc-900/95 backdrop-blur-md border-[3px] border-[#4a3422] dark:border-zinc-700 rounded-2xl shadow-2xl px-4 py-3 w-fit max-w-[calc(100vw-2rem)] box-border gap-2.5">
        {/* Row 1: Items & Trackball Deck (Symmetric 3-column grid for true center alignment) */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 w-full">
          {/* Left Cluster: Random Number & Random Choose */}
          <div className="flex items-center justify-end gap-2.5">
            {/* Button 1: Random Number */}
            <MechanicalItemButton
              icon="🎲"
              label={`×${counts.randomNumber}`}
              title={
                !isRandomNumberActive
                  ? `Random Number (${counts.randomNumber} left). Click to arm Stage 1 (Single Use).`
                  : activeItemStage === 1
                    ? `Random Number: Stage 1 (Single Use). Click again to advance to Stage 2 (Multi-Use).`
                    : `Random Number: Stage 2 (Multi-Use Active). Click to disarm.`
              }
              leftWingState={isRandomNumberActive && activeItemStage >= 1 ? 'amber' : 'inactive'}
              rightWingState={isRandomNumberActive && activeItemStage === 2 ? 'amber' : 'inactive'}
              leftWingTitle={isRandomNumberActive ? 'Stage 1 Active (Single Use)' : 'Disarmed'}
              rightWingTitle={
                isRandomNumberActive && activeItemStage === 2
                  ? 'Stage 2 Active (Multi-Use Mode)'
                  : 'Stage 2 Inactive'
              }
              onClick={() => toggleItem('randomNumber')}
              disabled={isPaused || counts.randomNumber <= 0}
            />

            {/* Button 2: Random Choose */}
            <MechanicalItemButton
              icon="🎰"
              label={`×${counts.randomChoose}`}
              title={
                !isRandomChooseActive
                  ? `Random Choose (${counts.randomChoose} left). Click to arm Stage 1 (Single Use).`
                  : activeItemStage === 1
                    ? `Random Choose: Stage 1 (Single Use). Click again to advance to Stage 2 (Multi-Use).`
                    : `Random Choose: Stage 2 (Multi-Use Active). Click to disarm.`
              }
              leftWingState={isRandomChooseActive && activeItemStage >= 1 ? 'purple' : 'inactive'}
              rightWingState={isRandomChooseActive && activeItemStage === 2 ? 'purple' : 'inactive'}
              leftWingTitle={isRandomChooseActive ? 'Stage 1 Active (Single Use)' : 'Disarmed'}
              rightWingTitle={
                isRandomChooseActive && activeItemStage === 2
                  ? 'Stage 2 Active (Multi-Use Mode)'
                  : 'Stage 2 Inactive'
              }
              onClick={() => toggleItem('randomChoose')}
              disabled={isPaused || counts.randomChoose <= 0}
            />
          </div>

          {/* Center: Trackball Control Pad */}
          <div className="flex flex-col items-center justify-center relative px-1">
            <div
              ref={trackballPadRef}
              onPointerDown={handleTrackballPointerDown}
              onPointerMove={handleTrackballPointerMove}
              onPointerUp={handleTrackballPointerUpOrCancel}
              onPointerCancel={handleTrackballPointerUpOrCancel}
              onDoubleClick={handleTrackballDoubleClick}
              className="w-[72px] h-[72px] rounded-full border-[3px] border-[#4a3422] dark:border-zinc-700 bg-[#fff9f1] dark:bg-zinc-950 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[inset_0_-4px_0px_#edd4b2] dark:shadow-[inset_0_-4px_0px_#27272a] touch-none transition-shadow"
              title="Drag trackball to pan board view • Double-click to re-center"
            >
              <div
                className="w-[26px] h-[26px] rounded-full border-[3px] border-[#4a3422] dark:border-zinc-700 bg-[#ffba53] shadow-[inset_0_-3px_0px_#c96a2e] pointer-events-none transition-transform duration-75"
                style={{
                  transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
                }}
              />
            </div>
          </div>

          {/* Right Cluster: Hint & Re-Center Pan */}
          <div className="flex items-center justify-start gap-2.5">
            {/* Button 3: Hint Item */}
            <MechanicalItemButton
              icon="💡"
              label={`×${counts.hint}`}
              title={`Hint Item (${counts.hint} left). Highlights valid Match-10 groups on the board.`}
              leftWingState={hintSuccessFlash ? 'emerald' : 'inactive'}
              rightWingState={hintSuccessFlash ? 'emerald' : 'inactive'}
              leftWingTitle="Hint Indicator"
              rightWingTitle="Hint Indicator"
              onClick={handleHintClick}
              disabled={isPaused || counts.hint <= 0}
            />

            {/* Button 4: Re-Center Pan */}
            <MechanicalItemButton
              icon="⊙"
              label={isPanned ? 'Pan' : '0,0'}
              title={
                isPanned
                  ? `Board is panned by (${Math.round(panOffset.x)}, ${Math.round(panOffset.y)}). Click to re-center (0, 0).`
                  : 'Board is centered (0, 0). Drag trackball to pan.'
              }
              leftWingState={isPanned ? 'amber' : 'inactive'}
              rightWingState={isPanned ? 'amber' : 'inactive'}
              leftWingTitle={isPanned ? 'Board Panned' : 'Board Centered'}
              rightWingTitle={isPanned ? 'Board Panned' : 'Board Centered'}
              onClick={resetPanOffset}
            />
          </div>
        </div>

        {/* Row 2: Items Extension & Pan Mode (Symmetric 3-column grid matching Row 1) */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 w-full pt-1.5 border-t border-[#edd4b2]/60 dark:border-zinc-800">
          {/* Left: Omnitile (below Random Number & Choose) */}
          <div className="flex items-center justify-end">
            <MechanicalItemButton
              icon="⭐"
              size="sm"
              label={`×${counts.omnitile}`}
              title={
                !isOmnitileActive
                  ? `Omnitile (${counts.omnitile} left). Click to arm Stage 1 (Single Use). Acts as 0-10 on selection.`
                  : activeItemStage === 1
                    ? `Omnitile: Stage 1 (Single Use). Click again to advance to Stage 2 (Multi-Use).`
                    : `Omnitile: Stage 2 (Multi-Use Active). Click to disarm.`
              }
              leftWingState={isOmnitileActive && activeItemStage >= 1 ? 'amber' : 'inactive'}
              rightWingState={isOmnitileActive && activeItemStage === 2 ? 'amber' : 'inactive'}
              leftWingTitle={isOmnitileActive ? 'Stage 1 Active (Single Use)' : 'Disarmed'}
              rightWingTitle={
                isOmnitileActive && activeItemStage === 2
                  ? 'Stage 2 Active (Multi-Use Mode)'
                  : 'Stage 2 Inactive'
              }
              onClick={() => toggleItem('omnitile')}
              disabled={isPaused || counts.omnitile <= 0}
            />
          </div>

          {/* Center: Pan Mode (below Trackball) */}
          <div className="flex items-center justify-center">
            <MechanicalItemButton
              icon="✋"
              size="sm"
              label={isPanMode ? 'PANNING ACTIVE' : 'PAN MODE'}
              title="Toggle Panning Mode: when enabled, drag anywhere on or off the board with Left, Middle, or Right Click to pan"
              leftWingState={isPanMode ? 'amber' : 'inactive'}
              rightWingState={isPanMode ? 'amber' : 'inactive'}
              leftWingTitle={isPanMode ? 'Pan Mode Active' : 'Pan Mode Inactive'}
              rightWingTitle={isPanMode ? 'Pan Mode Active' : 'Pan Mode Inactive'}
              onClick={togglePanMode}
            />
          </div>

          {/* Right: Shake Item (below Hint & Center) */}
          <div className="flex items-center justify-start">
            <MechanicalItemButton
              icon="🔀"
              size="sm"
              label={isUnsolvable ? 'FREE' : `×${counts.shake}`}
              title={
                isUnsolvable
                  ? 'No clearable moves remaining! Free Shake is available to break deadlock.'
                  : `Shake Item (${counts.shake} left). Shuffles live tile positions.`
              }
              leftWingState={shakeSuccessFlash ? 'emerald' : isUnsolvable ? 'emerald' : 'inactive'}
              rightWingState={shakeSuccessFlash ? 'emerald' : isUnsolvable ? 'emerald' : 'inactive'}
              leftWingTitle={isUnsolvable ? 'Free Shake Available' : 'Shake'}
              rightWingTitle={isUnsolvable ? 'Free Shake Available' : 'Shake'}
              onClick={handleShakeClick}
              disabled={isPaused || (!isUnsolvable && counts.shake <= 0)}
            />
          </div>
        </div>

        {/* Optional Collapse Mini Button on Console Frame */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute -top-3 -right-2 w-6 h-6 rounded-full bg-[#fff9f1] dark:bg-zinc-800 border-2 border-[#4a3422] dark:border-zinc-600 text-[#4a3422] dark:text-zinc-200 text-[10px] font-black flex items-center justify-center shadow-md hover:bg-amber-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            title="Collapse footer console"
          >
            ▼
          </button>
        )}
      </div>
    </div>
  );
};
