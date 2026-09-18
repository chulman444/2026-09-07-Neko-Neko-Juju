# Hint Algorithms Implementation Plan

## Goal Description
Implement two distinct hint algorithms to resolve performance issues during tile cascading, and update the Dev Tuner to switch between these modes. The current method (which uses heuristics, not brute-force) finds all combinations (clearable and blocked), causing painful lag during the cascade of clearing tiles. To fix this, we will introduce a fast "Default Mode" that only evaluates clearable hints on the fly, and relegate the expensive "All Combinations" mode to Dev Mode.

## Proposed Changes

---

### Hint Algorithms (Solver Engine & Store)

We need to support two modes in the `solverEngine.ts` and `solverStore.ts`.

#### [MODIFY] `src/features/look-ahead-solver/model/solverStore.ts`
- Add a new state variable `hintMode: 'default' | 'all_combinations'` (defaulting to `'default'`).
- Add an action `setHintMode(mode)` to toggle between the modes.
- Update the `recalculate()` and cascade logic:
  - **Default Mode**: Instead of cascading and maintaining blockers, re-evaluate only the currently clearable tiles from the board matrix after every tile clear. This avoids the expensive cascade operation.
  - **All Combinations Mode**: Use the heuristic method to evaluate all combinations on the initial seed's board. Cache this initial state. Then cascade any cleared tiles to match the current board.
- **Caching**: The solver store will keep the cached combinations for the current seed. When a "Retry" is triggered or "All Combinations" is toggled mid-game, reuse the cached baseline and then cascade the current list of cleared tiles. The cache is cleared when a new seed is loaded.

#### [MODIFY] `src/features/look-ahead-solver/model/solverEngine.ts`
- Expose a specialized, lightweight function (e.g., `findClearableCombinationsOnly(board)`) that only finds combinations that are currently unobstructed. This function will be used by the "Default Mode".
- Implement **O(1) Cascade Optimization**: For the "All Combinations" mode, allocate a lookup table or dictionary mapping tiles to the combinations they block. When a tile is cleared, immediately look up the affected blocked combinations and remove the tile from their blocker list, eliminating the need to filter over all active combinations.

---

### Dev Tuner UI

The Dev Tuner needs to allow switching between the two hint algorithm modes.

#### [MODIFY] `src/pages/game-v0.2.z/ui/DevTuner.tsx`
- Add a new section for "Hint Algorithm Mode" with a toggle or dropdown to select between "Default (On-the-fly)" and "All Combinations (Dev)".
- Connect this UI to the `setHintMode` action in the `solverStore`.
- Ensure changing the mode triggers the cached evaluation + cascade logic.

---

### Game Session Store

Ensure triggers for re-evaluation correctly call the solver store based on the active mode.

#### [MODIFY] `src/pages/game-v0.2.z/model/gameSessionStore.ts`
- Ensure that actions like `registerMatch` or `removeClearedTiles` correctly notify the `solverStore` to either re-evaluate clearable hints (Default mode) or perform the O(1) cascade (All Combinations mode).
- Ensure that "New Game", "Retry", and the future "Shake" feature trigger the appropriate evaluation.

## Verification Plan

### Automated Tests
- Run unit tests for the solver engine to ensure `findClearableCombinationsOnly` returns correctly and `cascadeClearTiles` via O(1) table remains functional.

### Manual Verification
- **Default Mode**: Play the game normally. Verify that clearing tiles does not cause any noticeable lag, and hints remain accurate.
- **Dev Mode**: Toggle to "All Combinations" in the Dev Tuner. Verify that the total combinations are found. Verify that the cascade is smooth and without lag.
- **Triggers**: Test "Roll" (New Game) and "Retry" (Same Seed) to ensure hints are correctly initialized for both modes, and the cache is correctly reused or cleared.
