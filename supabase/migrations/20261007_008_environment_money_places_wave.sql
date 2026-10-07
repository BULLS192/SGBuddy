-- SGBuddy v1.0: Travel + Living Intelligence catalog and security hardening.
-- Explicit grants are included so Data API access does not depend on legacy defaults.

insert into public.data_sources
(source_key,name,authority,base_url,source_type,refresh_strategy,default_ttl_seconds,active,metadata,last_verified_at)
values
('ecb_reference','ECB Euro Foreign Exchange Reference Rates','European Central Bank','https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/','official','daily_reference',86400,true,'{"domains":["fx"],"rate_type":"reference","transaction_rate":false}'::jsonb,now()),
('mas_money_changer_geojson','Locations of Money Changer','Monetary Authority of Singapore','https://data.gov.sg/datasets/d_f2dc6f340fcf53007e18dad9df92d229/view','official','quarterly_ingestion',7776000,true,'{"domains":["money_changers","locations"],"dataset_id":"d_f2dc6f340fcf53007e18dad9df92d229"}'::jsonb,now()),
('visitsingapore_web','Visit Singapore / official attraction sources','Singapore Tourism Board and attraction operators','https://www.visitsingapore.com/','official','manual_verified_catalog',2592000,true,'{"domains":["places","visitor_information"],"note":"TIH is not used"}'::jsonb,now())
on conflict (source_key) do update set
name=excluded.name,authority=excluded.authority,base_url=excluded.base_url,source_type=excluded.source_type,
refresh_strategy=excluded.refresh_strategy,default_ttl_seconds=excluded.default_ttl_seconds,
active=excluded.active,metadata=excluded.metadata,last_verified_at=excluded.last_verified_at,updated_at=now();

create index if not exists money_changers_verified_idx on public.money_changers(verified_at desc);
create index if not exists fx_rate_expiry_idx on public.fx_rate_snapshots(expires_at desc);

