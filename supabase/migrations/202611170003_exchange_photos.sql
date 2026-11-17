-- Optional Supabase Storage integration. PGlite does not install Storage.
-- Server-only writes: decode, strip metadata and resize before uploading.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    values ('professional-photos','professional-photos',false,153600,array['image/webp'])
    on conflict(id) do update set public=false,file_size_limit=153600,allowed_mime_types=array['image/webp'];
  end if;
end $$;
-- Do not add direct anon/authenticated policies to storage.objects for this
-- bucket. The application authorizes each read via exchange_photo_access.

-- Track immutable uploads before Storage I/O so failed commits and replacements
-- can be recovered without listing or scanning the whole bucket.
create table public.exchange_photo_objects (
  path text primary key check(path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.exchange_photo_objects enable row level security;
revoke all on public.exchange_photo_objects from public,anon,authenticated;
create function public.exchange_photo_track(p_path text,p_user uuid) returns void
language sql security definer set search_path='' as $$
  insert into public.exchange_photo_objects(path,owner_id) values(p_path,p_user);
$$;
create function public.exchange_photo_forget(p_path text) returns void
language sql security definer set search_path='' as $$
  delete from public.exchange_photo_objects where path=p_path;
$$;
create function public.exchange_photo_garbage()
returns table(path text) language sql stable security definer set search_path='' as $$
  select o.path from public.exchange_photo_objects o
  where o.created_at<now()-interval '1 day'
    and not exists(select 1 from public.exchange_profiles p where p.data->>'photoPath'=o.path)
  order by o.created_at limit 50;
$$;
revoke all on function public.exchange_photo_track(text,uuid),public.exchange_photo_forget(text),public.exchange_photo_garbage() from public,anon,authenticated;
do $$
begin
  if exists(select 1 from pg_roles where rolname='service_role') then
    grant execute on function public.exchange_photo_track(text,uuid),public.exchange_photo_forget(text),public.exchange_photo_garbage() to service_role;
  end if;
end $$;
