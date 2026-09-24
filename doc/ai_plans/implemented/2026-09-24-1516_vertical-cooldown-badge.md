# Implementation Plan: Vertical Cooldown Badge Direction

## Objective
Add `top` and `bottom` direction options for the `RechargeableItemButton`'s cooldown badge, allowing it to expand vertically rather than horizontally. This utilizes unused vertical space (like the spacious top-right corner) and prevents the cooldown text from overlapping the main item icon.

## Proposed Changes

### 1. Type Definitions & Props
- Update `RechargeableItemButtonProps` in `src/widgets/footer-console/ui/RechargeableItemButton.tsx`:
  - Change `cdDirection?: 'left' | 'right';` to `cdDirection?: 'left' | 'right' | 'top' | 'bottom';`
- Update `GameConfig` and `gameConfigStore`:
  - Change `itemCdDirection: 'left' | 'right';` to `'left' | 'right' | 'top' | 'bottom';`
- Update `ItemRefillsConfigSection`:
  - Add `top` and `bottom` options to the CD Direction `<select>`.

### 2. Badge Container Layout
- The joint badge container currently wraps the `cdTab` and `circularIndicator` in a horizontal layout.
- Update the wrapper's layout classes dynamically based on `cdDirection`:
  - If `cdDirection` is `left` or `right`, use `flex-row`.
  - If `cdDirection` is `top` or `bottom`, use `flex-col`.
- The `items-center` class will remain so that the tab stays perfectly centered with the circular charge indicator.

### 3. Cooldown Tab Animations & Styles
- Update the `cdTab` element's class string to handle vertical layouts:
  - **Shape & Width:** 
    - `top`: `w-auto min-w-[18px] px-0.5 rounded-t-full -mb-1.5 origin-bottom` 
    - `bottom`: `w-auto min-w-[18px] px-0.5 rounded-b-full -mt-1.5 origin-top`
    - *(Note: 18px width closely matches the 20px circle width for a clean look, but `w-auto` ensures wider decimal text like `12.5s` won't clip)*
  - **Hidden State (`isFull === true`):**
    - For vertical directions, animate height instead of width: `max-h-0 py-0 scale-y-0`.
    - Reset the negative margin depending on direction (`-mb-0` for `top`, `-mt-0` for `bottom`).
  - **Visible State (`isFull === false`):**
    - Expand height: `max-h-[24px] scale-y-100`.
    - Apply vertical padding to accommodate the visual overlap with the circle: 
      - `top`: `pt-1 pb-2`
      - `bottom`: `pt-2 pb-1`

### 4. Component Structure Tweaks
- Ensure the rendering order supports verticality seamlessly:
  ```tsx
  {['left', 'top'].includes(cdDirection) && cdTab}
  {circularIndicator}
  {['right', 'bottom'].includes(cdDirection) && cdTab}
  ```

### 5. Storybook & Verification
- Add stories showcasing `top` and `bottom` cooldown badge directions to `RechargeableItemButton.stories.tsx`.
