-- SGBuddy v1.1: keep the Place Index on validated, routable sources.

update public.data_sources
set active=false,
    metadata=coalesce(metadata,'{}'::jsonb)||'{"runtime_status":"disabled_after_overpass_406"}'::jsonb,
    updated_at=now()
where source_key='osm_supermarkets';

insert into public.data_sources
(source_key,name,authority,base_url,source_type,refresh_strategy,default_ttl_seconds,active,metadata,last_verified_at)
values
('hsa_pharmacies_geo','Retail pharmacy locations','Health Sciences Authority','https://data.gov.sg/datasets/d_bb92615f43de22933e4479558b1f6c36/view','official','weekly_ingestion',604800,true,'{"dataset_id":"d_bb92615f43de22933e4479558b1f6c36","place_category":"Retail pharmacy"}'::jsonb,null)
on conflict (source_key) do update set
name=excluded.name,authority=excluded.authority,base_url=excluded.base_url,source_type=excluded.source_type,
refresh_strategy=excluded.refresh_strategy,default_ttl_seconds=excluded.default_ttl_seconds,active=true,
metadata=excluded.metadata,last_verified_at=null,updated_at=now();
