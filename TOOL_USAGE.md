# AI-Assisted Development Tool Usage

This document records how agentic AI coding tools were employed to design, implement, test, and document the **Celebration & Event Planner** application, including tool allocations, human-in-the-loop review criteria, and specific corrections made during the development cycle.

---

## 1. Tools Employed and Task Allocations

| Tool / Subagent | Purpose & Assigned Tasks |
|---|---|
| **Antigravity CLI Agent (Main Orchestrator)** | End-to-end full-stack planning, domain engine implementation, API route construction, React 19 UI development, accessibility enforcement, and test execution. |
| **`run_command` Terminal Tool** | Managing dependencies (`npm install`), database migrations (`npx prisma db push`), running test suites (`vitest`), checking types (`tsc --noEmit`), linting (`next lint`), and generating production Next.js builds. |
| **`write_to_file` & `replace_file_content`** | Writing pure TypeScript domain algorithms, Prisma schema definitions, Zod validation schemas, Tailwind CSS styles, and Next.js App Router client/server components. |
| **Vitest Test Runner** | Automated execution of 41 unit, integration, and snapshot tests validating pure domain math, capacity constraints, prompt injection defenses, and rate limiting. |

---

## 2. Human Review & Engineering Corrections

During the automated build and verification process, several edge cases and compiler constraints were detected, reviewed, and corrected:

### 1. Floating-Point Arithmetic Drift in Allocation Sums
- **Detection**: Vitest detected an assertion failure in `tests/domain/intake.test.ts` where a summed category allocation equaled `39999.99999999999` instead of `40000` due to JavaScript IEEE-754 floating-point representation.
- **Engineering Correction**: Implemented deterministic round-to-cent logic `Math.round(val * 100) / 100` in `computeBudgetSummary` and added a final cent-level balancing pass to reconcile penny discrepancies into the highest non-overridden category.

### 2. Next.js 15 Build Worker CSS Type Resolution
- **Detection**: `next build` failed with `Cannot find module or type declarations for side-effect import of './globals.css'`.
- **Engineering Correction**: Next.js automatically rewrites `next-env.d.ts` during build cycles, causing inline module declarations to be erased. Created a separate `declarations.d.ts` declaring `declare module "*.css";` and explicitly registered it in `tsconfig.json`'s `include` array.

### 3. Zod `z.enum` Typing with Readonly Tuple Constants
- **Detection**: `tsc --noEmit` flagged type incompatibility when passing `CATEGORY_KEYS as [string, ...string[]]`.
- **Engineering Correction**: Replaced the mutable tuple cast with native `z.enum(CATEGORY_KEYS)` which supports `readonly` string arrays in Zod v3.

### 4. Mathematical Validation Gateway
- **Detection**: Ensuring the non-negotiable rule *"All arithmetic that affects money, capacity, or dates MUST be computed in pure TypeScript functions. The LLM must never be the source of truth for a number."*
- **Engineering Correction**: Created `lib/ai/validator.ts` which inspects both narrative outputs and vendor drafts. If a model mentions a budget or fee that contradicts or exceeds the computed domain facts, the gateway automatically sanitizes or overrides the number with ground truth.

---

## 3. Autonomous Execution & Verification Log

The entire application was built autonomously in strict order:
1. Pure domain logic and unit tests first (`lib/domain/*`, `tests/domain/*`).
2. AI abstraction, prompts, and schema validation (`lib/ai/*`, `tests/ai/*`).
3. Database persistence with Prisma and seed data (`lib/data/*`, `prisma/*`).
4. API routes with rate-limiting and prompt-injection defenses (`app/api/*`, `tests/api/*`).
5. Accessible Next.js App Router UI (`components/*`, `app/*`).
6. Comprehensive verification via:
   - `npm run typecheck` (0 errors)
   - `npm run lint` (0 warnings, 0 errors)
   - `npm test` (41 passing tests across 11 test suites)
   - `npm run build` (successful production compilation of 9 routes)
