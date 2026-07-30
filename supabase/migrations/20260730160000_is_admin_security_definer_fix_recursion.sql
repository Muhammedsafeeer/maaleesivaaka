-- Fixes a real, reproduced-live recursion bug (see docs/decisions.md D-015): is_admin()
-- (SECURITY INVOKER) reads `profiles`, whose own "admin has full access to profiles"
-- policy calls is_admin() again to decide row visibility — a genuinely self-referential
-- RLS definition. This is NOT the same situation as the Phase 9 SECURITY DEFINER attempt
-- (20260730124858, reverted in 20260730131044) — that one was a wrong guess at an
-- unrelated Storage bug. This one is root-caused via real judge sessions against the
-- actual PostgREST API: any judge querying `programs` or `program_judges` (both have an
-- "admin full access via is_admin()" policy) hit `54001: stack depth limit exceeded`.
--
-- SECURITY DEFINER makes is_admin() run as its owning role (postgres, via migration
-- execution), which is not subject to `profiles`' RLS at all — the self-referential
-- policy simply never gets re-evaluated. The other three Phase 7 helper functions stay
-- SECURITY INVOKER; only is_admin() has this specific self-referential shape.

alter function is_admin() security definer;
