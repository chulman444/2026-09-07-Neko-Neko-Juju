# Agent Guidelines (`AGENTS.md`)

## Interaction & Workflow Rules
- **No unsolicited edits**: Always diagnose, explain, or propose solutions first.
- **Strict Permission**: NEVER create, modify, or delete files, or execute modifying shell commands, without the user's explicit confirmation (e.g., "go ahead", "apply this fix").
- **Plan As Single Source of Truth**: When requirements or user feedback change the direction of a task, immediately rewrite and update `implementation_plan.md` in that exact same turn before asking for confirmation or proceeding to execution. Never leave an outdated plan in place while discussing changes in chat.

---

## 1. Project Overview & Tech Stack
- **Framework & Build**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (CSS-first configuration via `@theme` in the `app/` layer; do NOT create legacy `tailwind.config.ts` or `postcss.config.js`)
- **Architecture**: Feature-Sliced Design (FSD) (detailed reference in [`llms-full.txt`](./llms-full.txt))
- **Environment**: Windows (PowerShell)

---

## 2. Common Commands & Environment Notes
- **Dev Server**: `npm run dev` (or `npm.cmd run dev`)
- **Storybook**: `npm run storybook` (or `npm.cmd run storybook`)
- **Build App**: `npm run build` (runs `tsc -b && vite build`)
- **Build Storybook**: `npm run build-storybook`
- **Lint**: `npm run lint`
- **Windows Quirks**: Always use `npm.cmd` if running into PowerShell script execution policy (`PSSecurityException`) issues.

---

## 3. Architecture Rules: Feature-Sliced Design (FSD)
Follow FSD methodology strictly as detailed in [`llms-full.txt`](./llms-full.txt).

### 3.1 Layer Hierarchy (Strict Top-to-Bottom Dependency)
Code can only import from layers strictly below it. Never import upwards or horizontally across slices on the same layer:
1. `app/`: Application-wide setup, providers, routing, global styles.
2. `pages/`: Route/page-level composition views.
3. `widgets/`: Self-contained, full UI blocks combining features/entities (e.g., Header, Sidebar, Feed).
4. `features/`: User interactions and product use-cases (e.g., `auth-by-email`, `like-post`).
5. `entities/`: Business domain models and logic (e.g., `user`, `order`, `post`).
6. `shared/`: Reusable, domain-agnostic UI kits, libraries, helpers, configs, and API clients.

### 3.2 Slices & Segments
- Slices represent distinct business domains (e.g., `entities/user`, `features/add-to-cart`).
- Inside each slice, group files by standard segments:
  - `ui/`: UI components.
  - `model/`: State, stores, hooks, types, business logic.
  - `api/`: Requests, queries, endpoints.
  - `lib/`: Slice-internal helper functions.
  - `config/`: Slice-internal constants and configuration.
- **Flat Segments**: Segment folders (`ui/`, `model/`, `lib/`, etc.) must remain flat. Never create nested subfolders or internal `index.ts` files inside a segment.

### 3.3 Public API (`index.ts`)
- **Strict Boundary**: Every slice or shared segment must export its public interface via an `index.ts` at its root.
- **No Deep Imports**: External code must import strictly from the slice's public API:
  - *Correct*: `import { UserCard } from '@/entities/user'`
  - *Incorrect*: `import { UserCard } from '@/entities/user/ui/UserCard'`
- **No Cross-Slice Imports in Same Layer**: Slices in `features` cannot import from other `features`. Slices in `entities` cannot import from other `entities`. Composition must happen in a higher layer (`widgets`, `pages`, or `app`).

### 3.4 Avoid Premature Lower-Layer Decomposition
- **Keep code as high as practical first**: When introducing new functionality, keep it local to its immediate scope (`pages`, `widgets`, or `features`). Do not anticipate abstractions.
- **No premature `entities` or `shared`**: Do NOT extract components, state, or helpers into `entities/` or `shared/` until there is demonstrable domain justification or concrete reuse across multiple slices.
- **Colocation before extraction**: Colocate UI, state, and helper functions directly within the relevant feature or widget slice until repetition or distinct business domain boundaries naturally emerge (avoid "Excessive Entities" anti-pattern).

