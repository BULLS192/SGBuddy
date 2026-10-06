-- v0.8.2 Accounts & cross-device sync foundation.

create or replace function public.handle_new_sgbuddy_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.traveler_profiles (
    auth_user_id,
    active_mode,
    home_currency,
    preferred_language,
    walking_tolerance,
    preferences
  )
  values (
    new.id,
    'resident',
    'SGD',
    'en',
    'normal',
    '{}'::jsonb
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sgbuddy on auth.users;
create trigger on_auth_user_created_sgbuddy
after insert on auth.users
for each row execute function public.handle_new_sgbuddy_user();

create index if not exists traveler_profiles_auth_user_idx
  on public.traveler_profiles(auth_user_id);
