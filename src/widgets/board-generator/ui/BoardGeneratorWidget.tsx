import React from 'react';
import { BoardSizeSection } from './BoardSizeSection';
import { DifficultySection } from './DifficultySection';
import { SeedHistorySection } from './SeedHistorySection';

export interface BoardGeneratorWidgetProps {
  className?: string;
}

export const BoardGeneratorWidget: React.FC<BoardGeneratorWidgetProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col gap-4 text-sm select-none ${className}`.trim()}>
      <BoardSizeSection />
      <DifficultySection />
      <SeedHistorySection />
    </div>
  );
};
