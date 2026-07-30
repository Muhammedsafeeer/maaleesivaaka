# `src/types` — Type definitions

## `database.types.ts` is generated — never edit it by hand

```bash
pnpm db:types
```

This regenerates the file from the **live database schema** via the Supabase CLI. It is
the single source of truth for every row, insert and update shape in the application.

Hand-writing these types guarantees drift: the schema changes, the interface does not, and
TypeScript confidently reports that everything is fine. Generating them means a migration
that renames a column produces a compile error at every call site — which is exactly what
you want.

Regenerate after **every** migration.

## Domain types build on top of the generated ones

Derive rather than redeclare:

```ts
import type { Database } from "@/types/database.types";

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];

// Compose for query results that include joins
export type StudentWithGroup = Student & {
  main_group: Database["public"]["Tables"]["main_groups"]["Row"] | null;
};
```

Naming is **singular** per `docs/agents.md`: `Student`, `Program`, `Judge`, `Result`.

## Rules

- No `any`. Ever.
- Prefer deriving from `Database` over declaring a parallel interface.
- Discriminated unions for anything with a status or variant.
- Types describing a single feature may live in that feature instead; this folder is for
  types crossing feature boundaries.
