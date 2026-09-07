import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseGameTimerOptions {
  initialCountdown?: number;
  defeatThreshold?: number;
  autoStart?: boolean;
}

export const useGameTimer = ({
  initialCountdown = 60,
  defeatThreshold = 15,
  autoStart = true,
}: UseGameTimerOptions = {}) => {
  const [countdown, setCountdown] = useState<number>(initialCountdown);
  const [isPaused, setIsPaused] = useState<boolean>(!autoStart);
  const [isDefeated, setIsDefeated] = useState<boolean>(false);

  const isPausedRef = useRef<boolean>(!autoStart);
  const isDefeatedRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isDefeatedRef.current = isDefeated;
  }, [isDefeated]);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (lastTimeRef.current !== null && !isPausedRef.current && !isDefeatedRef.current) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        setCountdown((prev) => {
          const next = prev - deltaSeconds;
          if (next <= -defeatThreshold) {
            setIsDefeated(true);
            return -defeatThreshold;
          }
          return next;
        });
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
  }, [defeatThreshold]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    if (!isDefeatedRef.current) {
      lastTimeRef.current = performance.now();
      setIsPaused(false);
    }
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      if (isDefeatedRef.current) return prev;
      if (prev) {
        lastTimeRef.current = performance.now();
        return false;
      }
      return true;
    });
  }, []);

  const addTime = useCallback((seconds: number) => {
    setCountdown((prev) => {
      if (isDefeatedRef.current) return prev;
      return prev + seconds;
    });
  }, []);

  const reset = useCallback(
    (newInitial?: number) => {
      const val = newInitial ?? initialCountdown;
      setCountdown(val);
      setIsDefeated(false);
      lastTimeRef.current = performance.now();
    },
    [initialCountdown]
  );

  return {
    countdown,
    initialCountdown,
    defeatThreshold,
    isPaused,
    isDefeated,
    pause,
    resume,
    togglePause,
    addTime,
    reset,
  };
};
