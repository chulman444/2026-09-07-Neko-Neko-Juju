import type { Meta, StoryObj } from '@storybook/react';
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
    onClick: () => {},
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
    }));
  },
};
