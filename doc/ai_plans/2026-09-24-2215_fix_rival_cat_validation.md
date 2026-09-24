# Implementation Plan: Fix Rival Cat Target Validation

## Objective
Ensure that Rival Cats correctly drop their targets if the tiles are mathematically broken (e.g., via item use changing tile values) rather than only dropping targets when tiles are completely destroyed or cleared.

## Rationale
Currently, `isStillValid` in `rivalCatStore.ts` only verifies that the targeted tiles are strictly `> 0`. It does not recalculate if the values still form a valid match. We need to utilize `isHintComboValid` from the `board-hints` feature. To respect FSD (Feature-Sliced Design) boundaries—which prohibit direct cross-feature imports in the same layer—we will expose this validation logic through the `GameOrchestrator` in `shared/lib/orchestrator`.

## Steps

### 1. Update `GameOrchestrator` Interface
**File:** `src/shared/lib/orchestrator/orchestrator.ts`
- Add `isComboValid: (tiles: TileCoordinate[]) => boolean;` to the `GameOrchestrator` interface.
- Add `isComboValid: (tiles) => activeOrchestrator?.isComboValid(tiles) ?? false,` to the default `orchestrator` object.

### 2. Implement `isComboValid` in the Orchestrator Instance
**File:** `src/widgets/game-board/model/useGameOrchestrator.ts`
- Import `isHintComboValid` from `@/features/board-hints`.
- Inside `createGameOrchestrator`, implement the `isComboValid` method:
  ```typescript
  const isComboValid = (tiles: TileCoordinate[]): boolean => {
    return isHintComboValid(tiles, useBoardStore.getState().matrix);
  };
  ```
- Expose `isComboValid` in the return block of `createGameOrchestrator`.
- Expose `isComboValid` in the return block of the `useGameOrchestrator` hook.

### 3. Fix Target Validation in Rival Cat Store
**File:** `src/features/rival-cats/model/rivalCatStore.ts`
- In the `tick` function (around line 393), locate the `isStillValid` check for targeting cats.
- Replace the existing `every(val > 0)` logic with the orchestrator validation:
  ```typescript
  const isStillValid =
    cat.targetMatch &&
    cat.targetMatch.length > 0 &&
    orchestrator.isComboValid(cat.targetMatch);
  ```
  *(Note: `isHintComboValid` already verifies that tile values are strictly `> 0`, so we don't lose the existing destroyed-tile check.)*
