import React from 'react';
import { useBoardStore } from '@/entities/board';
import { MechanicalItemButton } from './MechanicalItemButton';

export interface ReCenterButtonProps {
  className?: string;
}

export const ReCenterButton: React.FC<ReCenterButtonProps> = ({ className = '' }) => {
  const panOffset = useBoardStore((state) => state.panOffset);
  const resetPanOffset = useBoardStore((state) => state.resetPanOffset);
  const isPanned = Math.abs(panOffset.x) > 1 || Math.abs(panOffset.y) > 1;

  return (
    <MechanicalItemButton
      icon="⊙"
      label={isPanned ? 'Pan' : '0,0'}
      title={
        isPanned
          ? `Board is panned by (${Math.round(panOffset.x)}, ${Math.round(panOffset.y)}). Click to re-center (0, 0).`
          : 'Board is centered (0, 0). Drag trackball to pan.'
      }
      leftWingState={isPanned ? 'amber' : 'inactive'}
      rightWingState={isPanned ? 'amber' : 'inactive'}
      leftWingTitle={isPanned ? 'Board Panned' : 'Board Centered'}
      rightWingTitle={isPanned ? 'Board Panned' : 'Board Centered'}
      onClick={resetPanOffset}
      className={className}
    />
  );
};
