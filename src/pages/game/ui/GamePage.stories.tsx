import type { Meta, StoryObj } from '@storybook/react';
import { GamePage } from './GamePage';
import { useGameConfigStore } from '@/entities/game-config';

const meta = {
  title: 'Pages/Game/GamePage',
  component: GamePage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof GamePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {
  decorators: [
    (Story) => {
      useGameConfigStore.getState().setPreset('arcade');
      return <Story />;
    },
  ],
};

export const Classic: Story = {
  decorators: [
    (Story) => {
      useGameConfigStore.getState().setPreset('classic');
      return <Story />;
    },
  ],
};

export const Editor: Story = {
  decorators: [
    (Story) => {
      useGameConfigStore.getState().setPreset('editor');
      return <Story />;
    },
  ],
};

export const Roguelite: Story = {
  decorators: [
    (Story) => {
      useGameConfigStore.getState().setPreset('roguelite');
      return <Story />;
    },
  ],
};
