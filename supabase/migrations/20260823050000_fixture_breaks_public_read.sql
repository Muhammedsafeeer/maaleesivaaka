-- Admin-requested: the currently-active break (if any) should show on /audience and
-- /tv's "Now Performing" section, same as a currently-scoring program does. Mirrors
-- the existing "anon can read all programs" policy (20260730082605_rls_policies.sql)
-- rather than restricting to just status = 'scoring' — a break's label carries no
-- sensitive information, and matching that precedent keeps the read contract simple
-- and consistent with how programs are already exposed to anon.
create policy "anon can read fixture_breaks"
on fixture_breaks
for select
to anon
using (true);
