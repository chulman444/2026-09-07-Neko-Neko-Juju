# Implementation Plan: Board Maker Layer List, Stack Pipeline & Inspector Enhancements

This plan updates the Board Maker based on the user's exact feedback and requirements:
1. **Stack Inspector Horizontal Scroll Alignment**: Auto-scroll compensation when adding new items below the base so repeated clicking of the `[+]` button keeps adding to the end rather than shifting under the cursor.
2. **Unified Data Pipeline (Single Value or Array)**: Every board entry in 1D array, JSON, and text matrix is either a single number or a `number[]` array representing a stack. Single number is a shortcut for an array with 1 value.
3. **Tile Value Wheel Scroll** in the Stack Inspector.
4. **Ghost Top-Tile in Active Layer Mode** rendered under the can/cannot draw indicators.
5. **Layer List Selector** with non-cycling wheel scroll, tile counts per layer, and base/top shortcuts.

---

## User Review Required

> [!IMPORTANT]
> - **Unified Data Pipeline Format**:
>   - In 1D Array & JSON Object: The `numbers` array contains `(number | number[])[]`.
>     - Flat single number: `5` $\rightarrow$ shortcut for `[5]` (single tile at base).
>     - `0` $\rightarrow$ empty cell (`[]`).
>     - Array of numbers: `[2, 7, 9]` $\rightarrow$ stack from bottom (base = 2) to top (surface = 9).
>   - In Text Matrix: Stacked cells are represented as bracketed or comma-delimited arrays (e.g. `1  [2,4]  3  0  [5,9,2]`). Plain numbers remain unbracketed.
> - **Stack Inspector Scroll Alignment**:
>   - When clicking `[+]` to append a new item below the base (far right), the inspector's horizontal scroll container automatically offsets/scrolls rightward by the new item width so the `[+]` button stays directly under the mouse pointer for rapid sequential clicks.

---

## Proposed Changes

### `features/import-export-board` (Unified Pipeline Format)

#### [MODIFY] `serialization.ts`
- **Cell Entry Representation**:
  - Define `BoardCellEntry = number | number[]`.
  - Helper to extract `BoardCellEntry[]` for any board state:
    - If empty $\rightarrow$ `0`
    - If single tile $\rightarrow$ `val`
    - If stacked $\rightarrow$ `[...stackBelow, topVal]`
- **Serialization Functions**:
  - `exportFormat1DArray(entries: BoardCellEntry[])`: Outputs JSON array where stacked cells are nested arrays: `[1, [2, 4], 3, 0, ...]`.
  - `exportFormatJsonObject(cols, rows, entries: BoardCellEntry[])`:
    ```json
    {
      "board_size": { "cols": 17, "rows": 10 },
      "numbers": [1, [2, 4], 3, 0, ...]
    }
    ```
  - `exportFormatTextMatrix(cols, rows, entries: BoardCellEntry[], spaceType, spaceWidth)`:
    - Formats stacked entries as `[2,4]`, single tiles as `5`, empty as `0`.
- **Parsing (`parseAnyBoardData`)**:
  - When parsing array elements or text tokens:
    - If element is a number: `0` is empty, `> 0` is single tile.
    - If element is an array (e.g. `[2, 4]` in JSON or parsed from `[2,4]` in text):
      - Top tile is `arr[arr.length - 1]`.
      - Stack underneath is `arr.slice(0, arr.length - 1)`.
    - Backward-compatible with legacy `{ board_size, numbers, stacks }` JSON.

#### [MODIFY] `serialization.test.ts`
- Add comprehensive tests for serializing and parsing mixed arrays `[1, [2, 7], 0]` in 1D array, JSON object, and Text Matrix.

---

### `entities/board-maker` (State)

#### [MODIFY] `boardMakerStore.ts`
- **Cycle Tile at Depth**:
  - Add `cycleTileValueAtDepth(col: number, row: number, z: number, delta: number)`.
  - Increments/decrements tile at depth $z$, wrapping 1–9.
