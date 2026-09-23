# Centralized Command Orchestrator Architecture

Refactor the game's architecture to centralize all board and hint interactions through a unified Command Center (the Orchestrator). This shifts the game from a reactive "cleanup" model to an explicit intent-driven model, ensuring that player matches, rival cat steals, and hint highlights are handled correctly with a guaranteed order of operations, fixing missing UI updates and race conditions.

## User Review Required

> [!WARNING]
> This refactor changes how almost every feature interacts with the board. It removes the decoupled listener wiring in `useGameSessionDriver` and replaces it with direct, synchronous commands via the Orchestrator.

## Open Questions

> [!IMPORTANT]
> **Orchestrator Location:** Since the Orchestrator needs to be called from inside other Zustand stores (e.g., `rivalCatStore` ticking in the background), it should likely be converted from a React Hook / Factory into a global Zustand store (e.g., `entities/orchestrator` or a similar root-level store). Does this align with your FSD architecture preferences?
>
> **Look-Ahead Solver Execution:** When you click to clear a match from the Look-Ahead Solver dev panel, should it be treated as a normal player match (granting score, combo, and time) or a "dev clear" that silently removes the tiles without awarding points?

## Proposed Changes

### Game Orchestrator (Command Center)

#### [MODIFY] `src/widgets/game-board/model/useGameOrchestrator.ts`
- Convert or augment to a globally accessible Command Store/Service.
- Add distinct command methods to handle the differences you pointed out:
  - `executePlayerMatch(tiles)`: Validates, clears board, awards score/time/combo, cascades solver, checks for zero remaining hints to reliably trigger 'No more hints available'.
  - `executeRivalSteal(tiles)`: Clears board, cascades solver, triggers steal notification. (No score/time/combo).
  - `executeHighlightHint(isFree)`: Resolves a hint from the solver and pushes it to `boardHintsStore` for highlighting. Triggers the 'No hints available' message explicitly if none exist.

### Feature Adjustments

#### [MODIFY] `src/features/rival-cats/model/rivalCatStore.ts`
- Remove direct `useBoardStore.getState().clearTiles(...)` calls.
- Invoke `orchestrator.executeRivalSteal(targetCombo)` when the steal timer finishes.

#### [MODIFY] `src/features/core-items/model/coreItemsStore.ts`
- Update `triggerHintItem` to call `orchestrator.executeHighlightHint(false)` instead of relying on the injected `hintTriggerHandler`.

#### [MODIFY] `src/features/free-triggered-hint/model/freeTriggeredHintStore.ts`
- Update the auto-firing `tick` logic to use `orchestrator.executeHighlightHint(true)`.

#### [MODIFY] `src/features/board-hints/model/boardHintsStore.ts`
- Remove the `removeClearedTiles` reactive check that attempts to set `noHintsAvailableMsg`. This responsibility moves to the Orchestrator's synchronous flow.
- Remove `setClearableHintsResolver` and directly consume the hint passed in by the orchestrator.

#### [MODIFY] `src/pages/game/model/useGameSessionDriver.ts`
- Strip out event wiring (`registerRivalStealListener`, `registerHintTriggerHandler`, etc.).
- Reduce the driver to purely managing the 60fps `requestAnimationFrame` loop that ticks the stores (`deltaSeconds`).

## Verification Plan

### Automated Tests
- Run `npx.cmd vitest run` to ensure existing game loop tests pass.

### Manual Verification
- Start a game and verify scoring and combo work for normal matches.
- Allow a Rival Cat to steal tiles and verify no score is awarded, but the solver recalculates.
- Trigger the Hint Item when no hints are available and verify the "No more hints available" message fires immediately.
- Clear the last remaining match on the board manually and verify the "No more hints available" message fires reliably.
