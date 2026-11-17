-- Operational objects, separate from product migrations. Requires Supabase Vault
-- and pg_net when invoked. Does not schedule jobs or send requests on installation.
begin;
create schema if not exists exchange_ops authorization postgres;
revoke all on schema exchange_ops from public, anon, authenticated, service_role;

create table if not exists exchange_ops.maintenance_runs (
  id bigint generated always as identity primary key,
  request_id bigint unique,
  destination text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'pending' check (status in ('pending','succeeded','failed')),
  http_status integer,
  failure_code text,
  summary jsonb,
  check ((status='pending') = (completed_at is null))
);
create index if not exists maintenance_runs_requested on exchange_ops.maintenance_runs(requested_at);
alter table exchange_ops.maintenance_runs enable row level security;
revoke all on all tables in schema exchange_ops from public, anon, authenticated, service_role;
revoke all on all sequences in schema exchange_ops from public, anon, authenticated, service_role;

-- pg_net success means queued, not completed. Reconcile only the request IDs
-- created here; retain counters, never response bodies, headers, tokens or PII.
create or replace function exchange_ops.collect_maintenance_results() returns integer
language plpgsql security invoker set search_path='' as $$
declare
  run record;
  response record;
  payload jsonb;
  counters jsonb;
  failure text;
  processed integer := 0;
  counter text;
  -- Protocol of POST /api/exchanges/maintenance, not message/account contents.
  required_counters constant text[] := array[
    'warned','deleted','expired','notifications_failed','notificationsAccepted',
    'notificationsSkipped','notificationFailures','notificationAckFailures',
    'accountsDeleted','accountFailures','photosCleaned','photoFailures'
  ];
begin
  perform pg_advisory_xact_lock(hashtextextended('autismo-exchange-maintenance',0));
  for run in select id,request_id,requested_at from exchange_ops.maintenance_runs where status='pending' order by id loop
    select status_code,timed_out,error_msg,content into response
      from net._http_response where id=run.request_id limit 1;
    if not found then
      if run.requested_at > now()-interval '5 minutes' then continue; end if;
      failure := 'missing_response';
      counters := null;
    else
      failure := null;
      counters := null;
      if response.timed_out or response.error_msg is not null then
        failure := case when response.timed_out then 'timeout' else 'transport_error' end;
      elsif response.status_code is distinct from 200 then
        failure := 'http_error';
      else
        begin
          payload := response.content::jsonb;
        exception when invalid_text_representation then
          payload := null;
        end;
        if jsonb_typeof(payload) is distinct from 'object' or payload ? 'error' then
          failure := 'invalid_response';
        else
          counters := '{}'::jsonb;
          foreach counter in array required_counters loop
            if jsonb_typeof(payload->counter) is distinct from 'number'
              or (payload->>counter) !~ '^[0-9]+$' then
              failure := 'invalid_response';
              counters := null;
              exit;
            end if;
            counters := counters || jsonb_build_object(counter,payload->counter);
          end loop;
          if failure is null and (
            (counters->>'notifications_failed')::numeric > 0
            or (counters->>'notificationFailures')::numeric > 0
            or (counters->>'notificationAckFailures')::numeric > 0
            or (counters->>'accountFailures')::numeric > 0
            or (counters->>'photoFailures')::numeric > 0
          ) then failure := 'incomplete_response'; end if;
        end if;
      end if;
    end if;
    update exchange_ops.maintenance_runs set
      completed_at=now(), status=case when failure is null then 'succeeded' else 'failed' end,
      http_status=response.status_code, failure_code=failure, summary=counters
      where id=run.id;
    processed := processed+1;
  end loop;
  delete from exchange_ops.maintenance_runs where requested_at < now()-interval '30 days';
  return processed;
end;
$$;

create or replace function exchange_ops.dispatch_maintenance(p_url text) returns bigint
language plpgsql security invoker set search_path='' as $$
declare
  worker_token text;
  request bigint;
begin
  if p_url is null or p_url not in (
    'https://autismo.ar/api/exchanges/maintenance',
    'https://test.autismo.ar/api/exchanges/maintenance'
  ) then raise exception 'INVALID_MAINTENANCE_DESTINATION'; end if;
  if not pg_try_advisory_xact_lock(hashtextextended('autismo-exchange-maintenance',0)) then return null; end if;
  perform exchange_ops.collect_maintenance_results();
  -- A repeated manual invocation must not duplicate a still-pending request.
  if exists(select 1 from exchange_ops.maintenance_runs where status='pending') then return null; end if;
  select decrypted_secret into worker_token from vault.decrypted_secrets
    where name='autismo_exchange_worker_token';
  if worker_token is null or length(worker_token)<32 or length(worker_token)>512 or worker_token ~ E'[\r\n]' then
    insert into exchange_ops.maintenance_runs(destination,status,completed_at,failure_code)
      values(p_url,'failed',now(),'configuration_missing');
    return null;
  end if;
  begin
    request := net.http_post(
      url:=p_url,
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || worker_token),
      body:='{}'::jsonb,
      timeout_milliseconds:=60000
    );
    if request is null then raise exception 'EMPTY_REQUEST_ID'; end if;
    insert into exchange_ops.maintenance_runs(destination,request_id) values(p_url,request);
  exception when others then
    -- SQLERRM can contain the authorization header; do not persist or log it.
    insert into exchange_ops.maintenance_runs(destination,status,completed_at,failure_code)
      values(p_url,'failed',now(),'dispatch_error');
    return null;
  end;
  return request;
end;
$$;
revoke all on function exchange_ops.collect_maintenance_results(),exchange_ops.dispatch_maintenance(text)
  from public, anon, authenticated, service_role;
commit;
