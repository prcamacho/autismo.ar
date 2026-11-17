-- Production only. Run after exchange-maintenance.sql and Vault configuration.
-- Installs one DISABLED hourly job. Enable only after a real successful HTTP run.
begin;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;
do $$
declare scheduled_job bigint;
begin
  if to_regprocedure('exchange_ops.dispatch_maintenance(text)') is null
    or to_regprocedure('public.exchange_maintenance()') is null then
    raise exception 'MAINTENANCE_SCHEMA_REQUIRED';
  end if;
  if not exists(select 1 from vault.secrets where name='autismo_exchange_worker_token') then
    raise exception 'MAINTENANCE_TOKEN_REQUIRED';
  end if;
  scheduled_job := cron.schedule('autismo-exchange-maintenance-hourly','17 * * * *',$job$
    select exchange_ops.dispatch_maintenance('https://autismo.ar/api/exchanges/maintenance');
    delete from cron.job_run_details
      where jobid=(select jobid from cron.job where jobname='autismo-exchange-maintenance-hourly')
        and end_time < now()-interval '30 days';
  $job$);
  perform cron.alter_job(scheduled_job,active:=false);
end;
$$;
commit;
