# Unified Combo Progression Table

Refactor the fragmented combo configuration tools (Drain Speed, Refill Timer, Pause Settings) into a single, highly flexible "Piecewise Function" table. This master table will allow developers to set specific rules for distinct combo ranges, supporting both hardcoded values and dynamic math equations (e.g., `x * 0.5`, `c`, or `atan(x)`).

## Proposed Changes

### `entities/game-session`
#### [MODIFY] [gameSessionStore.ts](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/entities/game-session/model/gameSessionStore.ts)
- Replace the current `ComboConfig` object with a `ComboRule` array.
- A `ComboRule` will look like: 
  ```typescript
  { 
    id: string, 
    upToCombo: number | null, 
    
    // Timer Rewards (Instant Add)
    addTimeValue: string | number, // e.g., '2' or 'x * 0.5'
    
    // Timer Flow State
    timerFlowMode: 'normal' | 'pause', // 'normal' means ignore/do nothing to flow
    pauseDuration: string | number,    // Evaluates 'x' (combo) and 'c' (comboDuration). Default: 'c'
    
    // Core Combo Mechanics
    comboDuration: string | number,    // replacing drain exponent math
    scoreMultiplier: string | number   // e.g., '1.5' or '1 + x*0.1'
  }
  ```
- Add a safe math evaluation helper: `evaluateFormula(formula, variables: {x: number, c: number})`.
- Refactor the `tick` and `registerMatch` functions to look up the correct `ComboRule` for the current combo and apply its evaluated logic. If `timerFlowMode` is `'pause'`, apply the evaluated `pauseDuration`.

### `widgets/dev-tuner`
#### [NEW] [ComboProgressionSection.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/widgets/dev-tuner/ui/ComboProgressionSection.tsx)
- Create a new UI component rendering the master table.
- Columns: Range, Add Time, Timer Flow (Radio: Normal | Pause), Pause Duration, Combo Duration, Score Mult.
- Include inputs that accept raw numbers or formulas.
- Include "Add Rule" and "Remove" buttons.

#### [MODIFY] [DevTunerWidget.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/widgets/dev-tuner/ui/DevTunerWidget.tsx)
- Import and render `<ComboProgressionSection />`.
- Remove the three old, fragmented combo sections.

#### [DELETE] [ComboDrainSection.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/widgets/dev-tuner/ui/ComboDrainSection.tsx)
#### [DELETE] [ComboRefillSection.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/widgets/dev-tuner/ui/ComboRefillSection.tsx)
#### [DELETE] [ComboPauseSection.tsx](file:///c:/Users/chulm/Dev/Projects/2026-09-07%20Neko%20Neko%20Juju/src/widgets/dev-tuner/ui/ComboPauseSection.tsx)

## Verification Plan
### Automated Tests
- Run `npx.cmd tsc -b` to ensure all type changes in the Zustand store compile cleanly.
- Run `npx.cmd vite build` to ensure the app builds.

### Manual Verification
- Verify the math evaluator successfully handles `c` as the evaluated combo duration.
- Play the game and verify the timer correctly evaluates time injections, flow pauses, and combo drain times.
