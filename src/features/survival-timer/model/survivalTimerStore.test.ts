import { describe, it, expect, beforeEach } from 'vitest';
import { useSurvivalTimerStore } from './survivalTimerStore';

describe('survivalTimerStore', () => {
  beforeEach(() => {
    useSurvivalTimerStore.setState({
      countdown: 6,
      maxCountdown: 6,
      baseSecondsPerTile: 0,
      isPaused: false,
      isDepleted: false,
    });
  });

  it('initializes countdown to maxCountdown and decrements on tick', () => {
    const store = useSurvivalTimerStore.getState();
    expect(store.countdown).toBe(store.maxCountdown);
    expect(store.isDepleted).toBe(false);

    useSurvivalTimerStore.getState().tick(1.0);
    expect(useSurvivalTimerStore.getState().countdown).toBe(store.maxCountdown - 1.0);
    expect(useSurvivalTimerStore.getState().isDepleted).toBe(false);
  });

  it('marks isDepleted true when countdown reaches 0', () => {
    const store = useSurvivalTimerStore.getState();
    useSurvivalTimerStore.getState().tick(store.maxCountdown + 1);

    const state = useSurvivalTimerStore.getState();
    expect(state.countdown).toBe(0);
    expect(state.isDepleted).toBe(true);
  });

  it('pauses countdown when isPaused is true or isTimerPausedByExternal is true', () => {
    const initialCountdown = useSurvivalTimerStore.getState().countdown;

    // External pause flag
    useSurvivalTimerStore.getState().tick(1.0, true);
    expect(useSurvivalTimerStore.getState().countdown).toBe(initialCountdown);

    // Internal isPaused state
    useSurvivalTimerStore.getState().setPaused(true);
    useSurvivalTimerStore.getState().tick(1.0, false);
    expect(useSurvivalTimerStore.getState().countdown).toBe(initialCountdown);

    // Resume
    useSurvivalTimerStore.getState().setPaused(false);
    useSurvivalTimerStore.getState().tick(1.0, false);
    expect(useSurvivalTimerStore.getState().countdown).toBe(initialCountdown - 1.0);
  });

  it('adds time up to maxCountdown with addTime', () => {
    useSurvivalTimerStore.getState().tick(3.0);
    const afterTick = useSurvivalTimerStore.getState().countdown;

    useSurvivalTimerStore.getState().addTime(1.0);
    expect(useSurvivalTimerStore.getState().countdown).toBe(afterTick + 1.0);

    // Clamps to maxCountdown
    useSurvivalTimerStore.getState().addTime(100.0);
    expect(useSurvivalTimerStore.getState().countdown).toBe(
      useSurvivalTimerStore.getState().maxCountdown
    );
  });

  it('clamps countdown when setMaxCountdown is called', () => {
    useSurvivalTimerStore.getState().setMaxCountdown(3);
    expect(useSurvivalTimerStore.getState().maxCountdown).toBe(3);
    expect(useSurvivalTimerStore.getState().countdown).toBe(3);
  });

  it('resets timer properly with resetTimer', () => {
    useSurvivalTimerStore.getState().tick(10.0);
    expect(useSurvivalTimerStore.getState().isDepleted).toBe(true);

    useSurvivalTimerStore.getState().resetTimer();
    expect(useSurvivalTimerStore.getState().countdown).toBe(6);
    expect(useSurvivalTimerStore.getState().isDepleted).toBe(false);
  });
});
