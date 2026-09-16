export interface ParsedBoardData {
  cols: number;
  rows: number;
  numbers: number[];
  stacks?: Record<string, number[]>;
}

export function exportFormat1DArray(board: number[]): string {
  return JSON.stringify(board);
}

export function exportFormatJsonObject(
  cols: number,
  rows: number,
  numbers: number[],
  stacks?: Record<string, number[]>
): string {
  const out: Record<string, unknown> = {
    board_size: { cols, rows },
    numbers,
  };
  if (stacks && Object.keys(stacks).length > 0) {
    out.stacks = stacks;
  }
  return JSON.stringify(out, null, 2);
}

export function exportFormatTextMatrix(
  cols: number,
  rows: number,
  board: number[],
  spaceType: 'space' | 'tab',
  spaceWidth: number
): string {
  const spaceChar = spaceType === 'tab' ? '\t' : ' ';
  const delimiter = spaceChar.repeat(Math.max(1, spaceWidth));

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    const currentLine: number[] = [];
    for (let c = 0; c < cols; c++) {
      currentLine.push(board[r * cols + c] ?? 0);
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

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    if (parsed.board_size && Array.isArray(parsed.numbers)) {
      return {
        cols: parsed.board_size.cols,
        rows: parsed.board_size.rows,
        numbers: parsed.numbers,
        stacks:
          parsed.stacks && typeof parsed.stacks === 'object' && !Array.isArray(parsed.stacks)
            ? (parsed.stacks as Record<string, number[]>)
            : {},
      };
    } else if (Array.isArray(parsed)) {
      const total = parsed.length;
      let cols = fallbackCols;
      let rows = fallbackRows;
      if (total !== cols * rows) {
        cols = fallbackCols;
        rows = Math.ceil(total / fallbackCols);
      }
      return {
        cols,
        rows,
        numbers: parsed,
        stacks: {},
      };
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

  const numbers: number[] = [];
  for (let r = 0; r < rows; r++) {
    const tokens = lines[r]!.split(/[\s\t]+/).filter((x) => x !== '');
    for (let c = 0; c < cols; c++) {
      numbers.push(parseInt(tokens[c] ?? '0', 10) || 0);
    }
  }

  return { cols, rows, numbers, stacks: {} };
}
