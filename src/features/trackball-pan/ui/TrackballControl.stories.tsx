import type { Meta, StoryObj } from '@storybook/react';
import { TrackballControl } from './TrackballControl';

const meta = {
  title: 'Features/TrackballPan/TrackballControl',
  component: TrackballControl,
  parameters: {
    layout: 'centered',
  },
  args: {},
} satisfies Meta<typeof TrackballControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HighSensitivity: Story = {
  args: {
    sensitivity: 2.5,
  },
};

export const InverseMovement: Story = {
  args: {
    inverseMovement: true,
  },
};
