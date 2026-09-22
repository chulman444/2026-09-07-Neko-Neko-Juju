# Extract Generic Hint Logic to board-hints Feature

The `features/free-triggered-hint/model/hintStore.ts` file currently violates the Single Responsibility Principle and Feature-Sliced Design (FSD) boundaries by acting as a "God Object" for the entire Hint domain. It couples the survival timer countdown mechanic (Phase 1 timer depletion) with the generic state for visually highlighting matching tiles on the board.

Because of this, other features (like the `Hint Item` in `core-items` and the `Rival Cat` steal mechanics) are forced to indirectly depend on the timer-based feature slice to trigger hints or manage highlighted tiles.

## Proposed Changes

We will extract the generic visual hint logic into a new, independent feature slice (`features/board-hints`), and decouple it entirely from the timer mechanics. The orchestrator layer (`useGameSessionDriver.ts`) will compose the two features together, ensuring no cross-feature imports.

---

### 1. `features/board-hints`
This new slice will be responsible purely for resolving clearable combinations and highlighting them on the board.

#### [NEW] src/features/board-hints/model/boardHintsStore.ts
Move the following generic state and actions here:
- `activeHintCombos` (TileCoord[][])
- `highlightedTiles` (TileCoord[])
- `noHintsAvailableMsg` (string | null)
- `triggerHint()`
- `validateActiveHints()`
- `removeClearedTiles()`
- `setClearableHintsResolver()` / `getResolvedClearableHints()`

#### [NEW] src/features/board-hints/index.ts
Export the public API.

---

### 2. `features/free-triggered-hint`
Refactor this slice to purely handle the survival mode countdown mechanic (the "3 free hints" sequence).

#### [RENAME & MODIFY] src/features/free-triggered-hint/model/freeTriggeredHintStore.ts (formerly `hintStore.ts`)
- **Rename**: `hintStore.ts` -> `freeTriggeredHintStore.ts` (and `hintStore.test.ts` -> `freeTriggeredHintStore.test.ts`).
- **Hook Name**: Rename `useHintStore` -> `useFreeTriggeredHintStore` (optionally alias `useHintStore` if needed, but update consumers to `useFreeTriggeredHintStore`).
- **Remove**: All highlighted tiles logic, `activeHintCombos`, `triggerHint`, `removeClearedTiles`, etc.
- **Keep**: `maxFreeHints`, `freeHintInterval`, `hintsRemaining`, `hintCountdown`, `hintPhaseStarted`, `isPhase1Over`.
- **Modify**: The `tick()` method will no longer call `get().triggerHint()` directly. Instead, we pass `tryTriggerHint: () => boolean` callback: `tick(deltaSeconds, isSurvivalDepleted, isTimerPaused, tryTriggerHint?: () => boolean)`.

#### [MODIFY] src/features/free-triggered-hint/index.ts
Export `useFreeTriggeredHintStore` (and alias `useHintStore` for transition) and types.

---

### 3. Orchestration & Consumers (Pages/Widgets)
Wire the two separated features together at the Orchestrator layer.

#### [MODIFY] src/pages/game/model/useGameSessionDriver.ts
- Import `setClearableHintsResolver` and `useBoardHintsStore` from `@/features/board-hints`.
- Import `useFreeTriggeredHintStore` from `@/features/free-triggered-hint`.
- When ticking `useFreeTriggeredHintStore`, pass `() => useBoardHintsStore.getState().triggerHint()` as the `tryTriggerHint` callback.
- Update `registerRivalStealListener` to call `useBoardHintsStore.getState().removeClearedTiles()`.
- Update `registerHintTriggerHandler` to call `useBoardHintsStore.getState().triggerHint()`.

#### [MODIFY] UI Consumers
Update the imports in the following files to pull `highlightedTiles`, `activeHintCombos`, and `noHintsAvailableMsg` from `features/board-hints`, and update free-hint timer consumers to use `useFreeTriggeredHintStore`:
- `src/pages/game/ui/GamePage.tsx`
- `src/pages/game/ui/GameHeaderBar.tsx`
- `src/pages/game/ui/HintBar.tsx`
- `src/pages/game/ui/SidePanel.tsx`
- `src/widgets/dev-tuner/ui/HintsConfigSection.tsx`
- `src/widgets/game-board/model/useGameOrchestrator.ts`

## Verification Plan

### Automated Tests
- Run `npx.cmd vitest run` to ensure unit tests for `useGameOrchestrator.test.ts` and `hintStore.test.ts` pass after updating their mocks/imports.

### Manual Verification
- Start `npx.cmd vite`.
- Verify the survival timer mode properly triggers free hints when it reaches 0.
- Verify the Hint Item correctly triggers highlighted tiles.
- Verify that clearing tiles manually (or via Rival Cats) properly clears the highlighted state.
