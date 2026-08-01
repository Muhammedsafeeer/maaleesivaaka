-- Phase 17 follow-up: drop the 'ongoing' program_status value.
--
-- Starting a program from the Fixture page has always set it straight to 'scoring'
-- (see fixture.service.ts's startNextProgram, and finalize_program_results' auto-advance)
-- — 'ongoing' has been unreachable through the app since that was built. Keeping it
-- around only left it selectable in the admin's manual status-override dropdown, where
-- picking it would silently do nothing useful (no code anywhere treats 'ongoing'
-- differently from 'scoring'). Removing it from the enum removes that dead option at
-- the source of truth instead of just hiding it in the UI.
--
-- Postgres can't drop a single enum value in place, so this recreates the type. Any
-- existing 'ongoing' row is moved to 'scoring' first (Phase 17's real "on stage" state)
-- while the old enum is still active, so the column type swap below never sees a value
-- that's about to stop existing.

update programs set status = 'scoring' where status = 'ongoing';

alter type program_status rename to program_status_old;

create type program_status as enum (
  'draft',
  'upcoming',
  'scoring',
  'completed',
  'published'
);

alter table programs
  alter column status drop default,
  alter column status type program_status using status::text::program_status,
  alter column status set default 'draft';

drop type program_status_old;
