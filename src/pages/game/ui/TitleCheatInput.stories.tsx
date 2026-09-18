import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { TitleCheatInput } from './TitleCheatInput';

const meta = {
  title: 'Pages/Game/TitleCheatInput',
  component: TitleCheatInput,
  parameters: {
    layout: 'centered',
  },
  args: {
    onCheatSuccess: fn(),
    titleText: 'Neko Neko Juju',
  },
} satisfies Meta<typeof TitleCheatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
