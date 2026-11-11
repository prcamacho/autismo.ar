-- Additive corrections; apply after 202609240001_community.sql.
-- Keep URL rules in sync with src/lib/public-url.ts and their parity tests.
create or replace function public.community_valid_url(value text) returns boolean
language plpgsql immutable set search_path = '' as $url$
declare
  parts text[];
  host text;
  labels text[];
  label text;
begin
  if value is null or length(value) > 1000
     or value ~ U&'[\0001-\0020\007F-\009F\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]' then
    return false;
  end if;
  parts := regexp_match(value, $pattern$^https?://([a-zA-Z0-9][a-zA-Z0-9.-]*)(:([0-9]{1,5}))?([/?#][^[:space:]\\]*)?$$pattern$);
  if parts is null then return false; end if;
  host := regexp_replace(parts[1], '\.$', '');
  if length(host) > 253 then return false; end if;
  labels := string_to_array(host, '.');
  foreach label in array labels loop
    if label !~ '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$' then return false; end if;
  end loop;
  if host ~ '^[0-9.]+$' then
    if cardinality(labels) <> 4 then return false; end if;
    foreach label in array labels loop
      if label !~ '^(0|[1-9][0-9]{0,2})$' then return false; end if;
      if label::integer > 255 then return false; end if;
    end loop;
  end if;
  return parts[3] is null or parts[3]::integer <= 65535;
end;
$url$;

-- Search the labels people see, not only internal category identifiers.
create function public.community_category_names(ids jsonb) returns text
language sql immutable set search_path = '' as $$
  select coalesce(string_agg(label, ' ' order by id), '')
  from (values
    ('profesionales', 'Profesionales'),
    ('centros', 'Centros y terapias'),
    ('educacion', 'Educación'),
    ('transporte', 'Transporte'),
    ('derechos', 'Derechos y trámites'),
    ('comunidad', 'Redes de apoyo')
  ) as categories(id, label)
  where ids ? id;
$$;
revoke all on function public.community_category_names(jsonb) from public, anon, authenticated;
grant execute on function public.community_category_names(jsonb) to anon, authenticated;

create or replace function public.community_search(
  p_query text default '', p_category text default '', p_province text default '',
  p_locality text default '', p_age text default '', p_page integer default 1
) returns setof public.resources
language sql stable security invoker set search_path = '' as $$
  select r.* from public.resources r
  where r.visible
    and (p_province = '' or p_province in ('buenos-aires','ciudad-autonoma-de-buenos-aires','catamarca','chaco','chubut','cordoba','corrientes','entre-rios','formosa','jujuy','la-pampa','la-rioja','mendoza','misiones','neuquen','rio-negro','salta','san-juan','san-luis','santa-cruz','santa-fe','santiago-del-estero','tierra-del-fuego','tucuman'))
    and (p_category = '' or r.data->'categoryIds' ? p_category)
    and (p_age = '' or r.data->'ageGroups' ? p_age)
    and (p_province = '' or r.data->>'scope' = 'national' or r.data->>'province' = p_province)
    and (p_locality = '' or (p_province <> '' and (r.data->>'scope' <> 'local' or public.community_normalize(r.data->>'locality') = public.community_normalize(p_locality))))
    and (p_query = '' or strpos(
      public.community_normalize(concat(
        r.data->>'name', ' ', r.data->>'description', ' ', r.data->>'locality', ' ',
        r.data->>'coverage', ' ', replace(r.data->>'province', '-', ' '), ' ',
        r.data->'categoryIds', ' ', public.community_category_names(r.data->'categoryIds')
      )),
      public.community_normalize(left(p_query, 160))
    ) > 0)
  order by r.published_at desc, r.id
  limit 21 offset ((greatest(1, least(p_page, 10000)) - 1) * 20);
$$;

-- Supports the default newest-first listing without scanning/sorting hidden rows.
create index resources_published on public.resources (published_at desc, id) where visible;
