# Board Maker Brush, Interaction & Layer Overhaul

This plan addresses the UI and UX updates for the Board Maker based on the latest notes and feedback.

## User Review Required
> [!IMPORTANT]
> - **Active Layer vs Surface Mode**: 
>   - In **Surface mode** (default), you view the top of all stacks. Drawing a number *pushes/adds* a new tile on top. `-`/`+` updates the top value, and `0` pops the top layer.
>   - In **Active Layer (Layer Z) mode**, you view only the tiles exactly at that Z-level. Drawing a number **simply overrides** the value at that layer—acting exactly like the **old 2D board editor**. No layers are added. `-`/`+` decrement/increment the value at that layer. If a cell has no supporting tile underneath, it ignores inputs (preventing floating tiles).

## Proposed Changes

### `entities/board-maker` (State)

#### [MODIFY] `boardMakerStore.ts`
- **Brushes**: Update the `selectedBrush` type to support `0`, `-`, and `+` along with `1-9` (e.g., `type Brush = number | '-' | '+'`). Default to `1`.
- **Layer Mode**: Add `activeLayer: number | 'surface'` (default `'surface'`).
- **Inspection State**: Add `inspectedStack: { col: number, row: number, stack: number[] } | null`.
- **Core Action Update (`setTileAtLayer`)**: Add a new robust setter that handles deep stack manipulation.
  - Calculates the `fullStack` array for a given cell `[bottomTile, ..., topTile]`.
  - If placing a tile where there is no support, it aborts.
  - If erasing a tile (`0` brush) in Active Layer mode while there are tiles above it, it **aborts/ignores** the action.
  - Re-saves the final `fullStack` back into `matrix` (top tile) and `stacks` (remaining tiles below).
- **Clear Stack**: Add a `clearStackAt(col, row)` action to wipe a cell completely.
- **Remove Specific Tile**: Add `removeTileAtDepth(col, row, z)` to allow the Inspector UI to delete middle tiles and let the ones above fall down to close the gap.
- **Insert Specific Tile**: Add `insertTileAtDepth(col, row, z, val)` to allow inserting tiles directly from the Inspector UI.

### `widgets/board-drawer` (Interactions)

#### [MODIFY] `DrawerCanvas.tsx`
- **Rendering in Active Layer Mode**:
  - Tiles that lack a supporting tile underneath (i.e. cannot be drawn on) will be rendered with a **darker color/disabled pattern** to visually distinguish them as non-drawable.
- **Mouse Interactions**:
  - `Middle Click (button 1)`: Implement drag-to-scroll on the parent `.overflow-auto` container to fulfill the "Pan" requirement cleanly.
  - `Ctrl + Left Click`: Trigger `setInspectedStack` for the hovered coordinate.
  - `Left Click (Drawing)`:
    - Determine target `z` (top of stack in 'surface' mode, or strict `activeLayer` index).
    - If brush is `1-9`: Call `setTileAtLayer(col, row, z, brush)`.
    - If brush is `0`: 
      - In Surface mode: Pops the top tile.
      - In Active Layer mode: Erases the tile at `z` ONLY IF there are no tiles above it. Otherwise, ignores the click.
    - If brush is `-` or `+`: 
      - Decrement/Increment the tile at `z`.
      - Values wrap strictly between `1-9` (e.g., `9 + 1 = 1`). 
      - If the current tile is `0` (empty) and `-`/`+` is clicked, it becomes `9` or `1` respectively. It never reaches `0` via these brushes.
  - `Right Click`: Same as brush `0`.
- **Scroll Wheel**: Cycle `selectedBrush` strictly through `1-9`. Exclude `0`, `-`, and `+`.
- **Keyboard Shortcuts**: Update `handleKeyDown` to listen for `-` and `=` (for `+`), in addition to `0-9`.

### `pages/board-maker` (UI)

#### [MODIFY] `BoardMakerPage.tsx`
- **Toolbar Updates**:
  - Add a **Layer Selector** (`Surface`, `Layer 0 (Base)`, `Layer 1`, etc.).
  - Visually group brush `1-9` separately from the special action brushes (`0`, `-`, `+`).
- **Inspector UI**:
  - Render `inspectedStack` horizontally below or alongside the toolbar.
  - Show tiles left-to-right: `[Surface Tile] -> [Depth 1] ... -> [Bottom Tile]`.
  - **Active Tile Indicator**: Visually highlight the tile that is currently being displayed on the board. In Surface mode, this highlights the top-most tile. In Active Layer mode, it highlights the tile at that specific Z-level.
  - **Tile Deletion**: Add a **"Delete" (X)** button on each individual tile to allow removing middle tiles.
  - **Tile Insertion**: Render small **`[+]` insert buttons** in the gaps between tiles (and at the ends). Clicking one will insert a new tile at that specific depth using your currently selected `1-9` brush.
  - Add a **"Clear Entire Stack"** button to the Inspector UI.

## Verification Plan

### Automated Tests
- Run `npx.cmd vitest run` to ensure state changes don't break existing entity tests (if any exist for `boardMakerStore`).

### Manual Verification
1. Open the Board Maker.
2. Verify scrolling the mouse wheel changes the selected brush in the toolbar.
3. Select brush `+` and click on a `1` tile to verify it increments to `2`.
4. Select brush `-` and click to verify it decrements.
5. Draw a few stacked tiles, hold `Ctrl` and click to verify the inspector UI pops up and displays the stack horizontally.
6. Verify middle mouse button allows you to pan the canvas smoothly.
7. Verify right click and brush `0` pop the layer.
