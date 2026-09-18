# Move User Configs to Player Config

This plan outlines the extraction of user-facing preferences ("public configs") into a dedicated `player config` store, conforming to FSD boundaries (`entities/player`).

## User Review Required

- Creating a new entity `player` inside `src/entities/player`.
- Extracting user preferences from `boardStore` to the new `playerStore`.

## Proposed Changes

### `src/entities/player` (New Entity)

Extracting preferences out of `boardStore` into a dedicated store for user settings.

#### [NEW] `src/entities/player/model/types.ts`
- Extract `CheckerboardMode` type (and potentially others) to be owned by `player`.

#### [NEW] `src/entities/player/model/playerStore.ts`
- Create `usePlayerStore` to manage:
  - `checkerboardMode`
  - `checkerColors`
  - `inversePan`
  - `panSensitivity`
- Provide actions: `setCheckerboardMode`, `setCheckerColors`, `setInversePan`, `toggleInversePan`, `setPanSensitivity`.

#### [NEW] `src/entities/player/model/playerStore.test.ts`
- Port the related tests from `boardStore.test.ts` to verify the new store behaviors (such as clamping sensitivity and parity preservation).

#### [NEW] `src/entities/player/index.ts`
- Export public APIs (`usePlayerStore`, `CheckerboardMode`).

---

### `src/entities/board`

Removing preference logic to focus strictly on board state and interactions. Also adding board rotation logic based on older references.

#### [MODIFY] `src/entities/board/model/boardStore.ts`
- Remove `checkerboardMode`, `checkerColors`, `inversePan`, `panSensitivity` state and actions.
- Add `isBoardRotated: boolean` (default `false`).
- Add `rotateBoardMatrix` action, copying the exact 90-degree CW / CCW toggle logic from the old reference `useBoardStore.ts`, keeping the top-left corner locked in logic (which just swaps dimensions and remaps the matrix indices).
- Update `generateNewBoard` and `setDimensions` to reset `isBoardRotated` to `false` when a fresh board is generated.

#### [MODIFY] `src/entities/board/model/boardStore.test.ts`
- Remove the tests for the extracted configuration properties.
- Add test for `rotateBoardMatrix` to ensure dimensions and matrix elements rotate correctly.

#### [MODIFY] `src/entities/board/model/types.ts`
- Remove `CheckerboardMode` (now in `entities/player`).

#### [MODIFY] `src/entities/board/index.ts`
- Remove exports for `CheckerboardMode` if exported here.

---

### `src/widgets/dev-tuner`

Updating tuner UI to dispatch actions to the new `playerStore`, and adding a rotation control.

#### [MODIFY] `src/widgets/dev-tuner/ui/CheckerboardSection.tsx`
- Replace `useBoardStore` imports with `usePlayerStore` for reading/writing checkerboard mode and colors.

#### [MODIFY] `src/widgets/dev-tuner/ui/PanControlsSection.tsx`
- Replace `useBoardStore` imports with `usePlayerStore` for `inversePan` and `panSensitivity`.
- Keep `useBoardStore` for runtime states like `isPanMode` and `panOffset`.

#### [NEW] `src/widgets/dev-tuner/ui/BoardOrientationSection.tsx`
- Create a new section under dev-tuner to contain the "Rotate Board Orientation (Rows ↔ Cols)" button, matching the user's reference implementation.
- Hook it up to `useBoardStore().rotateBoardMatrix()`.

#### [MODIFY] `src/widgets/dev-tuner/ui/DevTunerWidget.tsx`
- Import and render `BoardOrientationSection` in the widget layout.

---

### `src/widgets/game-board`

Updating game board renderer to read configurations from `playerStore`.

#### [MODIFY] `src/widgets/game-board/ui/GameBoardWidget.tsx`
- Read `storeCheckerboardMode` and `storeCheckerColors` from `usePlayerStore` instead of `useBoardStore`.

---

### `src/widgets/footer-console`

Updating trackball controls to use preferences from `playerStore`.

#### [MODIFY] `src/widgets/footer-console/model/useTrackball.ts`
- Swap `inversePan` and `panSensitivity` dependencies to `usePlayerStore`.

## Verification Plan

### Automated Tests
- Run `npm run test` to ensure `boardStore` tests still pass and the new `playerStore` tests validate correct clamping and assignments.
- Run `npm run lint` and `npm run build` to verify typing and FSD import boundary adherence.

### Manual Verification
- Open the DevTuner widget and adjust the Checkerboard options; verify changes apply to the game board.
- Adjust Pan controls in the DevTuner (Inverse Pan checkbox, Sensitivity slider); verify trackball behaviors reflect these config changes.
