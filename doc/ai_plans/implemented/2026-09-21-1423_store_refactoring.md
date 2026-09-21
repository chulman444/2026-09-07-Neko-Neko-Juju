# Refactor Core Stores & GamePage

This plan addresses the monolithic stores (`boardStore`, `itemStore`, `gameSessionStore`) to align with Feature-Sliced Design (FSD) and ECS architecture, as well as extracting a UI component for `GamePage` readability.

## User Review Required
> [!IMPORTANT]
> **Store Splitting Strategy:** Splitting Zustand stores means components that consumed the unified store will need their imports updated. This applies to **all** stores we are refactoring. Whenever we split a monolithic store into smaller feature slices, the React components using them will be updated to import from the new specific slices.

---

## Execution Phases

### Phase 1: UI Extraction & Board Config Separation
**Goal:** Improve `GamePage` readability and remove board generation configuration from the active board state.

1. **[NEW] `src/pages/game/ui/GameHeaderBar.tsx`**
   - Extract the massive `<header>` block from `GamePage.tsx` into this file. 
   - It will remain in the `pages/game/ui` segment (not a widget, just a UI split) to improve readability.
2. **[MODIFY] `src/pages/game/ui/GamePage.tsx`**
   - Import and render `<GameHeaderBar />`.
   - Simplify the component to focus purely on page orchestration.
3. **[NEW] `src/features/board-generator/model/boardGenConfigStore.ts`**
   - Move `boardSizeRanges`, `selectedSizeTier`, `tierAspectConfigs`, `rollSeedOnGenerate` out of the active `boardStore`.
4. **[MODIFY] `src/entities/board/model/boardStore.ts`**
   - Remove the above board generation config fields.
   - **Keep:** Core matrix data, Camera/Pan logic (`panOffset`, `isPanMode`), Sizing (`shapeSize`), and abstract Animation events (`clearingAnimations`).

---

### Phase 2: Session & Phase Orchestration
**Goal:** Decouple hardcoded phases and timer logic from the core game session to support ECS and modular game modes.

1. **[NEW] `src/features/survival-timer/model/survivalTimerStore.ts`**
   - Extract `countdown`, `maxCountdown`, `isDepleted`, and `tick()` logic from the session store.
2. **[NEW] `src/features/phase-progression/model/phaseProgressionStore.ts`**
   - Encapsulate `phase1Score`, `phase2Score`, and the orchestration logic that ties the Survival Timer to the Free Triggered Hint.
   - The Phase Progression feature will observe the session, manage its own scores, and orchestrate phase transitions.
3. **[MODIFY] `src/entities/game-session/model/gameSessionStore.ts`**
   - **Remove:** `phase1Score`, `phase2Score`, and the Survival Timer logic.
   - **Keep:** Core session data (overall `score`, `clearedTiles`, `retryAllowed`, base lifecycle actions).
   - **Purpose:** The core session tracks the abstract "game", not the specific timer or phase mechanics.

---

### Phase 3: Modular Item System
**Goal:** Separate inventory data from item behaviors to support mode-specific items (like future Rival Cat mechanics).

1. **[NEW] `src/features/core-items/`**
   - Create a slice to house the behaviors and state of the base game items (Shake, Omnitile, Random Number, Random Choose, Hint). 
   - Move the specific action handlers (`rollRandomNumber`, `triggerShakeItem`, `confirmRandomChoose`) and UI states (`toggleCheck`, `currentRolledNumber`) here.
2. **[MODIFY] `src/entities/item/model/itemStore.ts` (Refactor to Inventory Concept)**
   - **Keep:** The `counts` dictionary (a generalized inventory tracking item IDs and amounts) and the active toggle state if needed by the UI.
   - **Remove:** All item-specific execution logic.
   - **Purpose:** This becomes a pure Inventory Entity. It doesn't know *how* an item works, it just tracks usage and availability.

---

## Verification Plan (Per Phase)

### Automated Tests
- Run `npx.cmd vitest run` to ensure unit tests on the stores pass. The Coder Agent will need to update tests that break due to store splitting.
- Run `npx.cmd tsc -b` to catch any TypeScript import issues from the store decoupling.

### Manual Verification
- Start the app via `npx.cmd vite`.
- Verify the GamePage renders correctly with the new `<GameHeaderBar />`.
- Test that standard gameplay works without the monolithic stores breaking.
- Test that features like panning, generating new boards, the timer, phase progression, and core item usage behave identically to before.
