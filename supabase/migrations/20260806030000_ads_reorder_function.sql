-- Follow-up to 20260806020000_ads.sql: that migration's table/RLS/bucket/policies made
-- it onto the remote database, but reorder_ads (the last statement in the file) did not
-- — confirmed by directly querying the remote (ads table + ad-media bucket exist,
-- reorder_ads does not) after a `db push` failed retrying from the top with
-- "relation ads already exists" (42P07). This migration adds only the missing piece;
-- 20260806020000 is reconciled via `supabase migration repair --status applied`
-- rather than re-run, since re-running it would hit the same already-exists error.

create function reorder_ads(p_ids uuid[])
returns void
language plpgsql
as $$
declare
  i int;
begin
  for i in 1 .. array_length(p_ids, 1) loop
    update ads set position = i where id = p_ids[i];
  end loop;
end;
$$;

grant execute on function reorder_ads(uuid[]) to authenticated;
