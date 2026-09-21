# Goal: Refactor `gameSessionStore` God Object

The goal of this refactor is to dismantle the 851-line `gameSessionStore.ts`. We will extract volatile UI state, isolated game mechanics (Combos, Hints), and static configurations into their own FSD-compliant feature slices and entities, drastically reducing complexity and unnecessary re-renders.

## Proposed Changes

### Phase 1: Entity-Driven Configuration Extraction
Based on domain logic, we will move configurations out of the session store and into their respective domain entities, preventing a generic "Config God Object."

#### [MODIFY] `src/entities/board/model/boardStore.ts` (or `boardConfig.ts`)
* Move board-specific configuration here: `boardSizeRanges`, `selectedSizeTier`, `tierAspectConfigs`.
* The `board` entity is now solely responsible for knowing its dimensions and the raw grid structure.

#### [NEW] `src/entities/difficulty/model/difficultyStore.ts`
* Create a dedicated entity to handle the complex math of game balance.
* Move `selectedDifficultyTier`, `difficultyTiltRanges`, `difficultyNoiseSpread`, and `timerMultiplier`.
* **Responsibility:** This entity computes the weights/probabilities and outputs a clean interface (1D/2D arrays or stack counts) that the `board` generator consumes.

### Phase 2: Tile Selection Extraction
Because the game uses a pure Canvas engine (`GameBoardRenderer`), the high-speed drawing is already separated from React. However, the interaction class still fires `onSelectionChange` which updates the global session store. Moving this state out prevents the React UI (Score, Timer, Hint buttons) from unnecessarily re-rendering 60 times a second during a mouse drag.
#### [NEW] `src/features/select-tiles/model/selectionStore.ts`
* Move `selectedTiles`, `selectedSum`, `diagonalSum`, `isSquareSelection`, `activeSelectionType`.
* Move `setSelection()` and `clearSelection()`.

### Phase 3: Combo System Extraction
The combo math and timers are distinct mechanics.
#### [NEW] `src/features/combo-system/model/comboStore.ts`
* Move `comboCount`, `comboPct`, `comboPauseRemaining`, `comboRules`.
* Move the math parsers: `evaluateFormula`, `getMatchingComboRule`.
* Expose `tick(delta)` to drain the combo percentage.

### Phase 4: Free Hint System Extraction
Phase 1 mechanics and hint algorithms don't belong in the core session.
#### [NEW] `src/features/free-triggered-hint/model/hintStore.ts`
* Move `maxFreeHints`, `freeHintInterval`, `hintsRemaining`, `hintCountdown`, `hintPhaseStarted`, `isPhase1Over`, `activeHintCombos`.
* Move `triggerHint()`, `isHintComboValid()`, `validateActiveHints()`.
* Expose `tick(delta)` for the hint countdown.

### Phase 5: Core Session Cleanup
#### [MODIFY] `src/entities/game-session/model/gameSessionStore.ts`
* **Keep:** `score`, `clearedTiles`, `countdown`, `maxCountdown`, `baseSecondsPerTile`, `isPaused`, `isDepleted`.
* **Simplify `tick(delta)`:** Remove all combo and hint logic. It should now only decrement `countdown` (if not paused/depleted).
* **Simplify Actions:** Strip out `registerMatch` logic that relies on combos and hints. Expose simple setters like `addScore()` and `addTime()`.

### Phase 6: Event Orchestration (The ECS "System")
Because the mechanics are now decoupled, we need a central system to coordinate them when a match occurs.
#### [NEW] `src/widgets/game-board/model/useGameOrchestrator.ts`
* Create a custom hook that acts as the ECS "System".
* Listen for match events from the interaction layer.
* Explicitly dispatch commands to the decoupled stores (e.g., `comboStore.addCombo()`, `scoreStore.addPoints()`, `timerStore.addTime()`).
* This allows alternative Game Modes (like "Casual Mode") to simply swap out the orchestrator to ignore the timer.

---

## Verification Plan

### Automated Tests
- Run `npx.cmd tsc -b` to catch all broken imports across the app (widgets and UI components that were importing `useGameSessionStore`).
- Run `npx.cmd vitest run` to ensure pure functions like `evaluateFormula` and `isHintComboValid` still pass after being relocated.

### Manual Verification
- Fix imports in all `ui/` components that relied on `gameSessionStore` to point to the new respective stores.
- Start the dev server (`npx.cmd vite`) and verify that dragging tiles no longer triggers re-renders on the global session timer or score UI.
- Verify the game loops (Combo drains, Hint countdowns, Main Timer) still function correctly in parallel.
