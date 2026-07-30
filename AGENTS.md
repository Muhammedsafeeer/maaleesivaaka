# AGENTS.md

Instructions for AI coding agents working in this repository.

This file is a **summary**. The authoritative documents are in [`/docs`](docs/), and
`/docs` is the single source of truth for this project.

---

## Read before you write

In this order:

1. [`docs/project.md`](docs/project.md) — scope, roles, modules, requirements
2. [`docs/architecture.md`](docs/architecture.md) — layers, tables, auth, realtime, security
3. [`docs/agents.md`](docs/agents.md) — coding standards and definition of done
4. [`docs/decisions.md`](docs/decisions.md) — **decisions that override the three above**

Then the diagram documents relevant to your feature (see the documentation map in
[`README.md`](README.md)).

---

## Non-negotiable rules

### The call chain

```
Component → Server Action → Validate (Zod) + Authorize → Service → Supabase → DB
```

Business logic lives in `src/lib/services/`. It never lives in a UI component.

### Authorization is layered

Middleware routes. The server verifies. **RLS enforces.** Middleware alone is never
treated as security — a Server Action reached directly must still check permissions, and
the database must still refuse unauthorized rows.

Never trust a role sent from the client. Read it server-side from `profiles`.

### The audience is anonymous

Unauthenticated visitors read the live leaderboard. Every RLS policy must be written with
that in mind: the Postgres `anon` role gets a narrow, explicit read slice — published
results only — and nothing else.

### Never

- Disable Row Level Security on any table
- Expose `SUPABASE_SERVICE_ROLE_KEY` to the client, or prefix it with `NEXT_PUBLIC_`
- Use the `any` type
- Put business logic in a component
- Write a component beyond roughly 250 lines
- Hardcode values that belong in the database or `src/constants/`
- Poll on a timer where a Realtime subscription belongs
- Store files in the database — store URLs
- Log passwords, tokens, or keys

### Always

- TypeScript, strict mode
- Validate input with Zod on **both** client and server, from one shared schema
- Handle every error; return typed results; never surface a raw database error
- `created_at` and `updated_at` on every table; UUID primary keys; real foreign keys
- Prefer Server Components; use Client Components only where interaction requires them
- Reuse an existing component before creating a new one

---

## Working method

This project is built in **verified phases** (tracked in [`README.md`](README.md)). Do not
generate the whole project at once.

Each phase delivers, in order:

1. What we are building
2. Why we are building it this way
3. Files to be created
4. Implementation
5. How to test it
6. Verification checklist
7. Likely problems and their fixes

Confirm a phase works before starting the next one.

---

## When you disagree with the documentation

Do not silently deviate.

1. State the conflict plainly
2. Give advantages and disadvantages
3. Recommend one option
4. **Wait for approval**

Approved deviations are recorded in [`docs/decisions.md`](docs/decisions.md) with their
date and reasoning — never by editing the original document out from under its history.

---

## Before implementing any feature, identify

- Which document defines it
- Which architecture decision applies
- Which database tables it touches
- Which user roles it affects
- How it impacts existing modules

The goal is architectural consistency — a codebase another developer can pick up and
extend with minimal effort.