with seed(slug,name,aliases,category,lon,lat,description,source_url,metadata) as (values
('marina-bay-sands','Marina Bay Sands',array['mbs','marina bay sands hotel'],'Landmark',103.860722,1.283399,'Integrated Marina Bay landmark with observation, dining, shopping and museum access.','https://www.marinabaysands.com/','{"featured_rank":1,"visitor_relevance":"iconic","persona_fit":["visitor","executive"],"nearest_transit":"Bayfront MRT","rain_fit":"good","best_time":"Late afternoon into evening"}'::jsonb),
('gardens-by-the-bay','Gardens by the Bay',array['gardens by bay','gbtb','supertree grove'],'Gardens / Attraction',103.863613,1.281568,'Bayfront gardens with climate-controlled conservatories and outdoor Supertrees.','https://www.gardensbythebay.com.sg/','{"featured_rank":2,"visitor_relevance":"iconic","persona_fit":["visitor","resident","new_in_sg"],"nearest_transit":"Gardens by the Bay MRT / Bayfront MRT","rain_fit":"mixed","best_time":"Late afternoon and evening"}'::jsonb),
('jewel-changi-airport','Jewel Changi Airport',array['jewel','jewel changi','changi jewel'],'Airport attraction / Mall',103.989759,1.360208,'Airport-connected complex centred on the Rain Vortex, dining, shopping and indoor attractions.','https://www.jewelchangiairport.com/','{"featured_rank":3,"visitor_relevance":"major","persona_fit":["visitor","executive","new_in_sg"],"nearest_transit":"Changi Airport MRT","rain_fit":"excellent","best_time":"Arrival/departure day or evening"}'::jsonb),
('merlion-park','Merlion Park',array['merlion'],'Landmark',103.854519,1.286788,'Waterfront stop for the Merlion and classic Marina Bay skyline view.','https://www.visitsingapore.com/','{"featured_rank":4,"visitor_relevance":"iconic","persona_fit":["visitor"],"nearest_transit":"Raffles Place MRT","rain_fit":"poor","best_time":"Early morning or after sunset"}'::jsonb),
('sentosa','Sentosa',array['sentosa island'],'Island / Attractions',103.830321,1.249404,'Resort island for beaches, attractions and Resorts World Singapore.','https://www.sentosa.com.sg/','{"featured_rank":5,"visitor_relevance":"major","persona_fit":["visitor","resident","executive"],"nearest_transit":"HarbourFront MRT + Sentosa Express","rain_fit":"mixed","best_time":"Half-day to full-day"}'::jsonb),
('universal-studios-singapore','Universal Studios Singapore',array['uss','universal studios','universal studios singapore'],'Theme park',103.823809,1.254042,'Theme park at Resorts World Sentosa; allow a substantial part of the day.','https://www.rwsentosa.com/en/attractions/universal-studios-singapore','{"featured_rank":6,"visitor_relevance":"major","persona_fit":["visitor","resident"],"nearest_transit":"HarbourFront MRT + Sentosa Express","rain_fit":"mixed","best_time":"Opening time on a weekday"}'::jsonb),
('singapore-zoo','Singapore Zoo',array['zoo','mandai zoo','singapore zoological gardens'],'Wildlife park',103.793023,1.404344,'Open-concept wildlife park in Mandai; travel time from the city is significant.','https://www.mandai.com/en/singapore-zoo.html','{"featured_rank":7,"visitor_relevance":"major","persona_fit":["visitor","resident","new_in_sg"],"nearest_transit":"Mandai shuttle / connecting bus","rain_fit":"poor","best_time":"Morning"}'::jsonb),
('night-safari','Night Safari',array['night safari singapore'],'Wildlife park',103.788953,1.402347,'Evening wildlife park in Mandai designed around nocturnal animal viewing.','https://www.mandai.com/en/night-safari.html','{"featured_rank":8,"visitor_relevance":"major","persona_fit":["visitor","resident"],"nearest_transit":"Mandai shuttle / connecting bus","rain_fit":"poor","best_time":"After sunset"}'::jsonb),
('bird-paradise','Bird Paradise',array['mandai bird paradise','bird park'],'Wildlife park',103.785650,1.411970,'Mandai bird park with large walk-through aviaries and themed habitats.','https://www.mandai.com/en/bird-paradise.html','{"featured_rank":9,"visitor_relevance":"major","persona_fit":["visitor","resident","new_in_sg"],"nearest_transit":"Mandai shuttle / connecting bus","rain_fit":"mixed","best_time":"Morning"}'::jsonb),
('singapore-botanic-gardens','Singapore Botanic Gardens',array['botanic gardens','singapore botanical gardens'],'Gardens',103.815340,1.313839,'UNESCO-listed tropical garden suited to a slower walk and repeat local visits.','https://www.nparks.gov.sg/sbg','{"featured_rank":10,"visitor_relevance":"major","persona_fit":["visitor","resident","new_in_sg"],"nearest_transit":"Botanic Gardens MRT","rain_fit":"poor","best_time":"Early morning or late afternoon"}'::jsonb),
('orchard-road','Orchard Road',array['orchard','ion orchard'],'Shopping district',103.831944,1.304041,'Singapore''s main retail corridor with dense malls, dining and indoor connections.','https://www.visitsingapore.com/','{"featured_rank":11,"visitor_relevance":"major","persona_fit":["visitor","executive","resident","new_in_sg"],"nearest_transit":"Orchard / Orchard Boulevard / Somerset MRT","rain_fit":"excellent","best_time":"Afternoon into evening"}'::jsonb),
('chinatown','Chinatown',array['chinatown singapore','chinatown complex'],'Heritage district',103.843868,1.283598,'Compact heritage district combining temples, food centres, markets and conserved streets.','https://www.visitsingapore.com/','{"featured_rank":12,"visitor_relevance":"major","persona_fit":["visitor","new_in_sg","resident"],"nearest_transit":"Chinatown MRT","rain_fit":"mixed","best_time":"Late morning to evening"}'::jsonb),
('little-india','Little India',array['little india singapore','tekka'],'Heritage district',103.852568,1.306629,'Colourful heritage district around Serangoon Road, Tekka and cultural landmarks.','https://www.visitsingapore.com/','{"featured_rank":13,"visitor_relevance":"major","persona_fit":["visitor","new_in_sg","resident"],"nearest_transit":"Little India MRT","rain_fit":"mixed","best_time":"Late morning or evening"}'::jsonb),
('kampong-glam-haji-lane','Kampong Glam / Haji Lane',array['kampong glam','haji lane','arab street'],'Heritage district',103.859561,1.302475,'Historic Malay-Arab quarter with Sultan Mosque, independent shops, cafés and street art.','https://www.visitsingapore.com/','{"featured_rank":14,"visitor_relevance":"major","persona_fit":["visitor","new_in_sg","resident"],"nearest_transit":"Bugis MRT","rain_fit":"mixed","best_time":"Late afternoon and evening"}'::jsonb),
('clarke-quay','Clarke Quay',array['clarke quay singapore'],'Riverfront / Nightlife',103.846550,1.290602,'Singapore River dining and nightlife cluster with easy access to Boat Quay and Fort Canning.','https://www.visitsingapore.com/','{"featured_rank":15,"visitor_relevance":"major","persona_fit":["visitor","executive","resident"],"nearest_transit":"Clarke Quay MRT","rain_fit":"good","best_time":"Evening"}'::jsonb),
('national-gallery-singapore','National Gallery Singapore',array['national gallery','national gallery sg'],'Museum / Arts',103.851956,1.290270,'Major Southeast Asian art museum in the former Supreme Court and City Hall buildings.','https://www.nationalgallery.sg/','{"featured_rank":16,"visitor_relevance":"major","persona_fit":["visitor","executive","resident","new_in_sg"],"nearest_transit":"City Hall MRT","rain_fit":"excellent","best_time":"Midday / rainy weather"}'::jsonb),
('artscience-museum','ArtScience Museum',array['art science museum','artscience'],'Museum',103.859257,1.286266,'Museum at Marina Bay Sands known for rotating art, science and digital exhibitions.','https://www.marinabaysands.com/museum.html','{"featured_rank":17,"visitor_relevance":"major","persona_fit":["visitor","executive","resident"],"nearest_transit":"Bayfront MRT","rain_fit":"excellent","best_time":"Midday / rainy weather"}'::jsonb),
('singapore-flyer','Singapore Flyer',array['flyer'],'Observation attraction',103.863137,1.289297,'Observation wheel overlooking Marina Bay and the city skyline.','https://www.singaporeflyer.com/','{"featured_rank":18,"visitor_relevance":"major","persona_fit":["visitor"],"nearest_transit":"Promenade MRT","rain_fit":"good","best_time":"Golden hour or evening"}'::jsonb),
('fort-canning-park','Fort Canning Park',array['fort canning'],'Historic park',103.846453,1.295506,'Central hill park with heritage sites, shaded paths and links between Orchard and the river area.','https://www.nparks.gov.sg/visit/parks/park-detail/fort-canning-park','{"featured_rank":19,"visitor_relevance":"useful","persona_fit":["visitor","resident","new_in_sg"],"nearest_transit":"Fort Canning MRT","rain_fit":"poor","best_time":"Morning or late afternoon"}'::jsonb),
('haw-par-villa','Haw Par Villa',array['tiger balm gardens'],'Culture / Heritage',103.767245,1.283726,'Distinctive heritage park known for Chinese mythology dioramas and the Ten Courts of Hell.','https://www.hawparvilla.sg/','{"featured_rank":20,"visitor_relevance":"distinctive","persona_fit":["visitor","resident","new_in_sg"],"nearest_transit":"Haw Par Villa MRT","rain_fit":"mixed","best_time":"Morning or late afternoon"}'::jsonb)
)
insert into public.place_catalog
(slug,name,aliases,kind,category,geo,description,source_key,source_ref,source_url,verified_at,metadata,active)
select slug,name,aliases,'attraction',category,ST_SetSRID(ST_MakePoint(lon,lat),4326)::geography,description,
'sgbuddy_curated','wave-090-top20',source_url,now(),metadata,true
from seed
on conflict (slug) do update set
name=excluded.name,aliases=excluded.aliases,kind=excluded.kind,category=excluded.category,geo=excluded.geo,
description=excluded.description,source_key=excluded.source_key,source_ref=excluded.source_ref,source_url=excluded.source_url,
verified_at=excluded.verified_at,metadata=excluded.metadata,active=true,updated_at=now();

