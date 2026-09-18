# Implement Dev Tuner Combo Configurations

This plan details the implementation for adding two new toggleable configurations in the Dev Tuner:
1. A checkbox to enable/disable combo tier refill.
2. A new section with a checkbox to allow the active combo timer to pause the survival timer.

## Proposed Changes

### `entities/game-session`

#### [MODIFY] `src/entities/game-session/model/gameSessionStore.ts`
- **`ComboConfig` Interface:**
  - Add `isTierRefillEnabled: boolean`.
  - Add `pauseSurvivalTimerOnCombo: boolean`.
- **`DEFAULT_COMBO_CONFIG`:**
  - Set `isTierRefillEnabled: true` (maintaining current default behavior).
  - Set `pauseSurvivalTimerOnCombo: false` (maintaining current default behavior).
- **`registerMatch` action:**
  - Wrap the `comboRefillTime` assignment logic in an `if (state.comboConfig.isTierRefillEnabled)` check. If false, `comboRefillTime` remains 0.
- **`tick` action:**
  - In the "1. Survival Timer Countdown" block, add a condition to check `const isSurvivalPausedByCombo = state.comboConfig.pauseSurvivalTimerOnCombo && state.comboCount > 0;`.
  - Only decrement `nextCountdown` and process main timer depletion logic if `!isSurvivalPausedByCombo`.

---

### `widgets/dev-tuner`

#### [MODIFY] `src/widgets/dev-tuner/ui/DevTunerWidget.tsx`
- Import and render a new `ComboPauseSection` component alongside existing sections.

#### [MODIFY] `src/widgets/dev-tuner/ui/ComboRefillSection.tsx`
- Add a checkbox at the top of the section (or inline with the title) to toggle `comboConfig.isTierRefillEnabled`.
- Use `setComboConfig` to handle the toggle state.
- When `isTierRefillEnabled` is false, either disable the `Tier 1/2/3` inputs or style them as inactive/dimmed to indicate they are disabled.

#### [NEW] `src/widgets/dev-tuner/ui/ComboPauseSection.tsx`
- Create a new component similar to `ComboDrainSection`.
- Include a single checkbox or toggle switch for `comboConfig.pauseSurvivalTimerOnCombo`.
- Label it clearly, e.g., "Pause Survival Timer During Combo".

## Verification Plan

### Automated Tests
- Run `npx.cmd vitest run` to ensure no existing tests are broken.
- Ensure TypeScript compilation passes: `npx.cmd tsc -b`.

### Manual Verification
- Open Dev Tuner in the UI.
- Toggle "Combo Tier Refill" off and verify that clearing combos no longer adds seconds to the survival timer.
- Toggle "Combo Timer Pauses Survival Timer" on, trigger a combo, and verify that the main countdown pauses while the combo bar drains, and resumes once the combo expires.
