# School Function Judging & Live Score Management System

A web application for running school arts festivals and cultural competitions:
administrators manage students, programs and judges; judges score from any device; the
audience watches results and house leaderboards update **live**, with no page refresh.

It replaces the paper process — score sheets, manual averaging, a whiteboard tally —
with a single loop:

> A judge submits a score → averages, ranks and house points recalculate automatically →
> every screen in the hall updates in real time.

---

## Table of contents

- [Project status](#project-status)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Documentation map](#documentation-map)
- [Architecture in one page](#architecture-in-one-page)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing rules](#contributing-rules)

---

## Project status

This project is built in verified phases. Each phase is confirmed working before the
next begins.

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 0 | Planning, decision log, root documentation | ✅ Complete |
| 1 | Next.js 16 scaffold, Tailwind v4, shadcn/ui, folder skeleton | ✅ Complete |
| 2 | Git repository, `.gitignore`, environment file structure | ✅ Complete |
| 3 | Supabase project creation and dashboard walkthrough | ✅ Complete |
| 4 | Supabase ↔ Next.js connection (browser / server / middleware clients) | ✅ Complete |
| 5 | Database schema, migrations, indexes, constraints | ✅ Complete |
| 6 | Authentication (login, logout, sessions, protected routes) | ✅ Complete |
| 7 | Role-based access control + Row Level Security policies | ✅ Complete |
| 8 | Admin panel — dashboard, groups, students, programs | ✅ Complete |
| 9 | Supabase Storage — student and group photos | ✅ Complete |
| 10 | Student assignment (category-matched) | ⬜ Not started |
| 11 | Judge management and assignment | ⬜ Not started |
| 12 | Judge scoring interface | ⬜ Not started |
| 13 | Result calculation engine | ⬜ Not started |
| 14 | Main group leaderboard | ⬜ Not started |
| 15 | Supabase Realtime subscriptions | ⬜ Not started |
| 16 | Public audience dashboard (TV / projector / mobile) | ⬜ Not started |
| 17 | UI states, animation, responsive polish | ⬜ Not started |
| 18 | Testing | ⬜ Not started |
| 19 | Vercel deployment | ⬜ Not started |

Sections below marked **(from Phase N)** describe commands that do not exist yet.

---

## Tech stack

| Layer | Technology | Why |
| ----- | ---------- | --- |
| Framework | Next.js 16 (App Router) | Server Components remove the client fetch waterfall; Server Actions remove the need for a separate API server |
| UI | React 19, Tailwind CSS v4, shadcn/ui | Copy-in components we own and can modify — no black-box component library |
| Language | TypeScript (strict) | `any` is banned project-wide; database types are generated, not hand-written |
| Database | Supabase PostgreSQL | Relational data with real foreign keys, plus Row Level Security as the final authorization gate |
| Auth | Supabase Auth | JWT sessions in httpOnly cookies, integrated directly with RLS |
| Storage | Supabase Storage | Student and group photos. Files are never stored in the database — only URLs |
| Realtime | Supabase Realtime | Postgres WAL changes pushed over WebSocket. RLS applies, so anonymous viewers receive only public rows |
| Forms | React Hook Form + Zod | One schema validates on both client and server |
| Hosting | Vercel | Git-push deploys, edge middleware, first-class Next.js support |

**Deliberately deferred:** TanStack Query and Zustand are in the project stack but are not
installed until Phase 15. Server Components cover every data need through Phase 14, and
installing a client cache early invites duplicating server state — which the project rules
forbid. See [`docs/decisions.md`](docs/decisions.md).

---

## Prerequisites

| Tool | Minimum | Notes |
| ---- | ------- | ----- |
| Node.js | 20.9+ | Developed on 24.16 |
| pnpm | 9+ | npm also works — keep one lockfile, don't mix |
| Git | 2.30+ | |
| Supabase account | — | Free tier is sufficient |
| Supabase CLI | — | Installed as a devDependency; run via `pnpm supabase` |
| Docker | optional | Only needed for local Supabase (`npx supabase start`) |

---

## Getting started

The steps below are all functional as of Phase 5 — Supabase is connected and the schema
is live.

```bash
# 1. Install dependencies
pnpm install

# 2. Create your local environment file
cp .env.example .env.local

# 3. Fill in .env.local with values from your Supabase dashboard
#    (Project Settings → API)

# 4. Apply database migrations
pnpm db:push

# 5. Generate TypeScript types from the live schema
pnpm db:types

# 6. Start the dev server
pnpm dev
```

Open <http://localhost:3000>.

---

## Environment variables

Copy `.env.example` to `.env.local`. **`.env.local` is git-ignored and must never be
committed.**

| Variable | Exposure | Purpose |
| -------- | -------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | 🌐 **Public** | Your project's API URL. Ships in the browser bundle. Safe — it is a public endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🌐 **Public** | The anonymous/publishable key. Ships in the browser bundle. Safe **only because Row Level Security is enabled on every table** — the key grants no data access on its own. |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 **SECRET** | **Bypasses Row Level Security completely.** Server-only. Never prefix with `NEXT_PUBLIC_`, never import into a Client Component, never log it. |

### The rule that matters

Any variable prefixed `NEXT_PUBLIC_` is **inlined into JavaScript sent to every visitor**,
including the anonymous audience. Treat it as published to the world.

`SUPABASE_SERVICE_ROLE_KEY` is a master key. Leaking it means total read/write access to
every table regardless of policy. In this project it is used in **exactly one file** — the
route handler that creates judge accounts through the Supabase Admin API — and nowhere else.

> **Note on newer Supabase projects:** projects created recently may show
> `sb_publishable_...` and `sb_secret_...` keys instead of the legacy `anon` /
> `service_role` JWTs. They map one-to-one: publishable → `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
> secret → `SUPABASE_SERVICE_ROLE_KEY`. The exposure rules above are identical.

---

## Project structure

Every folder below contains a `README.md` explaining its purpose and its rules.

```
src/
├── app/                    Routes only — thin, delegating to features
│   ├── (auth)/login/       Route group: no shared shell, no sidebar
│   ├── admin/              Admin-only. Guarded by middleware + server check + RLS
│   ├── judge/              Judge-only. Sees assigned programs exclusively
│   ├── audience/           PUBLIC. No authentication. Optimised for TV/projector
│   └── api/                Route handlers (privileged operations only)
│
├── components/             Shared, feature-agnostic UI
│   ├── ui/                 shadcn/ui primitives (button, dialog, table…)
│   ├── forms/              Reusable form controls and field wrappers
│   ├── tables/             Data table shell, pagination, empty/loading states
│   └── dashboard/          Stat cards, section headers, page shells
│
├── features/               Feature modules — each owns its own slice
│   ├── auth/               components/ hooks/ types/ validation/
│   ├── students/
│   ├── programs/
│   ├── judges/
│   ├── groups/
│   └── leaderboard/
│
├── hooks/                  Cross-feature React hooks only
│
├── lib/
│   ├── supabase/           Data access layer
│   │   ├── client.ts       Browser client — Client Components
│   │   ├── server.ts       Server client — Server Components & Actions
│   │   └── middleware.ts   Session refresh for middleware.ts
│   ├── services/           ⭐ BUSINESS LOGIC LIVES HERE, AND ONLY HERE
│   │   ├── auth.service.ts
│   │   ├── group.service.ts
│   │   ├── student.service.ts
│   │   ├── program.service.ts
│   │   ├── judge.service.ts
│   │   ├── scoring.service.ts      averaging + ranking (pure functions)
│   │   ├── result.service.ts
│   │   └── leaderboard.service.ts
│   ├── validations/        Zod schemas — shared by client and server
│   └── utils/              Pure, dependency-free helpers
│
├── types/
│   ├── database.types.ts   GENERATED — never edit by hand
│   └── …                   Domain types built on top of the generated ones
│
├── constants/              Points table, categories, stage types, statuses
│
└── middleware.ts           Session refresh + role-based routing
```

### Why this shape

- **`app/` stays thin.** Routes compose features; they do not contain logic. This keeps
  pages readable and makes features movable.
- **`features/` over type-based folders.** Everything about students lives in one place,
  so a change to students touches one directory instead of six.
- **`lib/services/` is the single home for business rules.** Score averaging, ranking and
  points conversion exist here as pure functions — importable by Server Actions, testable
  without a browser or a database.
- **`components/` holds only what two or more features share.** Feature-specific
  components belong to their feature.

---

## Documentation map

`/docs` is the **single source of truth**. Read the relevant document before implementing
any feature.

| Document | Read it for |
| -------- | ----------- |
| [`project.md`](docs/project.md) | Scope, user roles, modules, functional requirements, success criteria |
| [`architecture.md`](docs/architecture.md) | Layered architecture, database tables, auth, realtime, security, scalability |
| [`agents.md`](docs/agents.md) | Coding standards, naming, folder conventions, definition of done |
| [`decisions.md`](docs/decisions.md) | **Decisions that override the documents above** — read alongside them |
| [`high-level-architecture.md`](docs/high-level-architecture.md) | System diagram: users → Next.js → Supabase |
| [`frontend-architecture.md`](docs/frontend-architecture.md) | Route tree |
| [`project-structure.md`](docs/project-structure.md) | Folder layout |
| [`database-architecture.md`](docs/database-architecture.md) | Entity relationships |
| [`business-layer.md`](docs/business-layer.md) | Service files and the scoring pipeline |
| [`authenticflow.md`](docs/authenticflow.md) | Login → JWT → middleware → role redirect |
| [`security-architecture.md`](docs/security-architecture.md) | Permission matrix per role |
| [`real-time-architecture.md`](docs/real-time-architecture.md) | Realtime propagation |
| [`score-submission.md`](docs/score-submission.md) | Score submission end to end |
| [`deployment-architecture.md`](docs/deployment-architecture.md) | GitHub → Vercel → Supabase |
| [`Overall-modules.md`](docs/Overall-modules.md) | Full module tree |

---

## Architecture in one page

### Three users, two of them authenticated

| User | Authentication | Can | Cannot |
| ---- | -------------- | --- | ------ |
| **Admin** | Supabase Auth, `role = admin` | Full CRUD on groups, students, programs, judges; assign; publish results | — |
| **Judge** | Supabase Auth, `role = judge` | View **assigned** programs; submit and update own scores | Modify students, programs, groups, or other judges' scores |
| **Audience** | **None — anonymous** | Read published results and the live leaderboard | Anything else |

The anonymous audience is the defining security constraint: Row Level Security must grant
the Postgres `anon` role a deliberately narrow read slice, and nothing beyond it.

### The mandated call chain

```
Component  →  Server Action  →  Validate (Zod) + Authorize  →  Service  →  Supabase  →  DB
```

Business logic never lives in a UI component. This is non-negotiable.

### Authorization: three independent gates

```
1. middleware.ts   session refresh, role routing        ← convenience, not security
2. Server check    re-verified in the page/action       ← catches direct action calls
3. RLS policy      enforced by PostgreSQL itself        ← the gate that actually holds
```

Middleware is never treated as sufficient on its own. A Server Action invoked directly
must still verify permissions, and the database must still refuse unauthorized rows.

### The scoring loop

```
Judge submits score
   → judge_scores INSERT
   → scoring service averages all judges' scores per student
   → ranks students, assigns positions (ties share a position)
   → results UPDATE, including points (1st = 5, 2nd = 3, 3rd = 1)
   → admin reviews, then publishes the program
   → Postgres WAL change → Supabase Realtime → every subscribed screen repaints
```

### Data model

```
main_groups ──1:N──> students
                        │
                        └──N:M──> program_students <──N:M── programs
                                                                │
                                          program_judges <──N:M─┘
                                                │
profiles (role = judge) ────────────────────────┘
                                                │
                                                ▼
                                          judge_scores      (program × student × judge → 0–100)
                                                │ aggregate
                                                ▼
                                             results        (program × student → average, position, points)
                                                │ SUM by group
                                                ▼
                                       group_leaderboard    (SQL view — derived, never stored)
```

---

## Scripts

| Command | Does |
| ------- | ---- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript with no emit |
| `pnpm db:types` | Regenerate `src/types/database.types.ts` from the live schema |
| `pnpm db:push` | Apply migrations to the linked Supabase project |

---

## Deployment

**(Phase 19)**

1. Push the repository to GitHub.
2. Import it into Vercel — the Next.js preset is detected automatically.
3. Add all three environment variables in Vercel's project settings. Mark
   `SUPABASE_SERVICE_ROLE_KEY` as sensitive.
4. In Supabase → Authentication → URL Configuration, add the production domain to
   **Site URL** and **Redirect URLs**, or logins will redirect to `localhost`.
5. Deploy.

### Production checklist

- [ ] Row Level Security enabled and verified on **every** table
- [ ] Anonymous access tested — the audience view works logged out
- [ ] Anonymous access tested **negatively** — no unpublished result is reachable
- [ ] Judge account cannot reach any `/admin` route
- [ ] Judge cannot read or write another judge's scores
- [ ] `SUPABASE_SERVICE_ROLE_KEY` absent from the client bundle (grep the build output)
- [ ] Storage bucket policies restrict uploads to admins
- [ ] Supabase Auth redirect URLs point at the production domain
- [ ] Database backups enabled
- [ ] Realtime verified across two devices simultaneously

---

## Contributing rules

Condensed from [`docs/agents.md`](docs/agents.md) — that document is authoritative.

**Always**

- TypeScript, strict, no `any`
- Validate every input with Zod, on **both** client and server
- Verify permissions in every mutation — never trust a role sent by the client
- Keep business logic in `lib/services/`
- Prefer Server Components; reach for a Client Component only when interaction demands it
- Handle every error and return typed results
- Every table keeps `created_at` and `updated_at`

**Never**

- Disable Row Level Security
- Expose the service role key
- Put business logic in a UI component
- Write a component beyond roughly 250 lines
- Hardcode a value that belongs in the database or `constants/`
- Introduce a dependency without justifying it
- Change the database design without discussing the impact first

**Definition of done:** UI · validation · database integration · error handling · loading
state · empty state · responsive · type-safe · authorized.
