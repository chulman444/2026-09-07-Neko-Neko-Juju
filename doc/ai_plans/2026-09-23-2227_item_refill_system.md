# Item Refill System

This plan introduces the new refillable item mechanics, configurable max stacks, progress gauges, and the MOBA-style UI overlay. To keep the codebase clean and safe, the new features will be built in parallel to the classic system.

## Proposed Changes

### 1. `src/entities/game-config`
- **[MODIFY] `model/types.ts`**:
  - Add `enableItemRefills: boolean` to `GameFeatureFlags`.
  - Add `itemRefillStyle: 'wipe' | 'spin'` to `GameFeatureFlags`.
- **[MODIFY] `model/gameConfigStore.ts`**:
  - Update `PRESET_CONFIGS` to include `enableItemRefills: true` (for arcade/roguelite) or `false` (for classic), and default `itemRefillStyle: 'spin'`.

### 2. `src/entities/item` (Isolated State)
- **[NEW] `model/rechargeableItemStore.ts`**:
  - Create a new store side-by-side with the classic `itemStore`.
  - Tracks `maxStacks` (default 3), `gauges` (default 0).
  - Tracks `refillTimers` (default 10s for most, 0 for Shake).
  - Tracks `refillActions` (default 5 for Shake, 0 for others).
  - Implements `addGauge`: Fills the gauge, modulo 1.0 to increment the classic item count in `itemStore` (only if `current < maxStacks`).
  - Implements `tickGauges`: Called every frame; increments time-based gauges.
- **[MODIFY] `model/itemStore.ts`**:
  - In `consumeItem`: When an item is consumed, if `enableItemRefills` is true and `item !== 'shake'`, call `useRechargeableItemStore.getState().addGauge('shake', 1 / refillActions.shake)`.

### 3. `src/widgets/footer-console` (Isolated UI)
- **[NEW] `ui/RechargeableItemButton.tsx`**:
  - A brand new component parallel to `GenericItemButton`.
  - **Visual State Logic (LoL-style)**: The icon and button are fully colored and "active" as long as `stacks > 0`. It is ONLY grayed out (`opacity-50 grayscale`) when `stacks === 0` (recharging from 0 to 1).
  - **Refill Gauge Overlay**: Adds a sweeping gauge (`wipe` or `spin` CSS). The overlay itself is purely for the recharge animation and is **not** responsible for graying out or darkening the icon. It just runs the animation on top/behind the button while it charges to the next stack.
  - Moves the label to the bottom-right showing stacks (`Current/Max`).
  - Adds a Cooldown Text Indicator at the bottom-left (`Math.ceil(remainingSeconds)` or remaining actions).
- **[MODIFY] `ui/FooterConsole.tsx`**:
  - Import `RechargeableItemButton`.
  - Conditionally render `<RechargeableItemButton>` if `enableItemRefills` is true, otherwise fallback to the untouched `<GenericItemButton>`.

### 4. `src/pages/game`
- **[MODIFY] `model/useGameSessionDriver.ts`**:
  - In the tick loop, if `enableItemRefills` is true, call `useRechargeableItemStore.getState().tickGauges(clampedDelta, isTimerPaused)`.

### 5. `src/widgets/dev-tuner`
- **[MODIFY] `ui/FeatureFlagsSection.tsx`** *(Optional/Recommended)*:
  - Add UI toggles for `enableItemRefills` and `itemRefillStyle` for easy testing.

## User Review Required
This isolated approach guarantees your classic game mode is 100% untouched and safe. 

If this plan looks perfect, please give the green light to proceed with execution.
