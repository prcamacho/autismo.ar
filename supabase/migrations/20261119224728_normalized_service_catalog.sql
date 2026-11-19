-- Normalized services, private incorporation requests and reviewed catalog changes.
-- Additive: historical publication JSON and identifiers remain intact.
create table public.service_catalog (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  name text not null check(length(trim(name)) between 2 and 100 and public.exchange_public_text(name)),
  group_name text not null check(group_name in ('Apoyos y disciplinas','Especialidades médicas')),
  aliases text[] not null default '{}' check(cardinality(aliases) <= 100),
  selectable boolean not null default true,
  source_url text not null default '' check(source_url='' or public.community_valid_url(source_url))
);
create unique index service_catalog_name on public.service_catalog(public.community_normalize(name));
alter table public.service_catalog enable row level security;
revoke all on public.service_catalog from public,anon,authenticated;
grant select on public.service_catalog to anon,authenticated;
create policy service_catalog_read on public.service_catalog for select to anon,authenticated using(true);

insert into public.service_catalog(id,name,group_name,aliases,selectable,source_url) select id,name,group_name,array(select jsonb_array_elements_text(aliases)),selectable,source_url from jsonb_to_recordset($seed$[{"id":"inclusion-escolar","name":"Apoyo a la inclusión escolar","aliases":["mai","aie","maestra integradora","maestro integrador","integracion escolar"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"acompanamiento-terapeutico","name":"Acompañamiento terapéutico","aliases":["at","acompanante terapeutico"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"psicologia","name":"Psicología","aliases":["psicologo","psicologa"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"psicopedagogia","name":"Psicopedagogía","aliases":["psicopedagogo","psicopedagoga"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"fonoaudiologia","name":"Fonoaudiología","aliases":["fono","fonoaudiologo","fonoaudiologa"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"terapia-ocupacional","name":"Terapia ocupacional","aliases":["to","terapista ocupacional","terapeuta ocupacional"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"kinesiologia","name":"Kinesiología","aliases":["kinesio","kinesiologo","kinesiologa","fisioterapia"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"trabajo-social","name":"Trabajo social","aliases":["trabajador social","trabajadora social","asistente social"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"nutricion","name":"Nutrición (licenciados)","aliases":["nutricionista","licenciatura en nutricion"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"psicomotricidad","name":"Psicomotricidad","aliases":["psicomotricista"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"musicoterapia","name":"Musicoterapia","aliases":["musicoterapeuta"],"selectable":true,"group_name":"Apoyos y disciplinas","source_url":""},{"id":"medicina-general","name":"Medicina general y de familia","aliases":["medico general","medica general","medicina familiar","generalista"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"clinica-medica","name":"Clínica médica","aliases":["medicina interna","medico clinico","medica clinica"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"pediatria","name":"Pediatría","aliases":["pediatra"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"geriatria","name":"Geriatría","aliases":["geriatra"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"neurologia","name":"Neurología","aliases":["neurologo","neurologa"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"neurologia-infantil","name":"Neurología infantil","aliases":["neuropediatra","neuropediatria","neurologo infantil","neurologa infantil","neurologia pediatrica"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"psiquiatria","name":"Psiquiatría","aliases":["psiquiatra"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"psiquiatria-infantojuvenil","name":"Psiquiatría infantojuvenil","aliases":["psiquiatra infantil","psiquiatria infantil","psiquiatria infanto juvenil"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"fisiatria","name":"Fisiatría","aliases":["fisiatra","medicina fisica y rehabilitacion"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"genetica-medica","name":"Genética médica","aliases":["genetista"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"gastroenterologia","name":"Gastroenterología","aliases":["gastroenterologo","gastroenterologa"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"gastroenterologia-infantil","name":"Gastroenterología infantil","aliases":["gastroenterologo infantil","gastroenterologia pediatrica"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"endocrinologia","name":"Endocrinología","aliases":["endocrinologo","endocrinologa"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"endocrinologia-infantil","name":"Endocrinología infantil","aliases":["endocrinologo infantil","endocrinologia pediatrica"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"alergia-inmunologia","name":"Alergia e inmunología","aliases":["alergista","alergologo","inmunologo"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"cardiologia","name":"Cardiología","aliases":["cardiologo","cardiologa"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"dermatologia","name":"Dermatología","aliases":["dermatologo","dermatologa"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"neumonologia","name":"Neumonología","aliases":["neumonologo","neumonologa","neumologia"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"oftalmologia","name":"Oftalmología","aliases":["oftalmologo","oftalmologa","oculista"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"otorrinolaringologia","name":"Otorrinolaringología","aliases":["otorrino","otorrinolaringologo"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"ortopedia-traumatologia","name":"Ortopedia y traumatología","aliases":["traumatologo","traumatologa","ortopedista"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"},{"id":"ginecologia","name":"Ginecología","aliases":["ginecologo","ginecologa"],"selectable":true,"group_name":"Especialidades médicas","source_url":"https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1"}]$seed$::jsonb) as s(id text,name text,group_name text,aliases jsonb,selectable boolean,source_url text);

create table public.catalog_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nonce uuid not null,
  requested_name text not null check(length(trim(requested_name)) between 2 and 100 and public.exchange_public_text(requested_name)),
  reason text not null check(length(trim(reason)) between 10 and 1000 and public.exchange_public_text(reason)),
  source_url text not null default '' check(source_url='' or public.community_valid_url(source_url)),
  status text not null default 'pending' check(status in ('pending','accepted','rejected')),
  response text not null default '',
  service_id text references public.service_catalog(id),
  draft jsonb check(draft is null or (jsonb_typeof(draft)='object' and octet_length(draft::text)<=16000)),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  unique(user_id,nonce)
);
create index catalog_requests_pending on public.catalog_requests(created_at,id) where status='pending';
create index catalog_requests_service on public.catalog_requests(service_id);
create index catalog_requests_reviewer on public.catalog_requests(reviewed_by);
alter table public.catalog_requests enable row level security;
revoke all on public.catalog_requests from public,anon,authenticated;
grant select on public.catalog_requests to authenticated;
create policy catalog_requests_private on public.catalog_requests for select to authenticated
  using(user_id=(select auth.uid()) or (select public.community_is_moderator()));

-- Mutation RPCs follow the existing transaction-safe API: no direct table writes.
create function public.catalog_request(p_name text,p_reason text,p_source text,p_nonce uuid,p_draft jsonb default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=public.exchange_member(); previous public.catalog_requests; result uuid;
begin
  if p_nonce is null or p_name is null or p_reason is null or p_source is null then raise exception 'INVALID_INPUT'; end if;
  perform pg_advisory_xact_lock(hashtextextended('catalog-request:'||u::text,0));
  select * into previous from public.catalog_requests where user_id=u and nonce=p_nonce;
  if found then
    if previous.requested_name<>trim(p_name) or previous.reason<>trim(p_reason) or previous.source_url<>p_source or previous.draft is distinct from p_draft then raise exception 'NONCE_REUSED'; end if;
    return previous.id;
  end if;
  perform public.exchange_rate(u,'catalog-request',5,interval '24 hours');
  insert into public.catalog_requests(user_id,nonce,requested_name,reason,source_url,draft)
    values(u,p_nonce,trim(p_name),trim(p_reason),p_source,p_draft) returning id into result;
  return result;
end;
$$;

create function public.catalog_review(p_request uuid,p_decision text,p_service text,p_name text,p_group text,p_source text,p_note text)
returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=public.exchange_member(); r public.catalog_requests; target text; alias_value text;
begin
  if not public.community_is_moderator() then raise exception 'MODERATOR_REQUIRED'; end if;
  select * into r from public.catalog_requests where id=p_request for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if r.user_id=u then raise exception 'SELF_REVIEW'; end if;
  if r.status<>'pending' then raise exception 'STALE_VERSION'; end if;
  if p_decision is null or p_decision not in ('existing','alias','new','rejected') or p_note is null or length(trim(p_note)) not between 10 and 1000 or not public.exchange_public_text(p_note) then raise exception 'INVALID_INPUT'; end if;
  if p_decision in ('existing','alias') then
    select id into target from public.service_catalog where id=p_service and selectable for update;
    if target is null then raise exception 'INVALID_SERVICE'; end if;
    if p_decision='alias' then
      alias_value:=public.community_normalize(r.requested_name);
      update public.service_catalog set aliases=(select array_agg(distinct a order by a) from unnest(aliases||array[alias_value]) a) where id=target;
    end if;
  elsif p_decision='new' then
    if p_source is null or not public.community_valid_url(p_source) then raise exception 'SOURCE_REQUIRED'; end if;
    target:='servicio-'||r.id::text;
    insert into public.service_catalog(id,name,group_name,aliases,source_url)
      values(target,trim(p_name),p_group,array[public.community_normalize(r.requested_name)],p_source);
  end if;
  update public.catalog_requests set status=case when p_decision='rejected' then 'rejected' else 'accepted' end,
    response=trim(p_note),service_id=target,reviewed_by=u where id=r.id;
end;
$$;
revoke all on function public.catalog_request(text,text,text,uuid,jsonb),public.catalog_review(uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.catalog_request(text,text,text,uuid,jsonb),public.catalog_review(uuid,text,text,text,text,text,text) to authenticated;
do $$ begin if exists(select 1 from pg_roles where rolname='service_role') then grant all on public.service_catalog,public.catalog_requests to service_role; end if; end $$;

-- Preserve historical validators for old stored snapshots, then validate new writes separately.
alter function public.exchange_valid_listing(jsonb) rename to exchange_valid_listing_legacy;
create function public.exchange_valid_listing(d jsonb) returns boolean language plpgsql stable set search_path='' as $$
declare checked jsonb;
begin
  if public.exchange_valid_listing_legacy(d) then return true; end if;
  if not exists(select 1 from public.service_catalog where id=d->>'service' and selectable) then return false; end if;
  checked:=jsonb_set(d-'coverage','{service}','"fonoaudiologia"');
  if d ? 'coverage' and (jsonb_typeof(d->'coverage')<>'string' or d->>'coverage' not in ('','Particular','Obra social','Prepaga','Sistema público','A consultar')) then return false; end if;
  if d->>'description'='' then checked:=jsonb_set(checked,'{description}','"Sin aclaraciones adicionales."'); end if;
  return public.exchange_valid_listing_legacy(checked);
end;
$$;
-- Existing check constraints reference the old function OID. Rebind without rewriting historical rows.
alter table public.exchange_listings drop constraint exchange_listings_data_check;
alter table public.exchange_listings add constraint exchange_listings_data_check check(public.exchange_valid_listing(data)) not valid;
alter table public.exchange_listings validate constraint exchange_listings_data_check;

create function public.catalog_valid_listing(d jsonb) returns boolean language sql stable set search_path='' as $$
  select coalesce(public.exchange_valid_listing(d)
    and exists(select 1 from public.service_catalog s where s.id=d->>'service' and s.selectable
      and (d->>'role'=s.name or (s.id='inclusion-escolar' and d->>'role' in ('Maestro/a de apoyo a la inclusión (MAI)','Acompañante de inclusión escolar (AIE)'))))
    and d->>'engagement' in ('','Particular','Mediante institución','Relación de dependencia','A convenir')
    and length(d->>'description')<=1500, false);
$$;

revoke all on function public.catalog_valid_listing(jsonb),public.exchange_valid_listing(jsonb) from public,anon,authenticated;

alter function public.community_valid_resource(jsonb) rename to community_valid_resource_legacy;
create function public.community_valid_resource(d jsonb) returns boolean language plpgsql stable set search_path='' as $$
begin
  if not public.community_valid_resource_legacy(d-array['serviceIds','placeId']) then return false; end if;
  if d ? 'serviceIds' then
    if not public.exchange_string_array(d->'serviceIds',33) then return false; end if;
    if exists(select 1 from jsonb_array_elements_text(d->'serviceIds') x where not exists(select 1 from public.service_catalog where id=x and selectable)) then return false; end if;
  end if;
  if d ? 'placeId' and d->>'placeId'<>'' and not exists(select 1 from public.exchange_places where id=d->>'placeId' and province=d->>'province' and name=d->>'locality') then return false; end if;
  return true;
end;
$$;
alter table public.resources drop constraint resources_data_check;
alter table public.resources add constraint resources_data_check check(public.community_valid_resource(data)) not valid;
alter table public.resources validate constraint resources_data_check;
alter table public.community_proposals drop constraint community_proposals_data_check;
alter table public.community_proposals add constraint community_proposals_data_check check(public.community_valid_resource(data)) not valid;
alter table public.community_proposals validate constraint community_proposals_data_check;

create function public.catalog_search_resources(p_service text,p_category text,p_province text,p_place text,p_age text,p_page integer)
returns setof public.resources language sql stable security invoker set search_path='' as $$
  select r.* from public.resources r
  where r.visible
    and (p_service='' or (exists(select 1 from public.service_catalog where id=p_service and selectable) and r.data->'serviceIds' ? p_service))
    and (p_category='' or r.data->'categoryIds' ? p_category)
    and (p_age='' or r.data->'ageGroups' ? p_age)
    and (p_province='' or exists(select 1 from public.exchange_places where province=p_province))
    and (p_place='' or exists(select 1 from public.exchange_places where id=p_place and province=p_province))
    and (p_province='' or r.data->>'scope'='national' or r.data->>'province'=p_province)
    and (p_place='' or r.data->>'scope'<>'local' or r.data->>'placeId'=p_place)
  order by r.published_at desc,r.id limit 21 offset ((greatest(1,least(p_page,10000))-1)*20);
$$;
revoke all on function public.community_valid_resource(jsonb),public.catalog_search_resources(text,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.catalog_search_resources(text,text,text,text,text,integer) to anon,authenticated;
create index resources_service_ids on public.resources using gin ((data->'serviceIds')) where visible;

create or replace function public.exchange_save_listing(p_id uuid,p_kind text,p_data jsonb,p_version integer,p_nonce uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.exchange_member(); l public.exchange_listings; pid uuid; result uuid; canonical_title text;
begin
  if not public.exchange_valid_listing(p_data) then raise exception 'INVALID_INPUT'; end if;
  if not public.catalog_valid_listing(p_data) then raise exception 'INVALID_SERVICE'; end if;
  select left((case when p_kind='offer' then 'Ofrezco ' else 'Busco ' end)||s.name||' · '||p.name||(case when jsonb_array_length(p_data->'locationIds')>1 then ' y otras zonas' else '' end)||' · '||(case p_data->>'modality' when 'virtual' then 'Virtual' when 'mixta' then 'Presencial y virtual' else 'Presencial' end),120)
    into canonical_title from public.service_catalog s,public.exchange_places p where s.id=p_data->>'service' and p.id=p_data->'locationIds'->>0;
  if canonical_title is null then raise exception 'INVALID_LOCATION'; end if;
  p_data:=jsonb_set(p_data,'{title}',to_jsonb(canonical_title));
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

create or replace function public.community_submit(p_data jsonb, p_source text, p_note text, p_resource uuid default null, p_version integer default 0) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.community_require_member(); result uuid; current_version integer;
begin
  if p_data->>'coverage' not in ('','Particular','Obra social','Prepaga','Sistema público','A consultar') then raise exception 'INVALID_INPUT'; end if;
  if (p_data->'categoryIds' ?| array['profesionales','centros']) and coalesce(jsonb_array_length(p_data->'serviceIds'),0)=0 then raise exception 'INVALID_SERVICE'; end if;
  if p_data->>'scope'='local' and coalesce(p_data->>'placeId','')='' then raise exception 'INVALID_LOCATION'; end if;
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

create or replace function public.community_field_value(d jsonb, f text) returns jsonb
language sql immutable set search_path = '' as $$
 select case f when 'name' then d->'name'
 when 'location' then jsonb_build_array(d->'scope', d->'province', d->'locality',coalesce(d->'placeId','""'))
 when 'contact' then jsonb_build_array(d->'website',d->'phone',d->'hours')
 when 'coverage' then d->'coverage' when 'ages' then d->'ageGroups'
 when 'description' then jsonb_build_array(d->'description',d->'categoryIds',coalesce(d->'serviceIds','[]')) end;
$$;
create or replace function public.community_required_fields(d jsonb, previous jsonb) returns text[]
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
