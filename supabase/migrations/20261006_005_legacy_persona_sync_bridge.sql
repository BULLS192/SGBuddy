-- v0.8.1 persona bridge for legacy token-based SGBuddy cloud profiles.
-- The actual sync secret is provisioned separately and is never committed.

create table if not exists public.internal_app_secrets (
  secret_key text primary key,
  secret_hash text not null,
  updated_at timestamptz not null default now()
);
alter table public.internal_app_secrets enable row level security;

create or replace function public.sync_legacy_traveler_profile(
  sync_secret text,
  legacy_id text,
  profile_mode text,
  stay_horizon_value text default null,
  budget_style_value text default null,
  walking_tolerance_value text default 'normal',
  profile_preferences jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare profile_uuid uuid;
begin
  if not exists (
    select 1 from public.internal_app_secrets s
    where s.secret_key='profile_sync'
      and s.secret_hash=encode(extensions.digest(sync_secret,'sha256'),'hex')
  ) then
    raise exception 'invalid sync secret' using errcode='42501';
  end if;

  if legacy_id is null or length(trim(legacy_id)) < 6 then
    raise exception 'invalid legacy profile id' using errcode='22023';
  end if;
  if profile_mode not in ('resident','visitor','executive','new_in_sg') then
    raise exception 'invalid persona mode' using errcode='22023';
  end if;
  if stay_horizon_value is not null and stay_horizon_value not in
    ('day_trip','few_days','few_weeks','one_to_three_months','three_to_six_months','six_plus_months','long_term') then
    raise exception 'invalid stay horizon' using errcode='22023';
  end if;
  if budget_style_value is not null and budget_style_value not in
    ('budget','value','balanced','premium','luxury') then
    raise exception 'invalid budget style' using errcode='22023';
  end if;
  if walking_tolerance_value not in ('low','normal','high') then
    walking_tolerance_value:='normal';
  end if;

  insert into public.traveler_profiles(
    legacy_profile_id,active_mode,stay_horizon,budget_style,walking_tolerance,preferences
  ) values (
    trim(legacy_id),profile_mode,stay_horizon_value,budget_style_value,
    walking_tolerance_value,coalesce(profile_preferences,'{}'::jsonb)
  )
  on conflict (legacy_profile_id) do update set
    active_mode=excluded.active_mode,
    stay_horizon=excluded.stay_horizon,
    budget_style=excluded.budget_style,
    walking_tolerance=excluded.walking_tolerance,
    preferences=excluded.preferences,
    updated_at=now()
  returning id into profile_uuid;

  return profile_uuid;
end;
$$;

revoke all on function public.sync_legacy_traveler_profile(text,text,text,text,text,text,jsonb) from public;
grant execute on function public.sync_legacy_traveler_profile(text,text,text,text,text,text,jsonb) to anon;
