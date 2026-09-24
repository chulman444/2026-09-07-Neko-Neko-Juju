import type { Meta, StoryObj } from '@storybook/react';
import { ItemRefillsConfigSection } from './ItemRefillsConfigSection';

const meta = {
  title: 'Widgets/ItemsPanel/ItemRefillsConfigSection',
  component: ItemRefillsConfigSection,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
} satisfies Meta<typeof ItemRefillsConfigSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
