export type BoardCellEntry = number | number[];

export interface ParsedBoardData {
  cols: number;
  rows: number;
  numbers: number[];
  stacks?: Record<string, number[]>;
  entries?: BoardCellEntry[];
}

export function extractCellEntries(
  cols: number,
  rows: number,
  matrix: number[][],
  stacks: Record<string, number[]> = {}
): BoardCellEntry[] {
  const entries: BoardCellEntry[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const topVal = matrix[r]?.[c] ?? 0;
      const stack = stacks[`${c},${r}`];
      if (stack && stack.length > 0) {
        entries.push([...stack, topVal]);
      } else {
        entries.push(topVal);
      }
    }
  }
  return entries;
}

export function exportFormat1DArray(entries: BoardCellEntry[]): string {
  return JSON.stringify(entries);
}

export function exportFormatJsonObject(
  cols: number,
  rows: number,
  entries: BoardCellEntry[],
  legacyStacks?: Record<string, number[]>
): string {
  const out: Record<string, unknown> = {
    board_size: { cols, rows },
    numbers: entries,
  };
  if (legacyStacks && Object.keys(legacyStacks).length > 0) {
    out.stacks = legacyStacks;
  }
  return JSON.stringify(out, null, 2);
}

export function exportFormatTextMatrix(
  cols: number,
  rows: number,
  entries: BoardCellEntry[],
  spaceType: 'space' | 'tab',
  spaceWidth: number
): string {
  const spaceChar = spaceType === 'tab' ? '\t' : ' ';
  const delimiter = spaceChar.repeat(Math.max(1, spaceWidth));

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    const currentLine: string[] = [];
    for (let c = 0; c < cols; c++) {
      const item = entries[r * cols + c] ?? 0;
      if (Array.isArray(item)) {
        currentLine.push(JSON.stringify(item));
      } else {
        currentLine.push(item.toString());
      }
    }
    lines.push(currentLine.join(delimiter));
  }
  return lines.join('\n');
}

export function parseAnyBoardData(
  rawStr: string,
  fallbackCols = 17,
  fallbackRows = 10
): ParsedBoardData {
  const trimmed = rawStr.trim();
  if (!trimmed) {
    throw new Error('Input text is empty!');
  }

  const unpackEntries = (
    rawEntries: (BoardCellEntry | unknown)[],
    cols: number,
    rows: number,
    existingStacks: Record<string, number[]> = {}
  ): ParsedBoardData => {
    const numbers: number[] = [];
    const stacks: Record<string, number[]> = { ...existingStacks };
    const entries: BoardCellEntry[] = [];

    for (let i = 0; i < cols * rows; i++) {
      const raw = rawEntries[i];
      const c = i % cols;
      const r = Math.floor(i / cols);
      const key = `${c},${r}`;

      if (Array.isArray(raw)) {
        const numArr = raw.map((n) => (typeof n === 'number' ? n : parseInt(String(n), 10) || 0));
        entries.push(numArr);
        if (numArr.length === 0) {
          numbers.push(0);
        } else if (numArr.length === 1) {
          numbers.push(numArr[0]!);
        } else {
          numbers.push(numArr[numArr.length - 1]!);
          stacks[key] = numArr.slice(0, numArr.length - 1);
        }
      } else {
        const num = typeof raw === 'number' ? raw : parseInt(String(raw ?? 0), 10) || 0;
        entries.push(num);
        numbers.push(num);
      }
    }

    return { cols, rows, numbers, stacks, entries };
  };

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    if (parsed.board_size && Array.isArray(parsed.numbers)) {
      const cols = parsed.board_size.cols;
      const rows = parsed.board_size.rows;
      const existingStacks =
        parsed.stacks && typeof parsed.stacks === 'object' && !Array.isArray(parsed.stacks)
          ? (parsed.stacks as Record<string, number[]>)
          : {};
      return unpackEntries(parsed.numbers, cols, rows, existingStacks);
    } else if (Array.isArray(parsed)) {
      const total = parsed.length;
      let cols = fallbackCols;
      let rows = fallbackRows;
      if (total !== cols * rows) {
        cols = fallbackCols;
        rows = Math.ceil(total / fallbackCols);
      }
      return unpackEntries(parsed, cols, rows);
    }
  }

  // Parse whitespace delimited matrix lines
  const lines = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const rows = lines.length;
  const firstLineElements = lines[0] ? lines[0].split(/[\s\t]+/).filter((x) => x !== '') : [];
  const cols = firstLineElements.length;

  const rawTokens: BoardCellEntry[] = [];
  for (let r = 0; r < rows; r++) {
    const tokens = lines[r]!.split(/[\s\t]+/).filter((x) => x !== '');
    for (let c = 0; c < cols; c++) {
      const token = tokens[c] ?? '0';
      if (token.startsWith('[') && token.endsWith(']')) {
        try {
          const arr = JSON.parse(token);
          if (Array.isArray(arr)) {
            rawTokens.push(arr.map((n) => parseInt(String(n), 10) || 0));
            continue;
          }
        } catch {
          // fallback
        }
      }
      rawTokens.push(parseInt(token, 10) || 0);
    }
  }

  return unpackEntries(rawTokens, cols, rows);
}
