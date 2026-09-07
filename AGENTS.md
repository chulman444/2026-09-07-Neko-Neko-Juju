# Agent Guidelines (`AGENTS.md`)

## 1. Project Overview & Tech Stack
- **Framework & Build**: React 19 + TypeScript + Vite
- **Architecture**: Feature-Sliced Design (FSD) (detailed reference in [`llms-full.txt`](./llms-full.txt))
- **Environment**: Windows (PowerShell)

---

## 2. Common Commands & Environment Notes
- **Dev Server**: `npm run dev` (or `npm.cmd run dev`)
- **Build & Typecheck**: `npm run build` (runs `tsc -b && vite build`)
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

---

## 4. Code Style & TypeScript Standards
- **TypeScript**: Strict type checking. Avoid `any` or `unknown` casts unless strictly necessary.
- **Exports**: Prefer explicit named exports (`export const MyComponent = ...`) to facilitate refactoring and tree-shaking.
- **File Naming**:
  - Components: PascalCase (e.g., `UserCard.tsx`)
  - Utilities / Hooks / Models: camelCase (e.g., `useAuth.ts`, `formatDate.ts`)
  - Public API entry: `index.ts`
- **Component Design**: Keep components small, declarative, and focused. Separate domain logic (`model/`) from rendering (`ui/`).

---

## 5. Verification & Definition of Done
Before completing any task:
1. Verify TypeScript compiles and builds cleanly: `npm.cmd run build`.
2. Check for lint or type errors and resolve them immediately.
3. Ensure no FSD layer boundary violations or deep slice imports are introduced.