-- SGBuddy v1.1: refresh Place Index source adapters after live ingestion QA.

update public.data_sources
set base_url='https://data.gov.sg/datasets/d_9de02d3fb33d96da1855f4fbef549a0f/view',
    metadata='{"dataset_id":"d_9de02d3fb33d96da1855f4fbef549a0f","place_category":"Community club"}'::jsonb,
    last_verified_at=null,updated_at=now()
where source_key='pa_community_clubs_geo';

update public.data_sources set last_verified_at=null,updated_at=now()
where source_key='nlb_libraries_geo';

update public.data_sources
set active=false,
    metadata=coalesce(metadata,'{}'::jsonb)||'{"status":"catalog_visible_but_poll_download_404","superseded_for_runtime":true}'::jsonb,
    updated_at=now()
where source_key='sfa_supermarkets_kml';

insert into public.data_sources
(source_key,name,authority,base_url,source_type,refresh_strategy,default_ttl_seconds,active,metadata,last_verified_at)
values
('sport_sg_facilities_geo','SportSG Sport Facilities','Sport Singapore','https://data.gov.sg/datasets/d_9b87bab59d036a60fad2a91530e10773/view','official','weekly_ingestion',604800,true,'{"dataset_id":"d_9b87bab59d036a60fad2a91530e10773","place_category":"Sports facility"}'::jsonb,null),
('nea_market_food_geo','NEA Market and Food Centre','National Environment Agency','https://data.gov.sg/datasets/d_a57a245b3cf3ec76ad36d55393a16e97/view','official','weekly_ingestion',604800,true,'{"dataset_id":"d_a57a245b3cf3ec76ad36d55393a16e97","place_category":"Market / food centre"}'::jsonb,null),
('osm_supermarkets','OpenStreetMap supermarkets','OpenStreetMap contributors','https://www.openstreetmap.org/','community','weekly_ingestion',604800,true,'{"query":"shop=supermarket","place_category":"Supermarket","official":false}'::jsonb,null)
on conflict (source_key) do update set
name=excluded.name,authority=excluded.authority,base_url=excluded.base_url,source_type=excluded.source_type,
refresh_strategy=excluded.refresh_strategy,default_ttl_seconds=excluded.default_ttl_seconds,active=excluded.active,
metadata=excluded.metadata,last_verified_at=null,updated_at=now();
