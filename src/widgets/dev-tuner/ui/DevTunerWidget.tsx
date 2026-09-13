import React from 'react';
import { HintsConfigSection } from './HintsConfigSection';
import { ComboDrainSection } from './ComboDrainSection';
import { ComboRefillSection } from './ComboRefillSection';
import { SimulationSection } from './SimulationSection';
import { HintAlgorithmSection } from './HintAlgorithmSection';
import { PanControlsSection } from './PanControlsSection';
import { CheckerboardSection } from './CheckerboardSection';

export interface DevTunerWidgetProps {
  className?: string;
}

export const DevTunerWidget: React.FC<DevTunerWidgetProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col gap-4 text-sm select-none ${className}`.trim()}>
      <CheckerboardSection />
      <PanControlsSection />
      <HintsConfigSection />
      <ComboDrainSection />
      <ComboRefillSection />
      <SimulationSection />
      <HintAlgorithmSection />
    </div>
  );
};
