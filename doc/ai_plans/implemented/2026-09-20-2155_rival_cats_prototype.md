# Goal: Minimal Prototype - Rival Cats & Macro Loop Emulation

Implement the core mechanics of the Macro Loop V2 to validate the "stress" of the game loop. Based on the architectural requirements (multiple cats, continuous presence, distinct behaviors like "strong cats"), we will **decouple Rival Cats completely from the existing Free Triggered Hint system**. 

The old hint system will remain intact (and can later be repurposed purely for the "Friendly Cat" RNG), while Rival Cats will get their own dedicated timing and steal logic.

## Open Questions
> [!WARNING]
> **Deprecating Phase 1 / Phase 2:** Since the V2 proposal removes the Phase 1 Speed Run / Phase 2 Cleanup structure, should we actively strip out the `isPhase1Over` logic right now, or just leave it dormant/disabled for this minimal prototype?

## Proposed Changes

### `features/rival-cats` (New Slice)
Following the ECS and Additive Features guidelines (Rule 3.6), we will NOT add this logic to `gameSessionStore` to avoid making it a God Object. Instead, Rival Cats will be a standalone feature slice with parallel state.

#### [NEW] `src/features/rival-cats/model/rivalCatStore.ts`
* **Parallel State:**
  * `isEnabled: boolean` (Feature flag, togglable via Dev Tuner)
  * `rivalCatInterval: number` (e.g., 5 seconds)
  * `rivalCatCountdown: number`
  * `activeRivalCats: number` 
  * `stolenTilesCount: number` 
* **Actions:**
  * `tick(deltaSeconds: number)`: Decrements the countdown. If it hits 0, calls `stealMatch()`. (This will be called by the same master game loop that ticks the session).
  * `stealMatch()`: 
    * Queries `getClearableHints()` from the look-ahead solver.
    * Calls `useBoardStore.getState().clearTiles(...)` to remove them.
    * Increments `stolenTilesCount`.
    * Resets `rivalCatCountdown`.

#### [NEW] `src/features/rival-cats/ui/RivalCatsDevTuner.tsx`
* Exposes the Dev Tuner controls specifically for this slice:
  * Toggle `isEnabled`.
  * Slider for `rivalCatInterval`.
  * Display for `stolenTilesCount`.
* *Note: This component exports via `features/rival-cats/index.ts` so it can be composed into the main Dev Tuner widget.*

---

### `widgets/dev-tuner`
#### [MODIFY] `src/widgets/dev-tuner/ui/DevTunerWidget.tsx`
* Import `<RivalCatsDevTuner />` from `@/features/rival-cats` and render it as a new tab or section.

---

### Master Game Loop Integration
#### [MODIFY] *(Main Game Loop Hook/Component)*
* We will locate where `useGameSessionStore.getState().tick(delta)` is currently being called (likely inside `widgets/game-board` or a `useGameLoop` hook).
* We will insert `useRivalCatStore.getState().tick(delta)` immediately after it, ensuring the Rival Cats run in sync with the game's timeline.

---

### `widgets/board-generator` & `entities/board`
To emulate the macro loop transition, we will add the ability to inject stacks of tiles into a newly generated board.

#### [MODIFY] `src/widgets/board-generator/ui/BoardSizeSection.tsx`
* Add a new number input: "Add Stacked Tiles".
* When generating the board, pass this value to the generator.

#### [MODIFY] `src/entities/board/model/boardGenerators.ts`
* Update `createBoardMatrix` (or add a utility) to accept a `stackedTilesCount` parameter.
* After the base matrix is generated, randomly distribute `stackedTilesCount` number of tiles on top of valid grid positions (updating the `stacks` record).

## Verification Plan

### Manual Verification
1. Launch the game and open the **Dev Tuner**.
2. Set the **Rival Cat Interval** to 3 seconds.
3. Observe the board: every 3 seconds, a valid match should disappear, and the **Stolen Tiles** counter in the Dev Tuner should increase.
4. Clear the board. Open the **Board Generator**.
5. Input the stolen tiles amount into **Add Stacked Tiles** and generate a Large board.
6. Verify the new board generates with the specified number of stacked tiles, proving the core macro loop transition works!
