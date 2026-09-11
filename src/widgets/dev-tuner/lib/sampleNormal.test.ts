import { describe, it, expect } from 'vitest';
import { sampleNormal } from './sampleNormal';

describe('sampleNormal', () => {
  it('returns a finite number', () => {
    const val = sampleNormal(1.0, 0.2);
    expect(Number.isFinite(val)).toBe(true);
  });

  it('samples numbers with average close to requested mean over many trials', () => {
    const targetMean = 1.35;
    const stdDev = 0.25;
    const n = 1000;
    let sum = 0;

    for (let i = 0; i < n; i++) {
      sum += sampleNormal(targetMean, stdDev);
    }

    const empiricalMean = sum / n;
    expect(empiricalMean).toBeGreaterThan(targetMean - 0.1);
    expect(empiricalMean).toBeLessThan(targetMean + 0.1);
  });
});
