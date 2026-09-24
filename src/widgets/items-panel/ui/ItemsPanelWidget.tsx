import React from 'react';
import { ItemFreeTriggersSection } from './ItemFreeTriggersSection';
import { ItemHistoryConstraintSection } from './ItemHistoryConstraintSection';
import { ItemsInventorySection } from './ItemsInventorySection';
import { ItemRefillsConfigSection } from './ItemRefillsConfigSection';
import { ItemSeedSection } from './ItemSeedSection';

export const ItemsPanelWidget: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 select-none pb-4">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 m-0">
            <span>🎒</span> Items & Consumables Dev Panel
          </h3>
          <p className="text-[11px] text-zinc-400 m-0">
            Tune roll constraints, test free items, and inspect active state.
          </p>
        </div>
      </div>

      {/* Free Triggers & Active State Section */}
      <ItemFreeTriggersSection />

      {/* Non-Repeat History Constraint Section */}
      <ItemHistoryConstraintSection />

      {/* Inventory & Stock Setting Section */}
      <ItemsInventorySection />

      {/* Rechargeable Items & Button Layout Config Section */}
      <ItemRefillsConfigSection />

      {/* PRNG & Seed Room Section */}
      <ItemSeedSection />
    </div>
  );
};
