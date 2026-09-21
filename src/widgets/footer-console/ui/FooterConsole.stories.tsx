import type { Meta, StoryObj } from '@storybook/react';
import { FooterConsole } from './FooterConsole';
import { TrackballControl } from '@/features/trackball-pan';

const meta = {
  title: 'Widgets/FooterConsole',
  component: FooterConsole,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isCollapsed: false,
    onToggleCollapse: () => {},
    centerSlot: <TrackballControl />,
    leftSlot: (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-bold font-mono border border-amber-500/40"
        >
          🎲 ×5
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-900 dark:text-purple-200 text-xs font-bold font-mono border border-purple-500/40"
        >
          🎰 ×3
        </button>
      </div>
    ),
    rightSlot: (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs font-bold font-mono border border-emerald-500/40"
        >
          💡 ×2
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-900 dark:text-blue-200 text-xs font-bold font-mono border border-blue-500/40"
        >
          🔀 ×4
        </button>
      </div>
    ),
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

export const Collapsed: Story = {
  args: {
    isCollapsed: true,
  },
};

export const CustomSlots: Story = {
  args: {
    leftSlot: <span className="text-xs font-bold font-mono">Custom Left</span>,
    centerSlot: <TrackballControl />,
    rightSlot: <span className="text-xs font-bold font-mono">Custom Right</span>,
  },
};
