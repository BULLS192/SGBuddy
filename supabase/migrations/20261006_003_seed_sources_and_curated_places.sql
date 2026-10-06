insert into public.data_sources
(source_key,name,authority,source_type,refresh_strategy,default_ttl_seconds,active,metadata,last_verified_at)
values
('sgbuddy_curated','SGBuddy Curated Catalog','Omnidite / SGBuddy','internal','manual_review',86400,true,'{"role":"canonical_place_seed"}'::jsonb,now()),
('lta_datamall','LTA DataMall','Land Transport Authority','official','api',60,true,'{"domains":["bus","traffic","transport"]}'::jsonb,now()),
('lta_gtfs','LTA GTFS','Land Transport Authority','official','scheduled_feed',86400,true,'{"domains":["rail","schedules"]}'::jsonb,now()),
('data_gov_sg','data.gov.sg','Government of Singapore','official','api',300,true,'{"domains":["weather","public_data"]}'::jsonb,now()),
('mas_fid','MAS Financial Institutions Directory','Monetary Authority of Singapore','official','periodic_ingestion',86400,true,'{"domains":["money_changers","licensing"]}'::jsonb,now()),
('onemap','OneMap','Singapore Land Authority','official','api',86400,true,'{"domains":["geocoding","places"]}'::jsonb,now()),
('iras_rules','IRAS','Inland Revenue Authority of Singapore','official','manual_verified_rules',604800,true,'{"domains":["gst","tourist_refund","eligibility"]}'::jsonb,now()),
('amadeus_hotels','Amadeus Hotels','Amadeus','provider','live_api',900,false,'{"status":"candidate","domains":["accommodation","offers"]}'::jsonb,now()),
('expedia_rapid','Expedia Rapid','Expedia Group','provider','live_api',900,false,'{"status":"candidate","domains":["accommodation","offers"]}'::jsonb,now())
on conflict (source_key) do update set
name=excluded.name,authority=excluded.authority,source_type=excluded.source_type,
refresh_strategy=excluded.refresh_strategy,default_ttl_seconds=excluded.default_ttl_seconds,
active=excluded.active,metadata=excluded.metadata,last_verified_at=excluded.last_verified_at,updated_at=now();

