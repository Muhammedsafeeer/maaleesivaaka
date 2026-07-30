# `src/app` — Routing layer

Routes and nothing else. Pages **compose** features; they do not contain business logic,
data transformation, or database calls beyond a service invocation.

## Structure

```
app/
├── (auth)/login/     Route group — parentheses mean the folder does NOT appear in the URL.
│                     /login renders without the admin sidebar or judge shell.
├── admin/            Admin only. Guarded by middleware + server check + RLS.
├── judge/            Judge only. Shows assigned programs exclusively.
├── audience/         PUBLIC — no authentication. Optimised for TV, projector, mobile.
├── api/              Route handlers. Only for work Server Actions cannot do.
├── layout.tsx        Root layout — fonts, theme, <html>/<body>.
└── globals.css       Tailwind v4 entry point and design tokens.
```

## Server Components vs Client Components in this app

Every file here is a **Server Component by default**. It runs on the server, never ships
to the browser, and may query the database directly. Add `"use client"` only when a file
needs browser-only capability.

| Route | Rendering | Why |
| ----- | --------- | --- |
| `admin/students` | **Server** | A table of rows. Fetch on the server, send HTML. No client fetch waterfall, and the Supabase query never reaches the browser. |
| `admin/students` *(the form dialog)* | **Client** | `useState` for open/closed, React Hook Form for input. Interaction requires the browser. |
| `judge/scoring` | **Client** | Controlled numeric inputs with live validation. |
| `audience/leaderboard` | **Client** | Holds a Supabase Realtime WebSocket subscription. Subscriptions are inherently stateful and browser-bound. |
| `login` | **Client** | Form state and inline error display. |

The rule: **fetch on the server, interact on the client.** Where a page is mostly static
data with one interactive island, keep the page a Server Component and mark only the
island `"use client"` — that way the data still never round-trips through the browser.

## Route handlers vs Server Actions

Prefer **Server Actions** for mutations. Use a **route handler** in `api/` only when you
need a genuine HTTP endpoint — currently just judge account creation, which calls the
Supabase Admin API with the service role key (see `docs/decisions.md` D-006).
