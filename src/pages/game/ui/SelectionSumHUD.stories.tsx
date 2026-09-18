import type { Meta, StoryObj } from '@storybook/react';
import { SelectionSumHUD } from './SelectionSumHUD';

const meta = {
  title: 'Pages/Game/SelectionSumHUD',
  component: SelectionSumHUD,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SelectionSumHUD>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    selectedTiles: [],
    selectedSum: 0,
    diagonalSum: 0,
    isSquareSelection: false,
    activeSelectionType: null,
  },
};

export const BoxSelectionInvalid: Story = {
  args: {
    selectedTiles: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    selectedSum: 7,
    diagonalSum: 0,
    isSquareSelection: false,
    activeSelectionType: 'box',
  },
};

export const BoxSelectionValid10: Story = {
  args: {
    selectedTiles: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    selectedSum: 10,
    diagonalSum: 0,
    isSquareSelection: false,
    activeSelectionType: 'box',
  },
};

export const SquareDualPreviewBoxInvalidDiagValid: Story = {
  args: {
    selectedTiles: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    selectedSum: 16,
    diagonalSum: 10,
    isSquareSelection: true,
    activeSelectionType: 'box',
  },
};

export const PureDiagonalValid10: Story = {
  args: {
    selectedTiles: [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
    ],
    selectedSum: 10,
    diagonalSum: 10,
    isSquareSelection: false,
    activeSelectionType: 'diagonal',
  },
};
