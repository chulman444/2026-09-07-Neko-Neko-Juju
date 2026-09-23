import { useEffect, useRef } from 'react';
import { useGameSessionStore } from '@/entities/game-session';
import { useSurvivalTimerStore } from '@/features/survival-timer';
import { usePhaseProgressionStore } from '@/features/phase-progression';
import { useComboStore } from '@/features/combo-system';
import { useFreeTriggeredHintStore } from '@/features/free-triggered-hint';
import { useRivalCatStore } from '@/features/rival-cats';
import { useGameConfigStore } from '@/entities/game-config';

/**
 * Lightweight RAF driver that ticks the unified game session store, combo store, and hint store.
 * Decouples continuous 60fps simulation from React component lifecycles.
 */
export const useGameSessionDriver = () => {
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        // Limit max delta to prevent huge jumps when switching tabs
        const clampedDelta = Math.min(deltaSeconds, 0.1);
        const isComboPaused = useComboStore.getState().isTimerPaused();
        const isSessionPaused = useGameSessionStore.getState().isPaused;
        const isTimerPaused = isComboPaused || isSessionPaused;
        const isSurvivalDepleted = useSurvivalTimerStore.getState().isDepleted;

        const { enableTimer, enableCombos, enableFreeTriggeredHint } =
          useGameConfigStore.getState();

        if (enableTimer) {
          useSurvivalTimerStore.getState().tick(clampedDelta, isTimerPaused);
        }
        if (enableCombos) {
          useComboStore.getState().tick(clampedDelta);
        }
        if (enableTimer && enableFreeTriggeredHint) {
          useFreeTriggeredHintStore
            .getState()
            .tick(clampedDelta, isSurvivalDepleted, isTimerPaused);
        }
        useRivalCatStore.getState().tick(clampedDelta, isTimerPaused);

        // Orchestrate Phase Progression
        const isHintPhase1Over = useFreeTriggeredHintStore.getState().isPhase1Over;
        if (isHintPhase1Over && !usePhaseProgressionStore.getState().isPhase1Over) {
          usePhaseProgressionStore.getState().setPhase(2);
        }
      }
      lastTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);
};
