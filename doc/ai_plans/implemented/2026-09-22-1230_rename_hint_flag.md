# Rename Hint Flag and Fix Background Ticking

Fix the bug where disabled features (like the timer or hints) continue to run in the background because their `.tick()` methods are executed unconditionally. Rename the hints feature flag to `enableFreeTriggeredHint` and make it strictly dependent on `enableTimer` so it cannot operate or render when the timer is disabled.

## Proposed Changes

### `src/entities/game-config`
#### [MODIFY] [types.ts](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/entities/game-config/model/types.ts)
- Rename `enableHints` to `enableFreeTriggeredHint` in `GameFeatureFlags`.

#### [MODIFY] [gameConfigStore.ts](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/entities/game-config/model/gameConfigStore.ts)
- Update all default state objects and presets to use `enableFreeTriggeredHint` instead of `enableHints`.

#### [MODIFY] [gameConfigStore.test.ts](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/entities/game-config/model/gameConfigStore.test.ts)
- Update test cases to reflect the renamed `enableFreeTriggeredHint` property.

---

### `src/pages/game`
#### [MODIFY] [useGameSessionDriver.ts](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/pages/game/model/useGameSessionDriver.ts)
- Import `useGameConfigStore` and retrieve the current state flags inside the `loop` function.
- Execute `useSurvivalTimerStore.getState().tick(...)` **only** if `enableTimer` is true.
- Execute `useComboStore.getState().tick(...)` **only** if `enableCombos` is true.
- Execute `useHintStore.getState().tick(...)` **only** if **both** `enableTimer` and `enableFreeTriggeredHint` are true.
- Update the `registerHintTriggerHandler` callback to ensure it aborts if `enableTimer` or `enableFreeTriggeredHint` are false.

#### [MODIFY] [GameHeaderBar.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/pages/game/ui/GameHeaderBar.tsx)
- Remove `enableHints` from the selectors.
- Remove the feature flag guards from `<HintBar />` and `noHintsAvailableMsg`. Make them render unconditionally, as the core hint system is a dependency for Items and Rival Cats, even if free triggered hints are disabled.

#### [MODIFY] [GamePage.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/pages/game/ui/GamePage.tsx)
- Select `enableFreeTriggeredHint` from the game config store.
- Pass `{ enableTimer, enableHints: enableTimer && enableFreeTriggeredHint }` to `useGameOrchestrator` when configuring it.

---

### `src/widgets/game-board`
#### [MODIFY] [useGameOrchestrator.ts](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/widgets/game-board/model/useGameOrchestrator.ts)
- Rename `enableHints` to `enableFreeTriggeredHint` in `GameOrchestratorOptions`.
- Update the internal option destructuring and occurrences inside `handleMatch` to use `enableFreeTriggeredHint`.

#### [MODIFY] [useGameOrchestrator.test.ts](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/widgets/game-board/model/useGameOrchestrator.test.ts)
- Rename `enableHints` to `enableFreeTriggeredHint` in tests.

---

### `src/widgets/dev-tuner`
#### [MODIFY] [FeatureFlagsSection.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/widgets/dev-tuner/ui/FeatureFlagsSection.tsx)
- Update the destructuring of `flags` to map `store.enableFreeTriggeredHint` instead of `store.enableHints`.
- Add conditional rendering to the checkbox loop: If the key is `enableFreeTriggeredHint` and `flags.enableTimer` is false, apply a `disabled` attribute to the input, lower its opacity (e.g., `opacity-50 pointer-events-none`), and append a tiny "(Requires Timer)" note.

## Verification Plan

### Automated Tests
- Run `npx.cmd vitest run` to ensure all tests pass with the renamed flags.
- Run `npx.cmd tsc -b` and `npx.cmd oxlint` to ensure the rename propagates everywhere in the codebase.

### Manual Verification
- Start the game (`npx.cmd vite preview`).
- Disable `enableTimer` in the Dev Tools feature flags.
- Verify that `enableFreeTriggeredHint` becomes grayed out and unclickable in the Dev Tools.
- Verify that the Hint Bar remains visible on the screen, but the free hint timer never ticks down automatically.
- Verify that clicking / matching tiles does not result in the free hints being triggered automatically.
- Re-enable `enableTimer` and disable `enableFreeTriggeredHint` to verify that the free hint progress is halted, but the Hint Bar remains visible for item usage.
