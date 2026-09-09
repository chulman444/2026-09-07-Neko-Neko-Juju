import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseGameTimerOptions {
  initialCountdown?: number;
  maxCountdown?: number;
  autoStart?: boolean;
}

export const useGameTimer = ({
  initialCountdown = 60,
  maxCountdown = 60,
  autoStart = true,
}: UseGameTimerOptions = {}) => {
  const [countdown, setCountdown] = useState<number>(initialCountdown);
  const [isPaused, setIsPaused] = useState<boolean>(!autoStart);
  const [isDepleted, setIsDepleted] = useState<boolean>(false);

  const isPausedRef = useRef<boolean>(!autoStart);
  const isDepletedRef = useRef<boolean>(false);
  const maxCountdownRef = useRef<number>(maxCountdown);
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isDepletedRef.current = isDepleted;
  }, [isDepleted]);

  useEffect(() => {
    maxCountdownRef.current = maxCountdown;
  }, [maxCountdown]);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (lastTimeRef.current !== null && !isPausedRef.current && !isDepletedRef.current) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        setCountdown((prev) => {
          const next = prev - deltaSeconds;
          if (next <= 0) {
            setIsDepleted(true);
            return 0;
          }
          // Clamp down if maxCountdown drops below current time via tuner
          return Math.min(next, maxCountdownRef.current);
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
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    if (!isDepletedRef.current) {
      lastTimeRef.current = performance.now();
      setIsPaused(false);
    }
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      if (isDepletedRef.current) return prev;
      if (prev) {
        lastTimeRef.current = performance.now();
        return false;
      }
      return true;
    });
  }, []);

  const addTime = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setCountdown((prev) => {
      const next = Math.min(prev + seconds, maxCountdownRef.current);
      if (next > 0 && isDepletedRef.current) {
        setIsDepleted(false);
        isDepletedRef.current = false;
        lastTimeRef.current = performance.now();
      }
      return next;
    });
  }, []);

  const reset = useCallback(
    (newInitial?: number) => {
      const val = newInitial ?? initialCountdown;
      setCountdown(val);
      setIsDepleted(false);
      lastTimeRef.current = performance.now();
    },
    [initialCountdown]
  );

  return {
    countdown,
    maxCountdown,
    isPaused,
    isDepleted,
    pause,
    resume,
    togglePause,
    addTime,
    reset,
  };
};
