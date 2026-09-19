import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { MacroLoopManagerWidget } from './MacroLoopManagerWidget';
import { useMacroLoopStore } from '@/entities/macro-loop';

const meta = {
  title: 'Widgets/MacroLoopManager/MacroLoopManagerWidget',
  component: MacroLoopManagerWidget,
  parameters: {
    layout: 'centered',
  },
  args: {
    onPlayBoard: fn(),
    onSwitchTab: fn(),
    onLoadIntoGenerator: fn(),
  },
  decorators: [
    (Story) => {
      return (
        <div className="w-[400px] p-2 bg-zinc-950">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof MacroLoopManagerWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    useMacroLoopStore.getState().resetMacroLoop();
  },
};

export const WhileEditingBoard1: Story = {
  beforeEach: () => {
    useMacroLoopStore.getState().resetMacroLoop();
    useMacroLoopStore.getState().startEditing(0);
  },
};

export const WithPlayedHistoryAndSolidBlocks: Story = {
  beforeEach: () => {
    useMacroLoopStore.getState().resetMacroLoop();
    useMacroLoopStore.getState().advanceToNextBoard(450, [
      { col: 1, row: 1, val: 7 },
      { col: 2, row: 3, val: 9 },
    ]);
  },
};