create or replace function public.list_public_featured_places(result_limit integer default 20)
returns table(
  slug text,name text,category text,description text,latitude double precision,longitude double precision,
  metadata jsonb,source_key text,source_url text,verified_at timestamptz
)
language sql stable security invoker set search_path = pg_catalog, public, extensions as $$
  select p.slug,p.name,p.category,p.description,ST_Y(p.geo::geometry),ST_X(p.geo::geometry),
         p.metadata,p.source_key,p.source_url,p.verified_at
  from public.place_catalog p
  where p.active and p.metadata ? 'featured_rank'
  order by coalesce((p.metadata->>'featured_rank')::integer,999),p.name
  limit greatest(1,least(coalesce(result_limit,20),40));
$$;
revoke all on function public.list_public_featured_places(integer) from public;
grant execute on function public.list_public_featured_places(integer) to anon, authenticated;

create or replace function public.nearby_public_money_changers(
  latitude double precision default null,
  longitude double precision default null,
  search_text text default '',
  result_limit integer default 12
)
returns table(
  source_ref text,name text,legal_name text,licence_type text,licence_status text,licence_reference text,
  business_registration_number text,address text,postal_code text,latitude double precision,longitude double precision,
  distance_m double precision,verified_at timestamptz,source_url text
)
language sql stable security invoker set search_path = pg_catalog, public, extensions as $$
  with q as (
    select nullif(lower(trim(coalesce(search_text,''))),'') term,
           case when latitude between 1.0 and 1.6 and longitude between 103.4 and 104.2
             then ST_SetSRID(ST_MakePoint(longitude,latitude),4326)::geography else null end point,
           greatest(1,least(coalesce(result_limit,12),30)) lim
  )
  select p.source_ref,p.name,m.legal_name,m.licence_type,m.licence_status,m.licence_reference,
         m.metadata->>'business_registration_number',p.address,p.postal_code,
         ST_Y(p.geo::geometry),ST_X(p.geo::geometry),
         case when q.point is null then null else ST_Distance(p.geo,q.point) end,
         m.verified_at,p.source_url
  from public.money_changers m
  join public.place_catalog p on p.id=m.place_id
  cross join q
  where p.active
    and (q.term is null or lower(coalesce(p.name,'')||' '||coalesce(m.legal_name,'')||' '||coalesce(p.address,'')||' '||coalesce(p.postal_code,'')) like '%'||q.term||'%')
  order by case when q.point is null then 0 else ST_Distance(p.geo,q.point) end,p.name
  limit (select lim from q);
