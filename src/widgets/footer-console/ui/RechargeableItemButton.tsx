import React from 'react';
import type { ItemBehavior, ItemRenderContext, ItemWingColor, ItemType } from '@/entities/item';
import { useRechargeableItemStore } from '@/entities/item';

export interface RechargeableItemButtonProps {
  behavior: ItemBehavior;
  context: ItemRenderContext;
  size?: 'sm' | 'md';
  className?: string;
  refillStyle?: 'wipe' | 'spin';
  onClick?: () => void;
}

function getWingBgClass(state: ItemWingColor): string {
  switch (state) {
    case 'active':
    case 'amber':
      return 'bg-[#ffba53] dark:bg-amber-500 shadow-[0_0_8px_rgba(255,186,83,0.6)]';
    case 'purple':
      return 'bg-[#c084fc] dark:bg-purple-500 shadow-[0_0_8px_rgba(192,132,252,0.6)]';
    case 'success':
    case 'emerald':
      return 'bg-[#2ca87c] dark:bg-emerald-500 shadow-[0_0_8px_rgba(44,168,124,0.6)]';
    case 'inactive':
    default:
      return 'bg-[#f0e9dd] dark:bg-zinc-800';
  }
}

export const RechargeableItemButton: React.FC<RechargeableItemButtonProps> = ({
  behavior,
  context,
  size,
  className = '',
  refillStyle = 'spin',
  onClick,
}) => {
  const item = behavior.id as ItemType;
  const stacks = context.counts[item] ?? 0;

  const maxStacks = useRechargeableItemStore((state) => state.maxStacks[item] ?? 3);
  const gauge = useRechargeableItemStore((state) => state.gauges[item] ?? 0);
  const refillTimer = useRechargeableItemStore((state) => state.refillTimers[item] ?? 0);
  const refillActions = useRechargeableItemStore((state) => state.refillActions[item] ?? 0);

  const finalSize = behavior.size ?? size ?? 'md';
  const isSm = finalSize === 'sm';

  const isRecharging = stacks < maxStacks;

  let cooldownText: string | null = null;
  if (isRecharging) {
    if (refillTimer > 0) {
      const remainingSeconds = Math.max(1, Math.ceil((1 - gauge) * refillTimer));
      cooldownText = `${remainingSeconds}s`;
    } else if (refillActions > 0) {
      const remainingHits = Math.max(1, Math.ceil((1 - gauge) * refillActions));
      cooldownText = `${remainingHits}`;
    }
  }

  const leftWingState =
    typeof behavior.leftWingState === 'function'
      ? behavior.leftWingState(context)
      : (behavior.leftWingState ?? 'inactive');
  const rightWingState =
    typeof behavior.rightWingState === 'function'
      ? behavior.rightWingState(context)
      : (behavior.rightWingState ?? 'inactive');
  const leftWingTitle =
    typeof behavior.leftWingTitle === 'function'
      ? behavior.leftWingTitle(context)
      : behavior.leftWingTitle;
  const rightWingTitle =
    typeof behavior.rightWingTitle === 'function'
      ? behavior.rightWingTitle(context)
      : behavior.rightWingTitle;

  const behaviorDisabled =
    typeof behavior.disabled === 'function'
      ? behavior.disabled(context)
      : (behavior.disabled ?? false);

  // LoL-Style visual logic: only disabled & grayed out when stacks === 0
  const isDisabled = behaviorDisabled || stacks === 0;

  const handleClick = () => {
    if (isDisabled) return;
    if (onClick) {
      onClick();
    } else {
      behavior.onActivate(context);
    }
  };

  const baseTitle = typeof behavior.title === 'function' ? behavior.title(context) : behavior.title;
  const refillTooltip = isRecharging
    ? refillTimer > 0
      ? `Recharging: ${Math.ceil((1 - gauge) * refillTimer)}s`
      : `Recharging: ${Math.ceil((1 - gauge) * refillActions)} actions left`
    : 'Full charge';
  const tooltip = `${baseTitle} (${stacks}/${maxStacks} stacks - ${refillTooltip})`;

  const progressDeg = Math.min(360, Math.max(0, gauge * 360));
  const wipeRemainingPercent = Math.max(0, Math.min(100, (1 - gauge) * 100));

  return (
    <div
      className={`inline-flex items-stretch select-none transition-transform duration-100 ${
        isSm ? 'h-8 text-xs' : 'h-11 text-sm'
      } ${
        isDisabled
          ? 'opacity-50 grayscale cursor-not-allowed pointer-events-none'
          : 'cursor-pointer active:translate-y-0.5 hover:-translate-y-0.5'
      } ${className}`}
      title={tooltip}
      onClick={isDisabled ? undefined : handleClick}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Left Wing Indicator */}
      <div
        className={`${
          isSm ? 'w-2 border-2' : 'w-2.5 border-[2.5px]'
        } border-[#4a3422] dark:border-zinc-700 border-r-0 rounded-l-lg transition-colors duration-150 ${getWingBgClass(
          leftWingState
        )}`}
        title={leftWingTitle}
      />

      {/* Center Core Button Deck */}
      <div
        className={`relative overflow-hidden bg-[#fff9f1] dark:bg-zinc-900 ${
          isSm
            ? 'min-w-[56px] h-full border-2 px-1.5 text-xs'
            : 'min-w-[64px] h-full border-[2.5px] px-2 text-sm'
        } border-[#4a3422] dark:border-zinc-700 font-mono font-bold flex flex-col items-center justify-center shadow-[inset_0_-3px_0px_#edd4b2] dark:shadow-[inset_0_-3px_0px_#27272a] text-[#4a3422] dark:text-zinc-100`}
      >
        {/* Refill Gauge Overlay (Animated Sweep) */}
        {isRecharging &&
          (refillStyle === 'wipe' ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-[1] bg-black/40 border-b border-amber-400/80 transition-[height] duration-75"
              style={{ height: `${wipeRemainingPercent}%` }}
            />
          ) : (
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background: `conic-gradient(from 0deg at 50% 50%, transparent ${progressDeg}deg, rgba(0, 0, 0, 0.45) ${progressDeg}deg 360deg)`,
              }}
            />
          ))}

        {/* Central Icon */}
        <span
          className={`relative z-[2] ${
            isSm ? 'text-sm -translate-y-1' : 'text-base -translate-y-1'
          } leading-none select-none`}
        >
          {behavior.icon}
        </span>

        {/* Bottom Sub-HUD: Cooldown Indicator (Bottom-Left) & Stacks (Bottom-Right) */}
        <div className="absolute inset-x-1 bottom-0.5 z-[2] flex items-center justify-between pointer-events-none leading-none">
          {/* Bottom-Left: Cooldown Countdown or Action Hits */}
          <span className="text-[9px] font-mono font-black text-amber-600 dark:text-amber-400 drop-shadow">
            {cooldownText ?? ''}
          </span>

          {/* Bottom-Right: Current/Max Stacks */}
          <span
            className={`text-[9px] font-mono font-black ${
              stacks === 0 ? 'text-zinc-400' : 'text-[#4a3422] dark:text-zinc-200'
            } drop-shadow`}
          >
            {stacks}/{maxStacks}
          </span>
        </div>
      </div>

      {/* Right Wing Indicator */}
      <div
        className={`${
          isSm ? 'w-2 border-2' : 'w-2.5 border-[2.5px]'
        } border-[#4a3422] dark:border-zinc-700 border-l-0 rounded-r-lg transition-colors duration-150 ${getWingBgClass(
          rightWingState
        )}`}
        title={rightWingTitle}
      />
    </div>
  );
};
