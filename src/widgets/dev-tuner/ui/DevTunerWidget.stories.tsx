import type { Meta, StoryObj } from '@storybook/react';
import { DevTunerWidget } from './DevTunerWidget';

const meta = {
  title: 'Widgets/DevTuner/DevTunerWidget',
  component: DevTunerWidget,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[380px] md:w-[420px] max-w-[92vw] bg-zinc-900/95 p-4 rounded-xl border border-zinc-700/80 shadow-2xl text-zinc-200">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DevTunerWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
