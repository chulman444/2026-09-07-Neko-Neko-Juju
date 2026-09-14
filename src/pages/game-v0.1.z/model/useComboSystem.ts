import { useState, useRef, useEffect, useCallback } from 'react';

export interface ComboConfig {
  drainExponent: number;
  fixedMinimalDrain: number; // Percent per second
  multiplier: number;
  tier1Refill: number; // Seconds added to main timer for Combos 1-4
  tier2Refill: number; // Seconds added to main timer for Combos 5-7
  tier3Refill: number; // Seconds added to main timer for Combos 8+
}

export const useComboSystem = (initialConfig?: Partial<ComboConfig>) => {
  const [comboCount, setComboCount] = useState(0);
  const [comboPct, setComboPct] = useState(0); // 0 to 100

  const [config, setConfig] = useState<ComboConfig>({
    drainExponent: 1.5,
    fixedMinimalDrain: 15,
    multiplier: 2,
    tier1Refill: 1,
    tier2Refill: 3,
    tier3Refill: 5,
    ...initialConfig,
  });

  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  // Keep latest state in refs for RAF loop without triggering effect re-binds
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const comboCountRef = useRef(comboCount);
  useEffect(() => {
    comboCountRef.current = comboCount;
  }, [comboCount]);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (lastTimeRef.current !== null && !isPausedRef.current && comboCountRef.current > 0) {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;

        setComboPct((prevPct) => {
          if (prevPct <= 0) return 0;

          const { fixedMinimalDrain, multiplier, drainExponent } = configRef.current;
          // Drain rate = fixed + mult * (combo^exponent)
          const drainRate =
            fixedMinimalDrain + multiplier * Math.pow(comboCountRef.current, drainExponent);

          const nextPct = prevPct - drainRate * deltaSeconds;

          if (nextPct <= 0) {
            // Combo dropped!
            setComboCount(0);
            return 0;
          }
          return nextPct;
        });
      }

      lastTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const registerMatch = useCallback(() => {
    setComboCount((prev) => prev + 1);
    setComboPct(100); // Fully reset the combo window

    // Calculate how much main timer to refill based on the NEW combo count
    const c = comboCountRef.current + 1;
    if (c <= 4) return configRef.current.tier1Refill;
    if (c <= 7) return configRef.current.tier2Refill;
    return configRef.current.tier3Refill;
  }, []);

  const resetCombo = useCallback(() => {
    setComboCount(0);
    setComboPct(0);
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    isPausedRef.current = paused;
    if (!paused) {
      lastTimeRef.current = performance.now();
    }
  }, []);

  return {
    comboCount,
    comboPct,
    config,
    setConfig,
    registerMatch,
    resetCombo,
    setPaused,
  };
};
