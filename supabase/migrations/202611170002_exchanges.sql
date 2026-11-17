-- Búsquedas y disponibilidad. Apply after the official locations catalog.
-- No user data, email addresses or remote services are created by this migration.

create function public.exchange_string_array(v jsonb, max_items integer, allowed text[] default null)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(v) is distinct from 'array' then return false; end if;
  if jsonb_array_length(v) > max_items then return false; end if;
  if exists(select 1 from jsonb_array_elements(v) x where jsonb_typeof(x) <> 'string') then return false; end if;
  if exists(select 1 from jsonb_array_elements_text(v) x where length(x) > 120 or length(x) = 0
    or (allowed is not null and not (x = any(allowed)))) then return false; end if;
  return (select count(*) = count(distinct x) from jsonb_array_elements_text(v) x);
end;
$$;
create function public.exchange_public_text(v text) returns boolean
language sql immutable set search_path = '' as $$
  select v !~* '([[:alnum:]_.+-]+@[[:alnum:].-]+\.[a-z]{2,}|https?://|www\.|([+]?[0-9][[:space:]().-]*){8,})';
$$;

create function public.exchange_valid_profile(d jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare k text;
begin
  if jsonb_typeof(d) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(d)) <> 9 then return false; end if;
  foreach k in array array['name','title','institution','registration','description'] loop
    if jsonb_typeof(d->k) is distinct from 'string' then return false; end if;
    if k<>'registration' and not public.exchange_public_text(d->>k) then return false; end if;
  end loop;
  if length(trim(d->>'name')) not between 2 and 100 or length(trim(d->>'title')) not between 2 and 160
    or length(d->>'institution') > 160 or length(d->>'registration') > 120
    or length(trim(d->>'description')) not between 20 and 1500 then return false; end if;
  if jsonb_typeof(d->'graduationYear') not in ('null','number') or not d ? 'graduationYear'
    or jsonb_typeof(d->'experienceYears') is distinct from 'number' then return false; end if;
  if d->>'graduationYear' is not null and (d->>'graduationYear' !~ '^\d{4}$'
    or (d->>'graduationYear')::integer not between 1900 and 2100) then return false; end if;
  if d->>'experienceYears' !~ '^\d{1,2}$' or (d->>'experienceYears')::integer > 80 then return false; end if;
  if not public.exchange_string_array(d->'ageGroups',4,array['Infancia','Adolescencia','Adultez','Personas mayores']) then return false; end if;
  if jsonb_typeof(d->'photoPath') not in ('null','string') or not d ? 'photoPath' then return false; end if;
  if d->>'photoPath' is not null and d->>'photoPath' !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$' then return false; end if;
  return true;
end;
$$;

create function public.exchange_valid_listing(d jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare k text;
begin
  if jsonb_typeof(d) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(d)) <> 13 then return false; end if;
  foreach k in array array['title','service','role','description','modality','startDate','availability','engagement'] loop
    if jsonb_typeof(d->k) is distinct from 'string' then return false; end if;
    if k in ('title','role','description','engagement') and not public.exchange_public_text(d->>k) then return false; end if;
  end loop;
  if length(trim(d->>'title')) not between 5 and 120 or length(trim(d->>'role')) not between 2 and 120
    or length(trim(d->>'description')) not between 20 and 1500 or length(d->>'engagement') > 200 then return false; end if;
  if d->>'service' not in ('inclusion-escolar','acompanamiento-terapeutico','psicologia','psicopedagogia',
    'fonoaudiologia','terapia-ocupacional','kinesiologia','medicina','otros-apoyos') then return false; end if;
  if d->>'modality' not in ('presencial','virtual','mixta')
    or d->>'availability' not in ('available','limited','unavailable') then return false; end if;
  if d->>'startDate' <> '' then
    if d->>'startDate' !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
    begin perform (d->>'startDate')::date; exception when others then return false; end;
  end if;
  if not public.exchange_string_array(d->'days',7,array['lunes','martes','miercoles','jueves','viernes','sabado','domingo'])
    or not public.exchange_string_array(d->'shifts',3,array['manana','tarde','noche'])
    or not public.exchange_string_array(d->'ageGroups',4,array['Infancia','Adolescencia','Adultez','Personas mayores'])
    or not public.exchange_string_array(d->'locationIds',30) then return false; end if;
  if jsonb_array_length(d->'locationIds') < 1 or jsonb_typeof(d->'receiveRequests') is distinct from 'boolean' then return false; end if;
  if jsonb_array_length(d->'days') < 1 or jsonb_array_length(d->'shifts') < 1 then return false; end if;
  return true;
end;
$$;

