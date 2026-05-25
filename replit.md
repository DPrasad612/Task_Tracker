# Task Tracker

A full-stack habit and task tracker with date-based task lifecycles, nested subtasks, visual streaks, completion locks, and GitHub-style heatmaps.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/task-tracker run dev` — run the React frontend (port from $PORT env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` (Postgres), `JWT_SECRET` (secret for JWT signing — set as a Replit Secret)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + wouter (routing) + framer-motion
- API: Express 5 (port 8080), JWT auth via httpOnly cookies
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Vite proxy: `/api` → `http://localhost:8080`

## Where things live

- `artifacts/task-tracker/src/` — React frontend
  - `context/AuthContext.tsx` — auth state + session management
  - `pages/` — LandingPage, LoginPage, SignupPage, TrackerPage, DashboardPage
  - `components/Navigation.tsx` — sidebar (desktop) + bottom nav (mobile) + logout modal
  - `lib/utils.ts` — `formatDate`, `getWeekDates`, `buildTaskTree`, `calculateStreak`
  - `types/index.ts` — shared TypeScript interfaces (Task, TaskWithDetails, ProgressLog, User)
- `artifacts/api-server/src/` — Express API
  - `routes/auth.ts` — login, signup (no FTUX seeding), logout, /me
  - `routes/tasks.ts` — CRUD + reorder + seed + delete-all + delete-sample
  - `routes/progress.ts` — toggle task completion (date-locked)
  - `routes/preferences.ts` — update theme/workweek
  - `routes/analytics.ts` — heatmap, streaks, weekly data, insights
  - `lib/auth.ts` — bcrypt + JWT helpers (fails fast if JWT_SECRET missing)
- `lib/db/src/schema/` — Drizzle schema: users, preferences, tasks, progress_logs

## Task Lifecycle System

Tasks now have a full date-based lifecycle:
- `startDate` (text YYYY-MM-DD, optional): task becomes active on this date
- `endDate` (text YYYY-MM-DD, optional): task expires after this date
- `scheduledTime` (text HH:MM 24h, optional): displayed under task title in tracker
- `scheduledNote` (text, optional): short reminder shown alongside scheduled time

### Lifecycle States
- **Active**: `startDate <= today` (or no startDate) → appears in main tracker grid
- **Upcoming**: `startDate > today` → appears in "Upcoming Tasks" card section below tracker
- **Expired**: `endDate < today` → remains visible in tracker but read-only, faded

### Cell Rendering Rules
- Before `startDate`: empty cell (no circle, no lock icon)
- After `endDate`: faded dashed circle (disabled, read-only)
- Within range: normal today/past/future logic

### Auto-Transition
- A 60-second interval updates `currentLocalDateStr`; reactive filtering automatically moves upcoming tasks into the active tracker at midnight with no user action required

## Architecture Decisions

- **Strict date lock**: Progress can only be toggled for today's date; past days are immutable
- **httpOnly cookie sessions**: JWT stored in `session` cookie, never accessible to JS
- **Optimistic UI**: Task checkbox toggles update local state immediately, then roll back on error
- **Recursive subtasks**: Tasks have a `parentId` self-reference; `buildTaskTree` handles nesting + ordering
- **Subtask inheritance**: Subtasks inherit parent's startDate/endDate for cell rendering (passed down via renderTaskRows params)
- **No FTUX seeding**: New users start with zero tasks — clean onboarding with empty state
- **isSample flag**: Sample tasks seeded via "Load Sample Tasks" are marked `isSample=true`

## Product

- Landing page: clean hero, no template/inspiration references
- Weekly grid tracker: view Mon–Sun with actual calendar dates
- Task lifecycle: startDate, endDate, scheduledTime with AM/PM display, reminder note
- Upcoming Tasks section: card grid below tracker showing future tasks with countdown
- Check/uncheck tasks per day (today only — past is locked)
- Nested subtasks with collapse/expand and drag-to-reorder
- Empty state with "Create your first task" + "Load Sample Tasks" buttons
- Sample tasks show "sample" badge; "Clear Samples" button removes them
- "Delete All" button with confirmation modal + loading state guard
- Dashboard with heatmap (16 weeks), streak counter, bar chart, priority breakdown
- Dark/light theme toggle persisted to DB
- CSV export of weekly progress
- Logout confirmation modal (desktop sidebar + mobile bottom nav)
- Inline field validation on signup (email regex, 8-char password) + login
- Password show/hide toggle on login and signup

## Gotchas

- `zod` must be installed directly in `lib/db` (not just via catalog) — drizzle-kit can't resolve catalog references
- Vite proxy (`/api` → port 8080) in `vite.config.ts` connects frontend to API in dev
- All fetch calls must include `credentials: "include"` for cookies to be sent
- `JWT_SECRET` must be set as a Replit Secret (not an env var) — server throws on startup if missing
- drizzle-zod has a pre-existing TypeScript version compatibility warning in `lib/db` schema files (cosmetic, does not affect runtime)
- Route ordering in tasks.ts matters: `/tasks/all`, `/tasks/sample`, `/tasks/reorder`, `/tasks/seed` must come BEFORE `/tasks/:id`
- Tasks fetched via `GET /api/tasks?startDate=&endDate=` — date range filters only progress_logs, not tasks themselves (all tasks always returned)
