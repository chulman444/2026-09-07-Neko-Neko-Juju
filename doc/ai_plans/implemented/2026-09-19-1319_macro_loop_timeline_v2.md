# Macro Loop Sequence Manager (Implementation Plan)

This plan outlines the architecture for the Macro Loop (Set) orchestrator and its Dev Tools UI. The goal is to create a "Playlist" of boards that the player progresses through naturally, while giving developers powerful God-Mode tools to edit, simulate, and manipulate that timeline.

## Proposed Changes

---

### `entities/macro-loop`
Creates the core domain state for the macro loop orchestrator.

#### [NEW] `entities/macro-loop/model/macroLoopStore.ts`
Zustand store containing the active Set's configuration and gameplay state:

**Types:**
```typescript
export interface AccumulatedBlock {
  originalValue: number;
  sourceBoardIndex: number;
  originalPosition?: { col: number; row: number };
}

export interface MacroBoardConfig {
  boardType: 'risk' | 'reward';
  sizeTier: BoardSizeTier; // 'small', 'medium', etc.
  difficultyTier: DifficultyTier; // 'easy', 'medium', etc.
  seed: string;
}
```

**Store State:**
- `boards`: `MacroBoardConfig[]` (The playlist sequence).
- `currentPlayIndex`: number (Which board in the sequence is currently active).
- `editingBoardIndex`: number | null (Tracks which board is currently "unlocked" for editing in the generator).
- `totalRiskMeter`: number
- `accumulatedSolidBlocks`: `AccumulatedBlock[]`

**Actions:**
- `startEditing(index)`: Locks the timeline and loads that board's config into the Board Generator tab.
- `saveEditing(newConfig)`: Saves the Board Generator's current state back to the locked timeline slot, then unlocks.
- `cancelEditing()`: Unlocks the timeline without saving.
- `advanceToNextBoard(phase1Score, leftoverTiles)`: The core game loop function. Adds to risk meter, saves solid blocks, increments `currentPlayIndex`, and automatically loads the next board into the game engine.

#### [NEW] `entities/macro-loop/index.ts`
Public API exporting the store and types.

---

### `widgets/macro-loop-manager`
The Timeline Dev UI.

#### [NEW] `widgets/macro-loop-manager/ui/MacroLoopManagerWidget.tsx`
A timeline panel that maps over `macroLoopStore.boards`:
- **Card Display:** Shows board index, type (Risk/Reward), Size, Difficulty, and Seed.
- **Phase Breakdown (History):** If the board is already played, it shows Phase 1 Score (Risk Meter earned) and Phase 2 Leftovers (Solid blocks created).
- **Edit Mode Logic:**
  - If `editingBoardIndex === null`, show an `[Edit in Board Generator]` button on each card.
  - If a board is being edited, that card highlights and shows `[Save]` and `[Cancel]`. All other cards have their edit buttons disabled.
- **Testing Actions:** `[Play Board]` (force starts a game session for that specific config) and `[+ Add Art Block]` (inject dummy solid blocks for testing).

#### [NEW] `widgets/macro-loop-manager/index.ts`
Public API exporting `MacroLoopManagerWidget`.

---

### `entities/game-session`
Update the core engine to support the Macro Loop data requirements.

#### [MODIFY] `entities/game-session/model/gameSessionStore.ts`
- Add `phase1Score: number` to track points earned specifically during the speedrun phase.
- Ensure `isPhase1Over` explicitly freezes `phase1Score` and begins adding any new points to a `phase2Score`.

---

### `pages/game`
Wire the new widget and the natural player progression.

#### [MODIFY] `pages/game/ui/SidePanel.tsx`
- Add `macro-loop` tab to the header.
- Render `<MacroLoopManagerWidget />`.

#### [MODIFY] `pages/game/ui/GameHeader.tsx` (or similar top-level game UI)
- Render a **"Next Board"** button when Phase 2 is active or finished, or when the board is completely cleared before Phase 1 is over.
- When clicked, this button calls `macroLoopStore.advanceToNextBoard()`, passing in the current Phase 1 score and remaining grid tiles.

---

### `widgets/board-generator`
Remove the old V1 hack.

#### [MODIFY] `widgets/board-generator/model/useBoardGeneratorActions.ts`
- Remove the old `isMacroLoopMode` check and branch logic. The Board Generator should return to being a pure, dumb generator based strictly on its dropdowns.

## Verification Plan

### Automated Tests
- Run `vitest run` and `oxlint`.

### Manual Verification
- Open Dev Tools -> Macro Loop tab.
- Click `[Edit in Board Generator]` on Board 1. Verify you cannot edit Board 2.
- Switch to Board Generator tab, change the seed to "TEST_SEED", change size to "Medium".
- Switch back to Macro Loop tab, click `[Save]`. Verify Board 1 now shows "Medium" and "TEST_SEED".
- Click `[Play Board]` on Board 1. Wait for Phase 1 to end.
- Click the in-game "Next Board" button.
- Verify the Macro Loop timeline updates automatically, recording the Phase 1 score to the Risk Meter, saving any leftover tiles as blocks, and auto-loading Board 2.


## UI Reference Code

<details>
<summary>Click to view HTML prototype code</summary>

