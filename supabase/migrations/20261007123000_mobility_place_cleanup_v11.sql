-- SGBuddy v1.1: sanitize official place descriptions displayed in cards.
update public.place_catalog
set description = case source_key
  when 'moh_chas_geo' then 'MOH-listed CHAS clinic.'
  when 'moh_polyclinics_geo' then 'MOH-listed polyclinic.'
  when 'hsa_pharmacies_geo' then 'HSA-licensed retail pharmacy.'
  when 'ecda_childcare_geo' then 'ECDA-licensed childcare centre.'
  when 'nparks_parks_geo' then 'NParks-managed park.'
  when 'nea_hawker_geo' then 'NEA-listed hawker centre.'
  when 'nea_market_food_geo' then 'NEA-listed market / food centre.'
  when 'pa_community_clubs_geo' then 'People''s Association community club.'
  when 'sport_sg_facilities_geo' then 'SportSG-managed sports facility.'
  when 'nlb_libraries_geo' then 'NLB public library.'
  else description
end,
updated_at=now()
where source_key in ('moh_chas_geo','moh_polyclinics_geo','hsa_pharmacies_geo','ecda_childcare_geo','nparks_parks_geo','nea_hawker_geo','nea_market_food_geo','pa_community_clubs_geo','sport_sg_facilities_geo','nlb_libraries_geo');