-- Add reviewed YouTube blocks without changing existing articles, RPCs or RLS.
-- Keep URL parsing aligned with src/features/articles/youtube.ts.
create function public.article_youtube_id(value text) returns text
language plpgsql immutable set search_path = '' as $$
declare url text := public.article_trim(value); base text; parts text[]; ids text[];
begin
  if url is null or not public.community_valid_url(url) then return null; end if;
  base := split_part(split_part(url, '?', 1), '#', 1);
  parts := regexp_match(base, '^https://(?:(?:www\.|m\.)?youtube\.com/(?:shorts|live|embed)|youtu\.be)/([A-Za-z0-9_-]{11})/?$');
  if parts is not null then return parts[1]; end if;
  if base !~ '^https://(?:www\.|m\.)?youtube\.com/watch$' then return null; end if;
  -- Only one literal v parameter is accepted; encoded or ambiguous IDs are rejected.
  select array_agg(part) into ids
    from regexp_split_to_table(substring(split_part(url, '#', 1) from '\?(.*)$'), '&') as part
    where part like 'v=%';
  if cardinality(ids) = 1 and ids[1] ~ '^v=[A-Za-z0-9_-]{11}$' then
    return substring(ids[1] from 3);
  end if;
  return null;
end;
$$;
revoke all on function public.article_youtube_id(text) from public,anon,authenticated;

create or replace function public.article_valid_document(d jsonb, publishing boolean default false) returns boolean
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
    elsif b->>'type' = 'youtube' then
      if not public.article_object_keys(b,array['type','label','url','display'])
        or not public.article_text(b->'label',min_text,160)
        or not public.article_text(b->'url',min_text,1000)
        or jsonb_typeof(b->'display') is distinct from 'string'
        or b->>'display' not in ('link','embed') then return false; end if;
      if public.article_trim(b->>'url') <> '' and public.article_youtube_id(b->>'url') is null then return false; end if;
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
