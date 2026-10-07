-- SGBuddy v1.1: persona-ranked Singapore Place Index.
-- Applied to production Supabase as migration 20261007092653 persona_place_index_v11.

insert into public.data_sources
(source_key,name,authority,base_url,source_type,refresh_strategy,default_ttl_seconds,active,metadata,last_verified_at)
values
('nea_hawker_geo','Hawker Centres (GEOJSON)','National Environment Agency','https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view','official','daily_ingestion',86400,true,'{"dataset_id":"d_4a086da0a5553be1d89383cd90d07ecd","place_category":"Hawker centre"}'::jsonb,null),
('nparks_parks_geo','Parks','National Parks Board','https://data.gov.sg/datasets/d_0542d48f0991541706b58059381a6eca/view','official','daily_ingestion',86400,true,'{"dataset_id":"d_0542d48f0991541706b58059381a6eca","place_category":"Park"}'::jsonb,null),
('nlb_libraries_geo','Libraries','National Library Board','https://data.gov.sg/datasets/d_27b8dae65d9ca1539e14d09578b17cbf/view','official','weekly_ingestion',604800,true,'{"dataset_id":"d_27b8dae65d9ca1539e14d09578b17cbf","place_category":"Library"}'::jsonb,null),
('pa_community_clubs_geo','Community Clubs','People''s Association','https://data.gov.sg/datasets/d_f706de1427279e61fe41e89e24d440fa/view','official','weekly_ingestion',604800,true,'{"dataset_id":"d_f706de1427279e61fe41e89e24d440fa","place_category":"Community"}'::jsonb,null),
('moh_chas_geo','CHAS Clinics','Ministry of Health','https://data.gov.sg/datasets/d_548c33ea2d99e29ec63a7cc9edcccedc/view','official','weekly_ingestion',604800,true,'{"dataset_id":"d_548c33ea2d99e29ec63a7cc9edcccedc","place_category":"Healthcare"}'::jsonb,null),
('ecda_childcare_geo','Child Care Services','Early Childhood Development Agency','https://data.gov.sg/datasets/d_5d668e3f544335f8028f546827b773b4/view','official','monthly_ingestion',2592000,true,'{"dataset_id":"d_5d668e3f544335f8028f546827b773b4","place_category":"Childcare"}'::jsonb,null),
('sfa_supermarkets_kml','Supermarkets','Singapore Food Agency','https://data.gov.sg/datasets/d_8a77ee0446716b2ce475a587004afc73/view','official','monthly_ingestion',2592000,true,'{"dataset_id":"d_8a77ee0446716b2ce475a587004afc73","place_category":"Supermarket"}'::jsonb,null)
on conflict (source_key) do update set
name=excluded.name,authority=excluded.authority,base_url=excluded.base_url,
source_type=excluded.source_type,refresh_strategy=excluded.refresh_strategy,
default_ttl_seconds=excluded.default_ttl_seconds,active=true,metadata=excluded.metadata,updated_at=now();

create index if not exists place_catalog_metadata_gin_idx on public.place_catalog using gin(metadata);

update public.place_catalog
set metadata=jsonb_set(coalesce(metadata,'{}'::jsonb),'{persona_scores}',
  case when kind='attraction'
    then '{"resident":38,"visitor":96,"executive":58,"new_in_sg":68}'::jsonb
    else '{"resident":60,"visitor":60,"executive":60,"new_in_sg":60}'::jsonb end,true)
where active and not (coalesce(metadata,'{}'::jsonb) ? 'persona_scores');

