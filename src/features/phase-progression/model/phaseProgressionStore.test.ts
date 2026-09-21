import { describe, it, expect, beforeEach } from 'vitest';
import { usePhaseProgressionStore } from './phaseProgressionStore';

describe('phaseProgressionStore', () => {
  beforeEach(() => {
    usePhaseProgressionStore.setState({
      phase1Score: 0,
      phase2Score: 0,
      currentPhase: 1,
      isPhase1Over: false,
    });
  });

  it('tracks points in phase1Score during Phase 1 and freezes it during Phase 2', () => {
    const store = usePhaseProgressionStore.getState();
    expect(store.phase1Score).toBe(0);
    expect(store.phase2Score).toBe(0);
    expect(store.currentPhase).toBe(1);
    expect(store.isPhase1Over).toBe(false);

    // Score during Phase 1
    usePhaseProgressionStore.getState().addScore(5);
    expect(usePhaseProgressionStore.getState().phase1Score).toBe(5);
    expect(usePhaseProgressionStore.getState().phase2Score).toBe(0);

    // Transition to Phase 2
    usePhaseProgressionStore.getState().setPhase(2);
    expect(usePhaseProgressionStore.getState().currentPhase).toBe(2);
    expect(usePhaseProgressionStore.getState().isPhase1Over).toBe(true);

    // Score during Phase 2
    usePhaseProgressionStore.getState().addScore(10);
    expect(usePhaseProgressionStore.getState().phase1Score).toBe(5); // frozen!
    expect(usePhaseProgressionStore.getState().phase2Score).toBe(10);
  });

  it('allows explicit isPhase1 override in addScore', () => {
    usePhaseProgressionStore.getState().addScore(7, false);
    expect(usePhaseProgressionStore.getState().phase1Score).toBe(0);
    expect(usePhaseProgressionStore.getState().phase2Score).toBe(7);

    usePhaseProgressionStore.getState().addScore(3, true);
    expect(usePhaseProgressionStore.getState().phase1Score).toBe(3);
    expect(usePhaseProgressionStore.getState().phase2Score).toBe(7);
  });

  it('resets progression state on resetProgression', () => {
    usePhaseProgressionStore.getState().addScore(15);
    usePhaseProgressionStore.getState().setPhase(2);
    usePhaseProgressionStore.getState().addScore(20);

    usePhaseProgressionStore.getState().resetProgression();
    expect(usePhaseProgressionStore.getState().phase1Score).toBe(0);
    expect(usePhaseProgressionStore.getState().phase2Score).toBe(0);
    expect(usePhaseProgressionStore.getState().currentPhase).toBe(1);
    expect(usePhaseProgressionStore.getState().isPhase1Over).toBe(false);
  });
});
