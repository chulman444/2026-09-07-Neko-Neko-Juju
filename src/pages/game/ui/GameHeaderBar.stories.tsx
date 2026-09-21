import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { GameHeaderBar } from './GameHeaderBar';
import { useGameConfigStore } from '@/entities/game-config';

const meta = {
  title: 'Pages/Game/GameHeaderBar',
  component: GameHeaderBar,
  parameters: {
    layout: 'centered',
  },
  args: {
    showSidePanel: false,
    setShowSidePanel: fn(),
    showItemArea: true,
    setShowItemArea: fn(),
    onRetryGame: fn(),
    onNewGame: fn(),
    onNextBoard: fn(),
  },
} satisfies Meta<typeof GameHeaderBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useGameConfigStore.getState().setPreset('arcade');
      return (
        <div className="w-[720px] p-4 bg-amber-50/20 dark:bg-zinc-950">
          <Story />
        </div>
      );
    },
  ],
};