with seed(slug,name,category,lon,lat,description,scores) as (values
('hub-raffles-place','Raffles Place','Business district',103.8513,1.2840,'Core CBD hub for offices, finance, meetings and transfers.','{"resident":55,"visitor":45,"executive":100,"new_in_sg":72}'::jsonb),
('hub-marina-bay-financial-centre','Marina Bay Financial Centre','Business district',103.8547,1.2797,'Major Marina Bay office and meeting cluster.','{"resident":50,"visitor":48,"executive":100,"new_in_sg":68}'::jsonb),
('hub-tanjong-pagar','Tanjong Pagar / Guoco Tower','Business district',103.8458,1.2764,'CBD office, dining and transport hub around Tanjong Pagar.','{"resident":68,"visitor":60,"executive":98,"new_in_sg":78}'::jsonb),
('hub-suntec-city','Suntec City','Business / convention',103.8572,1.2937,'Office, convention, retail and meeting hub around Suntec and Marina Centre.','{"resident":62,"visitor":72,"executive":95,"new_in_sg":72}'::jsonb),
('hub-one-north','one-north','Business / innovation',103.7875,1.2990,'Technology, biomedical, media and startup district.','{"resident":64,"visitor":30,"executive":94,"new_in_sg":72}'::jsonb),
('hub-mapletree-business-city','Mapletree Business City','Business district',103.7982,1.2748,'Large office campus beside Alexandra and Pasir Panjang.','{"resident":52,"visitor":24,"executive":92,"new_in_sg":60}'::jsonb),
('hub-paya-lebar-quarter','Paya Lebar Quarter','Business / town hub',103.8926,1.3175,'Major east-side office, retail and transport hub.','{"resident":84,"visitor":45,"executive":92,"new_in_sg":88}'::jsonb),
('hub-changi-business-park','Changi Business Park','Business district',103.9656,1.3348,'Large business park near Expo and Changi Airport.','{"resident":48,"visitor":24,"executive":91,"new_in_sg":58}'::jsonb),
('hub-singapore-expo','Singapore EXPO','Convention / business',103.9620,1.3349,'Major convention and exhibition venue beside Expo MRT.','{"resident":55,"visitor":58,"executive":92,"new_in_sg":62}'::jsonb),
('hub-international-business-park','International Business Park','Business district',103.7419,1.3288,'Jurong East business park and corporate cluster.','{"resident":55,"visitor":18,"executive":88,"new_in_sg":62}'::jsonb),
('hub-harbourfront','HarbourFront','Business / transport hub',103.8202,1.2643,'Office, retail, ferry and Sentosa gateway.','{"resident":72,"visitor":84,"executive":82,"new_in_sg":74}'::jsonb),
('hub-bedok','Bedok Town Centre','Town centre',103.9300,1.3240,'East-side everyday hub for food, shopping, services and transport.','{"resident":98,"visitor":42,"executive":55,"new_in_sg":96}'::jsonb),
('hub-tampines','Tampines Central','Town centre',103.9450,1.3530,'Major east-side town centre with retail, community, transport and services.','{"resident":98,"visitor":42,"executive":60,"new_in_sg":97}'::jsonb),
('hub-jurong-east','Jurong East Central','Town centre',103.7423,1.3331,'West-side regional centre for transport, shopping, offices and services.','{"resident":98,"visitor":48,"executive":72,"new_in_sg":97}'::jsonb),
('hub-woodlands','Woodlands Central','Town centre',103.7860,1.4360,'North-side regional hub for transport, retail and community services.','{"resident":97,"visitor":34,"executive":52,"new_in_sg":96}'::jsonb),
('hub-bishan','Bishan Central','Town centre',103.8488,1.3507,'Central residential hub with MRT interchange, retail and community services.','{"resident":97,"visitor":38,"executive":58,"new_in_sg":95}'::jsonb),
('hub-toa-payoh','Toa Payoh Central','Town centre',103.8474,1.3323,'Mature-town hub with food, services, sports and transport.','{"resident":98,"visitor":48,"executive":55,"new_in_sg":96}'::jsonb),
('hub-ang-mo-kio','Ang Mo Kio Central','Town centre',103.8492,1.3691,'Mature-town hub for transport, shopping, healthcare and everyday services.','{"resident":98,"visitor":36,"executive":54,"new_in_sg":97}'::jsonb),
('hub-punggol','Punggol Town Centre','Town centre',103.9024,1.4052,'North-east residential hub around Punggol MRT and Waterway Point.','{"resident":97,"visitor":44,"executive":50,"new_in_sg":96}'::jsonb),
('hub-sengkang','Sengkang Town Centre','Town centre',103.8954,1.3915,'North-east transport and residential hub around Sengkang MRT.','{"resident":97,"visitor":34,"executive":48,"new_in_sg":96}'::jsonb),
('hub-clementi','Clementi Town Centre','Town centre',103.7650,1.3151,'West-side residential and education hub with MRT, food and services.','{"resident":97,"visitor":40,"executive":56,"new_in_sg":96}'::jsonb),
('hub-queenstown','Queenstown','Neighbourhood hub',103.8060,1.2945,'Central-west residential hub with healthcare, sports and everyday services.','{"resident":94,"visitor":42,"executive":58,"new_in_sg":94}'::jsonb),
('hub-tiong-bahru','Tiong Bahru','Neighbourhood hub',103.8270,1.2862,'Residential heritage neighbourhood with food, market and local services.','{"resident":94,"visitor":78,"executive":68,"new_in_sg":92}'::jsonb),
('hub-katong-joo-chiat','Katong / Joo Chiat','Neighbourhood hub',103.9004,1.3122,'East-side neighbourhood known for food, heritage and daily-life amenities.','{"resident":94,"visitor":82,"executive":58,"new_in_sg":93}'::jsonb),
('hub-holland-village','Holland Village','Neighbourhood hub',103.7963,1.3111,'Dining, retail and residential hub popular with locals and newcomers.','{"resident":92,"visitor":70,"executive":74,"new_in_sg":94}'::jsonb),
('hub-serangoon','Serangoon Central','Town centre',103.8736,1.3497,'North-east interchange hub with retail, food and community services.','{"resident":96,"visitor":36,"executive":54,"new_in_sg":95}'::jsonb),
('hub-yishun','Yishun Central','Town centre',103.8351,1.4295,'North-side residential hub with healthcare, retail and transport.','{"resident":96,"visitor":28,"executive":46,"new_in_sg":95}'::jsonb)
)
insert into public.place_catalog
(slug,name,aliases,kind,category,geo,description,source_key,source_ref,source_url,verified_at,metadata,active)
select slug,name,array[]::text[],'poi',category,
ST_SetSRID(ST_MakePoint(lon,lat),4326)::geography,description,
'sgbuddy_curated','v11-persona-hub',null,now(),
jsonb_build_object('persona_scores',scores,'catalog_layer','persona_hub','featured_rank',null),true
from seed
on conflict (slug) do update set
name=excluded.name,category=excluded.category,geo=excluded.geo,description=excluded.description,
metadata=excluded.metadata,verified_at=now(),active=true,updated_at=now();

