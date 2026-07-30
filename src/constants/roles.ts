/**
 * User roles and their landing routes.
 *
 * Source: docs/project.md §User Roles
 *         docs/authenticflow.md (admin → /admin, judge → /judge)
 *
 * The role is stored on `profiles.role` and read SERVER-SIDE only.
 * docs/agents.md: "Never trust role information from the client."
 */

export const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "judge", label: "Judge" },
] as const;

export type Role = (typeof ROLES)[number]["value"];

/**
 * Where each role lands after authenticating, and where middleware redirects a user who
 * strays into the other role's area.
 */
export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  judge: "/judge",
};

/** Route prefixes that require authentication, mapped to the role permitted to enter. */
export const PROTECTED_PREFIXES: Record<string, Role> = {
  "/admin": "admin",
  "/judge": "judge",
};

/**
 * Routes reachable without a session.
 *
 * `/audience` is deliberately public — the audience never logs in, which is the defining
 * security constraint of this project. Row Level Security must grant the PostgreSQL
 * `anon` role a narrow read slice covering published results only.
 */
export const PUBLIC_ROUTES = ["/", "/login", "/audience"] as const;

export const LOGIN_ROUTE = "/login";
