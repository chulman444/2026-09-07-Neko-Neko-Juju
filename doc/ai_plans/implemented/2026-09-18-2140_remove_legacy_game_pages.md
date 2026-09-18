# Remove Legacy Game Pages & Unify Game Navigation

Remove deprecated hardcoded page folders (`game-v0.1.z`, `game-v0.2.z`, `game-v0.3.z`), clean up application routing to serve `/game` exclusively, and simplify `ViteWelcomePage` with a mode/version `<select>` dropdown and a single "Play Game" button.

## User Review Required

> [!NOTE]
> All functionality from the legacy versions is already fully covered by `src/pages/game` via `useGameConfigStore` feature flag presets (`classic`, `editor`, `arcade`, `roguelite`). Deleting the legacy directories will permanently retire `game-v0.1.z`, `game-v0.2.z`, and `game-v0.3.z` folders and their Storybook stories.

## Open Questions

None. The requirements are clear: remove the legacy page directories, clean up routing, and replace multiple version launch buttons with a mode select dropdown and a single "Play Game" button.

---

## Proposed Changes

### Application Routing Layer

#### [MODIFY] [App.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/app/App.tsx)
- Remove legacy page imports: `GamePageV01`, `GamePageV02`, `GamePageV03`.
- Remove route cases for `/game-v0.3.z`, `/game-v0.3`, `/game-v0.2.z`, `/game-v0.2`, `/game-v0.1.z`, `/game-v0.1`, and `/game-v0`.
- Maintain active routes: `/` (`ViteWelcomePage`), `/board-maker` (`BoardMakerPage`), and `/game` (`GamePage`), with the default 404 handler.

---

### Pages Layer

#### [DELETE] `src/pages/game-v0.1.z/`
- Delete the legacy v0.1 page directory (including `ui/`, `model/`, `index.ts`, and stories).

#### [DELETE] `src/pages/game-v0.2.z/`
- Delete the legacy v0.2 page directory (including `ui/`, `model/`, `index.ts`, and stories).

#### [DELETE] `src/pages/game-v0.3.z/`
- Delete the legacy v0.3 page directory (including `ui/`, `model/`, `index.ts`, and stories).

#### [MODIFY] [ViteWelcomePage.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/pages/vite-welcome/ui/ViteWelcomePage.tsx)
- Remove the "Legacy Versions (Safety Net)" section and links to `/game-v0.1.z`, `/game-v0.2.z`, and `/game-v0.3.z`.
- Remove the three separate launch preset buttons ("Play Arcade", "Play Sandbox", "Play Classic").
- Add a clean mode/version `<select>` dropdown connected to `useGameConfigStore` (`preset`, `setPreset`), allowing the user to select between:
  - `arcade` ("Arcade (v0.3) - Items + Console")
  - `editor` ("Sandbox (v0.2) - Dev Tools")
  - `classic` ("Classic (v0.1) - Clean Core")
  - `roguelite` ("Roguelite (v0.4) - Stacks & Bounties")
- Add a single primary "🎮 Play Game" button that navigates directly to `/game`.
- Preserve the link to `/board-maker`.

---

## Verification Plan

### Automated Tests
Run test suites and typechecking after changes:
1. `npx.cmd vitest run` - ensure all unit tests pass without errors.
2. `npx.cmd oxlint` - verify no lint or dead import errors.
3. `npx.cmd tsc -b` - confirm TypeScript compiles cleanly with all legacy page imports removed.
4. `npx.cmd vite build` - confirm Vite production build succeeds.
5. `npx.cmd storybook build` - confirm Storybook builds without orphaned stories.

### Manual Verification
1. Run `npx.cmd vite` and load `http://localhost:5173/`.
2. Verify that the welcome page shows the single "Play Game" button and the mode select dropdown.
3. Switch the dropdown between modes (Classic, Sandbox, Arcade) and verify the state updates.
4. Click "Play Game" and confirm it opens `/game` in the chosen preset mode.
5. Attempt navigating to `/game-v0.1.z` or `/game-v0.3.z` and verify it routes to the styled 404 page.
