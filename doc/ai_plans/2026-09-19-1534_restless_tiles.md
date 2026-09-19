# Implementation Plan: Restless Tiles (Randomly Changing Tiles)

## Goal
Implement a mechanic where a specified number of tiles randomly change their value every time the player completes a valid move. 

Instead of silently changing random tiles, the game will designate specific tiles as "Restless" when the board is generated. These Restless Tiles will have a distinctly animated border/background so the player can clearly identify the threat. After every move, any surviving Restless Tiles will automatically reroll their numeric value.

## Proposed Changes

### 1. Game Config & Dev Tools
- **[MODIFY]** `src/entities/game-config/model/types.ts` & `gameConfigStore.ts`
  - Add `enableRestlessTiles: boolean`.
  - Add `restlessTilesCount: number` (how many tiles spawn as restless on a new board, e.g., 3).
- **[MODIFY]** `src/widgets/dev-tuner/ui/DevTunerWidget.tsx`
  - Add toggles and a slider for `restlessTilesCount` so you can test it live.

### 2. ECS State & Feature Logic
Per our new architecture rules, we will not mutate `Cell` with a `isRestless` flag. We will use a parallel data structure (ECS).
- **[NEW]** `src/features/restless-tiles/model/useRestlessTiles.ts`
  - Create a local Zustand store or hook that maintains `restlessTiles: Record<string, boolean>` (where the key is `${col},${row}`).
  - **Generation Phase:** When a new board is generated (listen to board seed/size changes), randomly pick `restlessTilesCount` coordinates that have a tile (`val > 0`) and register them in the `restlessTiles` record.
  - **Move Phase:** Intercept the `onTilesCleared` event. For every coordinate in the `restlessTiles` record:
    - If `boardStore.matrix[r][c] === 0` (it was cleared), remove it from the record.
    - If it's still alive (`val > 0`), call `boardStore.setTileValue(col, row, newVal)` to reroll it.

### 3. Orchestration
- **[MODIFY]** `src/widgets/game-board/ui/GameBoardWidget.tsx`
  - Mount the `useRestlessTiles` hook.
  - Pass the `restlessTiles` record down to the `GameBoardEngine` so the renderer can access it.

### 4. Visual Identity (Crucial)
- **[MODIFY]** `src/widgets/game-board/model/GameBoardRenderer.ts`
  - Update `drawBaseBowls`. If the current `col,row` exists in the `restlessTiles` record, render it distinctly!
  - **Design Suggestion:** Instead of the normal warm border, give it a bright pulsing/shifting border (e.g., using `Math.sin(Date.now() / 150)` to pulse between purple and cyan), and perhaps a slightly darker/textured background so it immediately looks unstable.
  - When the tile successfully rerolls after a move, we still add a quick scale "pop" animation to draw the eye to the new number.

## Verification Plan
1. Open Dev Tuner, enable `enableRestlessTiles` and set count to `3`.
2. Generate a board. Verify exactly 3 tiles have the unique "Unstable/Pulsing" border.
3. Play the game and clear a 10 that *does not* include a restless tile.
4. Verify that the 3 Restless Tiles visually flash and swap to new numbers.
5. Verify the hint algorithm updates to reflect the new numbers.
6. Clear one of the Restless Tiles. Verify it disappears properly and the ECS record is cleaned up.
