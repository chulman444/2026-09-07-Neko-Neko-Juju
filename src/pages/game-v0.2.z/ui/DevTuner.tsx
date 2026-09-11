import React from 'react';
import {
  BoardSizeSection,
  DifficultySection,
  HintsConfigSection,
  ComboDrainSection,
  ComboRefillSection,
  SimulationSection,
  HintAlgorithmSection,
  SeedHistorySection,
} from './dev-tuner';

export const DevTuner: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 text-sm select-none">
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