create table public.exchange_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  adult_confirmed_at timestamptz not null default now(),
  notifications boolean not null default false
);
create table public.exchange_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.exchange_accounts(user_id) on delete cascade,
  data jsonb not null check (public.exchange_valid_profile(data)),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_public boolean not null default false,
  version integer not null default 1 check (version > 0),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.exchange_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.exchange_accounts(user_id) on delete cascade,
  profile_id uuid references public.exchange_profiles(id) on delete cascade,
  kind text not null check (kind in ('offer','request')),
  data jsonb not null check (public.exchange_valid_listing(data)),
  status text not null default 'pending' check (status in ('pending','published','rejected','paused','closed')),
  expires_at timestamptz,
  version integer not null default 1 check (version > 0),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  creation_nonce uuid not null,
  unique(user_id,creation_nonce),
  check ((kind = 'offer' and profile_id is not null) or (kind = 'request' and profile_id is null))
);
create index exchange_listings_owner on public.exchange_listings(user_id,created_at desc);
create index exchange_listings_search on public.exchange_listings(kind,status,expires_at,created_at desc);
create index exchange_listings_service on public.exchange_listings((data->>'service'));
create table public.exchange_listing_places (
  listing_id uuid not null references public.exchange_listings(id) on delete cascade,
  place_id text not null references public.exchange_places(id),
  primary key(listing_id,place_id)
);
create index exchange_places_listing on public.exchange_listing_places(place_id,listing_id);
create table public.exchange_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.exchange_listings(id) on delete set null,
  sender_id uuid not null references public.exchange_accounts(user_id) on delete cascade,
  recipient_id uuid not null references public.exchange_accounts(user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  nonce uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deletion_warning_at timestamptz,
  check(sender_id <> recipient_id),
  unique(sender_id,nonce),
  unique(listing_id,sender_id)
);
create index exchange_conversations_sender on public.exchange_conversations(sender_id,updated_at desc);
create index exchange_conversations_recipient on public.exchange_conversations(recipient_id,updated_at desc);
create index exchange_conversations_retention on public.exchange_conversations(updated_at,deletion_warning_at);
create table public.exchange_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.exchange_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(length(trim(body)) between 1 and 2000),
  nonce uuid not null,
  created_at timestamptz not null default now(),
  unique(sender_id,nonce)
);
create index exchange_messages_conversation on public.exchange_messages(conversation_id,created_at desc,id);
create table public.exchange_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id <> blocked_id)
);
create table public.exchange_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_kind text not null check(target_kind in ('profile','listing','conversation')),
  target_id uuid not null,
  reason text not null check(length(trim(reason)) between 10 and 1000),
  status text not null default 'open' check(status in ('open','resolved')),
  evidence jsonb not null,
  review_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index exchange_reports_open on public.exchange_reports(reporter_id,target_kind,target_id) where status='open';
create index exchange_reports_queue on public.exchange_reports(status,created_at);
create table public.exchange_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
create index exchange_events_rate on public.exchange_events(user_id,kind,created_at);
create table public.exchange_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
-- Outbox contains only account IDs. A dedicated server worker resolves email privately.
create table public.exchange_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('activity','retention')),
  status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
  available_at timestamptz not null default now(),
  attempts integer not null default 0,
  claim_token uuid,
  claimed_at timestamptz,
  last_sent_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id,kind)
);
create index exchange_notifications_due on public.exchange_notifications(status,available_at);
create table public.exchange_delivery_events (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.exchange_notifications(id) on delete set null,
  token uuid not null,
  created_at timestamptz not null default now(),
  delivered boolean not null default false
);
create index exchange_delivery_budget on public.exchange_delivery_events(created_at);
create index exchange_delivery_key on public.exchange_delivery_events(token,created_at);

create function public.exchange_member() returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.exchange_deletion_requests where user_id=u) then raise exception 'ACCOUNT_DELETING'; end if;
  if not exists(select 1 from public.exchange_accounts where user_id=u) then raise exception 'ADULT_REQUIRED'; end if;
  return u;
end;
$$;
create function public.exchange_rate(u uuid, k text, max_count integer, period interval) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('exchange-rate:' || u::text || ':' || k,0));
  if (select count(*) from public.exchange_events where user_id=u and kind=k and created_at > now()-period) >= max_count then
    raise exception 'RATE_LIMIT';
  end if;
  insert into public.exchange_events(user_id,kind) values(u,k);
end;
$$;
create function public.exchange_pair_lock(a uuid,b uuid) returns void
language sql security definer set search_path = '' as $$
  select pg_advisory_xact_lock(hashtextextended('exchange-pair:' || least(a,b)::text || ':' || greatest(a,b)::text,0));
$$;
create function public.exchange_is_blocked(a uuid,b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.exchange_blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a));
$$;
create function public.exchange_queue(u uuid,k text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.exchange_accounts where user_id=u and notifications) then return; end if;
  insert into public.exchange_notifications(user_id,kind) values(u,k)
  on conflict(user_id,kind) do update set
    status=case when public.exchange_notifications.status='sending' then 'sending' else 'pending' end,
    available_at=greatest(now(),coalesce(public.exchange_notifications.last_sent_at + interval '1 day',now())),
    attempts=case when public.exchange_notifications.status='sending' then public.exchange_notifications.attempts else 0 end,
    updated_at=clock_timestamp();
