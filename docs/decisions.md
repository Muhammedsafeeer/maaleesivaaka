# Decision Log

Architectural decisions that **resolve conflicts** between the documents in this folder,
or that **add** to them.

Where this file contradicts `project.md`, `architecture.md`, or `agents.md`, **this file
wins** — those documents are left unedited so their original intent stays visible.

Format: context → decision → consequences. Newest decisions are appended at the bottom.

| ID | Decision | Date | Status |
| -- | -------- | ---- | ------ |
| [D-001](#d-001-service-layer-lives-in-srclibservices) | Service layer lives in `src/lib/services/` | 2026-07-29 | Accepted |
| [D-002](#d-002-the-group-leaderboard-is-a-derived-sql-view) | Group leaderboard is a derived SQL view | 2026-07-29 | Accepted |
| [D-003](#d-003-results-calculate-automatically-the-admin-publishes-them) | Results auto-calculate; admin publishes | 2026-07-29 | Accepted |
| [D-004](#d-004-tied-scores-share-a-position-and-each-receive-full-points) | Ties share a position and full points | 2026-07-29 | Accepted |
| [D-005](#d-005-tanstack-query-and-zustand-are-deferred-to-the-realtime-phase) | TanStack Query and Zustand deferred to Phase 15 | 2026-07-29 | Accepted |
| [D-006](#d-006-the-service-role-key-is-used-in-exactly-one-place) | Service role key used in exactly one place | 2026-07-29 | Accepted |
| [D-007](#d-007-category-matching-is-enforced-by-the-database) | Category matching enforced by the database | 2026-07-29 | Accepted |
| [D-008](#d-008-docs-stays-canonical-the-repository-root-does-not-duplicate-it) | `/docs` stays canonical; root does not duplicate it | 2026-07-29 | Accepted |

---

## D-001: Service layer lives in `src/lib/services/`

**Date:** 2026-07-29 · **Status:** Accepted

### Context

The documentation specifies two different locations for the same files:

- `architecture.md` §6 and the folder tree in `agents.md` place them at `src/services/`
- `project-structure.md` and `business-layer.md` place them at `src/lib/services/`

### Decision

**`src/lib/services/`.**

### Reasoning

It groups all non-UI infrastructure — `supabase/`, `services/`, `validations/`, `utils/` —
under one roof, keeping the top level of `src/` short enough to scan. Service files also
sit directly beside the Supabase clients they depend on.

### Consequences

- `architecture.md` §6 and the `agents.md` folder tree are **superseded** on this point.
- Import paths are `@/lib/services/scoring.service`.
- Feature-local helpers still live in `src/features/<feature>/`. Only cross-cutting
  business services live in `lib/services/`.

---

## D-002: The group leaderboard is a derived SQL view

**Date:** 2026-07-29 · **Status:** Accepted

### Context

The documents disagree on whether house points are stored or computed:

- `project.md` lists "Total Points" as a field of a main group
- `architecture.md` §11 defines `main_groups` with **no** points column
- `database-architecture.md` and `architecture.md` §10 show a `GROUP_LEADERBOARD` entity
  that does not appear in the eight-table list

### Decision

House points are **never stored**. A `group_leaderboard` **SQL view** aggregates them from
`results` on read.

```sql
CREATE VIEW group_leaderboard AS
SELECT g.id,
       g.name,
       g.photo_url,
       COALESCE(SUM(r.points), 0)                        AS total_points,
       RANK() OVER (ORDER BY COALESCE(SUM(r.points), 0) DESC) AS rank
FROM main_groups g
LEFT JOIN students s ON s.group_id  = g.id
LEFT JOIN results  r ON r.student_id = s.id
GROUP BY g.id, g.name, g.photo_url;
```

### Reasoning

A stored counter is a cache, and caches desync. If a judge corrects a score after results
are published, a derived view is simply correct on the next read, while a stored total
requires every write path to remember to recompute it. At the scale this system targets —
hundreds of students, a few dozen programs — the aggregate is trivially cheap.

### Consequences

1. **`main_groups` has no `total_points` column.** `project.md`'s "Total Points" field is
   superseded: it is a computed property, not a stored one.
2. **`results` requires a `points` column** (integer, 0/1/3/5), because the view sums
   `results.points`. `architecture.md` §11 defines `results` without it — **this column is
   an addition mandated by this decision.**
3. **Postgres views do not emit Realtime events.** The leaderboard UI therefore subscribes
   to changes on the **`results` table** and re-reads the view when one arrives. This
   indirection must be documented wherever the subscription is set up.
4. The view needs its own read policy so anonymous audience clients can query it.

---

## D-003: Results calculate automatically; the admin publishes them

**Date:** 2026-07-29 · **Status:** Accepted

### Context

- `project.md` §Results: "Automatically generated after all judges submit scores."
- `architecture.md` §9 grants the Admin role a **"Publish Results"** permission.

Automatic visibility and admin-gated visibility are different systems.

### Decision

Both, in sequence. Results **compute automatically** once every assigned judge has scored,
but stay **invisible to the audience** until an admin publishes the program.

```
all assigned judges have scored
   → results rows written (average, position, points)
   → visible to the admin for review
   → admin clicks Publish
   → programs.status = 'published'
   → anonymous RLS policy now permits SELECT
   → audience leaderboard updates live
```

### Reasoning

Automatic calculation delivers the speed `project.md` asks for. The publish gate gives the
admin a chance to catch a mistyped score **before** it appears on a projector in front of
the whole school. Withdrawing a wrong result that the audience has already seen is far
worse than a few seconds' delay.

### Consequences

- `programs.status` needs an explicit lifecycle. Proposed, to be confirmed when the table
  is designed:
  `draft → upcoming → ongoing → scoring → completed → published`
  Results are written at `completed`; the audience sees nothing before `published`.
- The anonymous RLS policy on `results` filters on the parent program's `published` status.
- The admin dashboard needs a review-and-publish surface, not merely a read-only table.
- Recalculation must handle a score edited **after** publishing — the derived view in
  [D-002](#d-002-the-group-leaderboard-is-a-derived-sql-view) makes this self-correcting.

---

## D-004: Tied scores share a position and each receive full points

**Date:** 2026-07-29 · **Status:** Accepted

### Context

No document specifies tie behaviour, yet ties are near-certain with whole-number scores
from a handful of judges.

### Decision

**Standard competition ranking.** Tied students share the same position and each receive
that position's full points. The following position is skipped.

```
average 95.0  →  1st   5 points
average 95.0  →  1st   5 points
average 88.0  →  3rd   1 point     ← 2nd is skipped
average 80.0  →  4th   0 points
```

### Reasoning

It matches how school prize-giving actually works — two genuinely equal performances both
get first place — and it avoids inventing a tie-breaker that participants cannot see or
predict. Splitting points would produce fractional house totals; an arbitrary tie-break
would produce results nobody can explain from the visible score.

### Consequences

- Ranking uses `RANK()` semantics, **not** `DENSE_RANK()`.
- A program's total points payout is **not fixed**. A three-way tie for first awards
  15 points from a single program. This is intended, and worth stating out loud to anyone
  reviewing house totals.
- `scoring.service.ts` implements this as a **pure function** — scores in, ranked results
  out, no Supabase import — so tie behaviour is unit-testable in isolation.

---

## D-005: TanStack Query and Zustand are deferred to the Realtime phase

**Date:** 2026-07-29 · **Status:** Accepted

### Context

`project.md` §2 lists both in the frontend stack. `agents.md` separately instructs: "Use
the smallest tool that solves the problem," ranking Server Components and Server Actions
above both, and warns "Never duplicate server data in multiple places."

### Decision

Neither is installed until **Phase 15 (Realtime)**, and each only if a real need appears.

### Reasoning

Server Components and Server Actions cover every data requirement through Phase 14. A
client cache installed before it is needed becomes the default choice by habit, and the
project ends up with server state mirrored on the client — exactly what `agents.md`
forbids. Realtime is the first genuine case for client-side cache reconciliation.

### Consequences

- Phases 1–14 fetch in Server Components and mutate through Server Actions with
  `revalidatePath`.
- Adding either library later is additive and touches only the components that need it.
- This defers, and does not reject, the documented stack.

---

## D-006: The service role key is used in exactly one place

**Date:** 2026-07-29 · **Status:** Accepted

### Context

`architecture.md` §20 warns never to expose service role keys to the frontend.
Creating a judge's login account requires the Supabase Admin API, which requires that key.

### Decision

`SUPABASE_SERVICE_ROLE_KEY` is read in **one route handler** — judge account creation —
and nowhere else in the codebase.

### Reasoning

The key bypasses Row Level Security entirely. Confining it to a single, auditable file
means reviewing its blast radius is a one-file job, and any second usage is immediately
visible as a deviation.

### Consequences

- A single admin-only route handler owns account creation; it verifies the caller is an
  admin **before** touching the Admin API.
- No `lib/supabase/admin.ts` general-purpose privileged client — that would invite reuse.
- The production checklist includes grepping the client bundle for the key.

---

## D-007: Category matching is enforced by the database

**Date:** 2026-07-29 · **Status:** Accepted

### Context

`project.md` §Student Assignment requires that a student's category match the program's
category, and describes it as a validation step in the assignment UI.

### Decision

Enforce it in the **database** — via a trigger or check on `program_students` — **in
addition to** the UI and Server Action validation.

### Reasoning

A UI check is bypassable: Server Actions are network endpoints, and a mismatched row
inserted by any other path would silently corrupt results. `architecture.md` principle #2
states "Database rules should protect data," and §18 lists constraints under Database
Security. This is additive hardening, not a change of design.

### Consequences

- Validation exists at three levels: form (Zod), Server Action (Zod), database (constraint).
- The database error must be caught and translated into a readable message — never
  surfaced raw, per `agents.md`.

---

## D-008: `/docs` stays canonical; the repository root does not duplicate it

**Date:** 2026-07-29 · **Status:** Accepted

### Context

The build brief asked for `PROJECT.md`, `ARCHITECTURE.md` and `AGENTS.md` at the
repository root. `/docs` already contains all three.

### Decision

The root holds only what `/docs` does not:

- **`README.md`** — setup, environment variables, scripts, deployment, phase tracker
- **`AGENTS.md`** — a short rule summary that points to `docs/agents.md`

No `PROJECT.md` or `ARCHITECTURE.md` at root. `/docs` remains the single source of truth.

### Reasoning

Two copies of the same specification drift apart, and once they disagree neither can be
trusted. A root `AGENTS.md` is kept because agent tooling conventionally looks for it
there — but it is explicitly a pointer, not a second copy.

### Consequences

- Documentation changes are made in `/docs`.
- Overrides are recorded here, dated, rather than by rewriting the original document.

---

## D-009: Next.js 16 renamed `middleware.ts` to `proxy.ts`

**Date:** 2026-07-30 · **Status:** Accepted

### Context

`agents.md` (project structure) and `project-structure.md` both list `middleware.ts` at
the project root. Next.js 16.2.12 — the version pinned in this project since Phase 1 —
deprecates that file convention: `next build` emits "The 'middleware' file convention is
deprecated. Please use 'proxy' instead," linking to
`nextjs.org/docs/messages/middleware-to-proxy`. The exported function must be named to
match (`proxy`, not `middleware`) or the file isn't picked up.

### Decision

The Next.js entry point is `src/proxy.ts`, exporting `proxy()`, not `src/middleware.ts`
exporting `middleware()`. The Supabase session-refresh helper it calls is renamed to
match: `src/lib/supabase/proxy.ts` (was `middleware.ts`), still exporting
`updateSession()`.

### Reasoning

This is a framework rename, not a design choice with tradeoffs — building on a
convention the installed Next.js version already flags as deprecated would be adding
debt on day one for no benefit. Both original `/docs` files keep saying `middleware.ts`;
this entry is the record of why the repository doesn't match that filename.

### Consequences

- `src/proxy.ts` is the file middleware-adjacent logic (auth gating, redirects) lives in
  going forward — Phase 6/7 role-based redirects extend `proxy()`, not a `middleware()`.
- `src/lib/README.md`'s Phase-1 table is updated to say `proxy.ts` instead of
  `middleware.ts`.
- If a future `/docs` update or contributor greps for `middleware.ts` expecting to find
  the entry point, this ADR is the pointer to where it actually lives.
