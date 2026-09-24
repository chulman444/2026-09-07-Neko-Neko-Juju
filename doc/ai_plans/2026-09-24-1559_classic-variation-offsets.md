# Implementation Plan: Classic Variation Offsets

## Objective
Add precision offset options for both the main icon and the floating badge in the `classic` (first) variation of the `RechargeableItemButton`. This will allow the badge to intentionally "sit on the border" or float outside the button boundaries, and gives developers full control over the icon's visual centering.

## Proposed Changes

### 1. New Props
- Add offset properties to `RechargeableItemButtonProps` in `src/widgets/footer-console/ui/RechargeableItemButton.tsx`:
  ```ts
  /** 
   * Allows precise translation (in px) of the main icon. 
   * If provided, this overrides the default auto-nudging behavior. 
   */
  iconOffset?: { x?: number; y?: number };
  
  /** 
   * Allows precise translation (in px) of the joint badge. 
   * Negative or positive values allow the badge to float over the border. 
   */
  badgeOffset?: { x?: number; y?: number };
  ```

### 2. Container Clipping Adjustment (Crucial)
- **Remove `overflow-hidden`** from the "Center Core Button Deck".
  - Currently, `overflow-hidden` forces any child elements to be clipped if they extend past the button's boundaries.
  - To allow the floating badge to "sit on the border" as requested, this clipping must be removed.
  - *Safety Check:* The animated dark recharge overlays (wipe/spin) use `inset-0` inside a rectangular container, so removing `overflow-hidden` will **not** cause the dark sweep to bleed into the rounded wings.

### 3. Applying the Offsets
- **Icon Container:**
  - Check if `iconOffset` is provided. If so, strip out the hardcoded Tailwind nudges (`translate-y-1`, etc.) and apply the offset dynamically:
    ```tsx
    style={iconOffset ? { transform: `translate(${iconOffset.x ?? 0}px, ${iconOffset.y ?? 0}px)` } : undefined}
    ```
- **Badge Container:**
  - Keep the standard `placementClass` anchor (e.g., `bottom-0.5 right-0.5`).
  - Apply the `badgeOffset` via inline styles so it translates relative to its anchor:
    ```tsx
    style={badgeOffset ? { transform: `translate(${badgeOffset.x ?? 0}px, ${badgeOffset.y ?? 0}px)` } : undefined}
    ```
  - Using inline `transform` ensures smooth sub-pixel rendering and allows absolute freedom without fighting Tailwind's spacing scale.
