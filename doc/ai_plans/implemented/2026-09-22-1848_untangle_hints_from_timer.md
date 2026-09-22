# Fix Hint Item Functionality When enableTimer is Disabled

## Problem

The previous commit (`d213173`) incorrectly guarded `registerHintTriggerHandler` with `if (!enableTimer || !enableFreeTriggeredHint) return false;`. 
Because of this, players could not use the **Hint Item** when `enableTimer` was turned off.

`enableFreeTriggeredHint` is the automated hint phase that triggers specifically upon survival timer depletion, so it *should* depend on `enableTimer`. The only fix required is ensuring that the **Hint Item** triggers unconditionally.

---

## Proposed Changes

### 1. `src/pages/game/model/useGameSessionDriver.ts`
- **Make Hint Item Unconditional**: Keep `registerHintTriggerHandler(() => useHintStore.getState().triggerHint())` without any timer guards.
- **Restore Free Hint Timer Dependency**: Execute `useHintStore.getState().tick(...)` only when `enableTimer && enableFreeTriggeredHint` are both true.

### 2. `src/features/free-triggered-hint`
- **Revert `isUntimed` from `hintStore.ts` and `types.ts`**: Restore `tick(deltaSeconds, isSurvivalDepleted, isTimerPaused)` to its original signature and behavior.
- **Update `hintStore.test.ts`**: Remove the unnecessary `isUntimed` test.

### 3. `src/pages/game/ui/GamePage.tsx`
- Restore `enableFreeTriggeredHint: enableTimer && enableFreeTriggeredHint` passed to `useGameOrchestrator`.

### 4. `src/widgets/dev-tuner/ui/FeatureFlagsSection.tsx`
- Restore `isSubItem: true`, `requiresKey: 'enableTimer'`, and `requiresNote: 'Requires Timer'` for `enableFreeTriggeredHint`.

---

## Verification Plan

### Automated Tests
- Run vitest: `npx.cmd vitest run`
- TypeScript check: `npx.cmd tsc -b`
- Production build: `npx.cmd vite build`
- Linter: `npx.cmd oxlint`
- Prettier: `npx.cmd prettier --check "src/**/*.{ts,tsx,css,json}"`
