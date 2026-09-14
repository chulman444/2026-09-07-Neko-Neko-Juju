import { describe, it, expect } from 'vitest';
import {
  rotateCW,
  rotateCCW,
  transpose,
  antiTranspose,
  nextOrientationCW,
  nextOrientationCCW,
  nextOrientationTranspose,
  nextOrientationAntiTranspose,
  invertTransform,
  DEFAULT_ORIENTATION_OFFSET,
  type OrientationOffset,
} from './matrixTransforms';

describe('matrixTransforms pure functions', () => {
  const sampleMatrix = [
    [1, 2, 3],
    [4, 5, 6],
  ];

  it('handles empty matrix gracefully', () => {
    expect(rotateCW([])).toEqual([]);
    expect(rotateCCW([])).toEqual([]);
    expect(transpose([])).toEqual([]);
    expect(antiTranspose([])).toEqual([]);
    expect(invertTransform([], DEFAULT_ORIENTATION_OFFSET)).toEqual([]);
  });

  it('rotates 90 deg clockwise correctly', () => {
    const rotated = rotateCW(sampleMatrix);
    expect(rotated).toEqual([
      [4, 1],
      [5, 2],
      [6, 3],
    ]);
  });

  it('rotates 90 deg counter-clockwise correctly', () => {
    const rotated = rotateCCW(sampleMatrix);
    expect(rotated).toEqual([
      [3, 6],
      [2, 5],
      [1, 4],
    ]);
  });

  it('rotateCW and rotateCCW are exact inverses', () => {
    expect(rotateCCW(rotateCW(sampleMatrix))).toEqual(sampleMatrix);
    expect(rotateCW(rotateCCW(sampleMatrix))).toEqual(sampleMatrix);
  });

  it('four clockwise rotations return the original matrix', () => {
    let m = sampleMatrix;
    for (let i = 0; i < 4; i++) {
      m = rotateCW(m);
    }
    expect(m).toEqual(sampleMatrix);
  });

  it('transposes matrix across main diagonal (locking top-left and bottom-right)', () => {
    const transposed = transpose(sampleMatrix);
    expect(transposed).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    // Top-left locked (1)
    expect(transposed[0]![0]).toBe(sampleMatrix[0]![0]);
    // Bottom-right locked (6)
    expect(transposed[2]![1]).toBe(sampleMatrix[1]![2]);
    // Transpose is an involution
    expect(transpose(transposed)).toEqual(sampleMatrix);
  });

  it('anti-transposes matrix across anti-diagonal (locking top-right and bottom-left)', () => {
    const anti = antiTranspose(sampleMatrix);
    expect(anti).toEqual([
      [6, 3],
      [5, 2],
      [4, 1],
    ]);
    // Top-right locked (3)
    expect(anti[0]![1]).toBe(sampleMatrix[0]![2]);
    // Bottom-left locked (4)
    expect(anti[2]![0]).toBe(sampleMatrix[1]![0]);
    // Anti-transpose is an involution
    expect(antiTranspose(anti)).toEqual(sampleMatrix);
  });

  it('invertTransform restores original matrix across all 8 group elements', () => {
    // Generate an asymmetrical test matrix with unique elements
    const testM = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ];

    // Build the 8 elements of D4 by applying sequences
    const operations: {
      name: string;
      apply: (m: number[][]) => number[][];
      nextOffset: (o: OrientationOffset) => OrientationOffset;
    }[] = [
      { name: 'CW', apply: rotateCW, nextOffset: nextOrientationCW },
      { name: 'CCW', apply: rotateCCW, nextOffset: nextOrientationCCW },
      { name: 'Transpose', apply: transpose, nextOffset: nextOrientationTranspose },
      { name: 'AntiTranspose', apply: antiTranspose, nextOffset: nextOrientationAntiTranspose },
    ];

    // Run 50 random sequence walks
    for (let run = 0; run < 50; run++) {
      let currentM = testM.map((r) => [...r]);
      let offset: OrientationOffset = { ...DEFAULT_ORIENTATION_OFFSET };

      const numSteps = (run % 10) + 1;
      for (let s = 0; s < numSteps; s++) {
        const op = operations[(run + s * 3) % operations.length]!;
        currentM = op.apply(currentM);
        offset = op.nextOffset(offset);
      }

      // Inverting the transform must restore testM identically
      const restored = invertTransform(currentM, offset);
      expect(restored).toEqual(testM);
    }
  });
});
