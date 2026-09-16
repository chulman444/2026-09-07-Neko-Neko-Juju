import type { Meta, StoryObj } from '@storybook/react';
import { BoardMakerPage } from './BoardMakerPage';

const meta = {
  title: 'Pages/BoardMaker/BoardMakerPage',
  component: BoardMakerPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BoardMakerPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
