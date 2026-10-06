-- SGBuddy / Omnidite Travel Intelligence Core
-- v0.8 platform foundation. Designed for Supabase Postgres.
-- No production data migration is performed by this file.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  name text not null,
  authority text,
  base_url text,
  source_type text not null check (source_type in ('official','provider','partner','community','internal')),
  refresh_strategy text,
  default_ttl_seconds integer,
  terms_url text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.traveler_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  legacy_profile_id text unique,
  active_mode text not null default 'resident'
    check (active_mode in ('resident','visitor','executive','new_in_sg')),
  stay_horizon text
    check (stay_horizon is null or stay_horizon in ('day_trip','few_days','few_weeks','one_to_three_months','three_to_six_months','six_plus_months','long_term')),
  status_context text
    check (status_context is null or status_context in ('short_term_visitor','business_visitor','student','work_pass','dependent','permanent_resident','citizen','other')),
  home_currency char(3) not null default 'SGD',
  preferred_language text not null default 'en',
  walking_tolerance text not null default 'normal'
    check (walking_tolerance in ('low','normal','high')),
  budget_style text
    check (budget_style is null or budget_style in ('budget','value','balanced','premium','luxury')),
  preferences jsonb not null default '{}'::jsonb,
  accessibility jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.place_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  aliases text[] not null default '{}',
  kind text not null check (kind in ('poi','transport','accommodation','fx','food','shopping','health','business','service','education','nightlife','attraction')),
  category text,
  description text,
  address text,
  postal_code text,
  geo geography(point,4326),
  source_key text references public.data_sources(source_key),
  source_ref text,
  source_url text,
  verified_at timestamptz,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists place_catalog_geo_idx on public.place_catalog using gist (geo);
create index if not exists place_catalog_name_trgm_idx on public.place_catalog using gin (name gin_trgm_ops);
create index if not exists place_catalog_aliases_idx on public.place_catalog using gin (aliases);

create table if not exists public.place_source_links (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place_catalog(id) on delete cascade,
  source_key text not null references public.data_sources(source_key),
  external_id text not null,
  external_url text,
  payload_hash text,
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(source_key, external_id)
);

