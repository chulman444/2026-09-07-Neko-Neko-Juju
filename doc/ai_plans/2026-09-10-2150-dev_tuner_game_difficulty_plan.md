# Game Difficulty Settings Plan

We will separate the current "Game Timer & Phase 1 Hints" section into two distinct sections: "Game Difficulty" and "Phase 1 Hints". We will also add controls to randomize the board size based on adjustable difficulty tiers, and link the timer cap to the board size using a multiplier.

## 1. Update Board Store to Preserve Seed on Dimension Change
Currently, changing the board dimensions calls `generateNewBoard()` without arguments, which overwrites the active seed with a new one. We want the "Randomize board size" actions to change the size but retain the current active seed.
- **File**: `src/entities/board/model/boardStore.ts`
- **Changes**: Modify `setDimensions` so that it calls `createBoardMatrix` using the current `seed`.
  ```typescript
  setDimensions: (cols, rows) => {
    const { minNum, maxNum, seed } = get();
    const matrix = createBoardMatrix(cols, rows, minNum, maxNum, seed);
    set({ cols, rows, matrix, clearingAnimations: [] });
  },
  ```

## 2. Add Difficulty States & Timer Multiplier to Session Store
We need a multiplier state to compute the timer based on board size, and states for the configurable difficulty ranges.
- **File**: `src/pages/game-v0.2.z/model/gameSessionStore.ts`
- **Changes**:
  - Add `timerMultiplier: number` (default `20 / 170`).
  - Add `difficultyRanges` (e.g. `{ easy: [3, 8], medium: [9, 14], hard: [15, 20] }`).
  - Add `setTimerMultiplier: (val: number) => void`.
  - Add `setDifficultyRange: (level: 'easy'|'medium'|'hard', index: 0|1, val: number) => void`.

## 3. Update DevTuner UI
- **File**: `src/pages/game-v0.2.z/ui/DevTuner.tsx`
- **Changes**:
  - Extract `cols`, `rows`, and `setDimensions` from `useBoardStore`.
  - Extract the new difficulty ranges and timer multiplier from `useGameSessionStore`.
  - **Split UI into two sections**:
    1. **Game Difficulty**:
       - **Configurable Difficulty Generators**:
         - For each difficulty (Easy, Medium, Hard), display two numerical inputs for `Min` and `Max`.
         - Provide a button for each difficulty (e.g., "Generate Easy") that picks a random base size between its `Min` and `Max`, calculates the other axis as `Math.min(20, Math.round(baseSize * 1.7))`, and applies it via `setDimensions`.
       - **Generate Any Size**: A generic "Randomize Size" button that picks any base size from 3 to 20.
       - **Board to Timer Multiplier**: Number input bound to `timerMultiplier` (step = 0.01).
       - **Initial Timer Cap (s)**: Existing number input bound to `maxCountdown`.
       - **Revert/Auto-set Button**: A button next to "Initial Timer Cap" that computes `Math.round(cols * rows * timerMultiplier)` and calls `setMaxCountdown(calculatedValue)`.
    2. **Phase 1 Hints**:
       - Contains the existing settings: "Max Free Hints (N)", "Hint Interval (T, s)", and "Reward Per Tile (s)".

## 4. Verification
- **Manual Verification**:
  - Verify that the configurable difficulty ranges update the store correctly.
  - Ensure clicking any of the generation buttons (Easy, Medium, Hard, or Random) correctly sets the layout dimensions favoring the 1.7:1 ratio, based on the respective min/max inputs, without changing the currently displayed seed string.
  - Verify that clicking "Revert" on the timer cap calculates `cols * rows * timerMultiplier` and correctly reflects it in the UI and state.
