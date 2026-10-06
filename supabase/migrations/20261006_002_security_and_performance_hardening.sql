-- SGBuddy v0.8 security + performance hardening
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin new.updated_at = now(); return new; end;
$$;

alter table public.data_sources enable row level security;
alter table public.place_catalog enable row level security;
alter table public.place_source_links enable row level security;
alter table public.accommodation_properties enable row level security;
alter table public.accommodation_provider_map enable row level security;
alter table public.accommodation_offer_cache enable row level security;
alter table public.money_changers enable row level security;
alter table public.fx_rate_snapshots enable row level security;
alter table public.fx_quote_observations enable row level security;
alter table public.experience_catalog enable row level security;
alter table public.eligibility_rules enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.partner_referrals enable row level security;

drop policy if exists traveler_profiles_own_select on public.traveler_profiles;
drop policy if exists traveler_profiles_own_insert on public.traveler_profiles;
drop policy if exists traveler_profiles_own_update on public.traveler_profiles;
drop policy if exists saved_places_own_all on public.profile_saved_places;
drop policy if exists recent_places_own_all on public.profile_recent_places;
drop policy if exists journey_sessions_own_all on public.journey_sessions;
drop policy if exists trip_notifications_own_all on public.trip_notifications;

create policy traveler_profiles_own_select on public.traveler_profiles
for select using ((select auth.uid()) = auth_user_id);
create policy traveler_profiles_own_insert on public.traveler_profiles
for insert with check ((select auth.uid()) = auth_user_id);
create policy traveler_profiles_own_update on public.traveler_profiles
for update using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

create policy saved_places_own_all on public.profile_saved_places
for all using (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())))
with check (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())));
create policy recent_places_own_all on public.profile_recent_places
for all using (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())))
with check (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())));
create policy journey_sessions_own_all on public.journey_sessions
for all using (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())))
with check (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())));
create policy trip_notifications_own_all on public.trip_notifications
for all using (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())))
with check (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=(select auth.uid())));

create index if not exists accommodation_offer_cache_property_idx on public.accommodation_offer_cache(property_id);
create index if not exists accommodation_provider_map_property_idx on public.accommodation_provider_map(property_id);
create index if not exists experience_catalog_place_idx on public.experience_catalog(place_id);
create index if not exists experience_catalog_source_idx on public.experience_catalog(source_key);
create index if not exists fx_quote_money_changer_idx on public.fx_quote_observations(money_changer_id);
create index if not exists ingestion_runs_source_idx on public.ingestion_runs(source_key);
create index if not exists money_changers_source_idx on public.money_changers(source_key);
create index if not exists partner_referrals_journey_idx on public.partner_referrals(journey_session_id);
create index if not exists partner_referrals_profile_idx on public.partner_referrals(profile_id);
create index if not exists place_catalog_source_idx on public.place_catalog(source_key);
create index if not exists place_source_links_place_idx on public.place_source_links(place_id);
create index if not exists profile_recent_places_place_idx on public.profile_recent_places(place_id);
create index if not exists profile_saved_places_place_idx on public.profile_saved_places(place_id);
create index if not exists trip_notifications_journey_idx on public.trip_notifications(journey_session_id);
create index if not exists trip_notifications_profile_idx on public.trip_notifications(profile_id);
