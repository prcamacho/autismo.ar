-- Explicit administrative access for moderator assignment. BYPASSRLS does not
-- grant table privileges. Browser roles retain their existing read-only policy.
do $$
begin
  if exists(select 1 from pg_roles where rolname='service_role') then
    grant select,insert,update on public.community_members to service_role;
  end if;
end;
$$;
