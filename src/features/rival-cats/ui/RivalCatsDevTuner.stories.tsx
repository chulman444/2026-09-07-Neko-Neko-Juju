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
        defeatCondition: 'any_overlap',
        dormantDuration: 6,
        spawnInterval: 5,
        stealDuration: 4,
        pushbackPerClear: 1.5,
        toughCatPushbackBonus: -0.5,
        stolenTilesCount: 8,
        rivalCatInterval: 5,
        rivalCatCountdown: 3.2,
        activeRivalCats: 2,
        cats: [
          {
            id: 'cat-1',
            type: 'normal',
            phase: 'targeting',
            countdown: 3.2,
            targetMatch: [
              { col: 0, row: 1 },
              { col: 1, row: 1 },
            ],
          },
          {
            id: 'cat-2',
            type: 'tough',
            phase: 'idle',
            countdown: 4.5,
            targetMatch: null,
          },
        ],
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
        defeatCondition: 'exact_match',
        dormantDuration: 6,
        spawnInterval: 5,
        stealDuration: 4,
        pushbackPerClear: 1.5,
        toughCatPushbackBonus: -0.5,
        stolenTilesCount: 0,
        rivalCatInterval: 5,
        rivalCatCountdown: 5,
        activeRivalCats: 1,
        cats: [
          {
            id: 'cat-1',
            type: 'normal',
            phase: 'idle',
            countdown: 5,
            targetMatch: null,
          },
        ],
      });
      return (
        <div className="w-80 bg-zinc-900 p-4 rounded-xl text-white">
          <Story />
        </div>
      );
    },
  ],
};
