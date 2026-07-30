/**
 * Barrel export for `@/constants`.
 *
 * Values that the documentation has settled live here so they are never hardcoded at a
 * call site — docs/agents.md bans "hardcoded database values".
 *
 * Anything genuinely dynamic (configurable point values, per-event settings) belongs in
 * the database, not in this folder.
 */
export * from "./roles";
export * from "./programs";
export * from "./scoring";
export * from "./storage";
