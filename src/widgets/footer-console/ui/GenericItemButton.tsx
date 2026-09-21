import React from 'react';
import type { ItemBehavior, ItemRenderContext, ItemWingColor } from '@/entities/item';

export interface GenericItemButtonProps {
  behavior: ItemBehavior;
  context: ItemRenderContext;
  size?: 'sm' | 'md';
  className?: string;
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

export const GenericItemButton: React.FC<GenericItemButtonProps> = ({
  behavior,
  context,
  size,
  className = '',
  onClick,
}) => {
  const finalSize = behavior.size ?? size ?? 'md';
  const isSm = finalSize === 'sm';

  const label = typeof behavior.label === 'function' ? behavior.label(context) : behavior.label;
  const title = typeof behavior.title === 'function' ? behavior.title(context) : behavior.title;
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
  const disabled =
    typeof behavior.disabled === 'function'
      ? behavior.disabled(context)
      : (behavior.disabled ?? false);

  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
    } else {
      behavior.onActivate(context);
    }
  };

  return (
    <div
      className={`inline-flex items-stretch select-none transition-transform duration-100 ${
        isSm ? 'h-8 text-xs' : 'h-11 text-sm'
      } ${
        disabled
          ? 'opacity-40 pointer-events-none cursor-not-allowed'
          : 'cursor-pointer active:translate-y-0.5 hover:-translate-y-0.5'
      } ${className}`}
      title={title}
      onClick={disabled ? undefined : handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
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
        className={`bg-[#fff9f1] dark:bg-zinc-900 ${
          isSm ? 'border-2 px-2.5 gap-1 text-xs' : 'border-[2.5px] px-3 gap-1.5 text-sm'
        } border-[#4a3422] dark:border-zinc-700 font-mono font-bold flex items-center justify-center shadow-[inset_0_-3px_0px_#edd4b2] dark:shadow-[inset_0_-3px_0px_#27272a] z-[2] text-[#4a3422] dark:text-zinc-100`}
      >
        <span className={`${isSm ? 'text-sm' : 'text-base'} leading-none`}>{behavior.icon}</span>
        {label !== undefined && (
          <span
            className={`${
              isSm ? 'text-[11px]' : 'text-xs'
            } font-black tracking-tight text-[#4a3422] dark:text-zinc-200`}
          >
            {label}
          </span>
        )}
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
