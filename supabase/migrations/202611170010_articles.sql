-- Articles are documents, never executable markup. Apply after the community migrations.
-- Private working copies and reviewed publications have separate rows and policies.
create function public.article_object_keys(d jsonb, keys text[]) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(d) is distinct from 'object' then return false; end if;
  return d ?& keys and (select count(*) from jsonb_object_keys(d)) = cardinality(keys);
end;
$$;

-- Match ECMAScript String.trim used by the server schemas, including Unicode whitespace.
create function public.article_trim(value text) returns text
language sql immutable strict set search_path = '' as $$
  select btrim(value, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
$$;

create function public.article_text(d jsonb, minimum integer, maximum integer) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(d) = 'string'
    and length(public.article_trim(d #>> '{}')) >= minimum and length(d #>> '{}') <= maximum, false);
$$;

create function public.article_date(value text) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if value is null or value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or left(value,4) = '0000' then return false; end if;
  return to_char(value::date, 'YYYY-MM-DD') = value;
exception when datetime_field_overflow or invalid_datetime_format then return false;
end;
$$;

create function public.article_valid_document(d jsonb, publishing boolean default false) returns boolean
language plpgsql immutable set search_path = '' as $$
declare b jsonb; item jsonb; row_data jsonb; field text; min_text integer := case when publishing then 1 else 0 end;
begin
  if publishing is null or not public.article_object_keys(d, array[
    'title','summary','kind','category','province','locality','expiresOn','theme','headingStyle','showCafecito','blocks','agenda','sources'
  ]) then return false; end if;
  -- PostgreSQL's jsonb representation adds whitespace; the browser/server compact limit is 60,000 bytes.
  if octet_length(d::text) > 65536 then return false; end if;
  if not public.article_text(d->'title', case when publishing then 5 else 0 end, 160)
    or not public.article_text(d->'summary',0,300) or not public.article_text(d->'locality',0,100) then return false; end if;
  foreach field in array array['kind','category','province','expiresOn','theme','headingStyle'] loop
    if jsonb_typeof(d->field) is distinct from 'string' then return false; end if;
  end loop;
  if d->>'kind' not in ('article','agenda') or d->>'theme' not in ('blue','teal','violet')
    or d->>'headingStyle' not in ('plain','band') or jsonb_typeof(d->'showCafecito') is distinct from 'boolean' then return false; end if;
  if d->>'category' not in ('','profesionales','centros','educacion','transporte','derechos','comunidad') then return false; end if;
  if d->>'province' not in ('','buenos-aires','ciudad-autonoma-de-buenos-aires','catamarca','chaco','chubut','cordoba','corrientes','entre-rios','formosa','jujuy','la-pampa','la-rioja','mendoza','misiones','neuquen','rio-negro','salta','san-juan','san-luis','santa-cruz','santa-fe','santiago-del-estero','tierra-del-fuego','tucuman') then return false; end if;
  if public.article_trim(d->>'locality') <> '' and d->>'province' = '' then return false; end if;
  if d->>'expiresOn' <> '' and not public.article_date(d->>'expiresOn') then return false; end if;
  foreach field in array array['blocks','agenda','sources'] loop
    if jsonb_typeof(d->field) is distinct from 'array' then return false; end if;
  end loop;
  if jsonb_array_length(d->'blocks') > 40 or jsonb_array_length(d->'agenda') > 60
    or jsonb_array_length(d->'sources') > 10 then return false; end if;
  if publishing and ((d->>'kind' = 'article' and jsonb_array_length(d->'blocks') = 0)
    or (d->>'kind' = 'agenda' and (jsonb_array_length(d->'agenda') = 0 or jsonb_array_length(d->'sources') = 0))) then return false; end if;
  for b in select value from jsonb_array_elements(d->'blocks') loop
    if jsonb_typeof(b) is distinct from 'object' or jsonb_typeof(b->'type') is distinct from 'string' then return false; end if;
    if b->>'type' in ('paragraph','heading','callout') then
      if not public.article_object_keys(b,array['type','text']) or not public.article_text(b->'text',min_text,3000) then return false; end if;
    elsif b->>'type' = 'list' then
      if not public.article_object_keys(b,array['type','items']) or jsonb_typeof(b->'items') is distinct from 'array' then return false; end if;
      if jsonb_array_length(b->'items') not between min_text and 30 then return false; end if;
      for item in select value from jsonb_array_elements(b->'items') loop
        if not public.article_text(item,min_text,1000) then return false; end if;
      end loop;
    elsif b->>'type' = 'link' then
      if not public.article_object_keys(b,array['type','label','url']) or not public.article_text(b->'label',min_text,160)
        or not public.article_text(b->'url',min_text,1000) then return false; end if;
      if b->>'url' <> '' and not public.community_valid_url(b->>'url') then return false; end if;
    elsif b->>'type' = 'table' then
      if not public.article_object_keys(b,array['type','headers','rows']) or jsonb_typeof(b->'headers') is distinct from 'array'
        or jsonb_typeof(b->'rows') is distinct from 'array' then return false; end if;
      if jsonb_array_length(b->'headers') not between min_text and 8 or jsonb_array_length(b->'rows') not between min_text and 30 then return false; end if;
      for item in select value from jsonb_array_elements(b->'headers') loop
        if not public.article_text(item,min_text,100) then return false; end if;
      end loop;
      for row_data in select value from jsonb_array_elements(b->'rows') loop
        if jsonb_typeof(row_data) is distinct from 'array' then return false; end if;
        if jsonb_array_length(row_data) <> jsonb_array_length(b->'headers') then return false; end if;
        for item in select value from jsonb_array_elements(row_data) loop
          if not public.article_text(item,min_text,1000) then return false; end if;
        end loop;
      end loop;
    else return false;
    end if;
  end loop;
  for b in select value from jsonb_array_elements(d->'agenda') loop
    if not public.article_object_keys(b,array['date','title','details','kind']) or not public.article_text(b->'date',min_text,10)
      or not public.article_text(b->'title',min_text,160) or not public.article_text(b->'details',0,1000)
      or jsonb_typeof(b->'kind') is distinct from 'string' or b->>'kind' not in ('request','appointment','activity') then return false; end if;
    if b->>'date' <> '' and not public.article_date(b->>'date') then return false; end if;
    if publishing and d->>'expiresOn' <> '' and d->>'expiresOn' < b->>'date' then return false; end if;
  end loop;
  for b in select value from jsonb_array_elements(d->'sources') loop
    if not public.article_object_keys(b,array['label','url']) or not public.article_text(b->'label',min_text,160)
      or not public.article_text(b->'url',min_text,1000) then return false; end if;
    if b->>'url' <> '' and not public.community_valid_url(b->>'url') then return false; end if;
  end loop;
  return true;
end;
$$;

create function public.article_cafecito_slug(value text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(value ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,59}$' and lower(value) not in (
    'login','logout','register','signup','signin','faq','terms','privacy_policies','my_account','explore','explorar',
    'search','settings','account','api','auth','admin','posts','plans','buttons'
  ), false);
$$;

create table public.article_profiles (
  id uuid not null unique default gen_random_uuid(),
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(public.article_trim(display_name)) between 2 and 80),
  cafecito_slug text check (cafecito_slug is null or public.article_cafecito_slug(cafecito_slug)),
  cafecito_approved boolean not null default false,
  revision integer not null default 1 check (revision > 0),
  decision_note text,
  updated_at timestamptz not null default now(),
  check (not cafecito_approved or cafecito_slug is not null)
);
create table public.article_drafts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null check (public.article_valid_document(data,false)),
  revision integer not null default 1 check (revision > 0),
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected')),
  decision_note text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index article_drafts_author on public.article_drafts(author_id,updated_at desc,id);
create index article_drafts_queue on public.article_drafts(updated_at,id) where status = 'submitted';
create table public.articles (
  id uuid primary key references public.article_drafts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.article_profiles(id) on delete cascade,
  data jsonb not null check (public.article_valid_document(data,true)),
  version integer not null check (version > 0),
  published_at timestamptz not null default now(),
  visible boolean not null default true
);
create index articles_published on public.articles(published_at desc,id) where visible;
create index articles_profile on public.articles(profile_id,published_at desc,id) where visible;
create table public.article_revisions (
  article_id uuid not null references public.articles(id) on delete cascade,
  version integer not null check (version > 0),
  data jsonb not null check (public.article_valid_document(data,true)),
  published_at timestamptz not null default now(),
  primary key (article_id,version)
);
create table public.article_reports (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (length(public.article_trim(reason)) between 10 and 1000),
  status text not null default 'open' check (status in ('open','resolved')),
  decision_note text,
  created_at timestamptz not null default now()
);
create index article_reports_queue on public.article_reports(created_at,id) where status = 'open';
create index article_reports_author on public.article_reports(author_id,created_at desc);
create unique index article_report_open on public.article_reports(article_id,author_id) where status = 'open';
-- One rate-limit row per account avoids retaining a permanent event log.
create table public.article_write_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  writes integer not null
);