create or replace function public.list_persona_places(
  persona text default 'resident',
  category_filter text default null,
  latitude double precision default null,
  longitude double precision default null,
  search_text text default null,
  result_limit integer default 60
)
returns table(
  slug text,name text,kind text,category text,description text,address text,postal_code text,
  latitude double precision,longitude double precision,distance_m double precision,
  persona_score integer,source_key text,source_url text,metadata jsonb,verified_at timestamptz
)
language sql stable security invoker
set search_path = pg_catalog, public, extensions
as $$
  with q as (
    select
      case when persona in ('resident','visitor','executive','new_in_sg') then persona else 'resident' end p,
      nullif(lower(trim(coalesce(category_filter,''))),'') category_term,
      nullif(lower(trim(coalesce(search_text,''))),'') search_term,
      case when latitude between 1.0 and 1.6 and longitude between 103.4 and 104.2
        then ST_SetSRID(ST_MakePoint(longitude,latitude),4326)::geography else null end point,
      greatest(1,least(coalesce(result_limit,60),200)) lim
  )
  select
    p.slug,p.name,p.kind,p.category,p.description,p.address,p.postal_code,
    ST_Y(p.geo::geometry),ST_X(p.geo::geometry),
    case when q.point is null then null else ST_Distance(p.geo,q.point) end,
    coalesce((p.metadata->'persona_scores'->>q.p)::integer,50),
    p.source_key,p.source_url,p.metadata,p.verified_at
  from public.place_catalog p cross join q
  where p.active
    and (q.category_term is null or lower(coalesce(p.category,'')) like '%'||q.category_term||'%')
    and (q.search_term is null or lower(coalesce(p.name,'')||' '||coalesce(p.category,'')||' '||coalesce(p.address,'')) like '%'||q.search_term||'%')
    and coalesce((p.metadata->'persona_scores'->>q.p)::integer,50) >= 20
  order by
    coalesce((p.metadata->'persona_scores'->>q.p)::integer,50) desc,
    case when q.point is null then 0 else ST_Distance(p.geo,q.point) end,
    p.name
  limit (select lim from q);
$$;

revoke all on function public.list_persona_places(text,text,double precision,double precision,text,integer) from public;
grant execute on function public.list_persona_places(text,text,double precision,double precision,text,integer) to anon, authenticated;
