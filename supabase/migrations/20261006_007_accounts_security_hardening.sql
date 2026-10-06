-- v0.8.2 account trigger hardening.
-- The auth.users trigger can execute this function internally without granting
-- RPC execute rights to browser roles.

revoke all on function public.handle_new_sgbuddy_user() from public;
revoke all on function public.handle_new_sgbuddy_user() from anon;
revoke all on function public.handle_new_sgbuddy_user() from authenticated;

-- auth_user_id is already UNIQUE, so Postgres already maintains the required
-- unique index. Remove the redundant secondary index added by the foundation.
drop index if exists public.traveler_profiles_auth_user_idx;
