import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useEffect } from 'react';
import { PlayerSettingsModal } from './PlayerSettingsModal';
import { usePlayerStore } from '@/entities/player';

const meta = {
  title: 'Widgets/PlayerSettings/PlayerSettingsModal',
  component: PlayerSettingsModal,
  parameters: {
    layout: 'centered',
  },
  args: {
    onOpenDevTools: fn(),
  },
} satisfies Meta<typeof PlayerSettingsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Opened: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        usePlayerStore.setState({ isSettingsOpen: true });
        return () => {
          usePlayerStore.setState({ isSettingsOpen: false });
        };
      }, []);
      return <Story />;
    },
  ],
};
