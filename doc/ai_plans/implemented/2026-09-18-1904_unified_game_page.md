# Implementation Plan: Unified Game Page & Config Presets

This plan transitions the project from "Hardcoded Page Versions" (`game-v0.1.z`, etc.) to a single, scalable **Unified Game Page** driven by **Feature Flags** (Presets).

## Proposed Changes

### 1. Create the `GameConfigStore`
We will create a new central configuration store to act as the "Feature Flags" router for the game.
- **[NEW]** `src/entities/game-config/model/gameConfigStore.ts`:
  - Define `GamePreset` type (`'classic' | 'editor' | 'arcade' | 'roguelite'`).
  - Store boolean feature flags: `enableItems`, `enableDevTools`, `enableSolidBlocks`, `enableBounties`, etc.
  - Expose a `setPreset(preset)` action that instantly flips the flags on/off depending on the chosen mode.
- **[NEW]** `src/entities/game-config/index.ts` to export the store.

### 2. Scaffold the Unified Game Page
We will duplicate `game-v0.3.z` (the most complete version) to act as the foundation for the new unified page.
- **[NEW]** `src/pages/game/` (folder structure mirroring v0.3.z).
- **[MODIFY]** `src/pages/game/ui/GamePage.tsx`:
  - Hook into `useGameConfigStore()`.
  - Conditionally render features based on the config. For example:
    ```tsx
    {config.enableItems && <ItemBar />}
    {config.enableDevTools && <SidePanel />}
    ```

### 3. Update Application Routing
- **[MODIFY]** `src/app/App.tsx`:
  - Import the new unified `GamePage` from `@/pages/game`.
  - Update the `/game` route to explicitly point to the new unified page.
  - Leave `/game-v0.1.z`, `/game-v0.2.z`, and `/game-v0.3.z` pointing to their old pages for now, as a safety net before we delete them.

### 4. Main Menu Preset Selector
- **[MODIFY]** `src/pages/vite-welcome/ui/ViteWelcomePage.tsx` (or a dedicated home page):
  - Add UI buttons to launch the game with specific presets: "Play Classic (v0.1)", "Play Sandbox (v0.2)", "Play Arcade (v0.3)".
  - Clicking these will call `setPreset(...)` in the store and then route the user to `/game`.

## Verification Plan
1. Boot the dev server.
2. Navigate to the Home page and click "Play Classic".
3. Verify the game routes to `/game` and the UI correctly hides the Side Panel and Item Bar.
4. Go back and click "Play Arcade".
5. Verify `/game` now displays the Item Bar and Console.
6. Once verified, the old `game-v0.x.z` folders can be safely deleted.
