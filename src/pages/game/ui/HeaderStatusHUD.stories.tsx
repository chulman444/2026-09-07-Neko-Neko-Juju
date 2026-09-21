import type { Meta, StoryObj } from '@storybook/react';
import { HeaderStatusHUD } from './HeaderStatusHUD';
import { useBoardStore } from '@/entities/board';
import { useGameSessionStore } from '@/entities/game-session';
import { useSolverStore } from '@/features/look-ahead-solver';

const meta = {
  title: 'Pages/Game/HeaderStatusHUD',
  component: HeaderStatusHUD,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof HeaderStatusHUD>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useBoardStore.setState({
        cols: 10,
        rows: 10,
        matrix: Array(10).fill(Array(10).fill(5)),
        initialMatrix: Array(10).fill(Array(10).fill(5)),
        seed: '12345',
      });
      useGameSessionStore.setState({
        score: 150,
        clearedTiles: 18,
      });
      useSolverStore.setState({
        combinations: [],
      });
      return (
        <div className="p-4 bg-amber-50/20 dark:bg-zinc-950">
          <Story />
        </div>
      );
    },
  ],
};
