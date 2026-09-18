# Board Transformations & Manual Orientation Controls

This plan introduces manual board transformation actions that the player can trigger on demand. These transformations mutate the current board state in `boardStore` without acting as persistent cross-game preferences. 

## User Review Required

- Confirm the terminology for the UI buttons (e.g., "Rotate CW", "Rotate CCW", "Lock Top-Left / Bottom-Right", "Lock Top-Right / Bottom-Left", "Revert to Original Orientation").
- Confirm these buttons will be placed in the Player Config UI (or DevTuner for now until the modal is built).

## Proposed Changes

### `src/entities/board`

Introduce the transformation math and state tracking in `boardStore` to allow reverting.

#### [NEW] `src/entities/board/lib/matrixTransforms.ts`
- Extract pure functions for 2D array manipulations:
  - `rotateCW(matrix)`: True 90-degree clockwise rotation.
  - `rotateCCW(matrix)`: True 90-degree counter-clockwise rotation.
  - `transpose(matrix)`: Flips across the main diagonal (Locks Top-Left and Bottom-Right).
  - `antiTranspose(matrix)`: Flips across the anti-diagonal (Locks Top-Right and Bottom-Left).

#### [MODIFY] `src/entities/board/model/boardStore.ts`
- **State**:
  - Remove `isBoardRotated`.
  - Add `orientationOffset: { rot: number; flip: boolean }` (default `{ rot: 0, flip: false }`). This tracks the *current* board's deviation from its original generated orientation, allowing us to compute the exact inverse to revert it.
- **Actions**:
  - Remove the old `rotateBoardMatrix` toggle.
  - `applyRotationCW()`: Applies `rotateCW` to the matrix and updates `orientationOffset`.
  - `applyRotationCCW()`: Applies `rotateCCW` to the matrix and updates `orientationOffset`.
  - `applyTranspose()` ("Lock Top-Left"): Applies `transpose` and updates `orientationOffset`.
  - `applyAntiTranspose()` ("Lock Top-Right"): Applies `antiTranspose` and updates `orientationOffset`.
  - `revertOrientation()`: Calculates the inverse of `orientationOffset`, applies it to restore the matrix to its original generated orientation, and resets the offset to `{ rot: 0, flip: false }`.
- **Overrides**:
  - Update `generateNewBoard`, `setDimensions`, and `restartCurrentBoard` to explicitly reset `orientationOffset`.

#### [MODIFY] `src/entities/board/model/boardStore.test.ts`
- Add unit tests for all matrix transformations.
- Verify that `revertOrientation()` perfectly restores the board's dimensions and layout regardless of the sequence of transformations applied.

---

### UI Controls

Add the manual trigger buttons to the existing Player Settings Modal.

#### [MODIFY] `src/widgets/player-settings/ui/PlayerSettingsModal.tsx`
- Remove the existing "Rotate Board Orientation (Rows ↔ Cols)" button and `isBoardRotated` state.
- Add the new comprehensive transformation buttons:
  - ⟳ Rotate Clockwise
  - ⟲ Rotate Counter-Clockwise
  - ⤡ Lock Top-Left / Bottom-Right
  - ⤢ Lock Top-Right / Bottom-Left
  - ↺ Revert to Original Orientation
- Disable the "Revert" button when `orientationOffset` is already `{ rot: 0, flip: false }`.

## Verification Plan

### Automated Tests
- Test that applying random sequences of rotations and transposes, followed by `revertOrientation()`, always results in the exact same starting matrix orientation.

### Manual Verification
- Generate an asymmetrical board (e.g., 17x10).
- Click "Lock Top-Left" and verify the dimensions swap to 10x17 and the top-left tile stays anchored.
- Click "Rotate CW" and verify true rotation.
- Click "Revert" and ensure the board snaps back perfectly to 17x10 in its original layout without restoring cleared tiles.
