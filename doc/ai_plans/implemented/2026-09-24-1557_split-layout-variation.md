# Implementation Plan: Split Layout with Cell & Badge Styles

## Objective
Implement the "Second Variation" of the `RechargeableItemButton`. Structurally, this variation always uses a split layout so the main icon is perfectly centered in its own dedicated left-hand space without overlapping the information. Visually, it supports two distinct styles: a grid-like "Cell" mode and a floating "Badge" (UI) mode.

## Proposed Changes

### 1. New Props
- Update `RechargeableItemButtonProps` to support the new variation and its two styles:
  ```ts
  variant?: 'classic' | 'split'; // 'classic' is the current overlapping behavior
  splitStyle?: 'cell' | 'badge'; // The UI vs Cell toggle (only applies when variant='split')
  ```

### 2. Structural Layout (The "Split" Foundation)
When `variant === 'split'`, the "Center Core Button Deck" becomes a `flex-row` instead of overlapping everything.
- **Left Container (`flex-1`)**: The icon sits here and perfectly centers itself in whatever space is remaining. 
- **Right Container (`w-[28px]` or `w-[32px]`)**: A dedicated flex column for the cooldown and charges, completely preventing overlap with the icon.

### 3. Visual Styles (`splitStyle`)
The `splitStyle` prop changes how the right container and the dark recharge overlay are rendered, without changing the underlying structural split:

#### A. `splitStyle === 'cell'` (The Grid Look)
- **Visuals**: The right container has a solid left border separating it from the icon. It is divided horizontally with a bottom border for the top half.
- **Top Half (CD)**: Renders plain text for the cooldown (or `MAX`).
- **Bottom Half (C/M)**: Renders plain text for the charges (e.g., `2/3`).
- **Dark Overlay (Sweep)**: Scoped strictly to the left icon container, reinforcing the "grid" feel.

#### B. `splitStyle === 'badge'` (The "UI" Look)
- **Visuals**: The right container has **no borders** and a transparent background. It seamlessly blends with the left side, making the split invisible to the user ("it looks like the 'cell' isn't there").
- **Top Half (CD)**: Renders the stylized `cdTab` pill so it looks like a floating UI element inside that right-hand space.
- **Bottom Half (C/M)**: Renders the stylized `circularIndicator` inside the bottom space. 
- **Dark Overlay (Sweep)**: Spans across the entire button deck (both left and right containers) so the button feels like one cohesive unit with floating badges, even though structurally it is partitioned.
