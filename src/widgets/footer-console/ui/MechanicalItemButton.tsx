import React from 'react';

export type WingState = 'inactive' | 'active' | 'success' | 'amber' | 'purple' | 'emerald';

export interface MechanicalItemButtonProps {
  icon: React.ReactNode;
  label?: string | number;
  title: string;
  leftWingState?: WingState;
  rightWingState?: WingState;
  leftWingTitle?: string;
  rightWingTitle?: string;
  onRightWingClick?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

function getWingBgClass(state: WingState): string {
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

export const MechanicalItemButton: React.FC<MechanicalItemButtonProps> = ({
  icon,
  label,
  title,
  leftWingState = 'inactive',
  rightWingState = 'inactive',
  leftWingTitle,
  rightWingTitle,
  onRightWingClick,
  onClick,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-stretch select-none transition-transform duration-100 h-11 ${
        disabled
          ? 'opacity-40 pointer-events-none cursor-not-allowed'
          : 'cursor-pointer active:translate-y-0.5 hover:-translate-y-0.5'
      } ${className}`}
      title={title}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Left Wing Indicator */}
      <div
        className={`w-2.5 border-[2.5px] border-[#4a3422] dark:border-zinc-700 border-r-0 rounded-l-lg transition-colors duration-150 ${getWingBgClass(
          leftWingState
        )}`}
        title={leftWingTitle}
      />

      {/* Center Core Button Deck */}
      <div className="bg-[#fff9f1] dark:bg-zinc-900 border-[2.5px] border-[#4a3422] dark:border-zinc-700 px-3 font-mono text-sm font-bold flex items-center justify-center gap-1.5 shadow-[inset_0_-3px_0px_#edd4b2] dark:shadow-[inset_0_-3px_0px_#27272a] z-[2] text-[#4a3422] dark:text-zinc-100">
        <span className="text-base leading-none">{icon}</span>
        {label !== undefined && (
          <span className="text-xs font-black tracking-tight text-[#4a3422] dark:text-zinc-200">
            {label}
          </span>
        )}
      </div>

      {/* Right Wing Indicator / Optional Multi-use Toggle Click Target */}
      <div
        className={`w-2.5 border-[2.5px] border-[#4a3422] dark:border-zinc-700 border-l-0 rounded-r-lg transition-colors duration-150 ${getWingBgClass(
          rightWingState
        )} ${onRightWingClick ? 'hover:opacity-80' : ''}`}
        title={rightWingTitle}
        onClick={(e) => {
          if (onRightWingClick && !disabled) {
            e.stopPropagation();
            onRightWingClick(e);
          }
        }}
      />
    </div>
  );
};