`html
<!DOCTYPE html>
<html>
<head>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-4 font-sans">
  
  <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col max-h-[500px]">
    
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-lg shadow-inner">
          ?뵦
        </div>
        <div>
          <h2 class="font-bold text-sm">Macro Loop (Set 1)</h2>
          <div class="text-[11px] text-[var(--muted-foreground)] flex items-center gap-2 mt-0.5">
            <span>Boards: 3 Risk + 1 Reward</span>
            <span class="border-l border-[var(--border)] pl-2">Total Risk Meter: <strong class="text-rose-500 dark:text-rose-400">450</strong></span>
          </div>
        </div>
      </div>
      <button class="px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition shadow-sm">
        + Add Board
      </button>
    </div>

    <!-- Timeline Container -->
    <div class="p-4 overflow-y-auto flex-1 space-y-5">

      <!-- Board 1 (History) -->
      <div class="relative pl-6 border-l-2 border-emerald-500/30 pb-2">
        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--card)] border-2 border-emerald-500 flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        </div>
        
        <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 opacity-75">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">Risk Board 1</span>
              <span class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-bold">Played</span>
            </div>
            <!-- Disabled Play because another board is being edited -->
            <button class="text-[10px] px-3 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed shadow-sm font-semibold">??Play</button>
          </div>
          
          <div class="flex items-center justify-between mb-3">
            <div class="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1.5 font-mono">
              <span class="bg-[var(--background)] border border-[var(--border)] px-1 rounded">Size: Small</span>
              <span class="bg-[var(--background)] border border-[var(--border)] px-1 rounded">Diff: Easy</span>
              <span class="bg-[var(--background)] border border-[var(--border)] px-1 rounded">Seed: A1B2</span>
            </div>
            <!-- Disabled Edit on the same row as info -->
            <button class="text-[10px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed flex items-center gap-1">
              ?륅툘 Edit
            </button>
          </div>
          
          <div class="mt-2 text-[10px] bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1.5 flex items-center justify-between shadow-inner">
            <span class="text-[var(--muted-foreground)] font-semibold">Result:</span>
            <div class="flex items-center gap-2">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">+450 RM</span>
              <span class="text-[var(--border)]">|</span>
              <span class="font-bold text-amber-500">3 Blocks</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Board 2 (Active & EDITING STATE) -->
      <div class="relative pl-6 border-l-2 border-[var(--border)] pb-2">
        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--card)] border-2 border-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
        
        <div class="bg-sky-500/5 border-2 border-sky-500/50 rounded-lg p-3 shadow-md ring-2 ring-sky-500/20">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-[var(--foreground)]">Risk Board 2</span>
              <span class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-400 font-bold animate-pulse">Editing</span>
            </div>
            <!-- Disabled Play because we are currently editing -->
            <button class="text-[10px] px-3 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed shadow-sm font-semibold">??Play</button>
          </div>

          <!-- Default info remains visible while editing -->
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-sky-500/20">
            <div class="text-[10px] text-[var(--foreground)] flex items-center gap-1.5 font-mono">
              <span class="bg-[var(--background)] border border-sky-500/30 px-1 rounded">Size: Medium</span>
              <span class="bg-[var(--background)] border border-sky-500/30 px-1 rounded">Diff: Medium</span>
              <span class="bg-[var(--background)] border border-sky-500/30 px-1 rounded">Seed: RAND</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-[10px] text-sky-600 dark:text-sky-400 font-semibold animate-pulse">
              ?숋툘 Modify in Generator Tab...
            </span>
            <div class="flex gap-2">
              <button class="text-[10px] px-3 py-1 rounded border border-sky-500/40 text-sky-700 dark:text-sky-300 font-semibold hover:bg-sky-500/10 transition shadow-sm">Cancel</button>
              <button class="text-[10px] px-3 py-1 rounded bg-sky-500 text-white font-bold hover:bg-sky-600 transition shadow-sm border border-sky-600">Save New Config</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Board 3 (Reward) -->
      <div class="relative pl-6">
        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--card)] border-2 border-[var(--muted-foreground)]"></div>
        
        <div class="bg-[var(--background)] border border-[var(--border)] border-dashed rounded-lg p-3 opacity-60">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-purple-600 dark:text-purple-400">Reward Board</span>
              <span class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] font-bold">Locked</span>
            </div>
            <!-- Disabled Play -->
            <button class="text-[10px] px-3 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed shadow-sm font-semibold">??Play</button>
          </div>

          <div class="flex items-center justify-between mb-3">
            <div class="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1.5 font-mono">
              <span class="bg-[var(--card)] border border-[var(--border)] px-1 rounded">Size: Massive</span>
              <span class="bg-[var(--card)] border border-[var(--border)] px-1 rounded">Diff: Hard</span>
              <span class="bg-[var(--card)] border border-[var(--border)] px-1 rounded">Seed: RAND</span>
            </div>
            <!-- Disabled Edit on the same row -->
            <button class="text-[10px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed flex items-center gap-1">
              ?륅툘 Edit
            </button>
          </div>

          <div class="mt-2 text-[10px] bg-[var(--card)] border border-[var(--border)] rounded px-2 py-1.5 flex items-center justify-between opacity-75 shadow-inner">
            <span class="text-[var(--muted-foreground)] font-semibold">Incoming Solid Blocks:</span>
            <span class="font-bold text-[var(--foreground)]">3 from previous boards</span>
          </div>

        </div>
      </div>

    </div>
  </div>
</body>
</html>

``n
</details>

