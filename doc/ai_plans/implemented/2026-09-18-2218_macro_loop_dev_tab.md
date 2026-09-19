# Macro Loop Dev Manager (Planning)

This plan outlines the architecture for a new dev tool tab to manage the overall "Set" (Macro Loop) context for Risk and Reward boards, as detailed in `macro_loop_proposal.md`. We are focusing purely on the state and dev tooling to manage this context, not the actual gameplay mechanics (e.g., solid blocks logic) yet.

## Proposed Changes

---

### `entities/macro-loop`
Creates the core domain state for the macro loop (a single "Set").

#### [NEW] `entities/macro-loop/model/macroLoopStore.ts`
Zustand store containing the active Set's state.

First, define the rich data structure for solid blocks, allowing them to retain context from when they were abandoned:
```typescript
export interface AccumulatedBlock {
  originalValue: number;
  sourceBoardIndex: number; // Identifies which risk board this block came from
  originalPosition?: { col: number; row: number }; // Where it was left over on the risk board
}
```

Store state:
- `isMacroLoopMode`: boolean (toggles whether the Board Generator should use this context or its own random settings)
- `boardType`: `'risk' | 'reward'` (Distinguishes between the small/medium risk boards and the final massive reward board)
- `currentBoardIndex`: number (e.g., 1 for the first risk board, 2 for the second)
- `riskMeter`: number (Current value of the risk meter)
- `accumulatedSolidBlocks`: `AccumulatedBlock[]` (Tiles not cleared in Phase 2 that will carry over to the Reward board. Storing rich objects allows for future mechanics like color-coding by source board or transforming high-value tiles into obstacles requiring negative sums).
- `globalSetTimer`: number (The "Boss Rush" timer tracking the entire Set)
- Setter actions for all the above (including actions to add/clear accumulated blocks).

#### [NEW] `entities/macro-loop/index.ts`
Public API exporting the store and types.

---

### `widgets/macro-loop-manager`
The new dev mode tab UI to act as our control panel for a Set.

#### [NEW] `widgets/macro-loop-manager/ui/MacroLoopManagerWidget.tsx`
A panel component that connects to `useMacroLoopStore` and provides:
- A master toggle switch for "Macro Loop Mode: ON/OFF".
- A radio/select to switch the current simulated state between "Risk Board" and "Reward Board".
- Number inputs for `currentBoardIndex`, `riskMeter`, and `globalSetTimer`.
- **Accumulated Blocks Manager**: 
  - A sub-section showing the count of accumulated blocks.
  - Controls to quickly add dummy blocks (e.g., "Add Random Block from Board 1", "Add Block with Value 9") for testing, and a button to clear them.
- **Sync Actions**: 
  - `Load into Generator`: A button that takes the current Macro Loop settings and applies them to the Board Generator context.
  - `Update from Generator`: A button to sync relevant test data back into the Macro Loop store.

#### [NEW] `widgets/macro-loop-manager/index.ts`
Public API exporting `MacroLoopManagerWidget`.

---

### `pages/game`
Wire the new widget into the Side Panel.

#### [MODIFY] `pages/game/ui/SidePanel.tsx`
- Add a new tab button (`?봽 Macro Loop`) to the header.
- Add `macro-loop` to the `activeTab` state type.
- Render `<MacroLoopManagerWidget />` when the tab is active.

---

### `widgets/board-generator`
Make the generator context-aware.

#### [MODIFY] `widgets/board-generator/model/useBoardGeneratorActions.ts`
- Inside `generateBoard()`, check `useMacroLoopStore.getState().isMacroLoopMode`.
- If true, branch the generation logic based on `boardType`:
  - `risk`: Generate a small/medium board (overriding the random size tier) tailored for Phase 1 & 2 gameplay.
  - `reward`: Generate a massive board. (Later, this is where it will read the `accumulatedSolidBlocks` array and seed them into the board as special tiles).
- If false, proceed with the normal random generation logic.

## Verification Plan

### Automated Tests
- Run `vitest run` and `oxlint`.

### Manual Verification
- Open the Side Panel in Dev Mode.
- Navigate to the new "Macro Loop" tab.
- Toggle Macro Loop Mode on, set the board type to "Reward".
- Add several dummy solid blocks (e.g., source board 1, original value 9).
- Switch to the "Board Generator" tab and hit Generate.
- Verify the board generated is massive (Reward Board context).
- Toggle Macro Loop Mode off, hit Generate, and verify it generates a normal random board based on the selected tier.

