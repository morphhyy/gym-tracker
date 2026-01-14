---
name: GymPlanApp
overview: Build a responsive Next.js + TypeScript app with Clerk auth and Convex storage that lets users create a weekly workout schedule (exercises with sets/reps) and track session weights over time with charts and lightweight coaching feedback.
todos:
  - id: frontend-shell
    content: Create authenticated app shell with navigation and responsive layout; wire Clerk UI components for sign in/up and route protection.
    status: completed
  - id: frontend-plan-editor
    content: Implement weekly plan editor UI (days → exercises → sets/reps) with save/load via Convex hooks.
    status: completed
    dependencies:
      - frontend-shell
  - id: frontend-logger
    content: Implement workout logging UI for today's plan day, including per-set weight entry and session completion flow.
    status: completed
    dependencies:
      - frontend-plan-editor
  - id: frontend-progress
    content: Implement progress dashboard with charts (top set, volume, e1RM) and exercise detail pages.
    status: completed
    dependencies:
      - frontend-logger
  - id: backend-authz
    content: Integrate Clerk identity with Convex; enforce user-scoped authorization in all queries/mutations.
    status: completed
  - id: backend-schema
    content: Define Convex schema for users, exercises, plans, sessions, sessionSets; add indexes for common queries.
    status: completed
    dependencies:
      - backend-authz
  - id: backend-functions
    content: Implement Convex queries/mutations for plan CRUD, logging, and progress retrieval.
    status: completed
    dependencies:
      - backend-schema
  - id: backend-feedback
    content: Add rules-based suggestion generation (progression, deload, volume spike) and expose via progress endpoints.
    status: completed
    dependencies:
      - backend-functions
  - id: testing
    content: Add unit tests for metrics + Playwright E2E for plan→log→progress flow; validate responsive layouts.
    status: completed
    dependencies:
      - frontend-progress
      - backend-feedback
  - id: docs-deploy
    content: Write setup + user docs and document deployment steps for Vercel + Convex + Clerk with env separation.
    status: completed
    dependencies:
      - testing
---

# Gym plan + progress tracker (Next.js + Clerk + Convex)

## Assumptions (based on your answers)

- **Workout granularity**: Users plan workouts as **per-day exercises with sets × reps**, and log **weight per set** (optionally also RPE later).
- **Repo structure**: **Single Next.js repo** where Convex functions in `convex/` serve as the backend.

## Frontend plan (Next.js + TypeScript)

### UX / IA (app structure)

- **Public**
- Landing page: value prop, screenshots, sign in/up CTA.
- **Authenticated app (dashboard shell)**
- `Plan`: build/edit weekly plan (Mon–Sun) with exercises + sets/reps
- `Log`: log today’s workout (pre-filled from plan)
- `Progress`: charts + trends per exercise and weekly summaries
- `Profile`: goals, units (kg/lb), preferred split, export/delete data

### Core screens

- **Workout Plan Generator**
- Weekly calendar layout (tabs or accordion per day)
- Add exercise from searchable list (seeded catalog + custom)
- For each exercise: define set scheme (e.g., 3×8, 5×5) and optional notes
- Save plan; support versioning (keep last N plans) so progress remains coherent
- **Workout Logger**
- “Today” view with day’s exercises and sets from the plan
- For each set: input weight; auto-copy last logged weight as a starting point
- Mark complete; persist session and compute derived metrics
- **Progress Dashboard**
- Exercise detail page: time-series chart for top set, volume, or estimated 1RM
- Weekly summary: total volume by muscle group (optional) and adherence
- Filtering: date range, plan version, exercise variation

### Charts / visualization

- Use a client-side chart lib (e.g. **Recharts**) with responsive containers.
- Provide 2–3 default metrics per exercise:
- **Top set weight** over time
- **Total volume** per session (sum weight × reps)
- **Estimated 1RM** (Epley) from best set: \(e1RM = w \times (1 + reps/30)\)

### UI system & responsiveness

- Use a consistent component library approach:
- If you want: **shadcn/ui + Tailwind** patterns for fast, polished UI.
- Mobile-first layouts:
- Calendar becomes day tabs; logging becomes stacked cards; charts use simplified legends.
- Accessibility basics:
- Proper labels, keyboard navigation, focus states, sufficient contrast.

### Frontend data flow

