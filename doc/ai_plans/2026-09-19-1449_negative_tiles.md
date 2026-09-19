# Implementation Plan: Negative Tiles

## Goal
Introduce **Negative Tiles** to the game. These tiles have negative numeric values (e.g., `-3`) and subtract from the current selection sum. The spawn probability scales with the player's `totalRiskMeter` during "Reward Boards" in the Macro Loop, and is fully customizable via the Dev Tuner.

## Proposed Changes

### 1. Game Config & Dev Tools
- **[MODIFY]** `src/entities/game-config/model/types.ts` & `gameConfigStore.ts`
  - Add `enableNegativeTiles: boolean`.
  - Add `negativeTileProbability: number` (0.0 to 1.0) to dictate how often a generated tile is negative.
- **[MODIFY]** `src/entities/board/model/boardStore.ts`
  - Add `negMinNum` (default 1) and `negMaxNum` (default 3).
  - Add `negTileWeights?: number[]` to control the exact distribution of negative tiles.
- **[MODIFY]** `src/widgets/dev-tuner/ui/DevTunerWidget.tsx` (or split into a new component)
  - Add a new "Negative Tiles" configuration section.
  - Include toggles, probability slider, `negMinNum`/`negMaxNum` inputs, and weight sliders for each negative digit (mirroring the positive tile weights UI).

### 2. Board Generation
- **[MODIFY]** `src/entities/board/model/boardGenerators.ts`
  - Update `createBoardMatrix` to accept negative tile generation parameters.
  - When generating a tile, roll against `negativeTileProbability`.
  - If a negative tile is selected, generate its absolute value based on `negMinNum`, `negMaxNum`, and `negTileWeights`, then invert it to a negative number before pushing to the matrix.

### 3. Look-Ahead Solver Algorithm Fixes
- **[MODIFY]** `src/features/look-ahead-solver/model/solverEngine.ts`
  - **Remove Early Break:** If `enableNegativeTiles` is true, disable the `break` optimization when `sum > 10` so the solver mathematically searches past `10` in case a negative tile drops the sum back down.
  - **Tile Count SAT:** Create a second Summed Area Table (`calculateCountSAT`) alongside the value SAT. This new table tracks `val !== 0 ? 1 : 0` instead of the numeric value.
  - When checking if a bounding box is "tight" (checking if the outer edges are completely empty), query the **Count SAT**. This ensures edges containing `[3, -5, 2]` (sum = 0) are correctly recognized as containing tiles, fixing the box hint calculation for negative numbers.

### 4. Macro Loop Integration
- **[MODIFY]** `src/widgets/game-board/ui/GameBoardWidget.tsx` (or Macro Loop logic)
  - During a `reward` board transition, dynamically set `negativeTileProbability = Math.min(0.5, totalRiskMeter / 1000)`.

### 5. UI & Rendering
- **[MODIFY]** `src/widgets/game-board/model/GameBoardRenderer.ts`
  - If a tile value is `< 0`, render the text in bold **Red** (e.g., `#ef4444`) and tint the base bowl slightly red/purple to visually alert the player to the penalty.

## Verification Plan
1. Open Dev Tuner, enable `enableNegativeTiles` and set probability to `50%`.
2. Tweak the `negMinNum` and `negMaxNum` to `1` and `5`, and adjust the negative weights.
3. Generate a new board; verify negative tiles obey the custom ranges and weights.
4. Verify the Look-Ahead Solver correctly highlights box combinations that include negative numbers.
