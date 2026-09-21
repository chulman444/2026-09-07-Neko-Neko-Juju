import React from 'react';
import { FeatureFlagsSection } from './FeatureFlagsSection';
import { HintsConfigSection } from './HintsConfigSection';
import { ComboProgressionSection } from './ComboProgressionSection';
import { SimulationSection } from './SimulationSection';
import { HintAlgorithmSection } from './HintAlgorithmSection';
import { HotkeysConfigSection } from './HotkeysConfigSection';
import { RivalCatsDevTuner } from '@/features/rival-cats';

export interface DevTunerWidgetProps {
  className?: string;
}

export const DevTunerWidget: React.FC<DevTunerWidgetProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col gap-4 text-sm select-none ${className}`.trim()}>
      <FeatureFlagsSection />
      <HintsConfigSection />
      <RivalCatsDevTuner />
      <ComboProgressionSection />
      <SimulationSection />
      <HintAlgorithmSection />
      <HotkeysConfigSection />
    </div>
  );
};
