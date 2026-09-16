import { describe, it, expect } from 'vitest';
import {
  exportFormat1DArray,
  exportFormatJsonObject,
  exportFormatTextMatrix,
  parseAnyBoardData,
} from './serialization';

describe('import-export-board - serialization', () => {
  it('exports and parses 1D array', () => {
    const board = [1, 2, 3, 4, 5, 6];
    const jsonStr = exportFormat1DArray(board);
    expect(jsonStr).toBe('[1,2,3,4,5,6]');

    const parsed = parseAnyBoardData(jsonStr, 3, 2);
    expect(parsed.cols).toBe(3);
    expect(parsed.rows).toBe(2);
    expect(parsed.numbers).toEqual(board);
    expect(parsed.stacks).toEqual({});
  });

  it('exports and parses JSON object with stacks', () => {
    const numbers = [1, 2, 3, 4];
    const stacks = { '0,0': [5, 6], '1,1': [7] };
    const jsonStr = exportFormatJsonObject(2, 2, numbers, stacks);
    const parsed = parseAnyBoardData(jsonStr);

    expect(parsed.cols).toBe(2);
    expect(parsed.rows).toBe(2);
    expect(parsed.numbers).toEqual(numbers);
    expect(parsed.stacks).toEqual(stacks);
  });

  it('exports and parses text matrix with custom space width', () => {
    const board = [1, 2, 3, 4];
    const textStr = exportFormatTextMatrix(2, 2, board, 'space', 2);
    expect(textStr).toBe('1  2\n3  4');

    const parsed = parseAnyBoardData(textStr);
    expect(parsed.cols).toBe(2);
    expect(parsed.rows).toBe(2);
    expect(parsed.numbers).toEqual([1, 2, 3, 4]);
  });

  it('throws on empty string', () => {
    expect(() => parseAnyBoardData('   ')).toThrow('Input text is empty!');
  });
});
