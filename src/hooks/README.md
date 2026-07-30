# `src/hooks` — Cross-feature React hooks

Hooks used by **more than one feature**. A hook serving a single feature belongs in
`src/features/<feature>/hooks/`.

Naming is `useSomething.ts`, per `docs/agents.md`.

## Before adding a hook, check you need one

`docs/agents.md` sets a strict preference order for state:

```
1. React Server Components   ← no hook needed; fetch on the server
2. Server Actions            ← no hook needed; mutate on the server
3. TanStack Query            ← deferred to Phase 15 (decisions.md D-005)
4. Zustand                   ← deferred to Phase 15 (decisions.md D-005)
```

Most data needs in this application are met by the first two. A hook is the right tool for
**browser-only** concerns: subscriptions, media queries, focus management, fullscreen.

## Expected hooks

| Hook | Purpose | Phase |
| ---- | ------- | ----- |
| `useRealtimeLeaderboard.ts` | Subscribe to `results` changes, re-read the leaderboard view | 15 |
| `useFullscreen.ts` | Projector and TV mode for the audience view | 16 |

Note on the first: Postgres **views do not emit Realtime events** (`decisions.md` D-002).
The hook subscribes to the `results` **table** and re-reads the `group_leaderboard`
**view** when a change arrives. That indirection is deliberate — document it at the call
site so nobody "simplifies" it away.
