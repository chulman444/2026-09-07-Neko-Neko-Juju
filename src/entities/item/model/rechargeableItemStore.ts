import { create } from 'zustand';
import type { ItemType } from './types';
import { useItemStore } from './itemStore';

export const DEFAULT_MAX_STACKS: Record<ItemType, number> = {
  randomNumber: 3,
  randomChoose: 3,
  omnitile: 3,
  shake: 3,
  hint: 3,
};

export const DEFAULT_REFILL_TIMERS: Record<ItemType, number> = {
  randomNumber: 10,
  randomChoose: 10,
  omnitile: 10,
  shake: 0,
  hint: 10,
};

export const DEFAULT_REFILL_ACTIONS: Record<ItemType, number> = {
  randomNumber: 0,
  randomChoose: 0,
  omnitile: 0,
  shake: 5,
  hint: 0,
};

export const DEFAULT_GAUGES: Record<ItemType, number> = {
  randomNumber: 0,
  randomChoose: 0,
  omnitile: 0,
  shake: 0,
  hint: 0,
};

export interface RechargeableItemState {
  enabled: boolean;
  maxStacks: Record<ItemType, number>;
  gauges: Record<ItemType, number>;
  refillTimers: Record<ItemType, number>;
  refillActions: Record<ItemType, number>;

  setEnabled: (enabled: boolean) => void;
  setMaxStacks: (item: ItemType, max: number) => void;
  setRefillTimer: (item: ItemType, seconds: number) => void;
  setRefillActions: (item: ItemType, actions: number) => void;

  addGauge: (item: ItemType, amount: number) => void;
  tickGauges: (deltaSeconds: number, isPaused?: boolean) => void;
  onItemConsumed: (item: ItemType, amount?: number) => void;
  resetGauges: () => void;
  resetAll: () => void;
}

export const useRechargeableItemStore = create<RechargeableItemState>((set, get) => ({
  enabled: true,
  maxStacks: { ...DEFAULT_MAX_STACKS },
  gauges: { ...DEFAULT_GAUGES },
  refillTimers: { ...DEFAULT_REFILL_TIMERS },
  refillActions: { ...DEFAULT_REFILL_ACTIONS },

  setEnabled: (enabled: boolean) => {
    set({ enabled });
  },

  setMaxStacks: (item: ItemType, max: number) => {
    set((state) => ({
      maxStacks: {
        ...state.maxStacks,
        [item]: Math.max(1, max),
      },
    }));
  },

  setRefillTimer: (item: ItemType, seconds: number) => {
    set((state) => ({
      refillTimers: {
        ...state.refillTimers,
        [item]: Math.max(0, seconds),
      },
    }));
  },

  setRefillActions: (item: ItemType, actions: number) => {
    set((state) => ({
      refillActions: {
        ...state.refillActions,
        [item]: Math.max(0, actions),
      },
    }));
  },

  addGauge: (item: ItemType, amount: number) => {
    if (!get().enabled || amount <= 0) return;
    const currentCount = useItemStore.getState().counts[item];
    const max = get().maxStacks[item];

    if (currentCount >= max) {
      if (get().gauges[item] !== 0) {
        set((state) => ({ gauges: { ...state.gauges, [item]: 0 } }));
      }
      return;
    }

    const currentGauge = get().gauges[item];
    const nextGauge = currentGauge + amount;

    if (nextGauge >= 1.0) {
      const fullIncrements = Math.floor(nextGauge);
      const remainder = nextGauge - fullIncrements;
      const canAdd = max - currentCount;
      const toAdd = Math.min(fullIncrements, canAdd);

      if (toAdd > 0) {
        useItemStore.getState().addItem(item, toAdd);
      }

      const newCount = currentCount + toAdd;
      set((state) => ({
        gauges: {
          ...state.gauges,
          [item]: newCount >= max ? 0 : remainder,
        },
      }));
    } else {
      set((state) => ({
        gauges: {
          ...state.gauges,
          [item]: nextGauge,
        },
      }));
    }
  },

  tickGauges: (deltaSeconds: number, isPaused = false) => {
    if (isPaused || !get().enabled || deltaSeconds <= 0) return;
    const { refillTimers, maxStacks, gauges } = get();
    const counts = useItemStore.getState().counts;

    let hasChanged = false;
    const nextGauges = { ...gauges };
    const itemsToAdd: Partial<Record<ItemType, number>> = {};

    (Object.keys(refillTimers) as ItemType[]).forEach((item) => {
      const timer = refillTimers[item];
      if (timer <= 0) return;

      const count = counts[item];
      const max = maxStacks[item];

      if (count >= max) {
        if (nextGauges[item] !== 0) {
          nextGauges[item] = 0;
          hasChanged = true;
        }
        return;
      }

      const step = deltaSeconds / timer;
      const nextVal = nextGauges[item] + step;

      if (nextVal >= 1.0) {
        const fullIncrements = Math.floor(nextVal);
        const remainder = nextVal - fullIncrements;
        const canAdd = max - count;
        const toAdd = Math.min(fullIncrements, canAdd);

        if (toAdd > 0) {
          itemsToAdd[item] = (itemsToAdd[item] ?? 0) + toAdd;
        }
        const finalCount = count + toAdd;
        nextGauges[item] = finalCount >= max ? 0 : remainder;
        hasChanged = true;
      } else {
        nextGauges[item] = nextVal;
        hasChanged = true;
      }
    });

    Object.entries(itemsToAdd).forEach(([item, amount]) => {
      useItemStore.getState().addItem(item as ItemType, amount);
    });

    if (hasChanged) {
      set({ gauges: nextGauges });
    }
  },

  onItemConsumed: (consumedItem: ItemType, amount = 1) => {
    if (!get().enabled || consumedItem === 'shake' || amount <= 0) return;
    const actions = get().refillActions.shake;
    if (actions > 0) {
      get().addGauge('shake', amount / actions);
    }
  },

  resetGauges: () => {
    set({
      gauges: { ...DEFAULT_GAUGES },
    });
  },

  resetAll: () => {
    set({
      maxStacks: { ...DEFAULT_MAX_STACKS },
      gauges: { ...DEFAULT_GAUGES },
      refillTimers: { ...DEFAULT_REFILL_TIMERS },
      refillActions: { ...DEFAULT_REFILL_ACTIONS },
    });
  },
}));
