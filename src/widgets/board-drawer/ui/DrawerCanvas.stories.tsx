import type { Meta, StoryObj } from '@storybook/react';
import { DrawerCanvas } from './DrawerCanvas';
import { useBoardMakerStore } from '@/entities/board-maker';
import { useEffect } from 'react';

const meta = {
  title: 'Widgets/BoardDrawer/DrawerCanvas',
  component: DrawerCanvas,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DrawerCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

const DrawerCanvasStory = () => {
  useEffect(() => {
    useBoardMakerStore.getState().generateBlankBoard(8, 6);
    useBoardMakerStore.getState().addTileAt(0, 0, 5);
    useBoardMakerStore.getState().addTileAt(1, 1, 3);
    useBoardMakerStore.getState().addTileAt(1, 1, 7); // stacked layer
  }, []);

  return <DrawerCanvas />;
};

export const Default: Story = {
  render: () => <DrawerCanvasStory />,
};

const ActiveLayerStory = () => {
  useEffect(() => {
    useBoardMakerStore.getState().generateBlankBoard(8, 6);
    useBoardMakerStore.getState().addTileAt(0, 0, 5);
    useBoardMakerStore.getState().addTileAt(1, 1, 3);
    useBoardMakerStore.getState().addTileAt(1, 1, 7);
    useBoardMakerStore.getState().setActiveLayer(1);
  }, []);

  return <DrawerCanvas />;
};

export const ActiveLayerMode: Story = {
  render: () => <ActiveLayerStory />,
};

const InspectingStory = () => {
  useEffect(() => {
    useBoardMakerStore.getState().generateBlankBoard(8, 6);
    useBoardMakerStore.getState().addTileAt(1, 1, 3);
    useBoardMakerStore.getState().addTileAt(1, 1, 7);
    useBoardMakerStore.getState().addTileAt(1, 1, 9);
    useBoardMakerStore.getState().setInspectedStack({ col: 1, row: 1 });
  }, []);

  return <DrawerCanvas />;
};

export const InspectingStack: Story = {
  render: () => <InspectingStory />,
};
