# Celebration & Event Planner (Northstar)

> **Deterministic math, generative language.**  
> A production-quality GenAI-powered planning assistant for weddings, birthdays, and community celebrations that makes event planning manageable under real-world constraints (budget, timeline, guest count, venue limits).

---

## 1. Problem Framing

Event planning software traditionally forces users to choose between two unsatisfactory extremes:
1. **Static spreadsheets** that calculate numbers accurately but fail to explain trade-offs, draft communications, or recommend creative alternatives when constraints conflict.
2. **Generic LLM chatbots** that offer polite advice but hallucinate arithmetic, generate unfeasible budgets without respecting unit costs, and silently breach venue fire capacities.

**Celebration & Event Planner** resolves this tension through a strict architectural division:
- **Pure TypeScript Domain Engine**: Every financial calculation (budget allocation, cost per head, remaining buffer, overrun detection, contingency reserve floors), capacity threshold, and backwards milestone due date is computed deterministically with zero floating-point drift.
- **Generative AI Layer**: The LLM receives immutable computed facts and focuses exclusively on high-touch narratives, trade-off explanations, prioritized alternatives, and personalized vendor correspondence.
- **Mathematical Validation Gateway**: Any numeric claim or budget ceiling mentioned by the model is validated and corrected against deterministic ground truth before being rendered.

---

## 2. Zero-Configuration Quickstart

The application runs **100% offline out-of-the-box** with zero external API dependencies or configuration required. If no `OPENAI_API_KEY` is detected, the built-in deterministic local rule-based planner is activated with an unobtrusive banner: *"Demo mode — rule-based planner active."*

### Installation & Run

```bash
# 1. Clone repository & install dependencies
git clone <repo-url>
cd Northstar
npm install

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will automatically seed a rich coastal wedding celebration ("Maya & Lucas: Modern Coastal Wedding") on first load.

### Optional OpenAI-Compatible LLM Configuration

To connect live OpenAI or OpenAI-compatible models (e.g. `gpt-4o-mini`, Ollama, vLLM):

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-..."
LLM_MODEL="gpt-4o-mini"
LLM_BASE_URL="https://api.openai.com/v1"
```

Restart the dev server: `npm run dev`.

---

