# Board Maker with Stacked Tiles (Layers)

This plan re-introduces the Board Maker page based on the legacy reference. Thanks to your insight, we have found an incredibly elegant architecture that integrates stacked tiles seamlessly without requiring a complex 3D matrix or breaking legacy versions!

## Data Architecture: The Active Matrix + Reserve Stacks

Instead of managing a complex 3D grid, the active playable area remains a standard 2D matrix. The "depth" is simply a reserve queue (Hash Table) of tiles waiting to surface when the top tile is cleared.

**State Structure (`entities/board/model/boardStore.ts`):**
```typescript
interface BoardState {
  // The active, visible, and playable top layer
  matrix: number[][]; 
  
  // Hash map of tiles underneath the active layer.
  // Key: "col,row" (e.g., "3,4")
  // Value: Array of tile values acting as a LIFO stack.
  stacks: Record<string, number[]>; 
}
```

**How it works (LIFO):**
1. **Gameplay (`clearTiles`):** When a user clears a group of tiles, we check the `stacks` hash map for those positions. If `stacks["x,y"]` has remaining items, we `pop()` the last item and assign it directly to `matrix[row][col]`.
2. **Backward Compatibility:** Because the active playable state is still `matrix: number[][]`, **all of our existing components** (the solver, selection logic, and legacy pages `game-v0.1.z` to `0.3.z`) will continue to work perfectly out-of-the-box! They just see the active 2D layer.
3. **Editor:** When the user clicks to add a tile at an already occupied `(x, y)`, the current value in `matrix[row][col]` is pushed into `stacks["x,y"]`, and the new value takes its place in `matrix`.

## Addressing the "Extreme Stacking" UX

Since we know exactly how many tiles are underneath any given cell (`stacks["x,y"].length`), we can easily visualize this on the active 2D board:

1. **Stack Depth Badges:** We will render a small typography badge (e.g., `x7`) in the top-right corner of the active tile if `stacks["x,y"].length > 0`. The number displayed is `length + 1` (the stack plus the active tile).
2. **Topography (Optional pseudo-3D):** The `GameBoard` UI can optionally apply a CSS box-shadow or a slight translate offset based on `stacks["x,y"].length` to give the tile a thicker, 3D appearance.
3. **Heatmap Editor Mode:** In the Board Maker, we can add a toggle to color-code tiles based on their stack depth, so the designer instantly sees the board's topography.

## Proposed Changes

---

### `entities/board`

Enhance the existing board entity with the new `stacks` feature.

#### [MODIFY] `model/boardStore.ts`
- Add `stacks: Record<string, number[]>` to the store state.
- Update `clearTiles` action: 
  ```typescript
  tiles.forEach(({ col, row }) => {
    const stackKey = `${col},${row}`;
    const stack = get().stacks[stackKey];
    if (stack && stack.length > 0) {
      newMatrix[row][col] = stack.pop()!;
    } else {
      newMatrix[row][col] = 0;
    }
  });
  ```
- No need to create a whole new `entities/board-3d` anymore!

---

### `widgets/game-board`

Update the visual rendering to display stack depth.

#### [MODIFY] `ui/GameBoard.tsx` / `ui/BoardCanvas.tsx`
- Read `stacks` from `useBoardStore`.
- For each rendered tile, check `stacks["col,row"]?.length`. If it exists, render the `xN` badge and apply thicker styling.

---

### `entities/board-maker` (New)

#### [NEW] `model/boardMakerStore.ts`
- State: `cols`, `rows`, `matrix: number[][]`, `stacks: Record<string, number[]>`.
- Actions: `addTileAt(x, y, value)`, `removeTileAt(x, y)`.
  - `addTileAt`: If occupied, push to stack, replace matrix.
  - `removeTileAt`: If occupied, clear matrix, pop from stack to matrix.

---

### `pages/board-maker` & `widgets/board-drawer` (New)

#### [NEW] `ui/BoardMakerPage.tsx` & `ui/DrawerCanvas.tsx`
- Left column for Canvas & Configuration. Right column for Data Pipeline.
- The `DrawerCanvas` renders the active `matrix` and badges for depth, allowing the user to click to add/remove layers instantly.

## Verification Plan

### Automated Tests
- Add unit tests in `boardStore.test.ts` to verify that `clearTiles` correctly pops values from `stacks` into the `matrix`, and correctly sets it to `0` when the stack is empty.

### Manual Verification
- Navigate to `/board-maker`.
- Click a cell 3 times. Verify it shows the active value and an `x3` badge.
- Export to game board.
- Clear the tile in the game. Verify it reveals the underlying tile from the stack.
- Verify that old game versions (`/game-v0.1.z` to `/game-v0.3.z`) ignore the stacks and play normally if stacks are empty.
