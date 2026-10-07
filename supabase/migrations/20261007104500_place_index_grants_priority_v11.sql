-- SGBuddy v1.1: public catalog grant repair and persona priority refinement.
grant select on table public.place_catalog to anon, authenticated;

create or replace function public.list_persona_places(persona text default 'resident',category_filter text default null,latitude double precision default null,longitude double precision default null,search_text text default null,result_limit integer default 60)
returns table(slug text,name text,kind text,category text,description text,address text,postal_code text,latitude double precision,longitude double precision,distance_m double precision,persona_score integer,source_key text,source_url text,metadata jsonb,verified_at timestamptz)
language sql stable security invoker set search_path = pg_catalog, public, extensions as $$
with q as (
 select case when persona in ('resident','visitor','executive','new_in_sg') then persona else 'resident' end p,
 nullif(lower(trim(coalesce(category_filter,''))),'') category_term,
 nullif(lower(trim(coalesce(search_text,''))),'') search_term,
 case when latitude between 1.0 and 1.6 and longitude between 103.4 and 104.2 then ST_SetSRID(ST_MakePoint(longitude,latitude),4326)::geography else null end point,
 greatest(1,least(coalesce(result_limit,60),200)) lim
), base as (
 select p.*,coalesce((p.metadata->'persona_scores'->>q.p)::integer,50) score,
 case when q.point is null or p.geo is null then null else ST_Distance(p.geo,q.point) end dist,
 case q.p
  when 'resident' then case when p.kind='attraction' then 18 when p.category ilike '%town centre%' or p.category ilike '%neighbourhood hub%' then 1 when p.category ilike '%market%' or p.category ilike '%hawker%' then 2 when p.category ilike '%park%' then 3 when p.category ilike '%polyclinic%' or p.category ilike '%clinic%' or p.category ilike '%pharmacy%' then 4 when p.category ilike '%community%' then 5 when p.category ilike '%sport%' then 6 when p.category ilike '%library%' then 7 when p.category ilike '%childcare%' then 8 else 12 end
  when 'visitor' then case when p.kind='attraction' then 1 when p.category ilike '%heritage%' then 2 when p.category ilike '%hawker%' or p.category ilike '%market%' then 3 when p.category ilike '%park%' or p.category ilike '%garden%' then 4 when p.category ilike '%business%' then 5 else 12 end
  when 'executive' then case when p.category ilike '%business%' or p.category ilike '%convention%' then 1 when p.category ilike '%airport%' or p.kind='transport' then 2 when p.category ilike '%town%' then 3 when p.category ilike '%hawker%' or p.category ilike '%market%' then 4 when p.category ilike '%health%' or p.category ilike '%clinic%' or p.category ilike '%pharmacy%' then 5 when p.kind='attraction' then 15 else 10 end
  else case when p.kind='attraction' then 18 when p.category ilike '%town centre%' or p.category ilike '%neighbourhood hub%' then 1 when p.category ilike '%market%' or p.category ilike '%hawker%' then 2 when p.category ilike '%polyclinic%' or p.category ilike '%clinic%' or p.category ilike '%pharmacy%' then 3 when p.category ilike '%community%' then 4 when p.category ilike '%library%' then 5 when p.category ilike '%park%' then 6 when p.category ilike '%sport%' then 7 when p.category ilike '%childcare%' then 8 else 12 end
 end category_priority
 from public.place_catalog p cross join q
 where p.active
 and (q.category_term is null or lower(coalesce(p.category,'')) like '%'||q.category_term||'%')
 and (q.search_term is null or lower(coalesce(p.name,'')||' '||coalesce(p.category,'')||' '||coalesce(p.address,'')) like '%'||q.search_term||'%')
 and coalesce((p.metadata->'persona_scores'->>q.p)::integer,50)>=20
), ranked as (
 select base.*,row_number() over(partition by coalesce(category,'Other') order by score desc,dist nulls last,name) category_rank from base
)
select r.slug,r.name,r.kind,r.category,r.description,r.address,r.postal_code,
 case when r.geo is null then null else ST_Y(r.geo::geometry) end,
 case when r.geo is null then null else ST_X(r.geo::geometry) end,
 r.dist,r.score,r.source_key,r.source_url,r.metadata,r.verified_at
from ranked r
order by case when r.category_rank<=3 then 0 else 1 end,r.category_rank,r.category_priority,r.score desc,r.dist nulls last,r.name
limit (select lim from q);
$$;
revoke all on function public.list_persona_places(text,text,double precision,double precision,text,integer) from public;
grant execute on function public.list_persona_places(text,text,double precision,double precision,text,integer) to anon, authenticated;
