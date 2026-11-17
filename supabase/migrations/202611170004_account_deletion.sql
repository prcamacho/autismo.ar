-- Let Auth deletion remove account identity without deleting verified community
-- resources, their revisions, sources or recorded moderation decisions.
-- References become anonymous; rate-limit events have no historical purpose.

alter table public.community_proposals
  alter column author_id drop not null,
  drop constraint community_proposals_author_id_fkey,
  drop constraint community_proposals_moderated_by_fkey,
  add constraint community_proposals_author_id_fkey
    foreign key (author_id) references auth.users(id) on delete set null,
  add constraint community_proposals_moderated_by_fkey
    foreign key (moderated_by) references auth.users(id) on delete set null;

alter table public.community_checks
  alter column reviewer_id drop not null,
  drop constraint community_checks_reviewer_id_fkey,
  add constraint community_checks_reviewer_id_fkey
    foreign key (reviewer_id) references auth.users(id) on delete set null;

alter table public.community_reports
  alter column author_id drop not null,
  drop constraint community_reports_author_id_fkey,
  drop constraint community_reports_moderated_by_fkey,
  add constraint community_reports_author_id_fkey
    foreign key (author_id) references auth.users(id) on delete set null,
  add constraint community_reports_moderated_by_fkey
    foreign key (moderated_by) references auth.users(id) on delete set null;

alter table public.community_check_events
  drop constraint community_check_events_reviewer_id_fkey,
  add constraint community_check_events_reviewer_id_fkey
    foreign key (reviewer_id) references auth.users(id) on delete cascade;

-- No grants or RLS changes: null identity never matches auth.uid(). Anonymous
-- checks remain history; the existing independent-review predicate does not
-- count them toward publishing a new or pending proposal.
