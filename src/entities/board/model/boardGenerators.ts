import { seededRandomGenerator } from '@/shared/lib/prng';

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateRandomNumberList(total: number): number[] {
  const result: number[] = [];
  for (let i = 1; i <= 9; i++) {
    result.push(i, i);
  }
  if (result.length > total) {
    result.length = total;
  }
  while (result.length < total) {
    result.push(Math.floor(Math.random() * 9) + 1);
  }
  return shuffleArray(result);
}

export function generateRandomNumberSum10s(total: number): number[] {
  const numbers = generateRandomNumberList(total);
  const sum = numbers.reduce((p, c) => p + c, 0);
  const remainder = sum % 10;
  if (remainder === 0) return numbers;

  const diff = remainder <= 5 ? -remainder : 10 - remainder;
  const target = numbers.find((n) => (diff > 0 && n + diff <= 9) || (diff < 0 && n + diff >= 1));
  if (target !== undefined) {
    const idx = numbers.indexOf(target);
    numbers[idx] += diff;
  }
  return numbers;
}

export function generateRandomNumberSeeded(total: number, prng: () => number): number[] {
  const result: number[] = [];
  for (let i = 1; i <= 9; i++) {
    result.push(i, i);
  }
  if (result.length > total) {
    result.length = total;
  }
  while (result.length < total) {
    result.push(Math.floor(prng() * 9) + 1);
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateRandomNumberSum10sSeeded(total: number, prng: () => number): number[] {
  const numbers = generateRandomNumberSeeded(total, prng);
  const sum = numbers.reduce((p, c) => p + c, 0);
  const remainder = sum % 10;
  if (remainder === 0) return numbers;

  const diff = remainder <= 5 ? -remainder : 10 - remainder;
  const target = numbers.find((n) => (diff > 0 && n + diff <= 9) || (diff < 0 && n + diff >= 1));
  if (target !== undefined) {
    const idx = numbers.indexOf(target);
    numbers[idx] += diff;
  }
  return numbers;
}

export function sampleNormal(mean: number, stdDev: number, rng: () => number = Math.random): number {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Generates 9 normalized weights for tiles 1 to 9.
 * @param tiltPercent Tilt percentage (e.g. +4 for +4% easy, -4 for -4% hard).
 * @param noiseSpread Standard deviation of Gaussian noise added to each tile weight.
 * @param rng Random number generator (defaults to Math.random).
 */
export function generateLinearTileWeights(
  tiltPercent: number,
  noiseSpread = 0,
  rng: () => number = Math.random
): number[] {
  const tilt = tiltPercent / 100;
  const rawWeights: number[] = [];

  for (let k = 1; k <= 9; k++) {
    // Linear trendline centered at 1/9 (~11.11%)
    const base = 1 / 9 + tilt * ((5 - k) / 4);
    // Gaussian noise
    const noise = noiseSpread > 0 ? sampleNormal(0, noiseSpread, rng) : 0;
    // Floor at 0.005 so every digit always has a nonzero probability
    rawWeights.push(Math.max(0.005, base + noise));
  }

  const total = rawWeights.reduce((a, b) => a + b, 0);
  return rawWeights.map((w) => w / total);
}

export function createBoardMatrix(
  cols: number,
  rows: number,
  minNum: number,
  maxNum: number,
  seedOrPrng: string | (() => number),
  tileWeights?: number[]
): number[][] {
  const prng = typeof seedOrPrng === 'function' ? seedOrPrng : seededRandomGenerator(seedOrPrng);
  const matrix: number[][] = [];

  // If weights are provided and match the digit count, build CDF
  const count = maxNum - minNum + 1;
  let normalizedWeights: number[] | null = null;
  if (tileWeights && tileWeights.length === count) {
    const sum = tileWeights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      normalizedWeights = tileWeights.map((w) => w / sum);
    }
  }

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (normalizedWeights) {
        const roll = prng();
        let acc = 0;
        let chosen = maxNum;
        for (let i = 0; i < normalizedWeights.length; i++) {
          acc += normalizedWeights[i]!;
          if (roll <= acc || i === normalizedWeights.length - 1) {
            chosen = minNum + i;
            break;
          }
        }
        row.push(chosen);
      } else {
        row.push(Math.floor(prng() * (maxNum - minNum + 1)) + minNum);
      }
    }
    matrix.push(row);
  }
  return matrix;
}

export interface BoardMetrics {
  totalTiles: number;
  totalSum: number;
  averageTile: number;
  zScore: number;
  counts: Record<number, number>;
}

export function calculateBoardMetrics(matrix: number[][]): BoardMetrics {
  let totalTiles = 0;
  let totalSum = 0;
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) {
    counts[i] = 0;
  }

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const val = row[c] ?? 0;
      if (val > 0) {
        totalTiles++;
        totalSum += val;
        counts[val] = (counts[val] ?? 0) + 1;
      }
    }
  }

  const averageTile = totalTiles > 0 ? totalSum / totalTiles : 0;
  // Variance of a uniform tile 1..9 is 80/12 = 6.6667, stdDev = 2.581988897
  const expectedSum = totalTiles * 5;
  const sumStdDev = 2.581988897 * Math.sqrt(totalTiles);
  const zScore = sumStdDev > 0 ? (totalSum - expectedSum) / sumStdDev : 0;

  return {
    totalTiles,
    totalSum,
    averageTile,
    zScore,
    counts,
  };
}