- **Layer Stepping**:
  - Add `stepActiveLayer(delta: number, maxLayer?: number)`.
  - Moves active layer without cycling (clamped between 0 and max layer, or transitions cleanly to/from `'surface'`).
- **Layer Tile Counts**:
  - Add helper `getTileCounts(cols, rows, matrix, stacks)` to return `{ surface: number, layers: Record<number, number> }`.

---

### `widgets/board-drawer` (Canvas & Pipeline)

#### [MODIFY] `DrawerCanvas.tsx`
- **Ghost Top-Tile in Active Layer Mode**:
  - In Active Layer mode (layer $Z$):
    - If a cell does not have a tile at layer $Z$ (unsupported or supported empty slot), check `surfaceVal = matrix[r][c]`.
    - If `surfaceVal > 0`, render the surface tile in a muted/dimmed style (e.g. 30% opacity with lighter font) as the base layer.
    - On top of the ghost tile, draw the can/cannot draw indicator:
      - **Cannot draw**: semi-transparent dark hatch overlay so the surface tile is visible underneath.
      - **Can draw (empty at Z)**: clean highlight border with subtle center indicator.

#### [MODIFY] `DataPipelineEditor.tsx`
- Use `BoardCellEntry[]` (single numbers or arrays) for all exports (`exportFormat1DArray`, `exportFormatJsonObject`, `exportFormatTextMatrix`).
- Loading/parsing seamlessly supports both single numbers and arrays.

---

### `pages/board-maker` (UI & Inspector)

#### [MODIFY] `BoardMakerPage.tsx`
- **Stack Inspector Scroll Compensation**:
  - Attach a ref `inspectorScrollRef` to the horizontal tiles container.
  - When clicking the `[+]` button at the base (index 0, rightmost end), measure container scroll position and adjust `scrollLeft` to keep the end `[+]` button directly under the mouse cursor.
- **Tile Wheel Scroll in Inspector**:
  - On each tile card, add `onWheel`:
    - Calls `e.preventDefault()` and `e.stopPropagation()`.
    - Cycles tile value via `cycleTileValueAtDepth` (1–9).
- **Layer List Selector**:
  - Replace horizontal buttons with a structured Layer List:
    - Displays `⛰️ Surface (Top)` and layers `L0 (Base)` up to top.
    - Tile count badge on each item (e.g. `L0 • 45`).
    - `[Top]` and `[Base]` quick shortcut buttons.
    - Mouse wheel listener: steps layer up/down with **strictly NO cycling**.
    - Keyboard shortcuts: `Home` (Base L0), `End` (Surface), `[` / `]` (step down / up).

---

## Verification Plan

### Automated Tests
- `npx.cmd vitest run src/features/import-export-board`
- `npx.cmd vitest run src/entities/board-maker`
- `npx.cmd vitest run`
- `npx.cmd tsc -b`
- `npx.cmd vite build`
- `npx.cmd oxlint`

### Manual Verification
1. **Inspector Rapid Click**:
   - In the Stack Inspector, click `[+]` at the bottom/base repeatedly. Verify horizontal scroll keeps the `[+]` button under your cursor and adds new base tiles sequentially without drifting.
2. **Data Pipeline Stack Representation**:
   - Create a stack `[3, 7, 9]`.
   - Export 1D Array and JSON: verify entry appears as `[3, 7, 9]`.
   - Export Text Matrix: verify entry appears as `[3,7,9]`.
   - Clear board and click Auto-Detect: verify the exact stack is restored.
3. **Ghost Top-Tile**:
   - Switch to Layer 1 or 2. Verify cells with top tiles render them dimmed underneath the can/cannot draw indicators.
4. **Layer List & Wheel**:
   - Scroll wheel over the layer selector: verify it moves without cycling. Verify tile counts update on each layer.
