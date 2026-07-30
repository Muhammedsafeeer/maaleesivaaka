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
| [D-014](#d-014-result-finalization-uses-three-narrow-security-definer-functions) | Result finalization uses three narrow `SECURITY DEFINER` functions | 2026-07-30 | Accepted |
| [D-015](#d-015-is_admin-made-security-definer-to-break-a-real-recursive-rls-cycle) | `is_admin()` made `SECURITY DEFINER` to break a real recursive RLS cycle | 2026-07-30 | Accepted (bug fix, found live post-Phase-13) |
| [D-016](#d-016-realtime-via-routerrefresh-tanstack-query-and-zustand-stay-uninstalled) | Realtime via `router.refresh()`; TanStack Query and Zustand stay uninstalled | 2026-07-30 | Accepted |
| [D-017](#d-017-audience-dashboard-shows-group-names-only-never-individual-student-names) | Audience dashboard shows group names only, never individual student names | 2026-07-30 | Accepted |

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

---

## D-013: `storage.objects` needs an explicit SELECT policy even though both buckets are public

**Date:** 2026-07-30 · **Status:** Accepted (bug fix, found live post-Phase-9)

### Context

Every photo upload failed with `new row violates row-level security policy`
immediately after Phase 9 shipped, despite a genuinely authenticated admin session
with a JWT that checked out correctly on every axis (role, aud, sub) and an `is_admin()`
call that independently returned `true` via `rpc('is_admin')`. D-012's migration
justified having **no** SELECT policy on `storage.objects` with: *"both buckets are
public, so SELECT is already open to everyone — Supabase serves public-bucket objects
without consulting storage.objects RLS at all."* That statement is true, but only for
one specific access path.

### Decision

Add explicit `SELECT ... TO authenticated` policies on `storage.objects` for both
buckets (`20260730130453_storage_select_policies.sql`), unconditional (not gated by
`is_admin()`) — any authenticated session performing a write needs this, not just admin.

### Reasoning

Root-caused via direct reproduction, not guesswork: `supabase db query --linked`
(no Docker needed — a real alternative to the CLI's docker-dependent `db push`
verification step, worth remembering) let a raw `INSERT INTO storage.objects (...)
RETURNING id` be run under a simulated `authenticated` + admin JWT. That statement
failed with the exact same RLS error as the real bug — confirming the problem was
genuinely in Postgres's RLS evaluation, not something specific to the Storage
microservice, the browser client, or the JWT. Adding a temporary `SELECT` policy and
re-running the identical statement made it succeed immediately.

The actual mechanics: "public bucket" reads bypass RLS only through the dedicated
`/storage/v1/object/public/...` serving endpoint. Storage's own upload implementation
does an `INSERT ... RETURNING` internally, to hand the created object's metadata back
to the caller — a normal table read, executed as the `authenticated` role, going
through ordinary RLS, not the public-serving bypass. With zero SELECT policies granted
to `authenticated`, that implicit read-back had nothing granting it, so the *entire
INSERT* rolled back — even though its own `WITH CHECK` (`bucket_id = ... AND
is_admin()`) evaluated correctly to `true` in isolation. A CHECK passing is not
sufficient for an `INSERT ... RETURNING` to succeed if the RETURNING read itself has no
RLS grant.

A false lead pursued along the way, since ruled out and reverted
(`20260730131044_revert_is_admin_to_security_invoker.sql`): making `is_admin()` and
the other three Phase 7 helper functions `SECURITY DEFINER`, on the theory that a
`SECURITY INVOKER` function's *nested* RLS-governed query (`is_admin()` reads
`profiles`, which has its own RLS) might not see the same auth context as the outer
call. Plausible-sounding, but empirically not the cause — the bug reproduced
identically with `SECURITY DEFINER` in place, and was resolved by the SELECT policies
alone. Reverted rather than kept "just in case": an unnecessary `SECURITY DEFINER` is a
real, ongoing security-review cost for zero benefit.

### Consequences

- **Any future bucket needs its own SELECT policy for every role that writes to it**,
  regardless of whether the bucket is public or private. "Public" only ever describes
  the dedicated public-serving read path — it says nothing about what an authenticated
  write's own implicit read-back can see.
- `supabase db query --linked` (raw SQL against the linked project, no Docker) is now
  the preferred tool for reproducing an RLS bug precisely — far more reliable than
  reasoning about Storage-vs-PostgREST evaluation differences from the client-side
  error message alone.

---

## D-014: Result finalization uses three narrow `SECURITY DEFINER` functions

**Date:** 2026-07-30 · **Status:** Accepted

### Context

D-003 requires results to compute **automatically** the moment every assigned judge has
scored every assigned student — not on an admin's manual trigger. The natural place for
that check is right after a judge's own score submission, since that is the event that
can complete a program.

But a judge's own RLS-scoped session cannot answer the question "has every judge
finished?": `judge_scores` and `program_judges` policies (Phase 7) deliberately restrict
judges to their own rows only — a judge is not supposed to see a colleague's scores or
even how many colleagues are assigned. The same session also has no write access to
`results` or `programs` (both are admin-only for writes). Automatic, judge-triggered
finalization is therefore impossible under the existing RLS as a plain authenticated
query — it needs *some* elevated path, deliberately narrow.

This is a different situation from the `SECURITY DEFINER` detour reverted in
[D-013](#d-013-storageobjects-needs-an-explicit-select-policy-even-though-both-buckets-are-public):
that one was a guess at fixing an unrelated bug, empirically wrong, and reverted. This
one is the only technical path to an already-accepted requirement (D-003), not a guess.

### Decision

Three single-purpose `SECURITY DEFINER` SQL functions, each re-checking authorization
internally (bypassing RLS means the usual policy check no longer runs automatically, so
each function does it by hand via the existing `is_admin()` / `is_judge_assigned_to_program()`
helpers — `auth.uid()` still resolves to the real caller inside a `SECURITY DEFINER`
function; only the *table-privilege* role changes, not the session identity):

- `is_program_fully_scored(p_program_id)` — boolean count check
  (`judge_scores` rows = assigned judges × assigned students, both > 0). No
  authorization gate needed; leaks no row data, same privacy profile as
  `is_program_published()`.
- `get_program_scores(p_program_id)` — returns raw `(student_id, score)` rows for every
  judge, for the average/rank calculation. Gated to `is_admin() or
  is_judge_assigned_to_program(p_program_id)`.
- `finalize_program_results(p_program_id, p_results jsonb)` — upserts the
  **already-ranked** rows (computed in TypeScript, not here) into `results`, then flips
  `programs.status` from `scoring` to `completed`. Same authorization gate.

The actual averaging and `RANK()`-semantics ranking stays a pure TypeScript function in
`scoring.service.ts`, per [D-004](#d-004-tied-scores-share-a-position-and-each-receive-full-points)'s
explicit requirement that this logic be unit-testable with no Supabase import. These SQL
functions only do the parts TypeScript structurally cannot: read across every judge's
rows, and write to tables the calling judge has no RLS grant on.

### Reasoning

Narrower alternatives were considered and rejected:

- **Push the whole calculation into SQL** (one big `SECURITY DEFINER` function that
  reads, ranks, and writes) — rejected because it would duplicate/override D-004's
  already-accepted decision that ranking must be pure, testable TypeScript.
- **Admin-triggered instead of automatic** (a "Calculate Results" button, using the
  admin's own already-sufficient RLS access, no `SECURITY DEFINER` needed at all) —
  rejected because D-003 says "automatically," and the user re-confirmed D-003 as
  written earlier this phase rather than superseding it.
- **Expand the Phase 11 service-role key usage to a third route handler** — rejected to
  keep [D-006](#d-006-the-service-role-key-is-used-in-exactly-one-place)'s "confined
  usage" property intact; `SECURITY DEFINER` is the Postgres-native mechanism for a
  narrow privilege escalation and doesn't touch the Supabase Admin API surface at all.

### Consequences

- An **admin-side "Recalculate Results" fallback** exists on the program detail page
  (Phase 13) in case the automatic post-submission trigger silently fails for any
  reason (network error, etc.) — otherwise a program could get permanently stuck at
  "fully scored but still `scoring`" with nothing left to re-trigger it, since nothing
  else calls these functions once every judge is done.
- Each `SECURITY DEFINER` function's authorization check is hand-written and must be
  kept in sync with the tables it touches — unlike ordinary RLS, adding a new sensitive
  column or table later will not automatically be covered by these functions' existing
  checks.
- `finalize_program_results` is idempotent (`upsert` on the `results` unique
  constraint, status transition guarded by `where status = 'scoring'`) — safe to call
  more than once for the same program, which the Recalculate fallback above relies on.

### Verification note: an incomplete first check, corrected by D-015

While verifying this phase, `supabase db query --linked` reproduced `54001: stack depth
limit exceeded` inside `is_admin()` on a plain `select from profiles` under a simulated
judge session. A first round of live verification — a real judge session against the
real PostgREST/RPC endpoints — completed the `finalize_program_results` pipeline
cleanly, which was (wrongly) read as proof the crash was a harness artifact.

It wasn't. That first live check only exercised the three new `SECURITY DEFINER`
functions above, which bypass RLS on the tables they touch by design — it never
exercised a plain, RLS-governed `select` on `programs` or `program_judges`, which is
exactly what the judge dashboard's `listAssignedPrograms()` does. A follow-up check
against two other real judge accounts, reading `programs` and `program_judges`
directly, reproduced the identical stack-depth crash through the real API — confirming
the recursion was real all along, just not exercised by the first (incomplete) test.
See [D-015](#d-015-is_admin-made-security-definer-to-break-a-real-recursive-rls-cycle)
for the fix.

**Lesson for next time:** a live check that only exercises `SECURITY DEFINER` RPCs says
nothing about whether the plain RLS-governed path works — they bypass exactly the
mechanism that was actually broken. Test the specific code path the feature actually
uses, not a nearby one that happens to be reachable.

---

## D-015: `is_admin()` made `SECURITY DEFINER` to break a real recursive RLS cycle

**Date:** 2026-07-30 · **Status:** Accepted (bug fix, found live post-Phase-13)

### Context

The user reported that judges other than the one used in Phase 12's original testing
saw no assigned programs at all on `/judge`, despite being correctly assigned via
`program_judges`. `listAssignedPrograms()` (`scoring.service.ts`) does a plain `select
*` on `programs` and silently returns `[]` on any error — masking the real failure as
"nothing assigned" instead of surfacing it.

Root-caused with real judge sessions (minted via the Admin API's `generateLink` +
`verifyOtp`, no passwords needed or exposed) against the actual PostgREST API — not
just the `db query --linked` harness, whose reproductions had already been prematurely
dismissed once this phase (see the verification note under D-014). Querying `programs`
or `program_judges` as a real, correctly-assigned judge reproducibly failed with
`54001: stack depth limit exceeded`.

The cause: `is_admin()` (`SECURITY INVOKER`, since D-013's revert) reads `profiles`.
`profiles`' own "admin has full access to profiles" policy (D-011) calls `is_admin()`
to decide row visibility. That's genuinely self-referential. `programs` and
`program_judges` both carry an "admin has full access via `is_admin()`" policy too, and
`is_judge_assigned_to_program()` (itself `SECURITY INVOKER`) reads `program_judges` as
part of evaluating `programs`' judge policy — compounding the same cycle across tables.
A single-table `profiles` self-read alone happened not to blow the stack; the
cross-table evaluation needed for `programs` did.

### Decision

`alter function is_admin() security definer;` — the other three Phase 7 helper
functions (`is_judge_assigned_to_program`, `is_student_assigned_to_program`,
`is_program_published`) stay `SECURITY INVOKER`; only `is_admin()` has this specific
self-referential shape (it's the only helper whose target table's own RLS calls it
back).

### Reasoning

This is the standard, documented Postgres/Supabase fix for a helper function whose
target table's RLS policy references that same function: `SECURITY DEFINER` runs the
function as its owning role, which is not subject to `profiles`' RLS at all, so the
self-referential policy never gets re-evaluated. It resolves the recursion at its one
true source rather than working around it at every call site.

This is explicitly **not** a repeat of the Phase 9 `SECURITY DEFINER` episode
([D-013](#d-013-storageobjects-needs-an-explicit-select-policy-even-though-both-buckets-are-public)):
that one was a guess at an unrelated Storage bug, empirically wrong, and reverted. This
one is root-caused via direct reproduction with real sessions against the real API,
same standard this project already holds itself to for RLS bugs.

### Consequences

- Every "admin has full access via `is_admin()`" policy across all 8 tables now
  resolves without recursion risk, not just the two tables that happened to surface the
  symptom (`programs`, `program_judges`) — the fix is general, not table-specific.
- **`listAssignedPrograms()` and any other function that silently returns `[]`/`null`
  on a Supabase error should be revisited** — this bug was invisible in the UI
  precisely because the error was swallowed rather than surfaced. Worth auditing
  before Phase 14 for other spots doing the same silent-empty-on-error pattern.
- Reinforces the D-014 verification lesson: a check that only exercises a `SECURITY
  DEFINER` RPC proves nothing about the plain RLS-governed path a real feature uses.

---

## D-016: Realtime via `router.refresh()`; TanStack Query and Zustand stay uninstalled

**Date:** 2026-07-30 · **Status:** Accepted

### Context

D-005 deferred the TanStack Query / Zustand decision specifically to this phase,
explicitly conditioning it on "each only if a real need appears" — Phase 15 is where
that condition actually gets evaluated, not just deferred further. `project.md` §2
lists both in the frontend stack.

### Decision

Neither library is installed. A Supabase Realtime subscription (`postgres_changes` on
the `results` table, per `src/hooks/README.md`'s already-planned `useRealtimeLeaderboard`
hook) calls `router.refresh()` on any change. Next.js re-runs the Server Component fetch;
no client-side copy of the leaderboard (or anything else) is ever kept.

### Reasoning

`router.refresh()` fully satisfies `project.md` §8's "no manual refresh required" for
every case Phase 15 needs — a `postgres_changes` event just needs to trigger a re-fetch,
which is exactly what a Server Component re-render already does well. Introducing a
client-side cache to solve a problem `router.refresh()` already solves would be the
exact mistake `agents.md`'s "never duplicate server data in multiple places" warns
against, for a need that doesn't exist yet.

### Consequences

- The pattern established here (subscribe → `router.refresh()`) is expected to extend
  to Phase 16's audience dashboard and any other live-updating admin/judge surface,
  unless a genuine need for finer-grained client state (e.g. optimistic UI, avoiding a
  full-page data re-fetch flash on a TV display) surfaces later. If that need appears,
  D-005's original framing still applies: add the library additively, scoped to the
  component that needs it — not as a blanket architectural change.
- This is the second time a Phase 1 stack item has been evaluated against a real need
  and found unnecessary so far (Storage's browser-direct-upload path in Phase 9 is the
  other precedent for "smallest tool that solves the problem" winning over the
  documented default).

---

## D-017: Audience dashboard shows group names only, never individual student names

**Date:** 2026-07-30 · **Status:** Accepted

### Context

D-010 deliberately restricted `students` to `id, group_id` for `anon` — no name, photo,
roll number, class, or gender — and explicitly flagged that a public "now performing"
or "who won" display would need "a separate, narrower decision... made when Phase 16's
audience UI is actually being designed." This is that decision.

### Decision

The audience dashboard never displays an individual student's name or photo, at any
lifecycle stage. "Current Program" shows only program metadata (name, category, stage
type). "Latest Results" shows position + **group (house) name** + points — e.g.
"Mappila Pattu — 1st: Red House" — never which student performed. No change to the
`students` grant from D-010.

### Reasoning

Confirmed with the user rather than assumed. The alternative (a narrow view exposing
only currently-relevant students) was raised and explained, including its real
consequence — RLS is table-wide, not "only while this student is on stage," so even a
tightly-scoped view is still real, permanent, publicly-queryable PII about named
children, for a marginal UX gain over "which house won." Group/house pride is also
arguably the actual point of the house-competition format `project.md` describes, not
individual recognition.

### Consequences

- No migration needed — D-010's existing grant already covers everything Phase 16
  requires (`students.id, group_id` for the join to `main_groups`, nothing more).
- `result.service.ts`'s new audience-facing read (`listLatestPublishedResults`) returns
  a type with **no student_id or student name field at all**, so a future call site
  can't accidentally render one that was never fetched.
- If a "now performing" per-student display is ever wanted later, it needs its own
  fresh decision (a purpose-built view scoped to, e.g., only students in the currently
  `ongoing` program) — this ADR does not preclude that, it just declines it for now.
