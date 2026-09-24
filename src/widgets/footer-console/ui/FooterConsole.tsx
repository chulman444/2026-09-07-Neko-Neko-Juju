import React from 'react';
import type { ItemRenderContext } from '@/entities/item';
import { useItemStore } from '@/entities/item';
import { useGameSessionStore } from '@/entities/game-session';
import {
  coreItemBehaviors,
  randomNumberBehavior,
  randomChooseBehavior,
  omnitileBehavior,
  hintBehavior,
  shakeBehavior,
} from '@/features/core-items';
import { TrackballControl } from '@/features/trackball-pan';
import { useGameConfigStore } from '@/entities/game-config';
import { GenericItemButton } from './GenericItemButton';
import { RechargeableItemButton } from './RechargeableItemButton';
import { ReCenterButton } from './ReCenterButton';
import { PanModeButton } from './PanModeButton';

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
  const counts = useItemStore((state) => state.counts);
  const activeItem = useItemStore((state) => state.activeItem);
  const activeItemStage = useItemStore((state) => state.activeItemStage);
  const isToggled = useItemStore((state) => state.isToggled);
  const isPaused = useGameSessionStore((state) => state.isPaused);
  const enableItemRefills = useGameConfigStore((state) => state.enableItemRefills);
  const itemRefillStyle = useGameConfigStore((state) => state.itemRefillStyle);
  const itemButtonVariant = useGameConfigStore((state) => state.itemButtonVariant);
  const itemSplitStyle = useGameConfigStore((state) => state.itemSplitStyle);
  const itemBadgePlacement = useGameConfigStore((state) => state.itemBadgePlacement);
  const itemCdDirection = useGameConfigStore((state) => state.itemCdDirection);
  const itemCdFormat = useGameConfigStore((state) => state.itemCdFormat);

  const context: ItemRenderContext = {
    counts,
    activeItem,
    activeItemStage,
    isToggled,
    isPaused,
  };

  const activeBehavior = coreItemBehaviors.find((it) => it.id === activeItem);
  const overlay =
    isToggled && activeBehavior?.renderOverlay ? activeBehavior.renderOverlay(context) : null;

  const renderItemButton = (behavior: (typeof coreItemBehaviors)[number], size?: 'sm' | 'md') => {
    if (enableItemRefills) {
      return (
        <RechargeableItemButton
          behavior={behavior}
          context={context}
          size={size}
          variant={itemButtonVariant}
          splitStyle={itemSplitStyle}
          refillStyle={itemRefillStyle}
          badgePlacement={itemBadgePlacement}
          cdDirection={itemCdDirection}
          cdFormat={itemCdFormat}
        />
      );
    }
    return <GenericItemButton behavior={behavior} context={context} size={size} />;
  };

  // If collapsed, show compact floating trigger pill with dynamic item counts
  if (isCollapsed) {
    const summaryText = coreItemBehaviors
      .map((b) => `${b.icon} ×${counts[b.id as keyof typeof counts] ?? 0}`)
      .join(' · ');

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
            ({summaryText})
          </span>
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
      {/* Active Item Overlay Banner directly above the console */}
      {overlay && (
        <div className="w-full flex justify-center mb-2 pointer-events-auto">{overlay}</div>
      )}

      {/* Main Floating Console Deck Frame */}
      <div className="relative flex flex-col items-center justify-between bg-[#fff9f1]/95 dark:bg-zinc-900/95 backdrop-blur-md border-[3px] border-[#4a3422] dark:border-zinc-700 rounded-2xl shadow-2xl px-4 py-3 w-fit max-w-[calc(100vw-2rem)] box-border gap-2.5">
        {/* Row 1: Primary Controls (Random Number, Random Choose, Trackball, Hint, ReCenter) */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 w-full">
          {/* Left: Random Number & Random Choose */}
          <div className="flex items-center justify-end gap-2.5">
            {renderItemButton(randomNumberBehavior)}
            {renderItemButton(randomChooseBehavior)}
          </div>

          {/* Center: Trackball Control */}
          <div className="flex flex-col items-center justify-center relative px-1">
            <TrackballControl />
          </div>

          {/* Right: Hint & Re-Center Pan */}
          <div className="flex items-center justify-start gap-2.5">
            {renderItemButton(hintBehavior)}
            <ReCenterButton />
          </div>
        </div>

        {/* Row 2: Secondary Controls (Omnitile, Pan Mode, Shake) */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 w-full pt-1.5 border-t border-[#edd4b2]/60 dark:border-zinc-800">
          {/* Left: Omnitile */}
          <div className="flex items-center justify-end">
            {renderItemButton(omnitileBehavior, 'sm')}
          </div>

          {/* Center: Pan Mode Toggle */}
          <div className="flex items-center justify-center">
            <PanModeButton />
          </div>

          {/* Right: Shake Item */}
          <div className="flex items-center justify-start">
            {renderItemButton(shakeBehavior, 'sm')}
          </div>
        </div>

        {/* Collapse Mini Button on Console Frame */}
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
