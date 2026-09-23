import type { Meta, StoryObj } from '@storybook/react';
import { FooterConsole } from './FooterConsole';

const meta = {
  title: 'Widgets/FooterConsole',
  component: FooterConsole,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isCollapsed: false,
    onToggleCollapse: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-full min-h-[300px] bg-[#fdf6ea] dark:bg-zinc-950 relative flex items-center justify-center p-8">
        <div className="text-zinc-400 text-sm font-mono text-center">
          Board Canvas Area (Panned view responds to trackball)
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FooterConsole>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ClassicMode: Story = {
  decorators: [
    (Story) => {
      // In classic mode, item refills is disabled
      return <Story />;
    },
  ],
};

export const Collapsed: Story = {
  args: {
    isCollapsed: true,
  },
};
