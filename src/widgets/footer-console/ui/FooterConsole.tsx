import React, { useState } from 'react';
import { useBoardStore } from '@/entities/board';
import { useItemStore } from '@/entities/item';
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
  const isDepleted = useGameSessionStore((state) => state.isDepleted);
  const isPaused = useGameSessionStore((state) => state.isPaused);
  const panOffset = useBoardStore((state) => state.panOffset);
  const resetPanOffset = useBoardStore((state) => state.resetPanOffset);

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
  const toggleCheck = useItemStore((state) => state.toggleCheck);
  const targetTile = useItemStore((state) => state.targetTile);
  const randomChooseOptions = useItemStore((state) => state.randomChooseOptions);

  const toggleItem = useItemStore((state) => state.toggleItem);
  const untoggle = useItemStore((state) => state.untoggle);
  const setToggleCheck = useItemStore((state) => state.setToggleCheck);
  const confirmRandomChoose = useItemStore((state) => state.confirmRandomChoose);
  const cancelTargetTile = useItemStore((state) => state.cancelTargetTile);
  const triggerHintItem = useItemStore((state) => state.triggerHintItem);

  // State for momentary visual success flash on Hint trigger
  const [hintSuccessFlash, setHintSuccessFlash] = useState(false);

  const isRandomNumberActive = isToggled && activeItem === 'randomNumber';
  const isRandomChooseActive = isToggled && activeItem === 'randomChoose';
  const isPanned = Math.abs(panOffset.x) > 1 || Math.abs(panOffset.y) > 1;

  const handleHintClick = () => {
    if (isDepleted || isPaused || counts.hint <= 0) return;
    const success = triggerHintItem(false);
    if (success) {
      setHintSuccessFlash(true);
      setTimeout(() => setHintSuccessFlash(false), 500);
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
            (🎲 ×{counts.randomNumber} · 🎰 ×{counts.randomChoose} · 💡 ×{counts.hint})
          </span>
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
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
              title="Reselect another tile"
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
              🎲 Click tile to roll ({toggleCheck.randomNumber ? 'Continuous' : 'Single Use'})
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
              🎰 Click target tile on board ({toggleCheck.randomChoose ? 'Continuous' : 'Single Use'})
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
      </div>

      {/* Main Floating Console Deck (Fixed Dimensions) */}
      <div className="relative flex items-center justify-between gap-3 bg-[#fff9f1]/95 dark:bg-zinc-900/95 backdrop-blur-md border-[3px] border-[#4a3422] dark:border-zinc-700 rounded-2xl shadow-2xl px-3 py-2 w-fit max-w-[480px] h-[92px] box-border">
        {/* Left Cluster: Random Number & Random Choose */}
        <div className="flex items-center gap-2.5">
          {/* Button 1: Random Number */}
          <MechanicalItemButton
            icon="🎲"
            label={`×${counts.randomNumber}`}
            title={`Random Number Item (${counts.randomNumber} left). Click to arm, click right wing to toggle Continuous Mode.`}
            leftWingState={isRandomNumberActive ? 'amber' : 'inactive'}
            rightWingState={toggleCheck.randomNumber ? 'amber' : 'inactive'}
            leftWingTitle={isRandomNumberActive ? 'Random Number Armed' : 'Item Disarmed'}
            rightWingTitle={
              toggleCheck.randomNumber
                ? 'Continuous Mode Active (Stays armed after rolling)'
                : 'Single Use Mode (Untoggles after 1 roll). Click to toggle Continuous'
            }
            onRightWingClick={() => setToggleCheck('randomNumber', !toggleCheck.randomNumber)}
            onClick={() => toggleItem('randomNumber')}
            disabled={isDepleted || isPaused || counts.randomNumber <= 0}
          />

          {/* Button 2: Random Choose */}
          <MechanicalItemButton
            icon="🎰"
            label={`×${counts.randomChoose}`}
            title={`Random Choose Item (${counts.randomChoose} left). Click to arm, click right wing to toggle Continuous Mode.`}
            leftWingState={isRandomChooseActive ? 'purple' : 'inactive'}
            rightWingState={toggleCheck.randomChoose ? 'purple' : 'inactive'}
            leftWingTitle={isRandomChooseActive ? 'Random Choose Armed' : 'Item Disarmed'}
            rightWingTitle={
              toggleCheck.randomChoose
                ? 'Continuous Mode Active'
                : 'Single Use Mode. Click to toggle Continuous'
            }
            onRightWingClick={() => setToggleCheck('randomChoose', !toggleCheck.randomChoose)}
            onClick={() => toggleItem('randomChoose')}
            disabled={isDepleted || isPaused || counts.randomChoose <= 0}
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
        <div className="flex items-center gap-2.5">
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
            disabled={isDepleted || isPaused || counts.hint <= 0}
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
