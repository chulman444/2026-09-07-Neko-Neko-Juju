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

export function createBoardMatrix(
  cols: number,
  rows: number,
  minNum: number,
  maxNum: number,
  seedStr: string
): number[][] {
  const prng = seededRandomGenerator(seedStr);
  const matrix: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(Math.floor(prng() * (maxNum - minNum + 1)) + minNum);
    }
    matrix.push(row);
  }
  return matrix;
}
