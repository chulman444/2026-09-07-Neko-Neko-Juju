# Implementation Plan: Items Configuration in DevTuner

## Overview
We will add a new `ItemsConfigSection` to the `DevTunerWidget` to allow developers to configure item mechanics (stacks, CDs, refill rates) individually per item type, as well as customize the UI layout of the `RechargeableItemButton` (e.g., badge placement, CD direction, and CD format) globally.

## 1. Update Game Config Store (UI Flags)
File: `src/entities/game-config/model/types.ts`
- Add new properties to `GameFeatureFlags`:
  - `itemBadgePlacement: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`
  - `itemCdDirection: 'left' | 'right'`
  - `itemCdFormat: 'integer' | 'decimal'`

File: `src/entities/game-config/model/gameConfigStore.ts`
- Update `PRESET_CONFIGS` for all presets (`classic`, `editor`, `arcade`, `roguelite`) to include defaults for the new flags:
  - `itemBadgePlacement: 'bottom-right'`
  - `itemCdDirection: 'left'`
  - `itemCdFormat: 'integer'`

## 2. Plumb UI Flags into Footer Console
File: `src/widgets/footer-console/ui/FooterConsole.tsx`
- Consume `itemBadgePlacement`, `itemCdDirection`, and `itemCdFormat` from `useGameConfigStore`.
- Pass these variables as props down to the `RechargeableItemButton` component when rendering rechargeable items.

## 3. Create ItemRefillsConfigSection Component
File: `src/widgets/items-panel/ui/ItemRefillsConfigSection.tsx`
- Create a new component that reads states from `useItemStore` (for current stacks) and `useRechargeableItemStore` (for max stacks, cooldowns, and refill rates).
- Include a selector (e.g., buttons or a dropdown) to choose an active `ItemType` (`randomNumber`, `randomChoose`, `omnitile`, `shake`, `hint`) to edit.
- For the selected item type, render input sliders for:
  - Current Stacks (`setItemCount`)
  - Max Stacks (`setMaxStacks`)
  - Prevent-Spam Cooldown (`setSpamCooldown`)
  - Refill Timer (`setRefillTimer`)
  - Refill Actions (`setRefillActions`)
- Also render global dropdowns/selects for the new `GameConfigStore` UI flags:
  - Badge Placement
  - Cooldown Direction
  - Cooldown Format
- Following the user's requirements, these UI options do not need to be hidden behind `enableItemRefills` being active, they will simply configure the values.

## 4. Integrate into ItemsPanelWidget
File: `src/widgets/items-panel/ui/ItemsPanelWidget.tsx`
- Import and render `<ItemRefillsConfigSection />` inside the main `ItemsPanelWidget` container.
- Place it reasonably within the stack (e.g., below `ItemsInventorySection`).

## 5. (Optional but Recommended) Extract Generic Panel UI Components
- If not already done, use existing standard UI sliders/dropdown patterns for consistency with the rest of the Items Panel.

## Verification
1. Run `npx.cmd vite preview` / `npx.cmd tsc -b` / `npx.cmd oxlint` / `npx.cmd vitest run`.
2. Open the Items Panel (click the 🎒 Items tab in the side panel).
3. Verify changing current/max stacks applies instantly to the specific selected item.
4. Verify changing Badge Placement, CD Direction, and CD Format updates the buttons visually in the `FooterConsole`.
