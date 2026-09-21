import type { ItemBehavior } from '@/entities/item';
import { useItemStore } from '@/entities/item';
import { useGameSessionStore } from '@/entities/game-session';
import { useCoreItemsStore, isBoardUnsolvable } from './coreItemsStore';
import { RandomNumberOverlay, RandomChooseOverlay, OmnitileOverlay } from '../ui/ItemOverlays';

export const randomNumberBehavior: ItemBehavior = {
  id: 'randomNumber',
  icon: '🎲',
  label: (ctx) => `×${ctx.counts.randomNumber}`,
  title: (ctx) => {
    const isActive = ctx.isToggled && ctx.activeItem === 'randomNumber';
    if (!isActive)
      return `Random Number (${ctx.counts.randomNumber} left). Click to arm Stage 1 (Single Use).`;
    if (ctx.activeItemStage === 1)
      return `Random Number: Stage 1 (Single Use). Click again to advance to Stage 2 (Multi-Use).`;
    return `Random Number: Stage 2 (Multi-Use Active). Click to disarm.`;
  },
  leftWingState: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'randomNumber' && ctx.activeItemStage >= 1
      ? 'amber'
      : 'inactive',
  rightWingState: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'randomNumber' && ctx.activeItemStage === 2
      ? 'amber'
      : 'inactive',
  leftWingTitle: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'randomNumber' ? 'Stage 1 Active (Single Use)' : 'Disarmed',
  rightWingTitle: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'randomNumber' && ctx.activeItemStage === 2
      ? 'Stage 2 Active (Multi-Use Mode)'
      : 'Stage 2 Inactive',
  disabled: (ctx) => ctx.isPaused || ctx.counts.randomNumber <= 0,
  onActivate: () => useCoreItemsStore.getState().toggleItem('randomNumber'),
  renderOverlay: () => <RandomNumberOverlay />,
};

export const randomChooseBehavior: ItemBehavior = {
  id: 'randomChoose',
  icon: '🎰',
  label: (ctx) => `×${ctx.counts.randomChoose}`,
  title: (ctx) => {
    const isActive = ctx.isToggled && ctx.activeItem === 'randomChoose';
    if (!isActive)
      return `Random Choose (${ctx.counts.randomChoose} left). Click to arm Stage 1 (Single Use).`;
    if (ctx.activeItemStage === 1)
      return `Random Choose: Stage 1 (Single Use). Click again to advance to Stage 2 (Multi-Use).`;
    return `Random Choose: Stage 2 (Multi-Use Active). Click to disarm.`;
  },
  leftWingState: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'randomChoose' && ctx.activeItemStage >= 1
      ? 'purple'
      : 'inactive',
  rightWingState: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'randomChoose' && ctx.activeItemStage === 2
      ? 'purple'
      : 'inactive',
  leftWingTitle: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'randomChoose' ? 'Stage 1 Active (Single Use)' : 'Disarmed',
  rightWingTitle: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'randomChoose' && ctx.activeItemStage === 2
      ? 'Stage 2 Active (Multi-Use Mode)'
      : 'Stage 2 Inactive',
  disabled: (ctx) => ctx.isPaused || ctx.counts.randomChoose <= 0,
  onActivate: () => useCoreItemsStore.getState().toggleItem('randomChoose'),
  renderOverlay: () => <RandomChooseOverlay />,
};

