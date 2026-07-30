# `src/lib/services` — Business logic layer

**Every business rule in this application lives here, and only here.**

Location settled by `docs/decisions.md` **D-001** (the documentation named two different
paths; this is the canonical one).

## The mandated call chain

```
Component → Server Action → Validate (Zod) + Authorize → Service → Supabase → Database
```

A component never calls a service directly, and a service never renders anything.

## Planned services

| File | Owns | Phase |
| ---- | ---- | ----- |
| `auth.service.ts` | Session retrieval, role lookup, permission assertions | 6 |
| `group.service.ts` | Main group CRUD | 8 |
| `student.service.ts` | Student CRUD, search, filtering | 8 |
| `program.service.ts` | Program CRUD, status transitions | 8 |
| `storage.service.ts` | Photo uploads — runs in the browser, not the server (see file header) | 9 |
| `assignment.service.ts` | Student↔program roster (`program_students`) — added here; the original table only planned services through Phase 8, missing this the same way the Phase 1 folder tree missed a dedicated "assign" route | 10 |
| `judge.service.ts` | Judge accounts and program assignment | 11 |
| `scoring.service.ts` | **Averaging and ranking** | 13 |
| `result.service.ts` | Writing and publishing results | 13 |
| `leaderboard.service.ts` | Reading the `group_leaderboard` view | 14 |

## `scoring.service.ts` deserves special care

Its calculation core must be **pure functions**: scores in, ranked results out, with no
Supabase import. That makes the rules in `docs/decisions.md` D-004 — tied students share a
position and each receive full points, `RANK()` semantics rather than `DENSE_RANK()` —
testable without a database, a browser, or a running server.

Keep the impure part (reading scores, writing results) in a thin wrapper around the pure
core.

## Rules

- Return **typed results**. Never let a raw PostgreSQL error escape to the UI —
  `docs/agents.md`: *"Never expose raw database errors."*
- Verify permissions inside every mutation. Do not assume the caller already checked; a
  Server Action is a public endpoint.
- Services may call other services. Keep the dependency direction acyclic.
- No `any`.
