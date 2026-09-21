import { describe, it, expect } from 'vitest';
import {
  generateLinearTileWeights,
  calculateBoardMetrics,
  createBoardMatrix,
  createBoardWithStacks,
} from './boardGenerators';

describe('boardGenerators - Linear Slope Tile Weights', () => {
  it('generates 9 normalized weights summing to 1.0', () => {
    const weights = generateLinearTileWeights(0, 0);
    expect(weights).toHaveLength(9);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);

    // Tilt 0 with 0 noise should be flat (~11.1% each)
    weights.forEach((w) => {
      expect(w).toBeCloseTo(1 / 9, 4);
    });
  });

  it('biases toward smaller numbers when tilt is positive (Easy)', () => {
    const weights = generateLinearTileWeights(4.0, 0); // +4% tilt
    expect(weights[0]).toBeGreaterThan(weights[4]!); // 1 > 5
    expect(weights[4]).toBeGreaterThan(weights[8]!); // 5 > 9
    expect(weights[0]!).toBeCloseTo(0.1511, 2);
    expect(weights[8]!).toBeCloseTo(0.0711, 2);
  });

  it('biases toward larger numbers when tilt is negative (Hard)', () => {
    const weights = generateLinearTileWeights(-4.0, 0); // -4% tilt
    expect(weights[8]).toBeGreaterThan(weights[4]!); // 9 > 5
    expect(weights[4]).toBeGreaterThan(weights[0]!); // 5 > 1
    expect(weights[8]!).toBeCloseTo(0.1511, 2);
    expect(weights[0]!).toBeCloseTo(0.0711, 2);
  });

  it('adds Gaussian scatter when noiseSpread > 0 while keeping sum 1.0', () => {
    const weights = generateLinearTileWeights(2.0, 0.02);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
    weights.forEach((w) => {
      expect(w).toBeGreaterThan(0);
    });
  });
});

describe('boardGenerators - Board Metrics Calculation', () => {
  it('calculates exact sum, average tile, and zScore for a uniform board', () => {
    // 2x2 board with all 5s
    const matrix = [
      [5, 5],
      [5, 5],
    ];
    const metrics = calculateBoardMetrics(matrix);
    expect(metrics.totalTiles).toBe(4);
    expect(metrics.totalSum).toBe(20);
    expect(metrics.averageTile).toBe(5);
    expect(metrics.zScore).toBe(0);
    expect(metrics.counts[5]).toBe(4);
  });

  it('calculates negative zScore when board is filled with low numbers', () => {
    // 4 tiles of 1s: sum = 4, expected = 20
    const matrix = [
      [1, 1],
      [1, 1],
    ];
    const metrics = calculateBoardMetrics(matrix);
    expect(metrics.totalSum).toBe(4);
    expect(metrics.averageTile).toBe(1);
    expect(metrics.zScore).toBeLessThan(-1.5);
  });
});

describe('boardGenerators - createBoardMatrix with weighted tiles', () => {
  it('generates reproducible boards using seeded PRNG and weights', () => {
    const weights = generateLinearTileWeights(4.0, 0);
    const matrix1 = createBoardMatrix(10, 10, 1, 9, 'test-seed-123', weights);
    const matrix2 = createBoardMatrix(10, 10, 1, 9, 'test-seed-123', weights);
    expect(matrix1).toEqual(matrix2);

    const metrics = calculateBoardMetrics(matrix1);
    // With +4% tilt, average tile should be lower than 5.0
    expect(metrics.averageTile).toBeLessThan(5.0);
  });
});

describe('boardGenerators - createBoardWithStacks', () => {
  it('generates board with empty stacks when stackedTilesCount is 0', () => {
    const { matrix, stacks } = createBoardWithStacks(5, 5, 1, 9, 'seed-1', undefined, 0);
    expect(matrix).toHaveLength(5);
    expect(matrix[0]).toHaveLength(5);
    expect(stacks).toEqual({});
  });

  it('distributes exactly stackedTilesCount tiles across grid cells', () => {
    const cols = 6;
    const rows = 6;
    const count = 10;
    const { matrix, stacks } = createBoardWithStacks(
      cols,
      rows,
      1,
      9,
      'seed-stacks-test',
      undefined,
      count
    );
    expect(matrix).toHaveLength(rows);
    expect(matrix[0]).toHaveLength(cols);

    const totalStacked = Object.values(stacks).reduce((sum, s) => sum + s.length, 0);
    expect(totalStacked).toBe(count);

    // Validate that every stack coordinate is within bounds and values are 1..9
    Object.entries(stacks).forEach(([coord, tileValues]) => {
      const [c, r] = coord.split(',').map(Number);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(cols);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(rows);
      tileValues.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(9);
      });
    });
  });

  it('generates identical stacks given identical seed', () => {
    const res1 = createBoardWithStacks(8, 8, 1, 9, 'seed-reproducible', undefined, 12);
    const res2 = createBoardWithStacks(8, 8, 1, 9, 'seed-reproducible', undefined, 12);
    expect(res1.matrix).toEqual(res2.matrix);
    expect(res1.stacks).toEqual(res2.stacks);
  });
});
