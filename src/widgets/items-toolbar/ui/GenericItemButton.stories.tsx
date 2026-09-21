import type { Meta, StoryObj } from '@storybook/react';
import { GenericItemButton } from './GenericItemButton';
import { randomNumberBehavior, randomChooseBehavior, shakeBehavior } from '@/features/core-items';
import type { ItemRenderContext } from '@/entities/item';

const defaultContext: ItemRenderContext = {
  counts: { randomNumber: 5, randomChoose: 3, omnitile: 2, shake: 4, hint: 5 },
  activeItem: null,
  activeItemStage: 0,
  isToggled: false,
  isPaused: false,
};

const meta = {
  title: 'Widgets/ItemsToolbar/GenericItemButton',
  component: GenericItemButton,
  parameters: {
    layout: 'centered',
  },
  args: {
    behavior: randomNumberBehavior,
    context: defaultContext,
  },
} satisfies Meta<typeof GenericItemButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Stage1Armed: Story = {
  args: {
    behavior: randomNumberBehavior,
    context: {
      ...defaultContext,
      activeItem: 'randomNumber',
      activeItemStage: 1,
      isToggled: true,
    },
  },
};

export const Stage2Armed: Story = {
  args: {
    behavior: randomChooseBehavior,
    context: {
      ...defaultContext,
      activeItem: 'randomChoose',
      activeItemStage: 2,
      isToggled: true,
    },
  },
};

export const Disabled: Story = {
  args: {
    behavior: randomNumberBehavior,
    context: {
      ...defaultContext,
      counts: { ...defaultContext.counts, randomNumber: 0 },
    },
  },
};

export const ShakeItem: Story = {
  args: {
    behavior: shakeBehavior,
    context: defaultContext,
  },
};
