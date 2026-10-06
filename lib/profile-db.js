const SUPABASE_URL=String(process.env.SGBUDDY_SUPABASE_URL||'').replace(/\/$/,'');
const SUPABASE_KEY=String(process.env.SGBUDDY_SUPABASE_PUBLISHABLE_KEY||'');
const SYNC_SECRET=String(process.env.SGBUDDY_PROFILE_SYNC_SECRET||'');

export const hasProfileDatabaseSync=()=>Boolean(SUPABASE_URL&&SUPABASE_KEY&&SYNC_SECRET);

export async function syncLegacyTravelerProfile(profile){
  if(!hasProfileDatabaseSync()||!profile?.id||!profile?.preferences) return false;
  const prefs=profile.preferences;
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/sync_legacy_traveler_profile`,{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({
      sync_secret:SYNC_SECRET,
      legacy_id:String(profile.id),
      profile_mode:prefs.mode||'resident',
      stay_horizon_value:prefs.stayHorizon||null,
      budget_style_value:prefs.travelStyle||'balanced',
      walking_tolerance_value:prefs.walkingTolerance||'normal',
      profile_preferences:{
        personaOnboarded:Boolean(prefs.personaOnboarded),
      },
    }),
    cache:'no-store',
  });
  if(!response.ok){
    const message=await response.text().catch(()=>response.statusText);
    throw new Error(`traveler profile sync returned ${response.status}: ${message.slice(0,160)}`);
  }
  return true;
}
