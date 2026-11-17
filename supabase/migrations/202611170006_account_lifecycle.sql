-- Serialize a member's participation, writes and deletion request in one order.
-- The lock belongs only to auth.uid(); contact operations must not acquire the
-- recipient's lifecycle lock after acquiring profile/listing/pair/rate locks.
-- A write already holding this lock completes before deletion; a later write
-- sees the deletion request and cannot recreate the removed account/content.

create or replace function public.exchange_member() returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('exchange-account:' || u::text,0));
  if exists(select 1 from public.exchange_deletion_requests where user_id=u) then raise exception 'ACCOUNT_DELETING'; end if;
  if not exists(select 1 from public.exchange_accounts where user_id=u) then raise exception 'ADULT_REQUIRED'; end if;
  return u;
end;
$$;

create or replace function public.exchange_enroll(p_adult boolean,p_notifications boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('exchange-account:' || u::text,0));
  if p_adult is distinct from true then raise exception 'ADULT_REQUIRED'; end if;
  if p_notifications is null then raise exception 'INVALID_INPUT'; end if;
  if exists(select 1 from public.exchange_deletion_requests where user_id=u) then raise exception 'ACCOUNT_DELETING'; end if;
  insert into public.exchange_accounts(user_id,notifications) values(u,p_notifications)
    on conflict(user_id) do update set notifications=excluded.notifications;
  if not p_notifications then delete from public.exchange_notifications where user_id=u and status<>'sending'; end if;
end;
$$;

create or replace function public.exchange_delete_account() returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid();
begin
  if u is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('exchange-account:' || u::text,0));
  -- Keep the existing profile -> listing -> conversation deletion order.
  -- Report snapshots remain available only through their existing RLS policy.
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

-- CREATE OR REPLACE retains ownership and ACLs. Keep the original helper private,
-- the enrollment/deletion RPCs authenticated, and service-role grants unchanged.
