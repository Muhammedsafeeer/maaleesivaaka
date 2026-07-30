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

---

## D-010: Anonymous audience visibility scope for programs and students

**Date:** 2026-07-30 · **Status:** Accepted

### Context

`project.md` lists "Current Program" as something the public can view, separate from
"Latest Results." No document specifies whether that means full program metadata is
public at every lifecycle stage, or whether the audience learns a program existed only
once `published`. Separately, the `group_leaderboard` view (D-002) needs the anonymous
`anon` role to have *some* read access to `students` for its join to work, even though
the view never displays a student's identity — and no document says whether the public
should be able to see individual student names/photos at all.

### Decision

Two RLS choices, confirmed with the user at Phase 7 design time:

1. **`programs`** — anon can read every column, at every `status`, not just `published`.
2. **`students`** — anon gets a table-wide `SELECT` policy (`using (true)`) but is
   restricted at the *column* level to `id` and `group_id` only, via
   `revoke select on students from anon; grant select (id, group_id) on students to anon;`.
   No name, photo, roll number, class, or gender is exposed to an unauthenticated
   request, for any student, regardless of program status.

### Reasoning

D-003's actual concern is specifically about *results* being seen before an admin has
reviewed them — not about the event schedule. Hiding all program metadata until
`published` would make a live "what's happening now" display impossible, which is a
documented feature. Program name/category/stage_type/status carry no student-identifying
information, so there's little to protect by hiding them.

Student PII is a different risk profile. RLS is table-wide, not scoped to "only while
this student is currently performing" — granting `name`/`photo_url` to `anon` would make
the entire school roster's names and photos permanently queryable by anyone holding the
publishable anon key, not just visible during that student's moment on stage. The
column-level grant (rather than a view, or a row-level filter) is the correct tool here:
RLS decides which *rows* are visible, but `students` needs every row visible for the
leaderboard math to be correct across the whole festival, so the restriction has to be
per-*column* instead.

### Consequences

- A public "now performing: `<name>`" display is **not possible** with the current
  grant. If that's wanted later, it needs a separate, narrower decision — e.g. a purpose
  -built view exposing only the name of students in the currently `ongoing` program,
  made when Phase 16's audience UI is actually being designed — not a blanket widening
  of this grant.
- `group_leaderboard` works correctly for `anon` today only because `main_groups` is
  fully public (D-002 always intended house names/photos to be public) and `students`
  is visible enough at the row level (`id`, `group_id`) for the join, even though no
  student-identifying column is ever readable.
- Verified live via the anon key: `select=id,group_id` succeeds; `select=name` and
  `select=*` both fail with `42501 permission denied for table students`.

---

## D-011: Admin needs SELECT + UPDATE on `profiles`, not the FOR ALL pattern

**Date:** 2026-07-30 · **Status:** Accepted

### Context

Phase 7 gave every other table a single `FOR ALL` admin policy gated by `is_admin()`.
`profiles` was missed — it only had Phase 6's self-read policy (`auth.uid() = id`). This
surfaced building Phase 8's admin dashboard: an admin's own "how many judges exist"
query saw only their own row and silently returned the wrong count instead of erroring.

### Decision

Two new policies on `profiles`, not the `FOR ALL` pattern: `admin can read all profiles`
(`SELECT`) and `admin can update all profiles` (`UPDATE`). No `INSERT` or `DELETE` grant.

### Reasoning

D-006 confines account creation to exactly one path: the Phase 11 route handler, which
uses the service role key to create the `auth.users` row and the `profiles` row
together. Granting admin a direct `INSERT` via RLS wouldn't be exploitable (the foreign
key to `auth.users` still prevents an orphaned row), but it would open a second,
uncontrolled path to the same operation — exactly what D-006 exists to avoid. Deletion
is excluded for the same reason in reverse: deleting a judge should remove the
`auth.users` row through the Admin API, which cascades to `profiles` automatically, not
delete the profile in isolation and leave a login with no role.

### Consequences

- `profiles` is the one table in this schema where "admin has full access" is
  deliberately *not* implemented as a single `FOR ALL` policy — a future reader
  comparing it to the other seven tables should find this entry, not conclude it's an
  oversight.
- Judge account creation and deletion (Phase 11) must go through the Admin API /
  service-role route handler; a plain authenticated `INSERT`/`DELETE` on `profiles`
  will be rejected by RLS regardless of the caller's role.

---

## D-012: Both Storage buckets are public, including student photos

**Date:** 2026-07-30 · **Status:** Accepted

### Context

D-010 (Phase 7) restricted anonymous audience access to `students` at the table level
to `id`/`group_id` only — no name, photo, roll number, class, or gender. Phase 9 needed
to decide whether student *photo files* should follow the same restriction. The
consistent extension would be a private `student-photos` bucket, readable only by
authenticated admin/judge sessions via short-lived signed URLs, mirroring the table-
level column restriction.

### Decision

Both `group-photos` and `student-photos` buckets are **public**. This was raised
explicitly as a tradeoff against the private-bucket option and the user chose the
simpler public option for both.

### Reasoning

This is a deliberate simplification the user chose after the tradeoff was explained,
not an oversight or a default the assistant picked unprompted. Recorded here so it
reads as an accepted decision rather than an inconsistency with D-010 the next time
someone compares how `students` is handled at the table level versus the file level.

### Consequences

- Anyone holding a student photo's object URL can view it indefinitely — network
  inspection while an admin/judge session is active is enough to obtain one; no
  authentication is required to fetch it afterward.
- Writes (upload/replace/delete) are still admin-only, enforced by `storage.objects`
  RLS policies using the same `is_admin()` helper as every table policy — this
  decision only concerns *read* access, not who can change photos.
- If this needs revisiting later (e.g. before a public rollout, or if a school raises a
  concern), the fix is: flip `student-photos.public` to `false`, add a `SELECT` policy
  scoped `to authenticated`, and switch the admin/judge UI from plain `<img src>` URLs
  to `supabase.storage.from('student-photos').createSignedUrl(path, expiresIn)`.