alter table public.article_profiles enable row level security;
alter table public.article_drafts enable row level security;
alter table public.articles enable row level security;
alter table public.article_revisions enable row level security;
alter table public.article_reports enable row level security;
alter table public.article_write_limits enable row level security;
create policy article_profile_private on public.article_profiles for select to authenticated using (user_id = auth.uid() or public.community_is_moderator());
create policy article_draft_private on public.article_drafts for select to authenticated using (author_id = auth.uid() or public.community_is_moderator());
create policy article_published on public.articles for select to anon,authenticated using (visible);
create policy article_revision_private on public.article_revisions for select to authenticated using (
  exists(select 1 from public.article_drafts d where d.id = article_id and (d.author_id = auth.uid() or public.community_is_moderator()))
);
create policy article_report_private on public.article_reports for select to authenticated using (author_id = auth.uid() or public.community_is_moderator());
revoke all on public.article_profiles,public.article_drafts,public.articles,public.article_revisions,public.article_reports,public.article_write_limits from public,anon,authenticated;
grant select on public.article_profiles,public.article_drafts,public.article_revisions,public.article_reports to authenticated;
grant select(id,profile_id,data,version,published_at,visible) on public.articles to anon,authenticated;

create function public.article_require_member() returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.community_require_member(); count_writes integer;
begin
  insert into public.article_write_limits(user_id,window_start,writes) values(actor,now(),1)
  on conflict (user_id) do update set
    window_start = case when article_write_limits.window_start <= now()-interval '1 hour' then now() else article_write_limits.window_start end,
    writes = case when article_write_limits.window_start <= now()-interval '1 hour' then 1 else article_write_limits.writes+1 end
  returning writes into count_writes;
  if count_writes > 120 then raise exception 'RATE_LIMIT'; end if;
  return actor;
