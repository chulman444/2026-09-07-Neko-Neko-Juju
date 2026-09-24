# Implementation Plan: RechargeableItemButton UI Redesign & Spam Cooldown

This plan covers the implementation of the joint charge/cooldown badge, placement configuration, and the "prevent spamming" cooldown mechanism (Option A) for rechargeable items.

## 1. State Management (`src/entities/item/model/rechargeableItemStore.ts`)
- **Constants**: Add `DEFAULT_SPAM_COOLDOWNS` (e.g., initialized to `0` or `0.5` per item).
- **State Interface**:
  - Add `spamCooldowns: Record<ItemType, number>`.
  - Add `activeSpamTimers: Record<ItemType, number>`.
- **Actions**:
  - Add `setSpamCooldown: (item: ItemType, seconds: number) => void`.
- **Updates**:
  - **`tickGauges`**: Decrement `activeSpamTimers` using `deltaSeconds`. Ensure they don't drop below 0.
  - **`onItemConsumed`**: When an item is consumed, set its `activeSpamTimers[item]` to `spamCooldowns[item]`.
  - **`resetGauges`**: Reset `activeSpamTimers` to 0.
  - **`resetAll`**: Restore `spamCooldowns` to `DEFAULT_SPAM_COOLDOWNS` and reset `activeSpamTimers`.
- **Tests** (`rechargeableItemStore.test.ts`):
  - Add tests to verify `spamCooldowns` setting and `activeSpamTimers` decrementing during `tickGauges`.

## 2. UI Updates (`src/widgets/footer-console/ui/RechargeableItemButton.tsx`)
- **New Props**:
  - `badgePlacement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'` (default: `'bottom-right'`).
  - `cdDirection?: 'left' | 'right'` (default: `'left'`).
  - `cdFormat?: 'integer' | 'decimal'` (default: `'integer'`).
- **Store Hooks**: 
  - Retrieve `activeSpamTimer` for the item.
- **Overlay & Usability Logic**:
  - Define `isUnusable = stacks === 0 || activeSpamTimer > 0`.
  - The dark overlay and gray-out effect should **only** trigger when `isUnusable` is true.
  - If `activeSpamTimer > 0`, the overlay progress sweep should reflect the spam cooldown.
  - If `stacks === 0`, the overlay progress sweep should reflect the recharge progress from 0 to 1.
  - When `stacks >= 1` and `activeSpamTimer === 0`, the button should remain crisp and fully clickable without the dark overlay.
- **Joint Badge Implementation (Replacing old bottom HUD)**:
  - Position an absolute container based on `badgePlacement`.
  - Arrange the **Circular Charge Indicator** (`C/M`) and the **CD Tab** based on `cdDirection`.
  - **Circular Charge Indicator**:
    - Build an SVG circular progress ring (0% to 100%) that maps to the recharge gauge.
    - When `stacks === maxStacks`, the ring stays solidly filled (100%).
    - Inner text displays `${stacks}/${maxStacks}`.
  - **CD Tab**:
    - Displays `cooldownText`. Format the displayed number based on the `cdFormat` prop (e.g., `Math.ceil(seconds)` for integer, `seconds.toFixed(1)` for decimal).
    - Apply a smooth CSS transition (e.g., width, opacity, margin) so it collapses and hides when `stacks === maxStacks`, leaving only the circular indicator.

## 3. Storybook Updates (`src/widgets/footer-console/ui/RechargeableItemButton.stories.tsx`)
- Add/update stories to cover the new configurations:
  - **Badge Layouts**: Showcase different `badgePlacement` and `cdDirection` combinations.
  - **CD Format**: Showcase integer vs decimal countdown.
  - **Spam Lockout State**: Mock `activeSpamTimer > 0` to demonstrate the brief unusable overlay sweep while keeping charges > 0.
  - **Full Charge State**: Demonstrate the smooth collapse of the CD tab when at max stacks.

## 4. Verification
- Format all modified files.
- Run type checks (`tsc -b`).
- Run tests (`vitest run`).
- Run Storybook (`storybook build`) to ensure visual components render properly.
- Run linting (`oxlint`).
