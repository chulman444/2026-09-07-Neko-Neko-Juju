import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import type { ItemBehavior, ItemRenderContext } from '@/entities/item';
import { useRechargeableItemStore } from '@/entities/item';
import { RechargeableItemButton } from './RechargeableItemButton';

const dummyContext: ItemRenderContext = {
  counts: {
    randomNumber: 2,
    randomChoose: 1,
    omnitile: 0,
    shake: 2,
    hint: 3,
  },
  activeItem: null,
  activeItemStage: 0,
  isToggled: false,
  isPaused: false,
};

const dummyBehavior: ItemBehavior = {
  id: 'randomNumber',
  icon: '🎲',
  title: 'Random Number',
  onActivate: () => {},
};

const meta = {
  title: 'Widgets/FooterConsole/RechargeableItemButton',
  component: RechargeableItemButton,
  parameters: {
    layout: 'centered',
  },
  args: {
    behavior: dummyBehavior,
    context: dummyContext,
    size: 'md',
    refillStyle: 'spin',
    badgePlacement: 'bottom-right',
    cdDirection: 'left',
    cdFormat: 'integer',
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#fdf6ea] dark:bg-zinc-950 flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RechargeableItemButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullCharges: Story = {
  args: {
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 3 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const RechargingSpin: Story = {
  args: {
    refillStyle: 'spin',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 1 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.4 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const RechargingWipe: Story = {
  args: {
    refillStyle: 'wipe',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 2 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.65 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const DepletedRecharging: Story = {
  args: {
    refillStyle: 'spin',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 0 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.2 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const SpamLockout: Story = {
  args: {
    refillStyle: 'spin',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 2 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.3 },
      spamCooldowns: { ...state.spamCooldowns, randomNumber: 0.5 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0.25 },
    }));
  },
};

export const DecimalCountdown: Story = {
  args: {
    cdFormat: 'decimal',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 1 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.42 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const BadgeTopLeftCdRight: Story = {
  args: {
    badgePlacement: 'top-left',
    cdDirection: 'right',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 1 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.5 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const BadgeBottomLeftCdRight: Story = {
  args: {
    badgePlacement: 'bottom-left',
    cdDirection: 'right',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 1 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.5 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const BadgeBottomRightCdTop: Story = {
  args: {
    badgePlacement: 'bottom-right',
    cdDirection: 'top',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 1 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.5 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const BadgeTopRightCdBottom: Story = {
  args: {
    badgePlacement: 'top-right',
    cdDirection: 'bottom',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, randomNumber: 1 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, randomNumber: 0.5 },
      activeSpamTimers: { ...state.activeSpamTimers, randomNumber: 0 },
    }));
  },
};

export const ActionBasedShake: Story = {
  args: {
    behavior: {
      id: 'shake',
      icon: '🔀',
      title: 'Shake Board',
      size: 'sm',
      onActivate: () => {},
    },
    size: 'sm',
    context: {
      ...dummyContext,
      counts: { ...dummyContext.counts, shake: 1 },
    },
  },
  beforeEach: () => {
    useRechargeableItemStore.setState((state) => ({
      ...state,
      gauges: { ...state.gauges, shake: 0.4 },
      activeSpamTimers: { ...state.activeSpamTimers, shake: 0 },
    }));
  },
};
