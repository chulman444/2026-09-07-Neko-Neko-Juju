import type { Meta, StoryObj } from '@storybook/react';
import { RivalPawOverlay } from './RivalPawOverlay';
import { useRivalCatStore } from '../model/rivalCatStore';
import { useBoardStore } from '@/entities/board';

const meta = {
  title: 'Features/RivalCats/RivalPawOverlay',
  component: RivalPawOverlay,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      useBoardStore.setState({
        cols: 6,
        rows: 6,
        shapeSize: 50,
        tileBorder: 2,
        matrix: [
          [1, 9, 2, 8, 3, 7],
          [4, 6, 5, 5, 2, 8],
          [3, 7, 1, 9, 4, 6],
          [5, 5, 2, 8, 3, 7],
          [1, 9, 4, 6, 5, 5],
          [2, 8, 3, 7, 1, 9],
        ],
      });
      return (
        <div className="relative w-[324px] h-[324px] bg-amber-50 rounded-xl border border-amber-900/20 shadow-inner">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof RivalPawOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NormalCatTargeting: Story = {
  decorators: [
    (Story) => {
      useRivalCatStore.setState({
        isEnabled: true,
        cats: [
          {
            id: 'cat-normal',
            type: 'normal',
            phase: 'targeting',
            countdown: 3.4,
            targetMatch: [
              { col: 1, row: 1 },
              { col: 2, row: 1 },
            ],
          },
        ],
      });
      return <Story />;
    },
  ],
};

export const ToughCatTargeting: Story = {
  decorators: [
    (Story) => {
      useRivalCatStore.setState({
        isEnabled: true,
        cats: [
          {
            id: 'cat-tough',
            type: 'tough',
            phase: 'targeting',
            countdown: 2.1,
            targetMatch: [
              { col: 3, row: 2 },
              { col: 4, row: 2 },
            ],
          },
        ],
      });
      return <Story />;
    },
  ],
};

export const MultipleCats: Story = {
  decorators: [
    (Story) => {
      useRivalCatStore.setState({
        isEnabled: true,
        showTargets: true,
        showTimer: true,
        cats: [
          {
            id: 'cat-1',
            type: 'normal',
            phase: 'targeting',
            countdown: 2.8,
            targetMatch: [
              { col: 0, row: 0 },
              { col: 1, row: 0 },
            ],
          },
          {
            id: 'cat-2',
            type: 'tough',
            phase: 'targeting',
            countdown: 1.5,
            targetMatch: [
              { col: 4, row: 3 },
              { col: 5, row: 3 },
            ],
          },
        ],
      });
      return <Story />;
    },
  ],
};

export const WithoutTimerAndTargets: Story = {
  decorators: [
    (Story) => {
      useRivalCatStore.setState({
        isEnabled: true,
        showTargets: false,
        showTimer: false,
        cats: [
          {
            id: 'cat-1',
            type: 'normal',
            phase: 'targeting',
            countdown: 2.5,
            targetMatch: [
              { col: 2, row: 2 },
              { col: 3, row: 2 },
            ],
          },
        ],
      });
      return <Story />;
    },
  ],
};
