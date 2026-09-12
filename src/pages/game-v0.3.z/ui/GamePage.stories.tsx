import type { Meta, StoryObj } from '@storybook/react';
import { GamePage } from './GamePage';

const meta = {
  title: 'Pages/Game-v0.3.z/GamePage',
  component: GamePage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof GamePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
