import type { Meta, StoryObj } from '@storybook/react';
import { ItemsPanelWidget } from './ItemsPanelWidget';

const meta = {
  title: 'Widgets/ItemsPanel/ItemsPanelWidget',
  component: ItemsPanelWidget,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
} satisfies Meta<typeof ItemsPanelWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
