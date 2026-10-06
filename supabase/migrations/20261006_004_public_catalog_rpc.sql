create or replace function public.search_public_places(search_text text,result_limit integer default 8)
returns table(slug text,name text,kind text,category text,aliases text[],latitude double precision,longitude double precision,source_key text)
language sql stable security definer set search_path = pg_catalog, public, extensions as $$
  with q as (select lower(trim(coalesce(search_text,''))) term,greatest(1,least(coalesce(result_limit,8),20)) lim)
  select p.slug,p.name,p.kind,p.category,p.aliases,ST_Y(p.geo::geometry),ST_X(p.geo::geometry),p.source_key
  from public.place_catalog p,q
  where p.active and q.term<>'' and (
    lower(p.name) % q.term or lower(p.name) like '%'||q.term||'%'
    or exists(select 1 from unnest(p.aliases) a where lower(a)=q.term or lower(a) like '%'||q.term||'%')
  )
  order by case when lower(p.name)=q.term then 0 else 1 end,greatest(similarity(lower(p.name),q.term),0) desc,p.name
  limit (select lim from q);
$$;
revoke all on function public.search_public_places(text,integer) from public;
grant execute on function public.search_public_places(text,integer) to anon, authenticated;

create or replace function public.public_catalog_stats()
returns jsonb language sql stable security definer set search_path = pg_catalog, public as $$
select jsonb_build_object(
  'places',(select count(*) from public.place_catalog where active),
  'sources',(select count(*) from public.data_sources where active),
  'accommodations',(select count(*) from public.accommodation_properties),
  'money_changers',(select count(*) from public.money_changers),
  'experiences',(select count(*) from public.experience_catalog)
);
$$;
revoke all on function public.public_catalog_stats() from public;
grant execute on function public.public_catalog_stats() to anon, authenticated;
