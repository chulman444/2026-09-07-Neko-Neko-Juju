import React from 'react';
import { useBoardStore } from '@/entities/board';
import { MechanicalItemButton } from './MechanicalItemButton';

export interface PanModeButtonProps {
  className?: string;
}

export const PanModeButton: React.FC<PanModeButtonProps> = ({ className = '' }) => {
  const isPanMode = useBoardStore((state) => state.isPanMode);
  const togglePanMode = useBoardStore((state) => state.togglePanMode);

  return (
    <MechanicalItemButton
      icon="✋"
      size="sm"
      label={isPanMode ? 'PANNING ACTIVE' : 'PAN MODE'}
      title="Toggle Panning Mode: when enabled, drag anywhere on or off the board with Left, Middle, or Right Click to pan"
      leftWingState={isPanMode ? 'amber' : 'inactive'}
      rightWingState={isPanMode ? 'amber' : 'inactive'}
      leftWingTitle={isPanMode ? 'Pan Mode Active' : 'Pan Mode Inactive'}
      rightWingTitle={isPanMode ? 'Pan Mode Active' : 'Pan Mode Inactive'}
      onClick={togglePanMode}
      className={className}
    />
  );
};
