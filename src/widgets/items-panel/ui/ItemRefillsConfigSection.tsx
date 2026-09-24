import React, { useState } from 'react';
import {
  useItemStore,
  useRechargeableItemStore,
  DEFAULT_MAX_STACKS,
  DEFAULT_REFILL_TIMERS,
  DEFAULT_REFILL_ACTIONS,
  DEFAULT_SPAM_COOLDOWNS,
  type ItemType,
} from '@/entities/item';
import { useGameConfigStore } from '@/entities/game-config';

interface ItemConfigOption {
  id: ItemType;
  name: string;
  icon: string;
}

const ITEM_OPTIONS: ItemConfigOption[] = [
  { id: 'randomNumber', name: 'Random', icon: '🎲' },
  { id: 'randomChoose', name: 'Choose', icon: '🎰' },
  { id: 'omnitile', name: 'Omnitile', icon: '⭐' },
  { id: 'shake', name: 'Shake', icon: '🔀' },
  { id: 'hint', name: 'Hint', icon: '💡' },
];

export const ItemRefillsConfigSection: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<ItemType>('randomNumber');

  // Item counts store
  const counts = useItemStore((state) => state.counts);
  const setItemCount = useItemStore((state) => state.setItemCount);

  // Rechargeable item mechanics store
  const maxStacks = useRechargeableItemStore((state) => state.maxStacks);
  const refillTimers = useRechargeableItemStore((state) => state.refillTimers);
  const refillActions = useRechargeableItemStore((state) => state.refillActions);
  const spamCooldowns = useRechargeableItemStore((state) => state.spamCooldowns);
  const setMaxStacks = useRechargeableItemStore((state) => state.setMaxStacks);
  const setRefillTimer = useRechargeableItemStore((state) => state.setRefillTimer);
  const setRefillActions = useRechargeableItemStore((state) => state.setRefillActions);
  const setSpamCooldown = useRechargeableItemStore((state) => state.setSpamCooldown);
  const resetAllRechargeables = useRechargeableItemStore((state) => state.resetAll);

  // Game config store (UI Flags)
  const itemBadgePlacement = useGameConfigStore((state) => state.itemBadgePlacement);
  const itemCdDirection = useGameConfigStore((state) => state.itemCdDirection);
  const itemCdFormat = useGameConfigStore((state) => state.itemCdFormat);
  const setFlag = useGameConfigStore((state) => state.setFlag);

  const currentCount = counts[selectedItem] ?? 0;
  const currentMax = maxStacks[selectedItem] ?? 3;
  const currentTimer = refillTimers[selectedItem] ?? 0;
  const currentActions = refillActions[selectedItem] ?? 0;
  const currentCooldown = spamCooldowns[selectedItem] ?? 0.5;

  const handleResetSelected = () => {
    setItemCount(selectedItem, DEFAULT_MAX_STACKS[selectedItem]);
    setMaxStacks(selectedItem, DEFAULT_MAX_STACKS[selectedItem]);
    setRefillTimer(selectedItem, DEFAULT_REFILL_TIMERS[selectedItem]);
    setRefillActions(selectedItem, DEFAULT_REFILL_ACTIONS[selectedItem]);
    setSpamCooldown(selectedItem, DEFAULT_SPAM_COOLDOWNS[selectedItem]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[11px] text-amber-400/90 uppercase tracking-wider">
          🔋 Item Refills & Button Config
        </h4>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetSelected}
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 transition cursor-pointer"
            title="Reset selected item parameters to default"
          >
            Reset Selected
          </button>
          <button
            type="button"
            onClick={resetAllRechargeables}
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 transition cursor-pointer"
            title="Reset all rechargeable parameters to default"
          >
            Reset All
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/70">
        <p className="text-[11px] text-zinc-400 m-0">
          Configure cooldowns, max stacks, refill rates per item, and customize button layout.
        </p>

        {/* Item Selector Tabs */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-900/80 rounded-lg border border-zinc-700/60">
          {ITEM_OPTIONS.map((item) => {
            const isSelected = selectedItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded transition cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <span className="text-sm leading-none mb-0.5">{item.icon}</span>
                <span className="text-[10px] truncate max-w-full">{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Item Mechanics Tuning Box */}
        <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-0.5">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <span>{ITEM_OPTIONS.find((i) => i.id === selectedItem)?.icon}</span>
              <span>{ITEM_OPTIONS.find((i) => i.id === selectedItem)?.name} Tuning</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Stacks: <strong className="text-amber-400">{currentCount}</strong> / {currentMax}
            </span>
          </div>

          {/* Current Stacks */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>Current Stacks</span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">{currentCount}</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={currentCount}
              onChange={(e) => setItemCount(selectedItem, parseInt(e.target.value, 10) || 0)}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
              <span>0</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Max Stacks */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>Max Stacks Cap</span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">{currentMax}</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={currentMax}
              onChange={(e) => setMaxStacks(selectedItem, parseInt(e.target.value, 10) || 1)}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Prevent-Spam Cooldown */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>Prevent-Spam Cooldown</span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {currentCooldown.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={currentCooldown}
              onChange={(e) => setSpamCooldown(selectedItem, parseFloat(e.target.value) || 0)}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
              <span>0s</span>
              <span>2.5s</span>
              <span>5.0s</span>
            </div>
          </div>

          {/* Refill Timer (Passive Cooldown) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>Passive Refill Timer</span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {currentTimer === 0 ? '0s (Disabled)' : `${currentTimer}s`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={currentTimer}
              onChange={(e) => setRefillTimer(selectedItem, parseInt(e.target.value, 10) || 0)}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
              <span>0s (Off)</span>
              <span>10s</span>
              <span>30s</span>
              <span>60s</span>
            </div>
          </div>

          {/* Refill Actions (Action Hit Refill) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>Action Hits Refill</span>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {currentActions === 0 ? '0 (Disabled)' : `${currentActions} hits`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={currentActions}
              onChange={(e) => setRefillActions(selectedItem, parseInt(e.target.value, 10) || 0)}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
              <span>0 (Off)</span>
              <span>5 hits</span>
              <span>10 hits</span>
              <span>20 hits</span>
            </div>
          </div>
        </div>

        {/* Global Button Layout Settings */}
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/60">
          <span className="text-xs font-semibold text-zinc-200 border-b border-zinc-800 pb-1.5">
            🎨 Button UI & Cooldown Layout (Global)
          </span>

          {/* Badge Placement */}
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="text-[11px] text-zinc-400">Badge Placement:</span>
            <select
              value={itemBadgePlacement}
              onChange={(e) =>
                setFlag(
                  'itemBadgePlacement',
                  e.target.value as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
                )
              }
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded px-2 py-0.5 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="bottom-right">Bottom-Right (Default)</option>
              <option value="bottom-left">Bottom-Left</option>
              <option value="top-right">Top-Right</option>
              <option value="top-left">Top-Left</option>
            </select>
          </div>

          {/* CD Direction */}
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="text-[11px] text-zinc-400">Cooldown Direction:</span>
            <select
              value={itemCdDirection}
              onChange={(e) =>
                setFlag('itemCdDirection', e.target.value as 'left' | 'right' | 'top' | 'bottom')
              }
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded px-2 py-0.5 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="left">Left (Default)</option>
              <option value="right">Right</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>

          {/* CD Format */}
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="text-[11px] text-zinc-400">Cooldown Format:</span>
            <select
              value={itemCdFormat}
              onChange={(e) => setFlag('itemCdFormat', e.target.value as 'integer' | 'decimal')}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded px-2 py-0.5 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="integer">Integer (e.g. 10s)</option>
              <option value="decimal">Decimal (e.g. 9.8s)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
