# Task Tracker

A full-stack weekly habit and task tracker with nested subtasks, visual streaks, strict completion locks, and GitHub-style heatmaps.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/task-tracker run dev` — run the React frontend (port from $PORT env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

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
  - `components/Navigation.tsx` — sidebar (desktop) + bottom nav (mobile)
  - `lib/utils.ts` — `formatDate`, `getWeekDates`, `buildTaskTree`, `calculateStreak`
  - `types/index.ts` — shared TypeScript interfaces
- `artifacts/api-server/src/` — Express API
  - `routes/auth.ts` — login, signup (with FTUX seeding), logout, /me
  - `routes/tasks.ts` — CRUD + reorder (recursive delete)
  - `routes/progress.ts` — toggle task completion (date-locked)
  - `routes/preferences.ts` — update theme/workweek
  - `routes/analytics.ts` — heatmap, streaks, weekly data, insights
  - `lib/auth.ts` — bcrypt + JWT helpers
- `lib/db/src/schema/` — Drizzle schema: users, preferences, tasks, progress_logs

## Architecture decisions

- **Strict date lock**: Progress can only be toggled for today's date; past days are immutable to ensure honest streaks
- **httpOnly cookie sessions**: JWT stored in `session` cookie, never accessible to JS, with `credentials: "include"` on all fetch calls
- **Optimistic UI**: Task checkbox toggles update local state immediately, then roll back on server error
- **Recursive subtasks**: Tasks have a `parentId` self-reference; the `buildTaskTree` utility handles nesting + ordering
- **FTUX seeding**: On signup, 4 default tasks + 1 nested task with sample progress are created so the app feels alive immediately

## Product

- Weekly grid tracker: view Mon–Sun with actual calendar dates
- Check/uncheck tasks per day (today only — past is locked)
- Nested subtasks with collapse/expand and drag-to-reorder
- Dashboard with heatmap (16 weeks), streak counter, bar chart, priority breakdown
- Dark/light theme toggle persisted to DB
- CSV export of weekly progress

## Gotchas

- `zod` must be installed directly in `lib/db` (not just via catalog) — drizzle-kit can't resolve catalog references
- Vite proxy (`/api` → port 8080) in `vite.config.ts` is what connects the frontend to the API in dev
- All fetch calls in the frontend must include `credentials: "include"` for cookies to be sent
