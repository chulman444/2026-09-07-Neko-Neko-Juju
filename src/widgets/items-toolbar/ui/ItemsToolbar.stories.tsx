import type { Meta, StoryObj } from '@storybook/react';
import { ItemsToolbar } from './ItemsToolbar';
import { useItemStore } from '@/entities/item';
import {
  coreItemBehaviors,
  randomNumberBehavior,
  randomChooseBehavior,
} from '@/features/core-items';

const meta = {
  title: 'Widgets/ItemsToolbar/ItemsToolbar',
  component: ItemsToolbar,
  parameters: {
    layout: 'centered',
  },
  args: {
    items: coreItemBehaviors,
  },
  decorators: [
    (Story) => {
      useItemStore.setState({
        counts: { randomNumber: 5, randomChoose: 3, omnitile: 2, shake: 4, hint: 5 },
        activeItem: null,
        isToggled: false,
        activeItemStage: 0,
      });
      return (
        <div className="p-8 bg-[#fdf6ea] dark:bg-zinc-950 flex items-center justify-center">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof ItemsToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ArmedRandomNumber: Story = {
  decorators: [
    (Story) => {
      useItemStore.setState({
        counts: { randomNumber: 5, randomChoose: 3, omnitile: 2, shake: 4, hint: 5 },
        activeItem: 'randomNumber',
        isToggled: true,
        activeItemStage: 1,
      });
      return (
        <div className="p-8 bg-[#fdf6ea] dark:bg-zinc-950 flex items-center justify-center">
          <Story />
        </div>
      );
    },
  ],
};

export const SubsetItems: Story = {
  args: {
    items: [randomNumberBehavior, randomChooseBehavior],
  },
};
