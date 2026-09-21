# Refactor UI Orchestrators to Slot/ECS Composition

This plan addresses the architectural friction identified by decoupling the *presentation* layer. `FooterConsole` and `GameHeaderBar` are currently "God Widgets" that hardcode specific features and break the orchestrator separation rule.

The solution blends two patterns to achieve true modularity:
1. **Pattern A (Slot-Based Composition)** for the UI Orchestrators (`FooterConsole`, `GameHeaderBar`). They will become pure docking frames that know nothing about the features they host.
2. **Pattern B (Data-Driven ECS-Style Registry)** for the Item system. Items will be defined as data structures (`ItemBehavior`) that dictate their own UI overlays, hotkeys, and activation logic, allowing any game mode to simply mount a generic `<ItemsToolbar />`.

## Phased Execution Plan

The refactoring will be executed in four discrete phases to ensure stable intermediate states and easier verification.

### Phase 1: Feature Extraction (Trackball Pan)
Extract the trackball interaction into a standalone feature, as it is a core UI mechanic that should not be tied to the `enableItems` flag.

- **[NEW] `src/features/trackball-pan/model/useTrackball.ts`**: Move the hook from `widgets/footer-console`.
- **[NEW] `src/features/trackball-pan/ui/TrackballControl.tsx`**: Extract the trackball UI out of `FooterConsole`.
- **[MODIFY] `src/widgets/footer-console/ui/FooterConsole.tsx`**: Remove trackball logic.
- **[MODIFY] `src/pages/game/ui/GamePage.tsx`**: Import `<TrackballControl />` and render it appropriately, ensuring its visibility is independent of `enableItems`.

### Phase 2: Data-Driven ECS Registry (Items)
Establish the ECS registry pattern for items and migrate the core items to this new paradigm.

- **[NEW] `src/entities/item/model/types.ts`**: Define `ItemBehavior` interface (id, label, icon, onActivate, renderOverlay, etc.) and export it via `index.ts`.
- **[NEW] `src/features/core-items/model/coreItemBehaviors.ts`**: Define the 5 core items (Hint, Shake, Random Number, Random Choose, Omnitile) as `ItemBehavior` objects. Move the inline overlays (e.g., Random Choose picker, Random Number banner) into functional components returned by the `renderOverlay` property of their respective `ItemBehavior`.
- **[DELETE/MODIFY] `src/features/core-items/ui/*`**: Remove any legacy UI components that were previously hardcoded for the console.
- **[NEW] `src/widgets/items-toolbar/ui/ItemsToolbar.tsx`**: A generic component that takes a list of `ItemBehavior`s (or reads them from a GameMode config store), iterates over them, and renders `GenericItemButton`s. Also renders any active overlay by calling `activeItem.renderOverlay(context)`.

### Phase 3: Slot Orchestrator (Footer Console)
Transform the Footer Console into a pure slot-based docking frame.

- **[MODIFY] `src/widgets/footer-console/ui/FooterConsole.tsx`**: Strip all remaining item and game state logic. Convert to accept `leftSlot`, `centerSlot`, and `rightSlot` props. Convert the collapse/expand button into a purely visual toggle.
- **[MODIFY] `src/pages/game/ui/GamePage.tsx`**: Update to use the new Slot-based `FooterConsole`. Pass `<TrackballControl />` and `<ItemsToolbar activeItems={coreItemBehaviors} />` into `FooterConsole`.

### Phase 4: Slot Orchestrator (Game Header Bar)
The Header Bar has substantial inline logic (calculating Z-scores, clearable combo counts, etc.) that must be extracted to make it a pure frame.

- **[NEW] `src/widgets/header-bar/ui/HeaderStatusHUD.tsx`** (or similar names): Extract the complex inline logic for Score, Clearable Tiles, and Difficulty calculations from `GameHeaderBar`.
- **[MODIFY] `src/pages/game/ui/GameHeaderBar.tsx`**: Convert to accept `leftHUD`, `centerHUD`, and `rightHUD` props.
- **[RENAME/MOVE]**: Move the header to `src/widgets/header-bar/ui/GameHeaderBar.tsx` since it's a generic layout widget.
- **[MODIFY] `src/pages/game/ui/GamePage.tsx`**: Update to use the new Slot-based `GameHeaderBar`. Pass the newly extracted `<HeaderStatusHUD />`, `<ComboBar />`, `<TimerBar />`, etc., into `GameHeaderBar` based on feature flags.

## Verification Plan

### Automated Tests
- Run `npx.cmd vitest run` to ensure no logic breaks.
- Run `npx.cmd tsc -b` and `npx.cmd vite build` to ensure all FSD imports are clean and types align.
- Run `npx.cmd oxlint` to ensure no linting errors are introduced.

### Manual Verification (Per Phase)
- **Phase 1**: Verify the trackball still pans the board correctly and is accessible regardless of item toggles.
- **Phase 2**: Verify the generic `<ItemsToolbar />` renders the core items correctly and their specific overlays trigger dynamically.
- **Phase 3**: Verify the footer layout structure works flawlessly when passing slots from `GamePage`.
- **Phase 4**: Verify the header visually matches its previous state, but all internal metrics (score, Z-scores, combos) are computing correctly from their extracted components.
