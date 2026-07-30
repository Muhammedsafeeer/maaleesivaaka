# `src/features` — Feature modules

The project is organised by **feature**, not by file type. Everything about students lives
in one directory, so a change to students touches one place instead of six.

```
features/
├── auth/
├── students/
├── programs/
├── judges/
├── groups/
├── leaderboard/
└── scoring/
```

`scoring/` (Phase 12) isn't in the original plan above — the judge's own score-submission
UI belongs to neither `programs` (admin-only) nor `judges` (admin managing judge
accounts), same "add it when the gap shows up" pattern as `assignment.service.ts` in
Phase 10.

Each feature owns the same internal shape, created as needed:

```
<feature>/
├── components/    UI specific to this feature (StudentCard, StudentTable…)
├── hooks/         React hooks specific to this feature (useStudents…)
├── actions/       Server Actions — the mutation entry points
├── validation/    Zod schemas, shared by client and server
└── types/         Types derived from the generated database types
```

## What does NOT go here

- **Cross-cutting business rules** → `src/lib/services/`. The scoring engine is used by
  programs, results and the leaderboard, so it belongs to none of them.
- **Components shared by two or more features** → `src/components/`.
- **Database access primitives** → `src/lib/supabase/`.

## Keep features independent

A feature may import from `lib/`, `components/`, `types/` and `constants/`. Importing
directly from a *sibling feature* couples the two — route the shared piece through
`lib/services/` or `components/` instead.
