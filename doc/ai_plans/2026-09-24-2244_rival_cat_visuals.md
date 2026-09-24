# Implementation Plan: Rival Cat Visuals

## Overview
Currently, the Rival Cat instantly removes tiles on a successful steal and doesn't visually communicate when its target is broken or stolen by the player. This plan introduces stealing animations (matching the player's munching animation) and reaction emojis (🐾, 😼, 🙀, 💥) when targets are affected, without removing any existing UI markers or colors.

## 1. Extend `ClearingAnimation` for Reactions and Emojis
**File:** `src/entities/board/model/types.ts`
- Update the `type` in `ClearingAnimation` to: `'munching' | 'fadeout' | 'reaction' | 'rival-steal'`.
- Add an optional `emoji?: string` property to `ClearingAnimation`.

## 2. Update GameBoardRenderer
**File:** `src/widgets/game-board/model/GameBoardRenderer.ts`
- In `drawClearingAnimations`, handle the new animation types:
  - **`reaction`**: Skip drawing the bowl and tile number entirely. Render the `anim.emoji` floating upwards (`-progress * 20`) and fading out based on progress.
  - **`rival-steal`**: Act exactly like the `munching` logic (calculating `bounceOffset`), but instead of drawing `gameAssets.catHead`, draw the `anim.emoji` (`😼`) over the tile.

## 3. Implement Reaction Spawner in Rival Cat Store
**File:** `src/features/rival-cats/model/rivalCatStore.ts`
- Add a new config state `showExternalBreakPathReactions: boolean` (default `true`) and its setter to the store.
- Create a helper function `spawnReactions(cat: RivalCat, cause: 'player_clear' | 'external_break', clearedTiles?: TileCoord[])`.
- Iterate through `cat.targetMatch` and assign emojis based on the rules:
  - **`player_clear`**: If the tile is included in `clearedTiles`, it gets `🙀` (weary cat). If not, it gets `🐾` (cat paw).
  - **`external_break`** (e.g., random roll/shuffle): If it's the start tile (index 0), it gets `💥` (impact). For all other tiles in the path, it gets `🐾` (cat paw) *only if* `showExternalBreakPathReactions` is true; otherwise, they receive no reaction animation.
- Dispatch an `addClearingAnimation` for each targeted tile (that receives an emoji) with `type: 'reaction'`, duration `800ms`, and `bounceSpeed: 0`.
- **Integrate in `onPlayerClearedTiles`**: Call `spawnReactions(cat, 'player_clear', clearedTiles)` when `result === 'defeated'` or `result === 'broken'`.
- **Integrate in `tick`**: Call `spawnReactions(cat, 'external_break')` when target validation fails (`!isStillValid`) before resetting the cat to idle.

## 3.5. Add Toggle to Dev Tuner
**File:** `src/features/rival-cats/ui/RivalCatsDevTuner.tsx`
- Add a UI toggle switch bound to `showExternalBreakPathReactions` to allow players/devs to turn the path reactions on or off when targets are broken externally.

## 4. Animate the Steal Action
**File:** `src/widgets/game-board/model/useGameOrchestrator.ts`
- Inside `executeRivalSteal`, loop through the targeted `tiles` before calling `clearTiles`.
- For each tile with a value > 0, trigger `useBoardStore.getState().addClearingAnimation(...)` with:
  - `type: 'rival-steal'`
  - `emoji: '😼'`
  - `duration: 600` (matching standard munching)
  - `bounceSpeed: 80`
- This ensures the tiles are visually kept on the board (munching away via the renderer) while being logically removed from the store, exactly mirroring player clears.

## 5. Render Emojis in Targeting Overlay
**File:** `src/features/rival-cats/ui/RivalPawOverlay.tsx`
- Do not modify existing borders, dashed outlines, or drop shadows; they effectively distinguish normal and tough cats.
- For the `startTile` container, add an inner wrapper positioned absolute to center the `🐾` emoji over the draining fill.
- For the combo path tiles (when `showTargets` is enabled), add `flex items-center justify-center` and place the `🐾` emoji inside the `<div>`.
