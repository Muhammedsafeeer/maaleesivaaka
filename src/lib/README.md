# `src/lib` — Infrastructure and business logic

Everything that is not UI and not a route.

```
lib/
├── supabase/      Data access layer — the ONLY place a Supabase client is constructed
├── services/      Business logic layer — the ONLY place business rules live
├── validations/   Zod schemas shared ACROSS features (rare — most schemas are per-feature)
└── utils/         Pure, dependency-free helpers
```

## `supabase/` — data access layer

Three clients, because the App Router runs code in three different places and each needs
a different way of reading and writing the session cookie.

| File | Used by | Why it is separate |
| ---- | ------- | ------------------ |
| `client.ts` | Client Components | Runs in the browser. Reads cookies via `document.cookie`. |
| `server.ts` | Server Components, Server Actions, route handlers | Runs on the server. Reads cookies through `next/headers`. **Must be created per request** — never cached in a module-level variable, or one user's session leaks into another's request. |
| `proxy.ts` | `src/proxy.ts` only | Can both read *and write* cookies, so this is where the session is refreshed before it expires. Named `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the convention; see [D-009](../../docs/decisions.md#d-009-nextjs-16-renamed-middlewarets-to-proxyts). |

## `services/` — business logic layer

See [`services/README.md`](services/README.md). This is the heart of the application.

## `validations/` — Zod schemas shared across features

`features/README.md` puts most schemas in `features/<x>/validation/`, next to the
feature that owns them (e.g. `features/auth/validation/login.schema.ts`) — that's the
default. This folder is only for a schema two or more features genuinely need to share;
until one exists, it stays empty.

Whichever folder a schema lives in, the rule is the same: one schema per entity,
imported by **both** the client form and the Server Action. `docs/agents.md` requires
validation in both places; sharing the schema means they can never disagree.

Client validation is a convenience for the user. **Server validation is the security
boundary** — a Server Action is a network endpoint and can be called directly.

## `utils/` — pure helpers

Formatting, string manipulation, date display. No Supabase import, no network call, no
business rule. If it needs to know that first place is worth five points, it is a service,
not a utility.
