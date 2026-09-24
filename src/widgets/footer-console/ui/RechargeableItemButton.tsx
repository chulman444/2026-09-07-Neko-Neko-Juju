import React from 'react';
import type { ItemBehavior, ItemRenderContext, ItemWingColor, ItemType } from '@/entities/item';
import { useRechargeableItemStore } from '@/entities/item';

export interface RechargeableItemButtonProps {
  behavior: ItemBehavior;
  context: ItemRenderContext;
  size?: 'sm' | 'md';
  className?: string;
  refillStyle?: 'wipe' | 'spin';
  badgePlacement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  cdDirection?: 'left' | 'right' | 'top' | 'bottom';
  cdFormat?: 'integer' | 'decimal';
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
  badgePlacement = 'bottom-right',
  cdDirection = 'left',
  cdFormat = 'integer',
  onClick,
}) => {
  const item = behavior.id as ItemType;
  const stacks = context.counts[item] ?? 0;

  const maxStacks = useRechargeableItemStore((state) => state.maxStacks[item] ?? 3);
  const gauge = useRechargeableItemStore((state) => state.gauges[item] ?? 0);
  const refillTimer = useRechargeableItemStore((state) => state.refillTimers[item] ?? 0);
  const refillActions = useRechargeableItemStore((state) => state.refillActions[item] ?? 0);
  const activeSpamTimer = useRechargeableItemStore((state) => state.activeSpamTimers[item] ?? 0);
  const spamCooldown = useRechargeableItemStore((state) => state.spamCooldowns[item] ?? 0);

  const finalSize = behavior.size ?? size ?? 'md';
  const isSm = finalSize === 'sm';

  const isFull = stacks >= maxStacks;
  const isRecharging = stacks < maxStacks;

  let cooldownText: string | null = null;
  if (isRecharging) {
    if (refillTimer > 0) {
      const remainingSeconds = Math.max(0, (1 - gauge) * refillTimer);
      if (cdFormat === 'decimal') {
        cooldownText = `${remainingSeconds.toFixed(1)}s`;
      } else {
        cooldownText = `${Math.max(1, Math.ceil(remainingSeconds))}s`;
      }
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

  // Usability & dark overlay logic
  const isUnusable = stacks === 0 || activeSpamTimer > 0;
  const isDisabled = behaviorDisabled || isUnusable;
  const isGrayedOut = behaviorDisabled || stacks === 0;

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
      ? `Recharging: ${cdFormat === 'decimal' ? ((1 - gauge) * refillTimer).toFixed(1) : Math.ceil((1 - gauge) * refillTimer)}s`
      : `Recharging: ${Math.ceil((1 - gauge) * refillActions)} actions left`
    : 'Full charge';
  const tooltip = `${baseTitle} (${stacks}/${maxStacks} stacks - ${refillTooltip})`;

  // Progress sweep only triggers when isUnusable is true
  let showOverlay = false;
  let overlayProgress = 0;
  if (activeSpamTimer > 0 && spamCooldown > 0) {
    showOverlay = true;
    overlayProgress = Math.max(0, Math.min(1, 1 - activeSpamTimer / spamCooldown));
  } else if (stacks === 0) {
    showOverlay = true;
    overlayProgress = Math.max(0, Math.min(1, gauge));
  }

  const progressDeg = Math.min(360, Math.max(0, overlayProgress * 360));
  const wipeRemainingPercent = Math.max(0, Math.min(100, (1 - overlayProgress) * 100));

  const placementClass = {
    'bottom-right': 'bottom-0.5 right-0.5',
    'bottom-left': 'bottom-0.5 left-0.5',
    'top-right': 'top-0.5 right-0.5',
    'top-left': 'top-0.5 left-0.5',
  }[badgePlacement];

  const isTopBadge = badgePlacement.startsWith('top');
  const isVertical = cdDirection === 'top' || cdDirection === 'bottom';

  const cdTab = (
    <div
      className={`flex items-center justify-center bg-[#fff9f1]/95 dark:bg-zinc-800/95 border border-[#4a3422]/60 dark:border-zinc-600 z-0 transition-all duration-300 ease-in-out overflow-hidden ${
        isVertical
          ? cdDirection === 'top'
            ? 'w-auto min-w-[18px] px-0.5 rounded-t-full -mb-1.5 origin-bottom'
            : 'w-auto min-w-[18px] px-0.5 rounded-b-full -mt-1.5 origin-top'
          : `h-4.5 ${
              cdDirection === 'left'
                ? 'rounded-l-full -mr-1.5 origin-right'
                : 'rounded-r-full -ml-1.5 origin-left'
            }`
      } ${
        isFull
          ? isVertical
            ? `max-h-0 py-0 scale-y-0 opacity-0 ${cdDirection === 'top' ? '-mb-0' : '-mt-0'}`
            : `max-w-0 opacity-0 px-0 scale-x-0 ${cdDirection === 'left' ? '-mr-0' : '-ml-0'}`
          : isVertical
            ? `max-h-[24px] scale-y-100 opacity-100 shadow-sm ${
                cdDirection === 'top' ? 'pt-1 pb-2' : 'pt-2 pb-1'
              }`
            : `max-w-[48px] opacity-100 scale-x-100 shadow-sm ${
                cdDirection === 'left' ? 'pl-1.5 pr-2' : 'pl-2 pr-1.5'
              }`
      }`}
    >
      <span className="text-[8px] font-mono font-black leading-none text-amber-700 dark:text-amber-400 whitespace-nowrap">
        {cooldownText ?? ''}
      </span>
    </div>
  );

  const circularIndicator = (
    <div className="relative z-10 w-5 h-5 flex items-center justify-center rounded-full bg-[#fff9f1] dark:bg-zinc-900 border border-[#4a3422]/70 dark:border-zinc-600 shadow-sm shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[#4a3422]/15 dark:text-zinc-700"
        />
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke={isFull ? '#10b981' : '#f59e0b'}
          strokeWidth="2"
          strokeDasharray={50.265}
          strokeDashoffset={50.265 * (1 - (isFull ? 1 : Math.max(0, Math.min(1, gauge))))}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <span
        className={`relative z-10 text-[8px] font-mono font-black leading-none ${
          stacks === 0
            ? 'text-zinc-400 dark:text-zinc-500'
            : isFull
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-[#4a3422] dark:text-zinc-100'
        }`}
      >
        {stacks}/{maxStacks}
      </span>
    </div>
  );

  return (
    <div
      className={`inline-flex items-stretch select-none transition-transform duration-100 ${
        isSm ? 'h-8 text-xs' : 'h-11 text-sm'
      } ${isGrayedOut ? 'opacity-50 grayscale' : ''} ${
        isDisabled
          ? 'cursor-not-allowed pointer-events-none'
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
        {/* Dark Refill / Spam Lockout Overlay (Animated Sweep) */}
        {showOverlay &&
          (refillStyle === 'wipe' ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-[1] bg-black/45 border-b border-amber-400/80 transition-[height] duration-75"
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
            isSm
              ? isTopBadge
                ? 'text-sm translate-y-1'
                : 'text-sm -translate-y-1'
              : isTopBadge
                ? 'text-base translate-y-1'
                : 'text-base -translate-y-1'
          } leading-none select-none`}
        >
          {behavior.icon}
        </span>

        {/* Joint Badge: Circular Charge Indicator & Docked CD Tab */}
        <div
          className={`absolute ${placementClass} z-[3] flex ${
            isVertical ? 'flex-col' : 'flex-row'
          } items-center pointer-events-none select-none`}
        >
          {['left', 'top'].includes(cdDirection) && cdTab}
          {circularIndicator}
          {['right', 'bottom'].includes(cdDirection) && cdTab}
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
