import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { SolverPanelWidget } from './SolverPanelWidget';

const meta = {
  title: 'Widgets/SolverPanel/SolverPanelWidget',
  component: SolverPanelWidget,
  parameters: {
    layout: 'centered',
  },
  args: {
    onClose: fn(),
    onHighlightTiles: fn(),
    onClearMatch: fn(),
  },
} satisfies Meta<typeof SolverPanelWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