end;
$$;
create function public.exchange_visible(l public.exchange_listings) returns boolean
language sql stable security definer set search_path = '' as $$
  select l.status='published' and l.expires_at>now() and (
    (l.kind='request' and auth.uid() is not null) or
    (l.kind='offer' and exists(select 1 from public.exchange_profiles p where p.id=l.profile_id and p.status='approved' and p.is_public))
  );
$$;

-- Raw rows contain moderation notes and account IDs; public reads use DTO RPCs below.
do $$
declare t text;
begin
  foreach t in array array['exchange_accounts','exchange_profiles','exchange_listings','exchange_listing_places',
    'exchange_conversations','exchange_messages','exchange_blocks','exchange_reports','exchange_events',
    'exchange_deletion_requests','exchange_notifications','exchange_delivery_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
  end loop;
end;
$$;
grant select on public.exchange_accounts,public.exchange_profiles,public.exchange_listings,public.exchange_listing_places,
  public.exchange_conversations,public.exchange_messages,public.exchange_blocks,public.exchange_reports,public.exchange_deletion_requests to authenticated;
create policy exchange_accounts_self on public.exchange_accounts for select to authenticated using(user_id=auth.uid());
create policy exchange_profiles_private on public.exchange_profiles for select to authenticated using(user_id=auth.uid() or public.community_is_moderator());
create policy exchange_listings_private on public.exchange_listings for select to authenticated using(user_id=auth.uid() or public.community_is_moderator());
create policy exchange_listing_places_private on public.exchange_listing_places for select to authenticated using(exists(
  select 1 from public.exchange_listings l where l.id=listing_id and (l.user_id=auth.uid() or public.community_is_moderator())));
create policy exchange_conversations_private on public.exchange_conversations for select to authenticated using(auth.uid() in (sender_id,recipient_id));
create policy exchange_messages_private on public.exchange_messages for select to authenticated using(exists(
  select 1 from public.exchange_conversations c where c.id=conversation_id and auth.uid() in (c.sender_id,c.recipient_id)));
create policy exchange_blocks_private on public.exchange_blocks for select to authenticated using(auth.uid() in (blocker_id,blocked_id));
create policy exchange_reports_private on public.exchange_reports for select to authenticated using(reporter_id=auth.uid() or public.community_is_moderator());
create policy exchange_deletion_requests_self on public.exchange_deletion_requests for select to authenticated using(user_id=auth.uid());

create function public.exchange_enroll(p_adult boolean,p_notifications boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_adult is distinct from true then raise exception 'ADULT_REQUIRED'; end if;
  if p_notifications is null then raise exception 'INVALID_INPUT'; end if;
  if exists(select 1 from public.exchange_deletion_requests where user_id=u) then raise exception 'ACCOUNT_DELETING'; end if;
  insert into public.exchange_accounts(user_id,notifications) values(u,p_notifications)
    on conflict(user_id) do update set notifications=excluded.notifications;
  if not p_notifications then delete from public.exchange_notifications where user_id=u and status<>'sending'; end if;
end;
$$;
create function public.exchange_save_profile(p_data jsonb,p_public boolean,p_version integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := public.exchange_member(); p public.exchange_profiles; result uuid;
begin
  if p_public is null or p_version is null or not public.exchange_valid_profile(p_data) then raise exception 'INVALID_INPUT'; end if;
  if p_data->>'photoPath' is not null and p_data->>'photoPath' !~ ('^' || u::text || '/[0-9a-f-]{36}\.webp$') then raise exception 'INVALID_PHOTO'; end if;
  perform pg_advisory_xact_lock(hashtextextended('exchange-profile:' || u::text,0));
  select * into p from public.exchange_profiles where user_id=u for update;
  if not found then
    if p_version<>0 then raise exception 'STALE_VERSION'; end if;
    perform public.exchange_rate(u,'profile',10,interval '1 hour');
    insert into public.exchange_profiles(user_id,data,is_public) values(u,p_data,p_public) returning id into result;
  else
    if p.version<>p_version then raise exception 'STALE_VERSION'; end if;
    if p.data=p_data and p.is_public=p_public then return p.id; end if;
    perform public.exchange_rate(u,'profile',10,interval '1 hour');
    update public.exchange_profiles set data=p_data,is_public=p_public,version=version+1,updated_at=now(),
      status=case when data is distinct from p_data then 'pending' else status end,
      review_note=case when data is distinct from p_data then null else review_note end where id=p.id;
    result:=p.id;
  end if;
  return result;
end;
$$;
create function public.exchange_reserve_photo() returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member();
begin
  perform public.exchange_rate(u,'photo-hour',5,interval '1 hour');
  perform public.exchange_rate(u,'photo-day',10,interval '24 hours');
end;
$$;
create function public.exchange_save_listing(p_id uuid,p_kind text,p_data jsonb,p_version integer,p_nonce uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member(); l public.exchange_listings; pid uuid; result uuid;
begin
  if p_kind is null or p_kind not in ('offer','request') or p_version is null or p_nonce is null or not public.exchange_valid_listing(p_data) then raise exception 'INVALID_INPUT'; end if;
  if exists(select 1 from jsonb_array_elements_text(p_data->'locationIds') x where not exists(select 1 from public.exchange_places where id=x)) then raise exception 'INVALID_LOCATION'; end if;
  if p_id is null then
    perform pg_advisory_xact_lock(hashtextextended('exchange-create:' || u::text,0));
    select * into l from public.exchange_listings where user_id=u and creation_nonce=p_nonce;
    if found then
      if l.kind<>p_kind or l.data<>p_data then raise exception 'NONCE_REUSED'; end if;
      return l.id;
    end if;
  end if;
  if p_kind='offer' then
    select id into pid from public.exchange_profiles where user_id=u;
    if pid is null then raise exception 'PROFILE_REQUIRED'; end if;
  end if;
  if p_id is not null then
    select * into l from public.exchange_listings where id=p_id and user_id=u for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if l.kind<>p_kind then raise exception 'INVALID_INPUT'; end if;
    if l.version<>p_version then raise exception 'STALE_VERSION'; end if;
    if l.data=p_data then return l.id; end if;
  elsif p_version<>0 then raise exception 'STALE_VERSION';
  end if;
  perform public.exchange_rate(u,'listing',10,interval '1 hour');
  if p_id is null then
    insert into public.exchange_listings(user_id,profile_id,kind,data,creation_nonce) values(u,pid,p_kind,p_data,p_nonce) returning id into result;
  else
    update public.exchange_listings set data=p_data,version=version+1,updated_at=now(),
      status=case when (l.data-array['days','shifts','startDate','availability'])=(p_data-array['days','shifts','startDate','availability']) then l.status else 'pending' end,
      review_note=case when (l.data-array['days','shifts','startDate','availability'])=(p_data-array['days','shifts','startDate','availability']) then l.review_note else null end
      where id=p_id;
    result:=p_id;
    delete from public.exchange_listing_places where listing_id=p_id;
  end if;
  insert into public.exchange_listing_places(listing_id,place_id) select result,x from jsonb_array_elements_text(p_data->'locationIds') x;
  return result;
end;
$$;
create function public.exchange_listing_state(p_id uuid,p_state text) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member(); l public.exchange_listings;
begin
  if p_state is null or p_state not in ('renew','paused','closed','delete') then raise exception 'INVALID_INPUT'; end if;
  select * into l from public.exchange_listings where id=p_id and user_id=u for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.exchange_rate(u,'listing-state',30,interval '1 hour');
  if p_state='delete' then delete from public.exchange_listings where id=p_id; return; end if;
  if p_state='renew' then
    if l.status not in ('published','paused','closed') or l.expires_at is null then raise exception 'REVIEW_REQUIRED'; end if;
    if l.kind='offer' and not exists(select 1 from public.exchange_profiles where id=l.profile_id and status='approved' and is_public) then raise exception 'PROFILE_REVIEW_REQUIRED'; end if;
    update public.exchange_listings set status='published',expires_at=now()+case when kind='offer' then interval '60 days' else interval '30 days' end,
      updated_at=now(),version=version+1 where id=p_id;
  else
    -- Unreviewed records cannot become renewable by pausing or closing them.
    if l.status in ('pending','rejected') then raise exception 'REVIEW_REQUIRED'; end if;
    update public.exchange_listings set status=p_state,updated_at=now(),version=version+1 where id=p_id;
  end if;
end;
$$;
create function public.exchange_moderate(p_kind text,p_id uuid,p_decision text,p_note text,p_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); owner_id uuid; current_version integer; l public.exchange_listings;
begin
  if not public.community_is_moderator() then raise exception 'MODERATOR_REQUIRED'; end if;
  if p_decision is null or p_decision not in ('approved','rejected') or p_note is null or length(trim(p_note)) not between 10 and 1000 then raise exception 'INVALID_INPUT'; end if;
  if p_kind='profile' then
    select user_id,version into owner_id,current_version from public.exchange_profiles where id=p_id for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if owner_id=u then raise exception 'SELF_REVIEW'; end if;
    if current_version is distinct from p_version then raise exception 'STALE_VERSION'; end if;
    update public.exchange_profiles set status=p_decision,review_note=trim(p_note),version=version+1,updated_at=now() where id=p_id;
  elsif p_kind='listing' then
    select * into l from public.exchange_listings where id=p_id for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if l.user_id=u then raise exception 'SELF_REVIEW'; end if;
    if l.version is distinct from p_version then raise exception 'STALE_VERSION'; end if;
    if p_decision='approved' and l.kind='offer' and not exists(select 1 from public.exchange_profiles where id=l.profile_id and status='approved' and is_public) then raise exception 'PROFILE_REVIEW_REQUIRED'; end if;
    update public.exchange_listings set status=case when p_decision='approved' then 'published' else 'rejected' end,
      expires_at=case when p_decision='approved' then now()+case when kind='offer' then interval '60 days' else interval '30 days' end else null end,
      review_note=trim(p_note),version=version+1,updated_at=now() where id=p_id;
  else raise exception 'INVALID_INPUT'; end if;
end;
$$;

create function public.exchange_listing(p_id uuid)
returns table(id uuid,kind text,data jsonb,status text,expires_at timestamptz,version integer,profile jsonb,owner boolean,review_note text,created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.id,l.kind,l.data,l.status,l.expires_at,l.version,
    case when p.id is not null then jsonb_build_object('id',p.id,'data',(p.data-'photoPath') || jsonb_build_object('hasPhoto',p.data->>'photoPath' is not null)) else null end,
    coalesce(l.user_id=auth.uid(),false),case when l.user_id=auth.uid() or public.community_is_moderator() then l.review_note else null end,l.created_at
  from public.exchange_listings l left join public.exchange_profiles p on p.id=l.profile_id
  where l.id=p_id and (public.exchange_visible(l) or l.user_id=auth.uid() or public.community_is_moderator());
$$;
create function public.exchange_profile(p_id uuid)
returns table(id uuid,data jsonb,status text,is_public boolean,version integer,owner boolean,review_note text,updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id,(p.data-'photoPath') || jsonb_build_object('hasPhoto',p.data->>'photoPath' is not null),p.status,p.is_public,p.version,coalesce(p.user_id=auth.uid(),false),
    case when p.user_id=auth.uid() or public.community_is_moderator() then p.review_note else null end,p.updated_at
  from public.exchange_profiles p where p.id=p_id and ((p.status='approved' and p.is_public) or p.user_id=auth.uid() or public.community_is_moderator());
$$;
create function public.exchange_photo_access(p_profile uuid,p_viewer uuid)
returns table(path text)
language sql stable security definer set search_path = '' as $$
  select p.data->>'photoPath' from public.exchange_profiles p
  where p.id=p_profile and p.data->>'photoPath' is not null
    and ((p.status='approved' and p.is_public) or p.user_id=p_viewer
      or exists(select 1 from public.community_members where user_id=p_viewer and role='moderator'));
$$;
create function public.exchange_search(p_kind text,p_service text,p_province text,p_place text,p_page integer,p_modality text default '',p_availability text default '')
returns table(id uuid,kind text,data jsonb,status text,expires_at timestamptz,version integer,profile jsonb,owner boolean,review_note text,created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.id,l.kind,l.data,l.status,l.expires_at,l.version,
    case when p.id is not null then jsonb_build_object('id',p.id,'data',(p.data-'photoPath') || jsonb_build_object('hasPhoto',p.data->>'photoPath' is not null)) else null end,
    coalesce(l.user_id=auth.uid(),false),null::text,l.created_at
  from public.exchange_listings l left join public.exchange_profiles p on p.id=l.profile_id
  -- Keep coarse predicates visible to the planner; the helper enforces the full privacy rule.
  where l.status='published' and l.expires_at>now() and public.exchange_visible(l)
    and (p_availability='unavailable' or l.data->>'availability'<>'unavailable')
    and (coalesce(p_kind,'')='' or l.kind=p_kind)
    and (coalesce(p_service,'')='' or l.data->>'service'=p_service)
    and (coalesce(p_modality,'')='' or l.data->>'modality'=p_modality)
    and (coalesce(p_availability,'')='' or l.data->>'availability'=p_availability)
    and (coalesce(p_province,'')='' and coalesce(p_place,'')='' or exists(
      select 1 from public.exchange_listing_places lp join public.exchange_places gp on gp.id=lp.place_id
      where lp.listing_id=l.id and (coalesce(p_province,'')='' or gp.province=p_province) and (coalesce(p_place,'')='' or gp.id=p_place)))
  order by l.created_at desc,l.id
  limit 21 offset (least(greatest(coalesce(p_page,1),1),10000)-1)*20;
$$;

create function public.exchange_request(p_listing uuid,p_body text,p_nonce uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member(); l public.exchange_listings; c public.exchange_conversations; result uuid;
begin
  if p_body is null or length(trim(p_body)) not between 1 and 800 or p_nonce is null then raise exception 'INVALID_INPUT'; end if;
  select * into c from public.exchange_conversations where sender_id=u and nonce=p_nonce;
  if found then
    if c.listing_id is distinct from p_listing then raise exception 'NONCE_REUSED'; end if;
    if not exists(select 1 from public.exchange_messages where conversation_id=c.id and nonce=p_nonce and body=trim(p_body)) then raise exception 'NONCE_REUSED'; end if;
    return c.id;
  end if;
  select * into l from public.exchange_listings where id=p_listing;
  if not found then raise exception 'LISTING_UNAVAILABLE'; end if;
  -- Follow the same profile -> listing lock order as cascading profile deletion.
  if l.profile_id is not null then perform 1 from public.exchange_profiles where id=l.profile_id for share; end if;
  select * into l from public.exchange_listings where id=p_listing for share;
  if not found or not public.exchange_visible(l) or l.data->>'availability'='unavailable' or l.data->>'receiveRequests'<>'true' then raise exception 'LISTING_UNAVAILABLE'; end if;
  if l.user_id=u then raise exception 'SELF_CONTACT'; end if;
  perform public.exchange_pair_lock(u,l.user_id);
  if public.exchange_is_blocked(u,l.user_id) then raise exception 'CONTACT_BLOCKED'; end if;
  if exists(select 1 from public.exchange_deletion_requests where user_id=l.user_id) then raise exception 'LISTING_UNAVAILABLE'; end if;
  select * into c from public.exchange_conversations where sender_id=u and listing_id=p_listing;
  if found then
    if c.nonce=p_nonce then
      if not exists(select 1 from public.exchange_messages where conversation_id=c.id and nonce=p_nonce and body=trim(p_body)) then raise exception 'NONCE_REUSED'; end if;
      return c.id;
    end if;
    raise exception 'CONTACT_EXISTS';
  end if;
  perform public.exchange_rate(u,'request',5,interval '24 hours');
  insert into public.exchange_conversations(listing_id,sender_id,recipient_id,nonce)
    values(p_listing,u,l.user_id,p_nonce) returning id into result;
  insert into public.exchange_messages(conversation_id,sender_id,body,nonce) values(result,u,trim(p_body),p_nonce);
  perform public.exchange_queue(l.user_id,'activity');
  return result;
end;
$$;
create function public.exchange_respond(p_id uuid,p_decision text) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member(); c public.exchange_conversations;
begin
  if p_decision is null or p_decision not in ('accepted','rejected') then raise exception 'INVALID_INPUT'; end if;
  select * into c from public.exchange_conversations where id=p_id and recipient_id=u;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.exchange_pair_lock(c.sender_id,c.recipient_id);
  select * into c from public.exchange_conversations where id=p_id for update;
  if public.exchange_is_blocked(c.sender_id,c.recipient_id) then raise exception 'CONTACT_BLOCKED'; end if;
  if c.status=p_decision then return; end if;
  if c.status<>'pending' then raise exception 'CONTACT_NOT_PENDING'; end if;
  update public.exchange_conversations set status=p_decision,updated_at=now(),deletion_warning_at=null where id=p_id;
  perform public.exchange_queue(c.sender_id,'activity');
end;
$$;
create function public.exchange_send(p_conversation uuid,p_body text,p_nonce uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member(); c public.exchange_conversations; m public.exchange_messages; result uuid;
begin
  if p_body is null or length(trim(p_body)) not between 1 and 2000 or p_nonce is null then raise exception 'INVALID_INPUT'; end if;
  select * into c from public.exchange_conversations where id=p_conversation and u in (sender_id,recipient_id);
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.exchange_pair_lock(c.sender_id,c.recipient_id);
  select * into c from public.exchange_conversations where id=p_conversation for update;
  if public.exchange_is_blocked(c.sender_id,c.recipient_id) then raise exception 'CONTACT_BLOCKED'; end if;
  if c.status<>'accepted' then raise exception 'CONTACT_NOT_ACCEPTED'; end if;
  select * into m from public.exchange_messages where sender_id=u and nonce=p_nonce;
  if found then
    if m.conversation_id<>p_conversation or m.body<>trim(p_body) then raise exception 'NONCE_REUSED'; end if;
    return m.id;
  end if;
  perform public.exchange_rate(u,'message',60,interval '1 hour');
  insert into public.exchange_messages(conversation_id,sender_id,body,nonce) values(p_conversation,u,trim(p_body),p_nonce) returning id into result;
  update public.exchange_conversations set updated_at=now(),deletion_warning_at=null where id=p_conversation;
  perform public.exchange_queue(case when c.sender_id=u then c.recipient_id else c.sender_id end,'activity');
  return result;
end;
$$;
create function public.exchange_block(p_conversation uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member(); c public.exchange_conversations; other_id uuid;
begin
  select * into c from public.exchange_conversations where id=p_conversation and u in (sender_id,recipient_id);
  if not found then raise exception 'NOT_FOUND'; end if;
  other_id:=case when u=c.sender_id then c.recipient_id else c.sender_id end;
  perform public.exchange_pair_lock(u,other_id);
  insert into public.exchange_blocks(blocker_id,blocked_id) values(u,other_id) on conflict do nothing;
end;
$$;

create function public.exchange_report(p_kind text,p_id uuid,p_reason text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member(); snapshot jsonb; result uuid;
begin
  if p_reason is null or length(trim(p_reason)) not between 10 and 1000 then raise exception 'INVALID_INPUT'; end if;
  if p_kind='profile' then
    select to_jsonb(p) into snapshot from public.exchange_profile(p_id) p;
  elsif p_kind='listing' then
    select to_jsonb(l) into snapshot from public.exchange_listing(p_id) l;
  elsif p_kind='conversation' then
    if not exists(select 1 from public.exchange_conversations where id=p_id and u in (sender_id,recipient_id)) then raise exception 'NOT_FOUND'; end if;
    select jsonb_build_object('messages',coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb)) into snapshot from (
      select id,sender_id,body,created_at from public.exchange_messages where conversation_id=p_id order by created_at desc,id desc limit 20
    ) m;
  else raise exception 'INVALID_INPUT'; end if;
  if snapshot is null then raise exception 'NOT_FOUND'; end if;
  select id into result from public.exchange_reports where reporter_id=u and target_kind=p_kind and target_id=p_id and status='open';
  if result is not null then return result; end if;
  perform public.exchange_rate(u,'report',10,interval '24 hours');
  insert into public.exchange_reports(reporter_id,target_kind,target_id,reason,evidence)
    values(u,p_kind,p_id,trim(p_reason),snapshot) returning id into result;
  return result;
end;
$$;
create function public.exchange_resolve_report(p_id uuid,p_note text,p_hide boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.exchange_reports;
begin
  if not public.community_is_moderator() then raise exception 'MODERATOR_REQUIRED'; end if;
  if p_note is null or length(trim(p_note)) not between 10 and 1000 or p_hide is null then raise exception 'INVALID_INPUT'; end if;
  select * into r from public.exchange_reports where id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if r.reporter_id=auth.uid() then raise exception 'SELF_REVIEW'; end if;
  if (r.target_kind='profile' and exists(select 1 from public.exchange_profiles where id=r.target_id and user_id=auth.uid()))
    or (r.target_kind='listing' and exists(select 1 from public.exchange_listings where id=r.target_id and user_id=auth.uid()))
    or (r.target_kind='conversation' and exists(select 1 from public.exchange_conversations where id=r.target_id and auth.uid() in (sender_id,recipient_id))) then
    raise exception 'SELF_REVIEW';
  end if;
  if r.status<>'open' then raise exception 'REPORT_RESOLVED'; end if;
  if p_hide then
    if r.target_kind='profile' then
      if exists(select 1 from public.exchange_profiles where id=r.target_id and user_id=auth.uid()) then raise exception 'SELF_REVIEW'; end if;
      update public.exchange_profiles set status='rejected',review_note=trim(p_note),version=version+1,updated_at=now() where id=r.target_id;
    elsif r.target_kind='listing' then
      if exists(select 1 from public.exchange_listings where id=r.target_id and user_id=auth.uid()) then raise exception 'SELF_REVIEW'; end if;
      update public.exchange_listings set status='rejected',expires_at=null,review_note=trim(p_note),version=version+1,updated_at=now() where id=r.target_id;
    else
      update public.exchange_conversations set status='rejected' where id=r.target_id;
    end if;
  end if;
  update public.exchange_reports set status='resolved',review_note=trim(p_note),resolved_at=now() where id=p_id;
end;
$$;
create function public.exchange_delete_account() returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid();
begin
  if u is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Preserve only submitted report evidence until resolution; raw inbox content is removed.
  insert into public.exchange_deletion_requests(user_id) values(u) on conflict do nothing;
  delete from public.exchange_profiles where user_id=u;
  delete from public.exchange_listings where user_id=u;
  delete from public.exchange_conversations where sender_id=u or recipient_id=u;
  delete from public.exchange_blocks where blocker_id=u or blocked_id=u;
  delete from public.exchange_notifications where user_id=u;
  delete from public.exchange_accounts where user_id=u;
  delete from public.exchange_events where user_id=u;
end;
$$;

-- Service-only routines: grants are conditional so isolated PostgreSQL tests need no service credential.
create function public.exchange_maintenance()
returns table(warned integer,deleted integer,expired integer,notifications_failed integer)
language plpgsql security definer set search_path = '' as $$
declare c public.exchange_conversations;
begin
  warned:=0; deleted:=0; expired:=0; notifications_failed:=0;
  update public.exchange_notifications n set status='failed' where n.status in ('pending','sending')
    and n.claim_token is not null and exists(select 1 from public.exchange_delivery_events e
      where e.token=n.claim_token and e.created_at<now()-interval '23 hours');
  get diagnostics notifications_failed=row_count;
  update public.exchange_listings set status='paused',updated_at=now(),version=version+1 where status='published' and expires_at<=now();
  get diagnostics expired=row_count;
  for c in select * from public.exchange_conversations where updated_at<=now()-interval '83 days' and deletion_warning_at is null for update loop
    update public.exchange_conversations set deletion_warning_at=now() where id=c.id;
    perform public.exchange_queue(c.sender_id,'retention');
    perform public.exchange_queue(c.recipient_id,'retention');
    warned:=warned+1;
  end loop;
  -- Report snapshots already preserve evidence. A late maintenance run still gives seven days' notice.
  delete from public.exchange_conversations where updated_at<=now()-interval '90 days'
    and deletion_warning_at<=now()-interval '7 days';
  get diagnostics deleted=row_count;
  delete from public.exchange_reports where status='resolved' and resolved_at<now()-interval '90 days';
  delete from public.exchange_events where created_at<now()-interval '30 days';
  delete from public.exchange_delivery_events e where e.created_at<now()-interval '30 days'
    and not exists(select 1 from public.exchange_notifications n where n.claim_token=e.token);
  return next;
end;
$$;
create function public.exchange_claim_notifications(p_limit integer,p_daily_budget integer)
returns table(id uuid,user_id uuid,kind text,token uuid,attempts integer)
language plpgsql security definer set search_path = '' as $$
declare remaining integer; n public.exchange_notifications; claim uuid;
begin
  if p_limit is null or p_daily_budget is null or p_limit<1 or p_daily_budget<1 then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('exchange-notification-budget',0));
  -- Outside the provider's idempotency window, an unacknowledged send needs reconciliation.
  update public.exchange_notifications q set status='failed' where q.status in ('pending','sending')
    and q.claim_token is not null and exists(select 1 from public.exchange_delivery_events e
      where e.token=q.claim_token and e.created_at<now()-interval '23 hours');
  -- Reservations also consume the budget: a crash cannot trigger unlimited duplicate sends.
  select greatest(0,p_daily_budget-count(*)::integer) into remaining from public.exchange_delivery_events
    where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  for n in select q.* from public.exchange_notifications q join public.exchange_accounts a on a.user_id=q.user_id
    where a.notifications and q.attempts<5 and ((q.status='pending' and q.available_at<=now())
      or (q.status='sending' and q.claimed_at<now()-interval '15 minutes'))
    order by q.available_at,q.id limit least(p_limit,remaining,100) for update of q skip locked loop
    -- The delivery key survives transient failures and crashed workers. Providers can deduplicate retries.
    claim:=coalesce(n.claim_token,gen_random_uuid());
    update public.exchange_notifications q set status='sending',attempts=q.attempts+1,claim_token=claim,claimed_at=clock_timestamp() where q.id=n.id;
    insert into public.exchange_delivery_events(notification_id,token) values(n.id,claim);
    id:=n.id; user_id:=n.user_id; kind:=n.kind; token:=claim; attempts:=n.attempts+1; return next;
  end loop;
end;
$$;
create function public.exchange_finish_notification(p_id uuid,p_token uuid,p_success boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare n public.exchange_notifications;
begin
  select * into n from public.exchange_notifications where id=p_id and claim_token=p_token and status='sending' for update;
  if not found then return; end if;
  if p_success then
    update public.exchange_delivery_events set delivered=true where id=(
      select e.id from public.exchange_delivery_events e where e.token=p_token order by e.created_at desc,e.id desc limit 1);
    update public.exchange_notifications set status=case when updated_at>n.claimed_at then 'pending' else 'sent' end,
      last_sent_at=now(),available_at=now()+interval '1 day',claim_token=null,claimed_at=null where id=p_id;
  else
    update public.exchange_notifications set status=case when attempts>=5 then 'failed' else 'pending' end,
      available_at=now()+make_interval(mins=>least(60,power(2,n.attempts)::integer)),claimed_at=null where id=p_id;
  end if;
end;
$$;

-- Revoke PostgreSQL's default PUBLIC EXECUTE for every new routine, including internal helpers.
do $$
declare f record; t text;
begin
  for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'exchange_%' loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    if f.proname in ('exchange_search','exchange_listing','exchange_profile') then
      execute format('grant execute on function %s to anon,authenticated',f.signature);
    elsif f.proname in ('exchange_enroll','exchange_save_profile','exchange_reserve_photo','exchange_save_listing','exchange_listing_state',
      'exchange_moderate','exchange_request','exchange_respond','exchange_send','exchange_block','exchange_report','exchange_resolve_report','exchange_delete_account') then
      execute format('grant execute on function %s to authenticated',f.signature);
    end if;
    if exists(select 1 from pg_roles where rolname='service_role') then
      execute format('grant execute on function %s to service_role',f.signature);
    end if;
  end loop;
  if exists(select 1 from pg_roles where rolname='service_role') then
    foreach t in array array['exchange_accounts','exchange_profiles','exchange_listings','exchange_listing_places',
      'exchange_conversations','exchange_messages','exchange_blocks','exchange_reports','exchange_events',
      'exchange_deletion_requests','exchange_notifications','exchange_delivery_events'] loop
      execute format('grant all on public.%I to service_role',t);
    end loop;
  end if;
end;
$$;