- Auth: Clerk provides user session; only authenticated users can access app routes.
- Data access: use Convex React hooks to query/mutate (optimistic UI for logging).

### Key frontend files (expected)

- Next app router pages under `app/`:
- `app/(public)/page.tsx`
- `app/(app)/layout.tsx` (authenticated shell)
- `app/(app)/plan/page.tsx`
- `app/(app)/log/page.tsx`
- `app/(app)/progress/page.tsx`
- `app/(app)/progress/[exerciseId]/page.tsx`
- `app/(app)/profile/page.tsx`
- Shared UI/components:
- `app/components/*` (plan editor, set table, chart cards, etc.)
- Styling:
- `app/globals.css`

## Backend plan (Clerk + Convex)

### Authentication & authorization

- **Clerk** handles sign-up/sign-in, session cookies, user identity.
- **Convex** uses Clerk identity to authorize queries/mutations:
- Every write scoped to `userId`
- Queries require auth; no cross-user reads

### Data model (Convex tables)

- `users`
- `clerkUserId`, display name, units, goals
- `exercises`
- global seeded catalog + per-user custom exercises
- fields: name, muscleGroup (optional), equipment (optional)
- `plans`
- `userId`, `name`, `active`, `createdAt`, `planVersion`
- `planDays`
- `planId`, `weekday` (0–6), ordered list of `planExercises`
- `planExercises`
- `planDayId`, `exerciseId`, `order`, `sets` [{repsTarget, notes?}]
- `sessions`
- `userId`, `date`, `planId?`, `weekday?`, `completedAt`
- `sessionSets`
- `sessionId`, `exerciseId`, `setIndex`, `repsActual`, `weight`, `createdAt`
- (optional later) `insights`
- cached suggestions per exercise/week

### Backend API shape (Convex functions)

- **Queries**
- `getActivePlan()`
- `getPlanById(planId)`
- `getTodayTemplate(date)` (resolve weekday → plan day → exercises)
- `getExerciseHistory(exerciseId, range)`
- `getWeeklySummary(range)`
- **Mutations**
- `upsertProfile(settings)`
- `createOrUpdatePlan(planPayload)`
- `setActivePlan(planId)`
- `startSession(date, planId?)`
- `logSet(sessionId, exerciseId, setIndex, repsActual, weight)`
- `completeSession(sessionId)`

### Feedback / coaching (MVP rules-based)

Provide lightweight, explainable suggestions (no LLM required):

- **Progression suggestion** (per exercise)
- If last 2 sessions hit all reps with stable form → suggest +2.5–5 lb (or +1–2.5 kg)
- If missed reps for 2 sessions → suggest -5–10% or reduce reps target
- **Adherence & volume**
- Warn if big volume spikes (>~20–30% week-over-week)
- Highlight consistent improvements (streaks)
- Compute suggestions in query-time initially; later cache in an `insights` table via scheduled jobs.

### Performance & scalability

- Keep queries **range-bounded** (date windows) and index by `userId + date`.
- Avoid heavy aggregation on every render; provide summarized endpoints.
- Consider denormalized “exerciseStatsByWeek” later if needed.

## Testing strategy (web + mobile responsiveness)

### Automated tests

- **Unit tests**: metrics helpers (volume, e1RM, trend detection)
- **Integration**: Convex functions (authorization, data integrity)
- **E2E** (Playwright):
- Sign up/in
- Create plan
- Log workout
- Verify charts render and data updates

### Manual test matrix

- Devices: iPhone-size, Android-size, iPad, desktop
- Browsers: Chrome, Safari, Firefox
- Edge cases: empty history, plan changes mid-week, exercise rename, timezone/day boundary

## Deployment plan

- **Frontend**: Vercel (Next.js optimized)
- **Convex**: Convex hosted deployment
- **Clerk**: Clerk hosted auth
- Environments: `dev` and `prod` with separate Clerk + Convex projects and env vars.

## Documentation plan

- Developer docs in `README.md`:
- local setup, env vars, running dev server, Convex + Clerk setup steps
- Architecture doc (short) in `docs/architecture.md`:
- data model, auth flow, key queries/mutations
- User guide in `docs/user-guide.md`:
- create plan, log workouts, read charts, interpret suggestions

## Open items (not blocking, but good to confirm soon)

- Units: kg/lb default and allowed precision
- Exercise catalog: seed list vs fully user-defined
- Logging: repsActual required or optional (some users only track weight)