create table if not exists public.profile_saved_places (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.traveler_profiles(id) on delete cascade,
  label text not null,
  place_id uuid references public.place_catalog(id) on delete set null,
  freeform_query text,
  geo geography(point,4326),
  place_role text check (place_role is null or place_role in ('home','work','hotel','school','favourite','other')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profile_saved_places_profile_idx on public.profile_saved_places(profile_id);

create table if not exists public.profile_recent_places (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.traveler_profiles(id) on delete cascade,
  place_id uuid references public.place_catalog(id) on delete set null,
  label text not null,
  value text,
  last_used_at timestamptz not null default now(),
  use_count integer not null default 1,
  unique(profile_id,label)
);

create table if not exists public.accommodation_properties (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null unique references public.place_catalog(id) on delete cascade,
  segment text not null check (segment in ('hostel','capsule','budget_hotel','hotel','luxury_hotel','serviced_apartment','coliving','room_rental')),
  star_rating numeric(2,1),
  price_band text check (price_band is null or price_band in ('budget','value','midscale','upscale','luxury')),
  check_in_time time,
  check_out_time time,
  amenities jsonb not null default '{}'::jsonb,
  backpacker_attributes jsonb not null default '{}'::jsonb,
  business_attributes jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.accommodation_provider_map (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.accommodation_properties(id) on delete cascade,
  provider text not null,
  provider_property_id text not null,
  deep_link_base text,
  metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  unique(provider, provider_property_id)
);

create table if not exists public.accommodation_offer_cache (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.accommodation_properties(id) on delete cascade,
  provider text not null,
  check_in date not null,
  check_out date not null,
  adults smallint not null default 1,
  rooms smallint not null default 1,
  currency char(3) not null,
  nightly_amount numeric(12,2),
  total_amount numeric(12,2),
  offer_ref text,
  booking_url text,
  refundable boolean,
  available boolean not null default true,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  raw_summary jsonb not null default '{}'::jsonb
);
create index if not exists accommodation_offer_lookup_idx
  on public.accommodation_offer_cache(check_in,check_out,currency,expires_at);

create table if not exists public.money_changers (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null unique references public.place_catalog(id) on delete cascade,
  legal_name text not null,
  licence_type text not null default 'Money-changing Licensee',
  licence_status text not null default 'licensed',
  licence_reference text,
  source_key text references public.data_sources(source_key),
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.fx_rate_snapshots (
  id bigint generated always as identity primary key,
  base_currency char(3) not null,
  quote_currency char(3) not null,
  rate numeric(18,8) not null check (rate > 0),
  provider text not null,
  observed_at timestamptz not null,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists fx_rate_pair_time_idx
  on public.fx_rate_snapshots(base_currency,quote_currency,observed_at desc);

create table if not exists public.fx_quote_observations (
  id bigint generated always as identity primary key,
  money_changer_id uuid not null references public.money_changers(id) on delete cascade,
  base_currency char(3) not null,
  quote_currency char(3) not null,
  shop_buys_rate numeric(18,8),
  shop_sells_rate numeric(18,8),
  source_type text not null check (source_type in ('provider','partner','user','manual')),
  source_url text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  observed_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists fx_quote_latest_idx
  on public.fx_quote_observations(base_currency,quote_currency,observed_at desc);

create table if not exists public.experience_catalog (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.place_catalog(id) on delete set null,
  title text not null,
  category text not null,
  persona_fit text[] not null default '{}',
  price_band text,
  duration_minutes integer,
  source_key text references public.data_sources(source_key),
  source_ref text,
  source_url text,
  valid_from timestamptz,
  valid_to timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists experience_persona_idx on public.experience_catalog using gin(persona_fit);

create table if not exists public.eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  jurisdiction text not null default 'SG',
  title text not null,
  applies_to_modes text[] not null default '{}',
  status_contexts text[] not null default '{}',
  rule_payload jsonb not null,
  source_url text not null,
  effective_from date,
  effective_to date,
  verified_at timestamptz not null,
  active boolean not null default true,
  unique(rule_key,effective_from)
);

create table if not exists public.journey_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.traveler_profiles(id) on delete set null,
  persona_mode text not null check (persona_mode in ('resident','visitor','executive','new_in_sg')),
  origin jsonb not null,
  destination jsonb not null,
  requested_arrival_at timestamptz,
  context_snapshot jsonb not null default '{}'::jsonb,
  selected_route jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists journey_sessions_profile_idx on public.journey_sessions(profile_id,started_at desc);

create table if not exists public.trip_notifications (
  id uuid primary key default gen_random_uuid(),
  journey_session_id uuid not null references public.journey_sessions(id) on delete cascade,
  profile_id uuid references public.traveler_profiles(id) on delete set null,
  notification_type text not null check (notification_type in ('departure','transfer','alight','disruption','weather','arrival')),
  trigger_kind text not null check (trigger_kind in ('time','stop','station','distance','event')),
  trigger_value jsonb not null,
  status text not null default 'pending' check (status in ('pending','armed','sent','cancelled','expired')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ingestion_runs (
  id bigint generated always as identity primary key,
  source_key text not null references public.data_sources(source_key),
  job_key text not null,
  status text not null check (status in ('running','success','partial','failed')),
  rows_seen integer not null default 0,
  rows_written integer not null default 0,
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.partner_referrals (
  id bigint generated always as identity primary key,
  profile_id uuid references public.traveler_profiles(id) on delete set null,
  journey_session_id uuid references public.journey_sessions(id) on delete set null,
  provider text not null,
  category text not null,
  external_ref text,
  destination_url text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- updated_at triggers
drop trigger if exists set_data_sources_updated_at on public.data_sources;
create trigger set_data_sources_updated_at before update on public.data_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_traveler_profiles_updated_at on public.traveler_profiles;
create trigger set_traveler_profiles_updated_at before update on public.traveler_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_place_catalog_updated_at on public.place_catalog;
create trigger set_place_catalog_updated_at before update on public.place_catalog
for each row execute function public.set_updated_at();

drop trigger if exists set_saved_places_updated_at on public.profile_saved_places;
create trigger set_saved_places_updated_at before update on public.profile_saved_places
for each row execute function public.set_updated_at();

drop trigger if exists set_accommodation_properties_updated_at on public.accommodation_properties;
create trigger set_accommodation_properties_updated_at before update on public.accommodation_properties
for each row execute function public.set_updated_at();

drop trigger if exists set_experience_catalog_updated_at on public.experience_catalog;
create trigger set_experience_catalog_updated_at before update on public.experience_catalog
for each row execute function public.set_updated_at();

-- User-owned tables use RLS. Legacy token profiles continue through the server
-- until the account migration is deliberately enabled.
alter table public.traveler_profiles enable row level security;
alter table public.profile_saved_places enable row level security;
alter table public.profile_recent_places enable row level security;
alter table public.journey_sessions enable row level security;
alter table public.trip_notifications enable row level security;

create policy traveler_profiles_own_select on public.traveler_profiles
for select using (auth.uid() = auth_user_id);
create policy traveler_profiles_own_update on public.traveler_profiles
for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

create policy saved_places_own_all on public.profile_saved_places
for all using (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=auth.uid()))
with check (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=auth.uid()));

create policy recent_places_own_all on public.profile_recent_places
for all using (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=auth.uid()))
with check (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=auth.uid()));

create policy journey_sessions_own_all on public.journey_sessions
for all using (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=auth.uid()))
with check (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=auth.uid()));

create policy trip_notifications_own_all on public.trip_notifications
for all using (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=auth.uid()))
with check (exists(select 1 from public.traveler_profiles p where p.id=profile_id and p.auth_user_id=auth.uid()));

-- Catalog/cache tables intentionally have no anon policy in v0.8.
-- SGBuddy reads them server-side. This keeps provider data and commercial
-- fields private until we deliberately expose a stable public API.