$$;
revoke all on function public.nearby_public_money_changers(double precision,double precision,text,integer) from public;
grant execute on function public.nearby_public_money_changers(double precision,double precision,text,integer) to anon, authenticated;


-- v1.0 Data API hardening ----------------------------------------------------
alter table public.place_catalog enable row level security;
alter table public.money_changers enable row level security;

drop policy if exists place_catalog_public_active_select on public.place_catalog;
create policy place_catalog_public_active_select
on public.place_catalog for select
to anon, authenticated
using (active);

drop policy if exists money_changers_public_listed_select on public.money_changers;
create policy money_changers_public_listed_select
on public.money_changers for select
to anon, authenticated
using (licence_status is not null);

revoke all on table public.place_catalog from anon, authenticated;
grant select (
  id,slug,name,aliases,kind,category,description,address,postal_code,geo,
  source_key,source_ref,source_url,verified_at,active,metadata
) on public.place_catalog to anon, authenticated;

revoke all on table public.money_changers from anon, authenticated;
grant select (
  id,place_id,legal_name,licence_type,licence_status,licence_reference,
  source_key,verified_at,metadata
) on public.money_changers to anon, authenticated;

create or replace function public.search_public_places(search_text text,result_limit integer default 8)
returns table(slug text,name text,kind text,category text,aliases text[],latitude double precision,longitude double precision,source_key text)
language sql stable security invoker set search_path = pg_catalog, public, extensions as $$
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
returns jsonb
language sql stable security invoker set search_path = pg_catalog, public as $$
select jsonb_build_object(
  'places',(select count(*) from public.place_catalog where active),
  'money_changers',(select count(*) from public.money_changers),
  'connected',true
);
$$;
revoke all on function public.public_catalog_stats() from public;
grant execute on function public.public_catalog_stats() to anon, authenticated;

drop policy if exists traveler_profiles_own_select on public.traveler_profiles;
drop policy if exists traveler_profiles_own_insert on public.traveler_profiles;
drop policy if exists traveler_profiles_own_update on public.traveler_profiles;

create policy traveler_profiles_own_select
on public.traveler_profiles for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create policy traveler_profiles_own_insert
on public.traveler_profiles for insert
to authenticated
with check ((select auth.uid()) = auth_user_id);

create policy traveler_profiles_own_update
on public.traveler_profiles for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

revoke all on table public.traveler_profiles from anon;
grant select,insert,update on table public.traveler_profiles to authenticated;

revoke all on function public.sync_legacy_traveler_profile(text,text,text,text,text,text,jsonb) from public;
revoke all on function public.sync_legacy_traveler_profile(text,text,text,text,text,text,jsonb) from anon;
revoke all on function public.sync_legacy_traveler_profile(text,text,text,text,text,text,jsonb) from authenticated;
grant execute on function public.sync_legacy_traveler_profile(text,text,text,text,text,text,jsonb) to service_role;