export const omnitileBehavior: ItemBehavior = {
  id: 'omnitile',
  icon: '⭐',
  size: 'sm',
  label: (ctx) => `×${ctx.counts.omnitile}`,
  title: (ctx) => {
    const isActive = ctx.isToggled && ctx.activeItem === 'omnitile';
    if (!isActive)
      return `Omnitile (${ctx.counts.omnitile} left). Click to arm Stage 1 (Single Use). Acts as 0-10 on selection.`;
    if (ctx.activeItemStage === 1)
      return `Omnitile: Stage 1 (Single Use). Click again to advance to Stage 2 (Multi-Use).`;
    return `Omnitile: Stage 2 (Multi-Use Active). Click to disarm.`;
  },
  leftWingState: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'omnitile' && ctx.activeItemStage >= 1
      ? 'amber'
      : 'inactive',
  rightWingState: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'omnitile' && ctx.activeItemStage === 2
      ? 'amber'
      : 'inactive',
  leftWingTitle: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'omnitile' ? 'Stage 1 Active (Single Use)' : 'Disarmed',
  rightWingTitle: (ctx) =>
    ctx.isToggled && ctx.activeItem === 'omnitile' && ctx.activeItemStage === 2
      ? 'Stage 2 Active (Multi-Use Mode)'
      : 'Stage 2 Inactive',
  disabled: (ctx) => ctx.isPaused || ctx.counts.omnitile <= 0,
  onActivate: () => useCoreItemsStore.getState().toggleItem('omnitile'),
  renderOverlay: () => <OmnitileOverlay />,
};

export const hintBehavior: ItemBehavior = {
  id: 'hint',
  icon: '💡',
  label: (ctx) => `×${ctx.counts.hint}`,
  title: (ctx) =>
    `Hint Item (${ctx.counts.hint} left). Highlights valid Match-10 groups on the board.`,
  leftWingState: () => (useCoreItemsStore.getState().hintSuccessFlash ? 'emerald' : 'inactive'),
  rightWingState: () => (useCoreItemsStore.getState().hintSuccessFlash ? 'emerald' : 'inactive'),
  leftWingTitle: () => 'Hint Indicator',
  rightWingTitle: () => 'Hint Indicator',
  disabled: (ctx) => ctx.isPaused || ctx.counts.hint <= 0,
  onActivate: () => {
    const isPaused = useGameSessionStore.getState().isPaused;
    const counts = useItemStore.getState().counts;
    if (isPaused || counts.hint <= 0) return;
    useCoreItemsStore.getState().triggerHintItem(false);
  },
};

export const shakeBehavior: ItemBehavior = {
  id: 'shake',
  icon: '🔀',
  size: 'sm',
  label: (ctx) => {
    const unsolvable = isBoardUnsolvable();
    return unsolvable ? 'FREE' : `×${ctx.counts.shake}`;
  },
  title: (ctx) => {
    const unsolvable = isBoardUnsolvable();
    return unsolvable
      ? 'No clearable moves remaining! Free Shake is available to break deadlock.'
      : `Shake Item (${ctx.counts.shake} left). Shuffles live tile positions.`;
  },
  leftWingState: () => {
    const { shakeSuccessFlash } = useCoreItemsStore.getState();
    const unsolvable = isBoardUnsolvable();
    return shakeSuccessFlash ? 'emerald' : unsolvable ? 'emerald' : 'inactive';
  },
  rightWingState: () => {
    const { shakeSuccessFlash } = useCoreItemsStore.getState();
    const unsolvable = isBoardUnsolvable();
    return shakeSuccessFlash ? 'emerald' : unsolvable ? 'emerald' : 'inactive';
  },
  leftWingTitle: () => (isBoardUnsolvable() ? 'Free Shake Available' : 'Shake'),
  rightWingTitle: () => (isBoardUnsolvable() ? 'Free Shake Available' : 'Shake'),
  disabled: (ctx) => {
    if (ctx.isPaused) return true;
    const unsolvable = isBoardUnsolvable();
    return !unsolvable && ctx.counts.shake <= 0;
  },
  onActivate: () => {
    const isPaused = useGameSessionStore.getState().isPaused;
    if (isPaused) return;
    const unsolvable = isBoardUnsolvable();
    const counts = useItemStore.getState().counts;
    if (!unsolvable && counts.shake <= 0) return;
    useCoreItemsStore.getState().triggerShakeItem(unsolvable);
  },
};

export const coreItemBehaviors: ItemBehavior[] = [
  randomNumberBehavior,
  randomChooseBehavior,
  omnitileBehavior,
  hintBehavior,
  shakeBehavior,
];