insert into public.place_catalog
(slug,name,aliases,kind,category,geo,source_key,verified_at,metadata)
values
('jewel-changi-airport','Jewel Changi Airport',array['jewel','jewel changi','changi jewel'],'attraction','Attraction / Mall',ST_SetSRID(ST_MakePoint(103.989759,1.360208),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","executive","new_in_sg"]}'::jsonb),
('changi-airport-terminal-1','Changi Airport Terminal 1',array['changi t1','terminal 1','airport t1'],'transport','Airport',ST_SetSRID(ST_MakePoint(103.991531,1.36442),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","executive","resident","new_in_sg"]}'::jsonb),
('changi-airport-terminal-2','Changi Airport Terminal 2',array['changi t2','terminal 2','airport t2'],'transport','Airport',ST_SetSRID(ST_MakePoint(103.989869,1.355567),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","executive","resident","new_in_sg"]}'::jsonb),
('changi-airport-terminal-3','Changi Airport Terminal 3',array['changi t3','terminal 3','airport t3'],'transport','Airport',ST_SetSRID(ST_MakePoint(103.986233,1.356774),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","executive","resident","new_in_sg"]}'::jsonb),
('changi-airport-terminal-4','Changi Airport Terminal 4',array['changi t4','terminal 4','airport t4'],'transport','Airport',ST_SetSRID(ST_MakePoint(103.983198,1.338604),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","executive","resident","new_in_sg"]}'::jsonb),
('marina-bay-sands','Marina Bay Sands',array['mbs','marina bay sands hotel'],'attraction','Landmark',ST_SetSRID(ST_MakePoint(103.860722,1.283399),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","executive"]}'::jsonb),
('gardens-by-the-bay','Gardens by the Bay',array['gardens by bay','gbtb','supertree grove'],'attraction','Attraction',ST_SetSRID(ST_MakePoint(103.863613,1.281568),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident","new_in_sg"]}'::jsonb),
('merlion-park','Merlion Park',array['merlion'],'attraction','Landmark',ST_SetSRID(ST_MakePoint(103.854519,1.286788),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor"]}'::jsonb),
('esplanade','Esplanade',array['esplanade theatres','the durian'],'attraction','Arts',ST_SetSRID(ST_MakePoint(103.855321,1.289692),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident","new_in_sg"]}'::jsonb),
('suntec-city','Suntec City',array['suntec','suntec convention centre'],'business','Mall / Convention',ST_SetSRID(ST_MakePoint(103.857244,1.293574),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["executive","visitor","resident"]}'::jsonb),
('singapore-flyer','Singapore Flyer',array['flyer'],'attraction','Attraction',ST_SetSRID(ST_MakePoint(103.863137,1.289297),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor"]}'::jsonb),
('orchard-road','Orchard Road',array['orchard','ion orchard'],'shopping','Shopping',ST_SetSRID(ST_MakePoint(103.831944,1.304041),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","executive","resident","new_in_sg"]}'::jsonb),
('bugis-junction','Bugis Junction',array['bugis'],'shopping','Shopping',ST_SetSRID(ST_MakePoint(103.855363,1.299557),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident","new_in_sg"]}'::jsonb),
('vivocity','VivoCity',array['vivo city'],'shopping','Mall',ST_SetSRID(ST_MakePoint(103.822238,1.264371),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident","new_in_sg"]}'::jsonb),
('sentosa','Sentosa',array['sentosa island'],'attraction','Attraction',ST_SetSRID(ST_MakePoint(103.830321,1.249404),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident","executive"]}'::jsonb),
('universal-studios-singapore','Universal Studios Singapore',array['uss','universal studios','universal studios singapore'],'attraction','Attraction',ST_SetSRID(ST_MakePoint(103.823809,1.254042),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident"]}'::jsonb),
('singapore-zoo','Singapore Zoo',array['zoo','mandai zoo','singapore zoological gardens'],'attraction','Attraction',ST_SetSRID(ST_MakePoint(103.793023,1.404344),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident","new_in_sg"]}'::jsonb),
('night-safari','Night Safari',array['night safari singapore'],'attraction','Attraction',ST_SetSRID(ST_MakePoint(103.788953,1.402347),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident"]}'::jsonb),
('bird-paradise','Bird Paradise',array['mandai bird paradise','bird park'],'attraction','Attraction',ST_SetSRID(ST_MakePoint(103.78565,1.41197),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident","new_in_sg"]}'::jsonb),
('national-university-of-singapore','National University of Singapore',array['nus','national university singapore'],'education','University',ST_SetSRID(ST_MakePoint(103.776394,1.296643),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["new_in_sg","resident"]}'::jsonb),
('nanyang-technological-university','Nanyang Technological University',array['ntu','nanyang tech'],'education','University',ST_SetSRID(ST_MakePoint(103.683119,1.348309),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["new_in_sg","resident"]}'::jsonb),
('national-stadium','National Stadium',array['singapore national stadium','sports hub','singapore sports hub'],'attraction','Stadium',ST_SetSRID(ST_MakePoint(103.874327,1.304038),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["visitor","resident"]}'::jsonb),
('singapore-expo','Singapore Expo',array['expo','singapore expo convention'],'business','Convention',ST_SetSRID(ST_MakePoint(103.959036,1.334761),4326)::geography,'sgbuddy_curated',now(),'{"persona_fit":["executive","visitor"]}'::jsonb)
on conflict (slug) do update set
name=excluded.name,aliases=excluded.aliases,kind=excluded.kind,category=excluded.category,
geo=excluded.geo,source_key=excluded.source_key,verified_at=excluded.verified_at,
metadata=excluded.metadata,active=true,updated_at=now();