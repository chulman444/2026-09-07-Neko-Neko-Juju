# Implementation Plan: Telegraphed Rival Cats & Counter-Play

Based on the expanded design, Rival Cats are active entities the player fights using the core matching loop. The player can delay them by matching *any* tiles, or defeat them by stealing their specific targets. We also introduce a new "Tough" variant of the rival cat.

## Open Questions
> [!TIP]
> **What counts as a "Defeat"? (The 9-1-9 Problem)**
> If the cat targets 9-1, but the player clears 1-9, did the player "defeat" the cat or just "break" the hint? 
> To allow you to playtest this, we will add a `defeatCondition` setting in the Dev Tuner so you can feel out which mechanic is more fun!

## Proposed Changes

---

### Phase 1: Cat Variants, Dormancy, and Interruption Logic

**Goal:** Refactor the store to handle multiple independent cats with advanced counter-play states (Dormant, Idle, Targeting) and introduce `normal` vs `tough` variants.

#### `features/rival-cats`
#### [MODIFY] `src/features/rival-cats/model/types.ts`
* Introduce `RivalCat` entity:
  ```typescript
  export type CatPhase = 'dormant' | 'idle' | 'targeting';
  export type CatType = 'normal' | 'tough';
  export type DefeatCondition = 'exact_match' | 'any_overlap' | 'start_tile_only';
  
  export interface RivalCat {
    id: string;
    type: CatType;
    phase: CatPhase;
    countdown: number; 
    targetMatch: TileCoord[] | null;
  }
  ```
* Update `RivalCatState`:
  * Add `defeatCondition: DefeatCondition` (Default to `'any_overlap'`)
  * `cats: RivalCat[]`
  * `dormantDuration: number` 
  * `spawnInterval: number` 
  * `stealDuration: number` 
  * `pushbackPerClear: number` 
  * `toughCatPushbackBonus: number` 

#### [MODIFY] `src/features/rival-cats/model/rivalCatStore.ts`
* **`tick(delta)`**: Iterate through all `cats`:
  * `dormant`: decrement -> transition to `idle`.
  * `idle`: decrement -> pick target -> transition to `targeting`.
  * `targeting`: 
    * **Target Validation Check:** 
      * We must track exactly *what* the player cleared this frame.
      * If player cleared tiles: evaluate against `defeatCondition` (e.g. did they clear the exact `targetMatch`, or just *any* tile overlapping `targetMatch`, or specifically the *start tile*?).
      * If evaluating as **Defeated**:
        * `normal`: Transition to `dormant`.
        * `tough`: Transition to `idle` with massive timer penalty.
      * If evaluating as **Broken (Not Defeated)** (e.g., shuffle item used, or they didn't meet the `defeatCondition` but the target is gone):
        * `normal`: Forgive. Retreat to `idle`.
        * `tough`: Relentless. Instantly pick new target, stay `targeting`, restart `stealDuration`.
    * If valid, decrement. At `<= 0`, execute steal, check escalation, transition to `idle`.

---

### Phase 2: The Rival Paw UI

**Goal:** Render a visual indicator (the Paw) on the board.

#### `features/rival-cats`
#### [NEW] `src/features/rival-cats/ui/RivalPawOverlay.tsx`
* Reads `cats` from `useRivalCatStore`.
* For every cat in the `'targeting'` phase, calculates the absolute pixel position of its start tile and renders the icon over it.
* **Visual Distinction:** Different styling for `normal` vs `tough`.

#### `widgets/game-board`
#### [MODIFY] `src/widgets/game-board/ui/GameBoard.tsx`
* Import and render `<RivalPawOverlay />` inside the main board container.

---

### Phase 3: Dev Tuner & Progression Tuning

**Goal:** Expose all the new mechanics for testing.

#### `features/rival-cats`
#### [MODIFY] `src/features/rival-cats/ui/RivalCatsDevTuner.tsx`
* Add dropdown for **Defeat Condition** (`exact_match`, `any_overlap`, `start_tile_only`).
* Add sliders for Timers and Pushbacks.
* Add manual buttons: `[+ Add Normal Cat]` and `[+ Add Tough Cat]`.
* Display the live state of all `cats`.

## Verification Plan
1. Toggle between the three `Defeat Condition` modes in Dev Tuner.
2. Set up a 9-1-9 overlap scenario manually or wait for one.
3. Test if clearing the overlapping '1' triggers a Defeat or a Break based on the selected condition.
