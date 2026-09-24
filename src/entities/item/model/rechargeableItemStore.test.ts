import { describe, it, expect, beforeEach } from 'vitest';
import { useItemStore } from './itemStore';
import {
  useRechargeableItemStore,
  DEFAULT_MAX_STACKS,
  DEFAULT_REFILL_TIMERS,
  DEFAULT_REFILL_ACTIONS,
} from './rechargeableItemStore';

describe('useRechargeableItemStore', () => {
  beforeEach(() => {
    useItemStore.getState().resetItemCounts();
    useRechargeableItemStore.getState().resetAll();
    useRechargeableItemStore.getState().setEnabled(true);
  });

  it('initializes with default maxStacks, timers, and actions', () => {
    const state = useRechargeableItemStore.getState();
    expect(state.maxStacks).toEqual(DEFAULT_MAX_STACKS);
    expect(state.refillTimers).toEqual(DEFAULT_REFILL_TIMERS);
    expect(state.refillActions).toEqual(DEFAULT_REFILL_ACTIONS);
    expect(state.gauges.randomNumber).toBe(0);
    expect(state.gauges.shake).toBe(0);
  });

  it('addGauge does nothing if currentCount is already >= maxStacks', () => {
    // Default counts is 5, maxStacks is 3 -> 5 >= 3
    useRechargeableItemStore.getState().addGauge('randomNumber', 0.5);
    expect(useRechargeableItemStore.getState().gauges.randomNumber).toBe(0);
  });

  it('addGauge increases gauge and grants items when reaching 1.0', () => {
    useItemStore.getState().setItemCount('randomNumber', 1);
    // Add 0.4 gauge
    useRechargeableItemStore.getState().addGauge('randomNumber', 0.4);
    expect(useRechargeableItemStore.getState().gauges.randomNumber).toBeCloseTo(0.4);
    expect(useItemStore.getState().counts.randomNumber).toBe(1);

    // Add 0.7 gauge -> total 1.1 -> adds 1 item (count 2), remainder 0.1
    useRechargeableItemStore.getState().addGauge('randomNumber', 0.7);
    expect(useItemStore.getState().counts.randomNumber).toBe(2);
    expect(useRechargeableItemStore.getState().gauges.randomNumber).toBeCloseTo(0.1);
  });

  it('addGauge caps at maxStacks and resets gauge to 0 when reached', () => {
    useItemStore.getState().setItemCount('randomNumber', 2);
    useRechargeableItemStore.getState().addGauge('randomNumber', 1.5);
    // Should cap at 3 (maxStacks) and reset gauge to 0
    expect(useItemStore.getState().counts.randomNumber).toBe(3);
    expect(useRechargeableItemStore.getState().gauges.randomNumber).toBe(0);
  });

  it('tickGauges advances time-based gauges but ignores shake', () => {
    useItemStore.getState().setItemCount('randomNumber', 0);
    useItemStore.getState().setItemCount('shake', 0);

    // randomNumber timer is 10s. deltaSeconds = 2.5s -> gauge += 0.25
    useRechargeableItemStore.getState().tickGauges(2.5, false);
    expect(useRechargeableItemStore.getState().gauges.randomNumber).toBeCloseTo(0.25);
    // shake timer is 0 (action-based) -> gauge remains 0
    expect(useRechargeableItemStore.getState().gauges.shake).toBe(0);
  });

  it('tickGauges respects isPaused', () => {
    useItemStore.getState().setItemCount('randomNumber', 0);
    useRechargeableItemStore.getState().tickGauges(2.5, true);
    expect(useRechargeableItemStore.getState().gauges.randomNumber).toBe(0);
  });

  it('onItemConsumed increments shake gauge by 1/refillActions (0.2)', () => {
    useItemStore.getState().setItemCount('shake', 1);

    // Consuming randomNumber should give 0.2 to shake
    useRechargeableItemStore.getState().onItemConsumed('randomNumber');
    expect(useRechargeableItemStore.getState().gauges.shake).toBeCloseTo(0.2);

    // Consuming shake itself should NOT increment shake gauge
    useRechargeableItemStore.getState().onItemConsumed('shake');
    expect(useRechargeableItemStore.getState().gauges.shake).toBeCloseTo(0.2);

    // Consuming 4 more items (total 5) should complete 1 stack of shake
    useRechargeableItemStore.getState().onItemConsumed('hint', 4);
    expect(useItemStore.getState().counts.shake).toBe(2);
    expect(useRechargeableItemStore.getState().gauges.shake).toBeCloseTo(0);
  });

  it('does nothing when enabled is false', () => {
    useRechargeableItemStore.getState().setEnabled(false);
    useItemStore.getState().setItemCount('randomNumber', 0);

    useRechargeableItemStore.getState().addGauge('randomNumber', 0.5);
    expect(useRechargeableItemStore.getState().gauges.randomNumber).toBe(0);

    useRechargeableItemStore.getState().tickGauges(5, false);
    expect(useRechargeableItemStore.getState().gauges.randomNumber).toBe(0);

    useRechargeableItemStore.getState().onItemConsumed('hint');
    expect(useRechargeableItemStore.getState().gauges.shake).toBe(0);
  });

  it('triggers activeSpamTimers on item consumption and decrements on tickGauges', () => {
    useRechargeableItemStore.getState().setSpamCooldown('randomNumber', 1.0);
    expect(useRechargeableItemStore.getState().spamCooldowns.randomNumber).toBe(1.0);
    expect(useRechargeableItemStore.getState().activeSpamTimers.randomNumber).toBe(0);

    // Consume item
    useRechargeableItemStore.getState().onItemConsumed('randomNumber');
    expect(useRechargeableItemStore.getState().activeSpamTimers.randomNumber).toBe(1.0);

    // Tick by 0.4s
    useRechargeableItemStore.getState().tickGauges(0.4, false);
    expect(useRechargeableItemStore.getState().activeSpamTimers.randomNumber).toBeCloseTo(0.6);

    // Tick past 0
    useRechargeableItemStore.getState().tickGauges(0.8, false);
    expect(useRechargeableItemStore.getState().activeSpamTimers.randomNumber).toBe(0);
  });

  it('resets spam timers on resetGauges and resetAll', () => {
    useRechargeableItemStore.getState().setSpamCooldown('randomNumber', 2.0);
    useRechargeableItemStore.getState().onItemConsumed('randomNumber');
    expect(useRechargeableItemStore.getState().activeSpamTimers.randomNumber).toBe(2.0);

    useRechargeableItemStore.getState().resetGauges();
    expect(useRechargeableItemStore.getState().activeSpamTimers.randomNumber).toBe(0);
    expect(useRechargeableItemStore.getState().spamCooldowns.randomNumber).toBe(2.0);

    useRechargeableItemStore.getState().resetAll();
    expect(useRechargeableItemStore.getState().spamCooldowns.randomNumber).toBe(0.5);
    expect(useRechargeableItemStore.getState().activeSpamTimers.randomNumber).toBe(0);
  });
});
