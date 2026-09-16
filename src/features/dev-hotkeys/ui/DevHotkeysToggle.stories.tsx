import type { Meta, StoryObj } from '@storybook/react';
import { DevHotkeysToggle } from './DevHotkeysToggle';
import { useDevHotkeysStore } from '../model/devHotkeysStore';

const meta = {
  title: 'Features/DevHotkeys/DevHotkeysToggle',
  component: DevHotkeysToggle,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] bg-zinc-900/95 p-4 rounded-xl border border-zinc-700/80 shadow-2xl text-zinc-200">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DevHotkeysToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultDisabled: Story = {
  beforeEach: () => {
    useDevHotkeysStore.setState({ isDevHotkeysEnabled: false });
  },
};

export const Enabled: Story = {
  beforeEach: () => {
    useDevHotkeysStore.setState({ isDevHotkeysEnabled: true });
  },
};
