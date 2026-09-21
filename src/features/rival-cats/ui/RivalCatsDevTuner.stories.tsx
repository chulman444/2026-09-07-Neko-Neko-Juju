import type { Meta, StoryObj } from '@storybook/react';
import { RivalCatsDevTuner } from './RivalCatsDevTuner';
import { useRivalCatStore } from '../model/rivalCatStore';

const meta = {
  title: 'Features/RivalCats/RivalCatsDevTuner',
  component: RivalCatsDevTuner,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      useRivalCatStore.setState({
        isEnabled: true,
        rivalCatInterval: 5,
        rivalCatCountdown: 3.2,
        activeRivalCats: 1,
        stolenTilesCount: 8,
      });
      return (
        <div className="w-80 bg-zinc-900 p-4 rounded-xl text-white">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof RivalCatsDevTuner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  decorators: [
    (Story) => {
      useRivalCatStore.setState({
        isEnabled: false,
        rivalCatInterval: 5,
        rivalCatCountdown: 5,
        activeRivalCats: 1,
        stolenTilesCount: 0,
      });
      return (
        <div className="w-80 bg-zinc-900 p-4 rounded-xl text-white">
          <Story />
        </div>
      );
    },
  ],
};
