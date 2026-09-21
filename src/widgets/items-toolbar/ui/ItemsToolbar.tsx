import React from 'react';
import type { ItemBehavior, ItemRenderContext } from '@/entities/item';
import { useItemStore } from '@/entities/item';
import { useGameSessionStore } from '@/entities/game-session';
import { coreItemBehaviors } from '@/features/core-items';
import { GenericItemButton } from './GenericItemButton';

export interface ItemsToolbarProps {
  items?: ItemBehavior[];
  activeItems?: ItemBehavior[];
  className?: string;
  itemClassName?: string;
  direction?: 'row' | 'column';
  size?: 'sm' | 'md';
}

export const ItemsToolbar: React.FC<ItemsToolbarProps> = ({
  items: itemsProp,
  activeItems,
  className = '',
  itemClassName = '',
  direction = 'row',
  size,
}) => {
  const items = itemsProp ?? activeItems ?? coreItemBehaviors;

  const counts = useItemStore((state) => state.counts);
  const activeItem = useItemStore((state) => state.activeItem);
  const activeItemStage = useItemStore((state) => state.activeItemStage);
  const isToggled = useItemStore((state) => state.isToggled);
  const isPaused = useGameSessionStore((state) => state.isPaused);

  const context: ItemRenderContext = {
    counts,
    activeItem,
    activeItemStage,
    isToggled,
    isPaused,
  };

  const activeBehavior = items.find((it) => it.id === activeItem);
  const overlay =
    isToggled && activeBehavior?.renderOverlay ? activeBehavior.renderOverlay(context) : null;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Active Item Overlay Banner / Choice Deck */}
      {overlay && (
        <div className="w-full flex justify-center mb-2 pointer-events-auto">{overlay}</div>
      )}

      {/* Item Buttons Container */}
      <div
        className={`flex items-center gap-2.5 ${direction === 'column' ? 'flex-col' : 'flex-row'}`}
      >
        {items.map((behavior) => (
          <GenericItemButton
            key={behavior.id}
            behavior={behavior}
            context={context}
            size={size}
            className={itemClassName}
          />
        ))}
      </div>
    </div>
  );
};