### 3.5 Refactoring & Component Extraction Triggers
- **Component → Widget Threshold**: If a component decomposes into its own business logic / state hook (`model/`), internal utilities (`lib/`), and multiple child components, it has outgrown being an inline page component. Promote it directly to a `widgets/<name>` slice (e.g., `widgets/solver-panel`, `widgets/dev-tuner`) rather than nesting pseudo-slices inside a page segment.
- **Single-Use Widgets are Legitimate**: Unlike `entities/` or `shared/`, a `widgets/` slice does NOT require multi-page reuse to be extracted; self-contained composite blocks delivering an entire use case or dev tool belong in `widgets/`.

---

## 4. Code Style & TypeScript Standards
- **TypeScript**: Strict type checking. Avoid `any` or `unknown` casts unless strictly necessary.
- **Exports**: Prefer explicit named exports (`export const MyComponent = ...`) to facilitate refactoring and tree-shaking.
- **File Naming**:
  - Components: PascalCase (e.g., `UserCard.tsx`)
  - Utilities / Hooks / Models: camelCase (e.g., `useAuth.ts`, `formatDate.ts`)
  - Public API entry: `index.ts`
- **Component Design**: Keep components small, declarative, and focused. Separate domain logic (`model/`) from rendering (`ui/`).
- **Orchestrator vs. Content Separation**: Container/orchestrator components (such as panels, modals, drawers, tabs) must only handle layout frames, open/closed state, and tab orchestration. Never inline domain controls, sliders, or forms directly into orchestrators. Keep tool contents in their own focused components and compose them cleanly within the orchestrator.

---

## 5. Storybook & Testing Guidelines (FSD)

### 5.1 Strict Colocation & Public API
- **Colocate stories and tests beside components**: Every story (`*.stories.tsx`) and unit test (`*.test.tsx`) must reside directly beside the code it tests within the slice segment (e.g. `ui/` or `model/`).
- **Never create centralized test or story dumps**: Do NOT create `src/stories/` or root `tests/` folders for component or unit tests.
- **Never export stories or tests from `index.ts`**: The public API (`index.ts`) is strictly for runtime production code. Stories and tests must never be re-exported.

### 5.2 Naming & Title Hierarchy
- **File Naming**: `<ComponentName>.stories.tsx` (e.g., `GameBoardCanvas.stories.tsx`).
- **Sidebar Title**: Always mirror the FSD layer and slice hierarchy in the `title` field:
  - `Pages/<PageName>/<ComponentName>`
  - `Widgets/<WidgetName>/<ComponentName>`
  - `Features/<FeatureName>/<ComponentName>`
  - `Entities/<EntityName>/<ComponentName>`
  - `Shared/<ComponentName>`

### 5.3 Modern CSF 3 & Interaction Standards
- **CSF 3 Syntax**: Use Component Story Format 3 (`satisfies Meta<typeof Component>`, `type Story = StoryObj<typeof meta>`). Never use legacy CSF 2 templates (`.bind({})`).
- **Mock Actions**: Use `fn()` from `@storybook/test` for event handler props (`onClick`, `onTileMatch`, `onTimeUp`) so interactions log in Storybook's Actions panel.
- **Strict Layering for Mock Data**: Stories must respect FSD import boundaries. A story in `shared/` must never import mock data from `entities/`. Mock data must be defined within the slice or its immediate test scope.
- **Use Decorators for Providers**: If a component requires providers (e.g., routing, themes, or stores), configure them via Storybook `decorators` rather than wrapping within `render`.

---

## 6. Verification & Definition of Done
Before completing any task:
1. Verify TypeScript compiles and builds cleanly: `npm.cmd run build`.
2. Check for lint or type errors and resolve them immediately: `npm.cmd run lint`.
3. If story files or Storybook configs were modified, verify Storybook builds cleanly: `npm.cmd run build-storybook`.
4. Ensure no FSD layer boundary violations or deep slice imports are introduced.