## 3. Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                              Web UI (Next.js 15)                        |
|   - Adaptive Intake Wizard (3-6 steps)                                  |
|   - What-If Decision Simulator (Headcount +/-, Budget +/-, Date shifts) |
|   - Backwards Milestone Timeline (Checklist & Kanban views)             |
|   - Vendor Checklist & Personalized Negotiation Message Drafter         |
|   - PDF / Printable Plan Exporter                                       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        API Boundary & Security Gateway                  |
|   - Zod Payload Validation (Length caps, script pattern sanitization)  |
|   - Sliding-Window In-Memory Rate Limiting (per-IP)                     |
|   - Parameterized Queries (Prisma ORM on SQLite)                        |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                       Pure Domain Logic Layer                           |
|   - lib/domain/budget.ts    (Priority-weighted allocation, contingency) |
|   - lib/domain/capacity.ts  (Utilization rates, breach detection)       |
|   - lib/domain/simulator.ts (Deltas, absorption, ranked alternatives)  |
|   - lib/domain/timeline.ts  (UTC backwards countdown, phase grouping)  |
|   - lib/domain/intake.ts    (Adaptive interview state machine)          |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Generative AI & Decision-Support Layer                 |
|   - Prompt Injection Defense (<computed_facts>, <user_data> delimiters) |
|   - LLMProvider: OpenAIProvider vs DeterministicRuleBasedPlanner        |
|   - One-shot Repair Retry on schema mismatch                            |
|   - Math Verification: validateAndCorrectNarrativeOutput / VendorDraft  |
+-------------------------------------------------------------------------+
```

---

## 4. Key Flows & Features

### 1. Adaptive Event Intake
- **The Assistant asks before assuming:** Instead of assigning arbitrary budgets, the intake adapts dynamically based on prior responses.
- Step 1 gathers core celebration metrics (headcount, date, budget).
- Step 2 prompts for ranked priorities with full keyboard accessibility.
- Step 3 adaptively deep dives into the user's #1 stated priority (e.g., dining style for catering, setting for venue).
- Step 4 records venue constraints and fire code capacity limits.
- Step 5 sets the emergency contingency cushion tolerance.

### 2. Deterministic Budget Engine
- Allocates funds across 9 standardized categories (`venue`, `catering`, `photography`, `entertainment`, `decor`, `attire`, `invitations`, `favors`, `contingency`).
- Priority weighting boosts top-ranked categories while lower categories absorb adjustments.
- Enforces a non-negotiable **minimum 5% contingency reserve floor**.
- Tracks committed contract amounts, remaining category buffers, per-head costs, and highlights overruns.
- Supports manual dollar overrides per category with automatic rebalancing of non-overridden categories.

### 3. What-If Trade-Off Simulator (Core Differentiator)
- Interactive sliders and number inputs for guest count ($\pm$), budget ($\pm$), and priority reordering.
- Debounced (~300ms) recalculation with live screen reader announcements (`aria-live="polite"`).
- Real-time consequence report:
  - Exact headcount & catering cost per head scaling deltas.
  - Category absorption statements (which areas give up budget).
  - Broken constraint alerts (venue legal capacity exceeded, contingency drained below 5%).
  - 2 to 3 ranked feasible alternatives with explicit cost impacts and **required sacrifices**.
  - One-click "Apply What-If" action.

### 4. Backwards Milestone Timeline & Tasks
- UTC-based countdown schedule working backwards from the celebration date (12+ months out down to day-of run-of-show).
- Vendor lead-time awareness (e.g. venue booked 10 months out, invitations sent 75 days out, catering final headcount 14 days out).
- Toggle between Phased Checklist and 4-column Kanban board.
- Instant task status persistence (`todo`, `in_progress`, `blocked`, `done`).
- Overdue milestone badge detection relative to current date.

### 5. Vendor Management & Message Drafting
- Centralized tracking for quotes, deposits, outstanding balances, and contract statuses.
- **AI Vendor Drafter**: Generates inquiries, price negotiations, and timeline coordination drafts.
- Personalizes drafts with the client's guest count, event date, and **firm computed budget ceiling**.
- Fully editable preview with one-click clipboard copy.
- Explicit safety notice: drafts are for human review and never sent automatically.

### 6. Master Plan Export
- PDF/print-ready layout with responsive `@media print` styling.
- Executive financial summary, phased countdown schedule, and complete vendor directory.
- JSON data export for backup or custom processing.

---

## 5. Security & Prompt Injection Defenses

1. **Server-Side LLM Execution**: API keys exist strictly in `process.env` on the server. No secrets or tokens ever leak into client bundles.
2. **Explicit Delimiters**: User-provided text is wrapped in `<user_data>` XML delimiters with explicit system instructions to treat all enclosed text strictly as passive data.
3. **Boundary Validation**: Every API endpoint validates payloads with Zod, rejecting unknown attributes and capping text lengths to limit injection surfaces.
4. **Repair Retry & Graceful Fallback**: Malformed model outputs trigger a single repair prompt. If validation still fails, the system seamlessly falls back to the deterministic planner without throwing client crashes.
5. **Rate Limiting**: Sliding-window rate limiter prevents endpoint abuse (30 req/min for simulations, 20 req/min for drafts).
6. **Security Headers**: Production CSP, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), and strict referrer policy configured.

---

## 6. Accessibility (WCAG 2.2 AA)

- Semantic landmark markup (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- Visible focus rings (`focus-visible:ring-2 focus-visible:ring-brand-500`).
- Keyboard operability for sliders, modal dialogs (with focus traps and Escape key dismissal), and priority ranking.
- High color contrast ($\ge 4.5:1$) across all UI elements.
- Information never conveyed by color alone (status badges combine icons and text).
- `aria-live="polite"` announcements for asynchronous simulation changes.
- Respects `prefers-reduced-motion` settings.

---

## 7. Testing Suite

The application includes unit tests, integration tests, snapshot tests, and deterministic planner verification.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript type check
npm run typecheck

# Run ESLint
npm run lint

# Run production build
npm run build
```

---

## 8. Limitations & Future Work

- **Multi-Currency Conversion**: Default currency is USD; multi-currency exchange rate feeds can be integrated via external exchange APIs.
- **Direct Email Integration**: Vendor messages are intentionally designed as draft-only for human review and clipboard copy. OAuth-based direct email sending (SendGrid/Gmail API) could be added behind explicit confirmation prompts.
- **Multi-User Collaboration**: Current persistence supports single-event local SQLite storage. A multi-tenant Postgres schema with authentication can be added via the repository abstraction.
