/**
 * Barrel export for `@/lib/utils`.
 *
 * shadcn/ui's `components.json` points its `utils` alias here, so every generated
 * component importing `cn` from `@/lib/utils` resolves through this file.
 *
 * Add new utility modules as siblings of `cn.ts` and re-export them below.
 * Utilities here must be pure and dependency-free — anything that touches Supabase,
 * makes a network call, or encodes a business rule belongs in `@/lib/services`.
 */
export { cn } from "./cn";
