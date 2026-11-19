-- Private catalog drafts follow the same immediate account-deletion lifecycle.
-- Keep the existing account lock and deletion order; Auth cleanup still happens separately.
create or replace function public.exchange_delete_account() returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid();
begin
  if u is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('exchange-account:' || u::text,0));
  insert into public.exchange_deletion_requests(user_id) values(u) on conflict do nothing;
  delete from public.exchange_profiles where user_id=u;
  delete from public.exchange_listings where user_id=u;
  delete from public.exchange_conversations where sender_id=u or recipient_id=u;
  delete from public.exchange_blocks where blocker_id=u or blocked_id=u;
  delete from public.exchange_notifications where user_id=u;
  delete from public.catalog_requests where user_id=u;
  delete from public.exchange_accounts where user_id=u;
  delete from public.exchange_events where user_id=u;
end;
$$;
