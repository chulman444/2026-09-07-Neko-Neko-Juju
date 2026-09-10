import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseHintTimerOptions {
  totalHints?: number;
  intervalSeconds?: number;
  isMainTimerDepleted: boolean;
  isPaused?: boolean;
  onHintDepleted: () => void;
  onPhase1Over?: () => void;
}

export const useHintTimer = ({
  totalHints = 3,
  intervalSeconds = 4,
  isMainTimerDepleted,
  isPaused = false,
  onHintDepleted,
  onPhase1Over,
}: UseHintTimerOptions) => {
  const [hintsRemaining, setHintsRemaining] = useState<number>(totalHints);
  const [hintCountdown, setHintCountdown] = useState<number>(intervalSeconds);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPhase1Over, setIsPhase1Over] = useState<boolean>(false);

  const hintsRemainingRef = useRef<number>(totalHints);
  const countdownRef = useRef<number>(intervalSeconds);
  const intervalSecondsRef = useRef<number>(intervalSeconds);
  const isMainTimerDepletedRef = useRef<boolean>(isMainTimerDepleted);
  const prevDepletedRef = useRef<boolean>(isMainTimerDepleted);
  const isPausedRef = useRef<boolean>(isPaused);
  const isPhase1OverRef = useRef<boolean>(false);
  const hasTriggeredFirstHintRef = useRef<boolean>(false);

  const onHintDepletedRef = useRef(onHintDepleted);
  const onPhase1OverRef = useRef(onPhase1Over);

  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    hintsRemainingRef.current = hintsRemaining;
  }, [hintsRemaining]);

  useEffect(() => {
    intervalSecondsRef.current = intervalSeconds;
    if (!hasTriggeredFirstHintRef.current && !isPhase1OverRef.current) {
      countdownRef.current = intervalSeconds;
      setHintCountdown(intervalSeconds);
    }
  }, [intervalSeconds]);

  useEffect(() => {
    if (!hasTriggeredFirstHintRef.current && !isPhase1OverRef.current) {
      setHintsRemaining(totalHints);
      hintsRemainingRef.current = totalHints;
    }
  }, [totalHints]);

  useEffect(() => {
    isMainTimerDepletedRef.current = isMainTimerDepleted;
    if (isMainTimerDepleted) {
      lastTimeRef.current = performance.now();
    }
  }, [isMainTimerDepleted]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (!isPaused) {
      lastTimeRef.current = performance.now();
    }
  }, [isPaused]);

  useEffect(() => {
    isPhase1OverRef.current = isPhase1Over;
  }, [isPhase1Over]);

  useEffect(() => {
    onHintDepletedRef.current = onHintDepleted;
  }, [onHintDepleted]);

  useEffect(() => {
    onPhase1OverRef.current = onPhase1Over;
  }, [onPhase1Over]);

  // Immediate consumption of Hint #1 when main timer first hits 0 (rising edge: false -> true)
  useEffect(() => {
    const wasDepleted = prevDepletedRef.current;
    prevDepletedRef.current = isMainTimerDepleted;

    // Trigger only on rising edge (transition from running/not-depleted to depleted)
    if (
      !wasDepleted &&
      isMainTimerDepleted &&
      !isPaused &&
      !isPhase1OverRef.current &&
      !hasTriggeredFirstHintRef.current &&
      hintsRemainingRef.current === totalHints
    ) {
      hasTriggeredFirstHintRef.current = true;
      setHasStarted(true);

      // Trigger Hint #1 immediately
      onHintDepletedRef.current();

      // Decrement hints remaining from 3 to 2
      const nextRemaining = hintsRemainingRef.current - 1;
      hintsRemainingRef.current = nextRemaining;
      setHintsRemaining(nextRemaining);

      // Initialize countdown for Hint #2
      countdownRef.current = intervalSecondsRef.current;
      setHintCountdown(intervalSecondsRef.current);
      lastTimeRef.current = performance.now();
    }
  }, [isMainTimerDepleted, isPaused, totalHints]);

  // Main RAF loop for subsequent hint countdowns (Hint #2 and Hint #3)
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSeconds = lastTimeRef.current !== null ? (now - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = now;

      if (
        isMainTimerDepletedRef.current &&
        !isPausedRef.current &&
        !isPhase1OverRef.current &&
        hasTriggeredFirstHintRef.current &&
        hintsRemainingRef.current > 0
      ) {
        countdownRef.current -= deltaSeconds;

        if (countdownRef.current <= 0) {
          // Trigger the next hint (Hint #2 or Hint #3)
          onHintDepletedRef.current();

          const nextRemaining = hintsRemainingRef.current - 1;
          hintsRemainingRef.current = nextRemaining;
          setHintsRemaining(nextRemaining);

          if (nextRemaining <= 0) {
            // Final hint consumed, Phase 1 is over
            countdownRef.current = 0;
            setHintCountdown(0);
            setIsPhase1Over(true);
            isPhase1OverRef.current = true;
            onPhase1OverRef.current?.();
            return;
          } else {
            // Next cycle countdown
            countdownRef.current = intervalSecondsRef.current;
            setHintCountdown(intervalSecondsRef.current);
          }
        } else {
          setHintCountdown(countdownRef.current);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const reset = useCallback(
    (newTotal?: number, newInterval?: number) => {
      const hints = newTotal ?? totalHints;
      const interval = newInterval ?? intervalSeconds;
      setHintsRemaining(hints);
      hintsRemainingRef.current = hints;
      countdownRef.current = interval;
      setHintCountdown(interval);
      setHasStarted(false);
      hasTriggeredFirstHintRef.current = false;
      setIsPhase1Over(false);
      isPhase1OverRef.current = false;
      // Mark as depleted currently so any trailing depleted prop does not trigger as a rising edge
      prevDepletedRef.current = true;
      isMainTimerDepletedRef.current = false;
      lastTimeRef.current = performance.now();
    },
    [totalHints, intervalSeconds]
  );

  return {
    hintsRemaining,
    hintCountdown,
    hasStarted,
    isPhase1Over,
    reset,
  };
};
