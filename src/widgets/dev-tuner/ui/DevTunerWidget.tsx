import React from 'react';
import { BoardSizeSection } from './BoardSizeSection';
import { DifficultySection } from './DifficultySection';
import { HintsConfigSection } from './HintsConfigSection';
import { ComboDrainSection } from './ComboDrainSection';
import { ComboRefillSection } from './ComboRefillSection';
import { SimulationSection } from './SimulationSection';
import { HintAlgorithmSection } from './HintAlgorithmSection';
import { SeedHistorySection } from './SeedHistorySection';

export interface DevTunerWidgetProps {
  className?: string;
}

export const DevTunerWidget: React.FC<DevTunerWidgetProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col gap-4 text-sm select-none ${className}`.trim()}>
      <BoardSizeSection />
      <DifficultySection />
      <HintsConfigSection />
      <ComboDrainSection />
      <ComboRefillSection />
      <SimulationSection />
      <HintAlgorithmSection />
      <SeedHistorySection />
    </div>
  );
};
