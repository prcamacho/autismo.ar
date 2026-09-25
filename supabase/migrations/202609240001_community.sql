-- Community pilot. Run once on an empty Supabase project.
-- All writes go through authenticated, transaction-safe functions.
create table public.community_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator'))
);

create function public.community_normalize(value text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(lower(translate(trim(coalesce(value, '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '\s+', ' ', 'g');
$$;
create function public.community_valid_url(value text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(length(value) between 10 and 1000 and value ~ '^https?://[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]+)?([/?#][^[:space:]]*)?$', false);
$$;
create function public.community_valid_resource(d jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare k text;
begin
  if jsonb_typeof(d) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(d)) <> 11 then return false; end if;
  foreach k in array array['name','description','scope','province','locality','website','phone','hours','coverage'] loop
    if jsonb_typeof(d->k) is distinct from 'string' then return false; end if;
  end loop;
  if length(trim(d->>'name')) not between 3 and 160 or length(trim(d->>'description')) not between 30 and 2000
    or length(d->>'locality') > 120 or length(d->>'phone') > 80 or length(d->>'hours') > 300 or length(d->>'coverage') > 400 then return false; end if;
  if jsonb_typeof(d->'categoryIds') is distinct from 'array' or jsonb_typeof(d->'ageGroups') is distinct from 'array' then return false; end if;
  if jsonb_array_length(d->'categoryIds') not between 1 and 6 or jsonb_array_length(d->'ageGroups') > 3 then return false; end if;
  if exists(select 1 from jsonb_array_elements(d->'categoryIds') x where jsonb_typeof(x) <> 'string') or exists(select 1 from jsonb_array_elements(d->'ageGroups') x where jsonb_typeof(x) <> 'string') then return false; end if;
  if exists(select 1 from jsonb_array_elements_text(d->'categoryIds') x where x not in ('profesionales','centros','educacion','transporte','derechos','comunidad')) then return false; end if;
  if exists(select 1 from jsonb_array_elements_text(d->'ageGroups') x where x not in ('Infancia','Adolescencia','Adultez')) then return false; end if;
  if (d->>'website') <> '' and not public.community_valid_url(d->>'website') then return false; end if;
  if d->>'scope' not in ('national','province','local') then return false; end if;
  if d->>'scope' = 'national' then
    if d->>'province' <> '' or d->>'locality' <> '' then return false; end if;
  else
    if d->>'province' not in ('buenos-aires','ciudad-autonoma-de-buenos-aires','catamarca','chaco','chubut','cordoba','corrientes','entre-rios','formosa','jujuy','la-pampa','la-rioja','mendoza','misiones','neuquen','rio-negro','salta','san-juan','san-luis','santa-cruz','santa-fe','santiago-del-estero','tierra-del-fuego','tucuman') then return false; end if;
    if d->>'scope' = 'local' and length(trim(d->>'locality')) < 2 then return false; end if;
    if d->>'scope' = 'province' and d->>'locality' <> '' then return false; end if;
  end if;
  return true;
end;
$$;

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  version integer not null check (version > 0),
  data jsonb not null check (public.community_valid_resource(data)),
  source_url text not null check (public.community_valid_url(source_url)),
  published_at timestamptz not null default now(),
  visible boolean not null default true
);
create unique index resources_identity on public.resources (
  public.community_normalize(data->>'name'), (data->>'scope'), (data->>'province'), public.community_normalize(data->>'locality')
);
create index resources_categories on public.resources using gin ((data->'categoryIds'));
create index resources_province on public.resources ((data->>'province'));

create table public.community_proposals (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id),
  resource_id uuid references public.resources(id),
  base_version integer not null check (base_version >= 0),
  data jsonb not null check (public.community_valid_resource(data)),
  source_url text not null check (public.community_valid_url(source_url)),
  note text not null check (length(trim(note)) between 10 and 1000),
  status text not null default 'submitted' check (status in ('submitted','reviewing','approved','rejected')),
  decision_note text,
  moderated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index proposals_queue on public.community_proposals (status, created_at);
create index proposals_author on public.community_proposals (author_id, created_at desc);
create table public.community_checks (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.community_proposals(id),
  reviewer_id uuid not null references auth.users(id),
  field text not null check (field in ('name','location','contact','coverage','ages','description')),
  verdict text not null check (verdict in ('matches','disagrees')),
  source_url text not null check (public.community_valid_url(source_url)),
  checked_at timestamptz not null default now(),
  unique (proposal_id, reviewer_id, field)
);
create index checks_reviewer on public.community_checks (reviewer_id, checked_at);
create table public.community_check_events (
  reviewer_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index check_events_rate on public.community_check_events(reviewer_id,created_at);
alter table public.community_check_events enable row level security;
revoke all on public.community_check_events from anon,authenticated;
create table public.resource_revisions (
  resource_id uuid not null references public.resources(id),
  version integer not null,
  data jsonb not null,
  source_url text not null,
  published_at timestamptz not null default now(),
  primary key (resource_id, version)
);
create table public.resource_confirmations (
  resource_id uuid not null references public.resources(id),
  field text not null,
  source_url text not null,
  confirmed_at timestamptz not null,
  version integer not null,
  primary key (resource_id, field)
);
create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id),
  author_id uuid not null references auth.users(id),
  reason text not null check (length(trim(reason)) between 10 and 1000),
  status text not null default 'open' check (status in ('open','resolved')),
  decision_note text,
  moderated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index reports_queue on public.community_reports (status, created_at);
create index reports_author on public.community_reports (author_id, created_at);

create function public.community_is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.community_members where user_id = auth.uid() and role = 'moderator');
$$;
alter table public.community_members enable row level security;
alter table public.resources enable row level security;
alter table public.community_proposals enable row level security;
alter table public.community_checks enable row level security;
alter table public.resource_revisions enable row level security;
alter table public.resource_confirmations enable row level security;
alter table public.community_reports enable row level security;

create policy own_membership on public.community_members for select to authenticated using (user_id = auth.uid());
create policy published_resources on public.resources for select to anon, authenticated using (visible or public.community_is_moderator());
create policy readable_proposals on public.community_proposals for select to authenticated using (author_id = auth.uid() or status = 'reviewing' or public.community_is_moderator());
create policy readable_checks on public.community_checks for select to authenticated using (exists(select 1 from public.community_proposals p where p.id = proposal_id));
create policy published_revisions on public.resource_revisions for select to anon, authenticated using (exists(select 1 from public.resources r where r.id = resource_id));
create policy published_confirmations on public.resource_confirmations for select to anon, authenticated using (exists(select 1 from public.resources r where r.id = resource_id));
create policy own_reports on public.community_reports for select to authenticated using (author_id = auth.uid() or public.community_is_moderator());

-- Supabase default grants must not allow bypassing the workflow.
revoke all on public.community_members, public.resources, public.community_proposals, public.community_checks, public.resource_revisions, public.resource_confirmations, public.community_reports from anon, authenticated;
grant select on public.resources, public.resource_revisions, public.resource_confirmations to anon, authenticated;
grant select on public.community_members, public.community_proposals, public.community_checks, public.community_reports to authenticated;

create function public.community_require_member() returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Serialize writes per person so rate limits cannot be bypassed concurrently.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  insert into public.community_members(user_id) values(actor) on conflict do nothing;
  return actor;
end;
$$;

create function public.community_submit(p_data jsonb, p_source text, p_note text, p_resource uuid default null, p_version integer default 0) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.community_require_member(); result uuid; current_version integer;
begin
  if (select count(*) from public.community_proposals where author_id = actor and created_at > now() - interval '1 day') >= 10 then raise exception 'RATE_LIMIT'; end if;
  if p_resource is not null then
    select version into current_version from public.resources where id = p_resource and visible for share;
    if current_version is null or current_version <> p_version then raise exception 'STALE_VERSION'; end if;
  elsif p_version <> 0 then raise exception 'STALE_VERSION';
  end if;
  if exists(select 1 from public.community_proposals where author_id = actor and data = p_data and resource_id is not distinct from p_resource and status in ('submitted','reviewing')) then raise exception 'DUPLICATE_PROPOSAL'; end if;
  insert into public.community_proposals(author_id, resource_id, base_version, data, source_url, note)
    values(actor, p_resource, p_version, p_data, p_source, trim(p_note)) returning id into result;
  return result;
end;
$$;

create function public.community_field_value(d jsonb, f text) returns jsonb
language sql immutable set search_path = '' as $$
 select case f when 'name' then d->'name'
 when 'location' then jsonb_build_array(d->'scope', d->'province', d->'locality')
 when 'contact' then jsonb_build_array(d->'website',d->'phone',d->'hours')
 when 'coverage' then d->'coverage' when 'ages' then d->'ageGroups'
 when 'description' then jsonb_build_array(d->'description',d->'categoryIds') end;
$$;
create function public.community_required_fields(d jsonb, previous jsonb) returns text[]
language plpgsql immutable set search_path = '' as $$
declare f text; result text[] := '{}';
begin
 foreach f in array array['name','location','contact','coverage','ages','description'] loop
   if previous is not null then
     if public.community_field_value(d,f) is distinct from public.community_field_value(previous,f) then result := array_append(result,f); end if;
   elsif f in ('name','location','description') or (f = 'contact' and concat(d->>'website',d->>'phone',d->>'hours') <> '') or (f = 'coverage' and d->>'coverage' <> '') or (f = 'ages' and jsonb_array_length(d->'ageGroups') > 0) then
     result := array_append(result,f);
   end if;
 end loop;
 if cardinality(result) = 0 then result := array['description']; end if;
 return result;
end;
$$;

create function public.community_check(p_proposal uuid, p_field text, p_verdict text, p_source text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.community_require_member(); proposal public.community_proposals;
begin
 select * into proposal from public.community_proposals where id = p_proposal for update;
 if proposal.id is null or proposal.status <> 'reviewing' then raise exception 'NOT_REVIEWABLE'; end if;
 if proposal.author_id = actor then raise exception 'SELF_REVIEW'; end if;
 if (select count(*) from public.community_check_events where reviewer_id = actor and created_at > now() - interval '1 hour') >= 40 then raise exception 'RATE_LIMIT'; end if;
 insert into public.community_check_events(reviewer_id) values(actor);
 insert into public.community_checks(proposal_id, reviewer_id, field, verdict, source_url)
 values(p_proposal, actor, p_field, p_verdict, p_source)
 on conflict (proposal_id, reviewer_id, field) do update set verdict = excluded.verdict, source_url = excluded.source_url, checked_at = now();
end;
$$;

create function public.community_moderate(p_proposal uuid, p_decision text, p_note text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.community_require_member(); proposal public.community_proposals; previous public.resources; rid uuid; next_version integer; f text; required text[];
begin
 if not public.community_is_moderator() then raise exception 'MODERATOR_REQUIRED'; end if;
 if p_decision is null or p_decision not in ('reviewing','approved','rejected') then raise exception 'INVALID_TRANSITION'; end if;
 if length(trim(p_note)) not between 10 and 1000 or p_note is null then raise exception 'REASON_REQUIRED'; end if;
 select * into proposal from public.community_proposals where id = p_proposal for update;
 if proposal.id is null or proposal.status not in ('submitted','reviewing') then raise exception 'NOT_REVIEWABLE'; end if;
 if proposal.author_id = actor then raise exception 'SELF_REVIEW'; end if;
 if p_decision = 'reviewing' and proposal.status = 'submitted' then
   update public.community_proposals set status = 'reviewing', moderated_by = actor, decision_note = trim(p_note) where id = p_proposal;
   return null;
 elsif p_decision = 'rejected' then
   update public.community_proposals set status = 'rejected', moderated_by = actor, decision_note = trim(p_note), decided_at = now() where id = p_proposal;
   return null;
 elsif p_decision <> 'approved' or proposal.status <> 'reviewing' then raise exception 'INVALID_TRANSITION'; end if;
 if proposal.resource_id is not null then
   select * into previous from public.resources where id = proposal.resource_id and visible for update;
   if previous.id is null or previous.version <> proposal.base_version then raise exception 'STALE_VERSION'; end if;
 end if;
 required := public.community_required_fields(proposal.data, previous.data);
 if exists(select 1 from public.community_checks where proposal_id = p_proposal and verdict = 'disagrees') then raise exception 'UNRESOLVED_DISAGREEMENT'; end if;
 foreach f in array required loop
   if not exists(select 1 from public.community_checks where proposal_id = p_proposal and field = f and verdict = 'matches' and reviewer_id <> proposal.author_id) then raise exception 'MISSING_CHECKS'; end if;
 end loop;
 rid := coalesce(previous.id, gen_random_uuid()); next_version := coalesce(previous.version,0) + 1;
 if previous.id is null then
   insert into public.resources(id,slug,version,data,source_url) values(rid,rid::text,next_version,proposal.data,proposal.source_url);
 else
   update public.resources set version = next_version, data = proposal.data, source_url = proposal.source_url, published_at = now() where id = rid;
 end if;
 insert into public.resource_revisions(resource_id, version, data, source_url) values(rid,next_version,proposal.data,proposal.source_url);
 -- Confirmations describe field values, not general popularity or clinical quality.
 foreach f in array required loop
   delete from public.resource_confirmations where resource_id = rid and field = f;
 end loop;
 insert into public.resource_confirmations(resource_id,field,source_url,confirmed_at,version)
 select distinct on (field) rid,field,source_url,checked_at,next_version from public.community_checks
 where proposal_id = p_proposal and verdict = 'matches' order by field,checked_at desc
 on conflict(resource_id,field) do update set source_url=excluded.source_url, confirmed_at=excluded.confirmed_at, version=excluded.version;
 update public.community_proposals set resource_id = rid, status = 'approved', moderated_by = actor, decision_note = trim(p_note), decided_at = now() where id = p_proposal;
 return rid;
end;
$$;

create function public.community_report(p_resource uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.community_require_member();
begin
 if not exists(select 1 from public.resources where id = p_resource and visible) then raise exception 'RESOURCE_NOT_FOUND'; end if;
 if (select count(*) from public.community_reports where author_id = actor and created_at > now() - interval '1 day') >= 10 then raise exception 'RATE_LIMIT'; end if;
 insert into public.community_reports(resource_id,author_id,reason) values(p_resource,actor,trim(p_reason));
end;
$$;
create function public.community_resolve_report(p_report uuid, p_note text, p_hide boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.community_require_member(); report public.community_reports;
begin
 if not public.community_is_moderator() then raise exception 'MODERATOR_REQUIRED'; end if;
 if p_note is null or length(trim(p_note)) not between 10 and 1000 then raise exception 'REASON_REQUIRED'; end if;
 select * into report from public.community_reports where id = p_report and status = 'open' for update;
 if report.id is null then raise exception 'REPORT_NOT_FOUND'; end if;
 if p_hide then
   update public.resources set visible = false where id = report.resource_id;
   update public.community_proposals set status = 'rejected', moderated_by = actor, decided_at = now(), decision_note = 'La ficha fue retirada de la consulta pública. Moderación debe resolver el reporte antes de incorporar cambios.' where resource_id = report.resource_id and status in ('submitted','reviewing');
 end if;
 update public.community_reports set status = 'resolved', decision_note = trim(p_note), moderated_by = actor where id = p_report;
end;
$$;

create function public.community_search(p_query text default '', p_category text default '', p_province text default '', p_locality text default '', p_age text default '', p_page integer default 1)
returns setof public.resources language sql stable security invoker set search_path = '' as $$
 select r.* from public.resources r where r.visible
 and (p_province = '' or p_province in ('buenos-aires','ciudad-autonoma-de-buenos-aires','catamarca','chaco','chubut','cordoba','corrientes','entre-rios','formosa','jujuy','la-pampa','la-rioja','mendoza','misiones','neuquen','rio-negro','salta','san-juan','san-luis','santa-cruz','santa-fe','santiago-del-estero','tierra-del-fuego','tucuman'))
 and (p_category = '' or r.data->'categoryIds' ? p_category)
 and (p_age = '' or r.data->'ageGroups' ? p_age)
 and (p_province = '' or r.data->>'scope' = 'national' or r.data->>'province' = p_province)
 and (p_locality = '' or (p_province <> '' and (r.data->>'scope' <> 'local' or public.community_normalize(r.data->>'locality') = public.community_normalize(p_locality))))
 and (p_query = '' or strpos(public.community_normalize(concat(r.data->>'name',' ',r.data->>'description',' ',r.data->>'locality',' ',r.data->>'coverage',' ',replace(r.data->>'province','-',' '),' ',r.data->'categoryIds')),public.community_normalize(left(p_query,160))) > 0)
 order by r.published_at desc, r.id limit 21 offset ((greatest(1, least(p_page,10000)) - 1) * 20);
$$;

-- Explicitly restrict every entry point; internal helpers are not exposed RPCs.
revoke all on function public.community_require_member(), public.community_submit(jsonb,text,text,uuid,integer), public.community_check(uuid,text,text,text), public.community_moderate(uuid,text,text), public.community_report(uuid,text), public.community_resolve_report(uuid,text,boolean), public.community_is_moderator(), public.community_search(text,text,text,text,text,integer), public.community_normalize(text), public.community_valid_url(text), public.community_valid_resource(jsonb), public.community_field_value(jsonb,text), public.community_required_fields(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.community_submit(jsonb,text,text,uuid,integer), public.community_check(uuid,text,text,text), public.community_moderate(uuid,text,text), public.community_report(uuid,text), public.community_resolve_report(uuid,text,boolean) to authenticated;
grant execute on function public.community_is_moderator(), public.community_search(text,text,text,text,text,integer), public.community_normalize(text) to anon, authenticated;