end;
$$;

create function public.article_profile_save(p_name text,p_cafecito_slug text,p_revision integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.article_require_member(); profile public.article_profiles; result uuid;
begin
  if p_name is null or length(public.article_trim(p_name)) not between 2 and 80 or p_revision is null or p_revision < 0
    or (p_cafecito_slug is not null and not public.article_cafecito_slug(p_cafecito_slug)) then raise exception 'INVALID_PROFILE'; end if;
  select * into profile from public.article_profiles where user_id = actor for update;
  if profile.id is null then
    if p_revision <> 0 then raise exception 'STALE_VERSION'; end if;
    insert into public.article_profiles(user_id,display_name,cafecito_slug) values(actor,public.article_trim(p_name),p_cafecito_slug) returning id into result;
  else
    if profile.revision <> p_revision then raise exception 'STALE_VERSION'; end if;
    update public.article_profiles set display_name=public.article_trim(p_name),cafecito_slug=p_cafecito_slug,
      cafecito_approved=case when cafecito_slug is not distinct from p_cafecito_slug and display_name=public.article_trim(p_name) then cafecito_approved else false end,
      decision_note=case when cafecito_slug is not distinct from p_cafecito_slug and display_name=public.article_trim(p_name) then decision_note else null end,
      revision=revision+1,updated_at=now() where user_id=actor returning id into result;
  end if;
  return result;
end;
$$;

create function public.article_profile_moderate(p_profile uuid,p_revision integer,p_approved boolean,p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.article_require_member(); profile public.article_profiles;
begin
  if not public.community_is_moderator() then raise exception 'MODERATOR_REQUIRED'; end if;
  if p_note is null or length(public.article_trim(p_note)) not between 10 and 1000 or p_approved is null then raise exception 'INVALID_DECISION'; end if;
  select * into profile from public.article_profiles where id=p_profile for update;
  if profile.id is null then raise exception 'NOT_FOUND'; end if;
  if profile.user_id=actor then raise exception 'SELF_REVIEW'; end if;
  if p_revision is null or profile.revision<>p_revision then raise exception 'STALE_VERSION'; end if;
  if profile.cafecito_slug is null then raise exception 'NOT_REVIEWABLE'; end if;
  update public.article_profiles set cafecito_approved=p_approved,decision_note=public.article_trim(p_note),revision=revision+1,updated_at=now() where id=p_profile;
end;
$$;

create function public.article_author(p_id uuid)
returns table(id uuid,display_name text,cafecito_slug text)
language sql stable security definer set search_path = '' as $$
  select p.id,p.display_name,case when p.cafecito_approved then p.cafecito_slug else null end
  from public.article_profiles p where p.id=p_id
    and exists(select 1 from public.articles a where a.profile_id=p.id and a.visible);
$$;

create function public.article_save(p_id uuid,p_data jsonb,p_revision integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.article_require_member(); draft public.article_drafts; result uuid;
begin
  if not public.article_valid_document(p_data,false) then raise exception 'INVALID_ARTICLE'; end if;
  if p_revision is null or p_revision<0 then raise exception 'STALE_VERSION'; end if;
  if p_id is null then
    if p_revision<>0 then raise exception 'STALE_VERSION'; end if;
    if (select count(*) from public.article_drafts where author_id=actor and created_at>now()-interval '1 day') >=20 then raise exception 'RATE_LIMIT'; end if;
    insert into public.article_drafts(author_id,data) values(actor,p_data) returning id into result;
  else
    select * into draft from public.article_drafts where id=p_id for update;
    if draft.id is null or draft.author_id<>actor then raise exception 'NOT_FOUND'; end if;
    if draft.revision<>p_revision then raise exception 'STALE_VERSION'; end if;
    update public.article_drafts set data=p_data,revision=revision+1,status='draft',decision_note=null,updated_at=now() where id=p_id returning id into result;
  end if;
  return result;
end;
$$;

create function public.article_submit(p_article uuid,p_revision integer) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.article_require_member(); draft public.article_drafts;
begin
  select * into draft from public.article_drafts where id=p_article for update;
  if draft.id is null or draft.author_id<>actor then raise exception 'NOT_FOUND'; end if;
  if p_revision is null or draft.revision<>p_revision then raise exception 'STALE_VERSION'; end if;
  if draft.status not in ('draft','rejected') then raise exception 'NOT_REVIEWABLE'; end if;
  if not exists(select 1 from public.article_profiles where user_id=actor) then raise exception 'PROFILE_REQUIRED'; end if;
  if not public.article_valid_document(draft.data,true) then raise exception 'INCOMPLETE_ARTICLE'; end if;
  update public.article_drafts set status='submitted',revision=revision+1,decision_note=null,updated_at=now() where id=p_article;
end;
$$;

create function public.article_moderate(p_article uuid,p_revision integer,p_decision text,p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.article_require_member(); draft public.article_drafts; profile uuid; next_version integer;
begin
  if not public.community_is_moderator() then raise exception 'MODERATOR_REQUIRED'; end if;
  if p_decision is null or p_decision not in ('approved','rejected') or p_note is null or length(public.article_trim(p_note)) not between 10 and 1000 then raise exception 'INVALID_DECISION'; end if;
  select * into draft from public.article_drafts where id=p_article for update;
  if draft.id is null then raise exception 'NOT_FOUND'; end if;
  if draft.author_id=actor then raise exception 'SELF_REVIEW'; end if;
  if p_revision is null or draft.revision<>p_revision then raise exception 'STALE_VERSION'; end if;
  if draft.status<>'submitted' then raise exception 'NOT_REVIEWABLE'; end if;
  if p_decision='approved' then
    if not public.article_valid_document(draft.data,true) then raise exception 'INCOMPLETE_ARTICLE'; end if;
    select id into profile from public.article_profiles where user_id=draft.author_id;
    if profile is null then raise exception 'PROFILE_REQUIRED'; end if;
    select version+1 into next_version from public.articles where id=p_article;
    next_version:=coalesce(next_version,1);
    insert into public.articles(id,author_id,profile_id,data,version) values(p_article,draft.author_id,profile,draft.data,next_version)
      on conflict(id) do update set data=excluded.data,version=excluded.version,published_at=now(),visible=true;
    insert into public.article_revisions(article_id,version,data) values(p_article,next_version,draft.data);
  end if;
  update public.article_drafts set status=p_decision,revision=revision+1,decision_note=public.article_trim(p_note),updated_at=now() where id=p_article;
end;
$$;

create function public.article_withdraw(p_article uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.article_require_member(); draft public.article_drafts;
begin
  select * into draft from public.article_drafts where id=p_article for update;
  if draft.id is null or (draft.author_id<>actor and not public.community_is_moderator()) then raise exception 'NOT_FOUND'; end if;
  update public.articles set visible=false where id=p_article;
  update public.article_drafts set status='draft',revision=revision+1,decision_note='Publicación retirada. Para volver a publicar, enviá una nueva revisión.',updated_at=now() where id=p_article;
end;
$$;

create function public.article_report(p_article uuid,p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.article_require_member();
begin
  if p_reason is null or length(public.article_trim(p_reason)) not between 10 and 1000 then raise exception 'INVALID_REPORT'; end if;
  if not exists(select 1 from public.articles where id=p_article and visible) then raise exception 'NOT_FOUND'; end if;
  if exists(select 1 from public.article_reports where article_id=p_article and author_id=actor and status='open') then raise exception 'DUPLICATE_REPORT'; end if;
  if (select count(*) from public.article_reports where author_id=actor and created_at>now()-interval '1 day')>=10 then raise exception 'RATE_LIMIT'; end if;
  insert into public.article_reports(article_id,author_id,reason) values(p_article,actor,public.article_trim(p_reason));
end;
$$;

create function public.article_resolve_report(p_report uuid,p_note text,p_hide boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.article_require_member(); report public.article_reports;
begin
  if not public.community_is_moderator() then raise exception 'MODERATOR_REQUIRED'; end if;
  if p_note is null or length(public.article_trim(p_note)) not between 10 and 1000 or p_hide is null then raise exception 'INVALID_DECISION'; end if;
  select * into report from public.article_reports where id=p_report for update;
  if report.id is null or report.status<>'open' then raise exception 'NOT_REVIEWABLE'; end if;
  if p_hide then
    -- Lock the draft before its publication, matching save/moderate/withdraw order.
    perform 1 from public.article_drafts where id=report.article_id for update;
    update public.articles set visible=false where id=report.article_id;
    update public.article_drafts set status='rejected',revision=revision+1,decision_note=public.article_trim(p_note),updated_at=now() where id=report.article_id;
  end if;
  update public.article_reports set status='resolved',decision_note=public.article_trim(p_note) where id=p_report;
end;
$$;

revoke all on function public.article_object_keys(jsonb,text[]),public.article_trim(text),public.article_text(jsonb,integer,integer),public.article_date(text),public.article_cafecito_slug(text),public.article_valid_document(jsonb,boolean),public.article_require_member(),public.article_profile_save(text,text,integer),public.article_profile_moderate(uuid,integer,boolean,text),public.article_author(uuid),public.article_save(uuid,jsonb,integer),public.article_submit(uuid,integer),public.article_moderate(uuid,integer,text,text),public.article_withdraw(uuid),public.article_report(uuid,text),public.article_resolve_report(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.article_author(uuid) to anon,authenticated;
grant execute on function public.article_profile_save(text,text,integer),public.article_profile_moderate(uuid,integer,boolean,text),public.article_save(uuid,jsonb,integer),public.article_submit(uuid,integer),public.article_moderate(uuid,integer,text,text),public.article_withdraw(uuid),public.article_report(uuid,text),public.article_resolve_report(uuid,text,boolean) to authenticated;
