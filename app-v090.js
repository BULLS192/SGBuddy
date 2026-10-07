const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const safeParse=(value,fallback)=>{try{return JSON.parse(value)}catch{return fallback}};
const storedPlaces=safeParse(localStorage.getItem('sgc-places')||'{}',{});
if(!storedPlaces.hotel && localStorage.getItem('sgc-hotel')) storedPlaces.hotel=localStorage.getItem('sgc-hotel');
const storedStops=safeParse(localStorage.getItem('sgc-bus-stops')||'[]',[]);
const storedStations=safeParse(localStorage.getItem('sgc-rail-stations')||'[]',[]);
const storedRecentDestinations=safeParse(localStorage.getItem('sgc-recent-destinations')||'[]',[]);
const normalizePersonaMode=value=>value==='traveller'?'visitor':['resident','visitor','executive','new_in_sg'].includes(value)?value:'resident';
const state={
  mode:normalizePersonaMode(localStorage.getItem('sgc-mode')||'resident'),
  transportView:localStorage.getItem('sgc-transport-view')||'cards',
  lat:null,lon:null,nearby:null,rail:null,train:null,traffic:null,weather:null,
  places:{home:storedPlaces.home||'',work:storedPlaces.work||'',hotel:storedPlaces.hotel||''},
  savedStops:Array.isArray(storedStops)?storedStops.filter(x=>x&&/^\d{5}$/.test(String(x.code||x))).map(x=>({code:String(x.code||x),name:x.name||'',label:x.label||'',services:Array.isArray(x.services)?x.services.map(String):[]})).slice(0,20):[],
  savedStopData:[],
  savedRailStations:Array.isArray(storedStations)?storedStations.map(x=>typeof x==='string'?{code:x,name:''}:x).filter(x=>x?.code).map(x=>({code:String(x.code).toUpperCase(),name:x.name||''})).slice(0,12):[],
  savedRailData:[],
  recentDestinations:Array.isArray(storedRecentDestinations)?storedRecentDestinations.filter(x=>x?.value||x?.label).slice(0,6):[],
  stayHorizon:localStorage.getItem('sgc-stay-horizon')||'',
  travelStyle:localStorage.getItem('sgc-travel-style')||'balanced',
  walkingTolerance:localStorage.getItem('sgc-walking-tolerance')||'normal',
  personaOnboarded:localStorage.getItem('sgc-persona-onboarded')==='1',
  locationChoice:localStorage.getItem('sgc-location-choice')||'',
  profileToken:localStorage.getItem('sgc-profile-token')||'',
  profile:null,
  cloudStatus:'local',
  accountSession:safeParse(localStorage.getItem('sgc-auth-session')||'null',null),
  accountUser:null,
  accountProfile:null,
  accountStatus:'signed-out',
  recoveryMode:false,
  map:null,mapLayer:null,journeyMap:null,journeyMapLayer:null,journeyPayload:null
};
let deferredInstallPrompt=null;
let profileSyncTimer=null;
let pairLink='';
let pairQrObjectUrl='';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const CLIENT_VERSION='0.9.0-dev';
window.__SGBUDDY_CLIENT_VERSION__=CLIENT_VERSION;
function setVersionBadge(){const el=$('#appVersion');if(el)el.textContent='v'+CLIENT_VERSION}
const SUPABASE_AUTH_URL='https://zcxcjmtejcpvlttvaxes.supabase.co';
const SUPABASE_PUBLIC_KEY='sb_publishable_4WQDw1iG2548G3icxBgxEw_MiBC3wal';
const AUTH_SESSION_KEY='sgc-auth-session';
const AUTH_REDIRECT_URL='https://sgbuddy.omnidite.com/';
let accountSyncTimer=null;

function authError(payload,fallback='Account request failed'){
  return payload?.msg||payload?.message||payload?.error_description||payload?.error||fallback;
}
async function supabaseAuth(path,{method='POST',body,token}={}){
  const headers={apikey:SUPABASE_PUBLIC_KEY,Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(token)headers.Authorization='Bearer '+token;
  const response=await fetch(SUPABASE_AUTH_URL+'/auth/v1'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  let payload={};try{payload=await response.json()}catch{}
  if(!response.ok){const error=new Error(authError(payload,`Account request failed ${response.status}`));error.status=response.status;throw error}
  return payload;
}
function saveAccountSession(payload){
  const source=payload?.session||payload||{};
  if(!source.access_token)return false;
  const session={
    accessToken:source.access_token,
    refreshToken:source.refresh_token||state.accountSession?.refreshToken||'',
    expiresAt:Date.now()+Math.max(60,Number(source.expires_in||3600))*1000,
    user:source.user||payload?.user||state.accountUser||state.accountSession?.user||null,
  };
  state.accountSession=session;state.accountUser=session.user||state.accountUser||null;
  localStorage.setItem(AUTH_SESSION_KEY,JSON.stringify(session));
  renderAccountUi();
  return true;
}
function clearAccountSession(){
  state.accountSession=null;state.accountUser=null;state.accountProfile=null;state.accountStatus='signed-out';state.recoveryMode=false;
  localStorage.removeItem(AUTH_SESSION_KEY);renderAccountUi();
}
async function refreshAccountSession(){
  const refreshToken=state.accountSession?.refreshToken;
  if(!refreshToken){clearAccountSession();return null}
  try{
    const payload=await supabaseAuth('/token?grant_type=refresh_token',{body:{refresh_token:refreshToken}});
    saveAccountSession(payload);return state.accountSession;
  }catch{clearAccountSession();return null}
}
async function ensureAccountSession(){
  const session=state.accountSession;
  if(!session?.accessToken)return null;
  if(Number(session.expiresAt||0)>Date.now()+90_000)return session;
  return refreshAccountSession();
}
async function refreshAccountUser(){
  const session=await ensureAccountSession();if(!session)return null;
  try{
    const user=await supabaseAuth('/user',{method:'GET',token:session.accessToken});
    state.accountUser=user;state.accountSession.user=user;localStorage.setItem(AUTH_SESSION_KEY,JSON.stringify(state.accountSession));renderAccountUi();return user;
  }catch{clearAccountSession();return null}
}
function accountMessage(message='',kind=''){
  const el=$('#accountMessage');if(!el)return;el.textContent=message;el.className='account-message'+(kind?' '+kind:'');
}
function renderAccountUi(){
  const signedIn=Boolean(state.accountUser&&state.accountSession?.accessToken);
  $('#accountSignedOut')?.classList.toggle('hidden',signedIn||state.recoveryMode);
  $('#accountSignedIn')?.classList.toggle('hidden',!signedIn||state.recoveryMode);
  $('#passwordResetPanel')?.classList.toggle('hidden',!state.recoveryMode);
  const email=state.accountUser?.email||state.accountSession?.user?.email||'';
  if($('#accountEmailDisplay'))$('#accountEmailDisplay').textContent=email||'SGBuddy account';
  if($('#accountButtonText'))$('#accountButtonText').textContent=signedIn?(email.split('@')[0]||'Account').slice(0,12):'Account';
  if($('#accountButtonIcon'))$('#accountButtonIcon').textContent=signedIn?'✓':'◎';
  const badge=$('#accountSyncBadge'),syncText=$('#accountSyncText');
  if(badge){
    badge.classList.remove('synced','error');
    if(state.accountStatus==='syncing'){badge.textContent='Syncing…'}
    else if(state.accountStatus==='error'){badge.textContent='Sync issue';badge.classList.add('error')}
    else{badge.textContent=signedIn?'Synced':'Offline';if(signedIn)badge.classList.add('synced')}
  }
  if(syncText)syncText.textContent=state.accountStatus==='syncing'?'Updating account profile…':state.accountStatus==='error'?'Last sync needs attention':signedIn?'Cross-device profile active':'Sign in to sync across devices';
  $('#accountButton')?.classList.toggle('signed-in',signedIn);if(typeof renderAccountHub==='function')renderAccountHub();
  const desc=$('#profileDescription');
  if(desc&&signedIn)desc.textContent='Your SGBuddy account syncs this profile automatically across devices. The private cloud profile remains as a compatibility backup.';
}
function openAccountSheet(){
  renderAccountUi();accountMessage('');
  $('#accountSheet')?.classList.remove('hidden');
}
function closeAccountSheet(){
  if(state.recoveryMode)return;
  $('#accountSheet')?.classList.add('hidden');
}
function consumeAuthHash(){
  if(!location.hash.startsWith('#'))return false;
  const params=new URLSearchParams(location.hash.slice(1));
  const access=params.get('access_token'),refresh=params.get('refresh_token');
  if(!access)return false;
  const expires=Number(params.get('expires_in')||3600);
  const type=params.get('type')||'';
  saveAccountSession({access_token:access,refresh_token:refresh,expires_in:expires});
  state.recoveryMode=type==='recovery';
  for(const key of ['access_token','refresh_token','expires_in','expires_at','token_type','type'])params.delete(key);
  const rest=params.toString();
  history.replaceState(null,'',location.pathname+location.search+(rest?'#'+rest:''));
  return true;
}
async function signInAccount(){
  const email=$('#accountEmail').value.trim(),password=$('#accountPassword').value;
  if(!email||!password)return accountMessage('Enter your email and password.','error');
  await withBusy($('#signInButton'),'Signing in…',async()=>{
    try{
      const payload=await supabaseAuth('/token?grant_type=password',{body:{email,password}});
      saveAccountSession(payload);await refreshAccountUser();await loadAccountProfile({preferRemote:true});
      accountMessage('Signed in. This device is now connected to your SGBuddy account.','success');toast('Signed in to SGBuddy');
    }catch(error){accountMessage(error.message,'error')}
  });
}
async function createAccount(){
  const email=$('#accountEmail').value.trim(),password=$('#accountPassword').value;
  if(!email||!password)return accountMessage('Enter an email and password.','error');
  if(password.length<8)return accountMessage('Use a password with at least 8 characters.','error');
  await withBusy($('#createAccountButton'),'Creating…',async()=>{
    try{
      const redirect=AUTH_REDIRECT_URL;
      const payload=await supabaseAuth('/signup?redirect_to='+encodeURIComponent(redirect),{body:{email,password}});
      if(saveAccountSession(payload)){
        await refreshAccountUser();await loadAccountProfile({preferRemote:false});
        accountMessage('Account created and signed in.','success');toast('SGBuddy account created');
      }else{
        accountMessage('Account created. Check your email to confirm it, then return here and sign in.','success');
      }
    }catch(error){accountMessage(error.message,'error')}
  });
}
async function sendPasswordReset(){
  const email=$('#accountEmail').value.trim();
  if(!email)return accountMessage('Enter your email address first.','error');
  await withBusy($('#forgotPasswordButton'),'Sending…',async()=>{
    try{
      const redirect=AUTH_REDIRECT_URL;
      await supabaseAuth('/recover?redirect_to='+encodeURIComponent(redirect),{body:{email}});
      accountMessage('Password reset email sent. Open the link on this device to choose a new password.','success');
    }catch(error){accountMessage(error.message,'error')}
  });
}
async function updateAccountPassword(){
  const password=$('#newPasswordInput').value;
  if(password.length<8)return accountMessage('Use a password with at least 8 characters.','error');
  const session=await ensureAccountSession();if(!session)return accountMessage('Your recovery session expired. Request a new password-reset email.','error');
  await withBusy($('#updatePasswordButton'),'Updating…',async()=>{
    try{
      await supabaseAuth('/user',{method:'PUT',token:session.accessToken,body:{password}});
      state.recoveryMode=false;$('#newPasswordInput').value='';renderAccountUi();accountMessage('Password updated.','success');toast('Password updated');
    }catch(error){accountMessage(error.message,'error')}
  });
}
async function signOutAccount(){
  const session=await ensureAccountSession();
  try{if(session)await supabaseAuth('/logout',{method:'POST',token:session.accessToken})}catch{}
  clearAccountSession();accountMessage('Signed out. Your local SGBuddy data remains on this device.','success');toast('Signed out');
}
async function accountRest(path,{method='GET',body,prefer}={}){
  let session=await ensureAccountSession();if(!session)throw new Error('Sign in to use account sync.');
  const headers={apikey:SUPABASE_PUBLIC_KEY,Authorization:'Bearer '+session.accessToken,Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';if(prefer)headers.Prefer=prefer;
  let response=await fetch(SUPABASE_AUTH_URL+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  if(response.status===401){
    session=await refreshAccountSession();if(!session)throw new Error('Your SGBuddy session expired.');
    headers.Authorization='Bearer '+session.accessToken;
    response=await fetch(SUPABASE_AUTH_URL+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  }
  let payload=null;try{payload=await response.json()}catch{}
  if(!response.ok)throw new Error(authError(payload,`Account sync failed ${response.status}`));
  return payload;
}
function accountPreferences(){
  return {...persistentPreferences(),recentDestinations:state.recentDestinations.slice(0,8),accountInitialized:true};
}
function accountRowPayload(){
  return {
    auth_user_id:state.accountUser.id,
    active_mode:state.mode,
    stay_horizon:state.stayHorizon||null,
    home_currency:'SGD',
    preferred_language:(navigator.language||'en').split('-')[0].slice(0,12),
    walking_tolerance:state.walkingTolerance||'normal',
    budget_style:state.travelStyle||'balanced',
    preferences:accountPreferences(),
  };
}
function applyPreferenceObject(prefs){
  if(!prefs)return;
  state.savedStops=Array.isArray(prefs.savedBusStops)?prefs.savedBusStops.filter(x=>/^\d{5}$/.test(String(x.code||''))).map(x=>({code:String(x.code),name:x.name||'',label:x.label||'',services:Array.isArray(x.services)?x.services.map(String):[]})).slice(0,20):[];
  state.savedRailStations=Array.isArray(prefs.savedRailStations)?prefs.savedRailStations.map(x=>typeof x==='string'?{code:x,name:''}:x).filter(x=>x?.code).map(x=>({code:String(x.code).toUpperCase(),name:x.name||''})).slice(0,12):[];
  state.places={home:prefs.places?.home||'',work:prefs.places?.work||'',hotel:prefs.places?.hotel||''};
  state.stayHorizon=prefs.stayHorizon||'';
  state.travelStyle=prefs.travelStyle||'balanced';
  state.walkingTolerance=prefs.walkingTolerance||'normal';
  state.personaOnboarded=Boolean(prefs.personaOnboarded);
  state.recentDestinations=Array.isArray(prefs.recentDestinations)?prefs.recentDestinations.filter(x=>x?.label&&x?.value).slice(0,8):state.recentDestinations;
  setMode(prefs.mode||'resident',false);cachePreferences(false);localStorage.setItem('sgc-recent-destinations',JSON.stringify(state.recentDestinations));
  initPlaces();renderSavedStops();renderSavedStations();renderRecentDestinations();renderPersonaContext();
}
async function syncAccountProfile({quiet=false}={}){
  if(!state.accountUser)return false;
  state.accountStatus='syncing';renderAccountUi();
  try{
    const rows=await accountRest('traveler_profiles?on_conflict=auth_user_id',{method:'POST',body:accountRowPayload(),prefer:'resolution=merge-duplicates,return=representation'});
    state.accountProfile=Array.isArray(rows)?rows[0]||null:rows;state.accountStatus='synced';renderAccountUi();
    if(!quiet)toast('Account synced');return true;
  }catch(error){
    state.accountStatus='error';renderAccountUi();if(!quiet)toast(error.message);return false;
  }
}
async function loadAccountProfile({preferRemote=true}={}){
  if(!state.accountUser)return false;
  state.accountStatus='syncing';renderAccountUi();
  try{
    const id=encodeURIComponent(state.accountUser.id);
    let rows=await accountRest(`traveler_profiles?auth_user_id=eq.${id}&select=id,auth_user_id,active_mode,stay_horizon,home_currency,preferred_language,walking_tolerance,budget_style,preferences,updated_at&limit=1`);
    let row=Array.isArray(rows)?rows[0]:null;
    const initialized=Boolean(row?.preferences?.accountInitialized);
    if(!row||!initialized||!preferRemote){
      await syncAccountProfile({quiet:true});
      row=state.accountProfile;
    }else{
      state.accountProfile=row;applyPreferenceObject(row.preferences);
    }
    state.accountStatus='synced';renderAccountUi();return true;
  }catch(error){
    state.accountStatus='error';renderAccountUi();return false;
  }
}
async function initAccount(){
  const callback=consumeAuthHash();
  if(state.accountSession?.accessToken)await refreshAccountUser();
  if(state.accountUser)await loadAccountProfile({preferRemote:state.recoveryMode?true:!callback});
  renderAccountUi();
  if(state.recoveryMode){openAccountSheet();accountMessage('Choose a new password to finish recovery.','success')}
  else if(callback&&state.accountUser)toast('SGBuddy account confirmed and signed in');
}
async function syncAllProfiles({quiet=false}={}){
  const results=await Promise.allSettled([
    syncProfileNow({quiet:true}),
    state.accountUser?syncAccountProfile({quiet:true}):Promise.resolve(false)
  ]);
  const ok=results.some(r=>r.status==='fulfilled'&&r.value===true);
  if(!quiet)toast(ok?'SGBuddy synced':'Changes are saved locally; cloud sync needs attention.');
  return ok;
}

const PERSONAS={
  resident:{label:'Resident',icon:'🇸🇬',title:'Your everyday Singapore',copy:'Prioritize routines, reliable transport and the fastest practical way around your day.',planner:'Plan the trips you make repeatedly, with live transport, weather and disruption context.',panelLabel:'RESIDENT',panelTitle:'Your daily shortcuts',panelCopy:'Save Home and Work so everyday routes stay one tap away.',actions:[['Plan to work','saved:work'],['Plan home','saved:home'],['Transport','transport']]},
  visitor:{label:'Visitor',icon:'🎒',title:'Make Singapore easy',copy:'Keep navigation simple, your hotel close, and the places you want to see easy to reach.',planner:'Search attractions and familiar place names. SGBuddy keeps transfers, weather and your hotel context in view.',panelLabel:'VISITOR SUPPORT',panelTitle:'Your Singapore safety net',panelCopy:'Your saved hotel stays one tap away while you explore.',actions:[['Back to hotel','saved:hotel'],['Jewel','destination:Jewel Changi Airport'],['MBS','destination:Marina Bay Sands']]},
  executive:{label:'Executive',icon:'💼',title:'Protect your schedule',copy:'Prioritize punctuality, lower-friction routes and enough buffer to arrive composed.',planner:'Use Arrive by for meetings. SGBuddy emphasizes schedule reliability and lower-friction routing.',panelLabel:'EXECUTIVE MODE',panelTitle:'Keep the day moving',panelCopy:'Save your hotel and use arrival-time planning to protect meeting buffers.',actions:[['Arrive on time','arrive'],['Marina Bay','destination:Marina Bay Sands'],['Suntec','destination:Suntec City']]},
  new_in_sg:{label:'New in SG',icon:'🌏',title:'Settle in like a local',copy:'Learn daily transport, build useful routines and gradually discover Singapore beyond the visitor checklist.',planner:'Build familiar routes to home, work or school while you learn how Singapore fits together.',panelLabel:'NEW IN SG',panelTitle:'Build your Singapore routine',panelCopy:'Save Home, Work or School-area destinations and let SGBuddy make them familiar.',actions:[['Plan home','saved:home'],['Orchard','destination:Orchard Road'],['NUS','destination:National University of Singapore']]}
};
const PERSONA_DEFAULT_HORIZON={resident:'long_term',visitor:'few_days',executive:'few_days',new_in_sg:'one_to_three_months'};
let personaDraftMode=state.mode;
let personaFirstRun=false;
function personaConfig(){return PERSONAS[state.mode]||PERSONAS.resident}
function renderPersonaContext(){if(document.querySelector('#placesGrid'))setTimeout(renderFeaturedPlaces,0);
  const cfg=personaConfig();
  if($('#modeText'))$('#modeText').textContent=cfg.label;
  const modeButton=$('#modeButton');if(modeButton)modeButton.title=`${cfg.label} mode — tap to change`;
  const title=$('#personaFocusTitle'),copy=$('#personaFocusCopy'),meta=$('#personaFocusMeta'),actions=$('#personaFocusActions');
  if(title)title.textContent=cfg.title;if(copy)copy.textContent=cfg.copy;
  if(meta){const horizon=(state.stayHorizon||PERSONA_DEFAULT_HORIZON[state.mode]).replaceAll('_',' ');meta.innerHTML=`<span>${cfg.icon} ${esc(cfg.label)}</span><span>${esc(state.travelStyle||'balanced')} style</span><span>${esc(horizon)}</span>`}
  if(actions)actions.innerHTML=cfg.actions.map(([label,action])=>`<button type="button" data-persona-action="${esc(action)}">${esc(label)}</button>`).join('');
  const panel=$('#travellerPanel');if(panel)panel.classList.toggle('hidden',state.mode==='resident');
  if($('#personaPanelLabel'))$('#personaPanelLabel').textContent=cfg.panelLabel;
  if($('#personaPanelTitle'))$('#personaPanelTitle').textContent=cfg.panelTitle;
  if($('#personaPanelCopy'))$('#personaPanelCopy').textContent=cfg.panelCopy;
  const planner=$('.planner-copy');if(planner)planner.textContent=cfg.planner;
  updateHotelButton();
}
function updatePersonaSheetFields(){
  $$('.persona-option').forEach(b=>b.classList.toggle('active',b.dataset.persona===personaDraftMode));
  const labels={resident:'Your Singapore horizon',visitor:'How long are you visiting?',executive:'How long is this business trip?',new_in_sg:'How long are you settling in?'};
  if($('#personaStayLabel'))$('#personaStayLabel').textContent=labels[personaDraftMode]||labels.resident;
}
function openPersonaSheet(firstRun=false){
  personaFirstRun=firstRun;personaDraftMode=state.mode;
  $('#personaStayHorizon').value=state.stayHorizon||PERSONA_DEFAULT_HORIZON[state.mode];
  $('#personaTravelStyle').value=state.travelStyle||'balanced';
  $('#personaWalkingTolerance').value=state.walkingTolerance||'normal';
  $('#closePersonaSheet').classList.toggle('hidden',firstRun&&!state.personaOnboarded);
  updatePersonaSheetFields();$('#personaSheet').classList.remove('hidden');
}
function closePersonaSheet(){if(personaFirstRun&&!state.personaOnboarded)return;$('#personaSheet').classList.add('hidden')}
function choosePersona(mode){personaDraftMode=normalizePersonaMode(mode);if(!state.stayHorizon)$('#personaStayHorizon').value=PERSONA_DEFAULT_HORIZON[personaDraftMode];updatePersonaSheetFields()}
async function savePersonaContext(){
  state.mode=normalizePersonaMode(personaDraftMode);
  state.stayHorizon=$('#personaStayHorizon').value||PERSONA_DEFAULT_HORIZON[state.mode];
  state.travelStyle=$('#personaTravelStyle').value||'balanced';
  state.walkingTolerance=$('#personaWalkingTolerance').value||'normal';
  state.personaOnboarded=true;
  cachePreferences(true);renderPersonaContext();$('#personaSheet').classList.add('hidden');
  queueProfileSync();toast(`${personaConfig().label} mode saved`);
  if(personaFirstRun&&!state.locationChoice)setTimeout(()=>maybeUseLocation(),250);
  personaFirstRun=false;
}
function runPersonaAction(action){
  if(action==='transport'){navigateTo('transport');return}
  if(action==='arrive'){navigateTo('travel');setJourneyTiming('arrive');setTimeout(()=>$('#tripTo')?.focus(),350);return}
  if(action.startsWith('saved:')){
    const key=action.slice(6),value=state.places[key]||'';
    if(!value){toast(`Save your ${key} first.`);navigateTo('travel');return}
    $('#tripTo').value=value;navigateTo('travel');return
  }
  if(action.startsWith('destination:')){$('#tripTo').value=action.slice(12);navigateTo('travel')}
}

function toLocalDateTimeValue(date){const d=date instanceof Date?date:new Date(date);const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
function defaultArriveByValue(){const d=new Date(Date.now()+60*60000);d.setMinutes(Math.ceil(d.getMinutes()/5)*5,0,0);return toLocalDateTimeValue(d)}
function setJourneyTiming(mode){const arrive=mode==='arrive';$('#timingNowButton')?.classList.toggle('active',!arrive);$('#timingArriveButton')?.classList.toggle('active',arrive);$('#arriveByWrap')?.classList.toggle('hidden',!arrive);if(arrive&&$('#arriveByInput')&&!$('#arriveByInput').value)$('#arriveByInput').value=defaultArriveByValue();$('#journeyResults')?.classList.add('hidden');$('#journeyMapWrap')?.classList.add('hidden');if($('#journeyStatus'))$('#journeyStatus').textContent=arrive?'Choose when you need to arrive.':'Ready to plan a route.'}

function greet(){const h=new Date().getHours();$('#greeting').textContent=h<12?'Good morning':h<18?'Good afternoon':'Good evening'}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
async function withBusy(button,busyText,task){if(!button)return task();const original=button.textContent;button.disabled=true;button.textContent=busyText;try{return await task()}finally{button.disabled=false;button.textContent=original}}
const placeSearchTimers={};
function recentKey(item){return String(item?.value||item?.label||'').trim().toLowerCase()}
function rememberDestination(place){if(!place?.label)return;const item={label:place.label,value:place.code||place.label,type:place.type||'place'};state.recentDestinations=[item,...state.recentDestinations.filter(x=>recentKey(x)!==recentKey(item))].slice(0,6);localStorage.setItem('sgc-recent-destinations',JSON.stringify(state.recentDestinations));renderRecentDestinations()}
function renderRecentDestinations(){const host=$('#recentDestinations');if(!host)return;if(!state.recentDestinations.length){host.classList.add('hidden');host.innerHTML='';return}host.innerHTML='<span>Recent</span>'+state.recentDestinations.map(x=>`<button type="button" class="recent-destination" data-value="${esc(x.value||x.label)}">${esc(x.label)}</button>`).join('');host.classList.remove('hidden')}
function localPlaceSuggestions(query){const q=String(query||'').trim().toLowerCase(),items=[];for(const key of ['home','work','hotel']){const value=state.places[key];if(value&&(!q||key.includes(q)||value.toLowerCase().includes(q)))items.push({type:'saved',label:key[0].toUpperCase()+key.slice(1),subtitle:value,value})}for(const item of state.recentDestinations){if(!q||String(item.label).toLowerCase().includes(q)||String(item.value).toLowerCase().includes(q))items.push({type:'recent',label:item.label,subtitle:'Recent destination',value:item.value})}return items}
function renderPlaceSuggestions(inputId,items){const panel=$('#'+inputId+'Suggestions');if(!panel)return;const unique=[],seen=new Set();for(const item of items||[]){const key=String(item.value||item.label).toLowerCase();if(!key||seen.has(key))continue;seen.add(key);unique.push(item)}panel.innerHTML=unique.slice(0,8).map(item=>`<button type="button" class="place-suggestion" role="option" data-target="${inputId}" data-value="${esc(item.value||item.label)}"><span class="place-suggestion-icon">${item.type==='station'?'▰':item.type==='bus-stop'?'▣':item.type==='saved'?'★':'◎'}</span><span><strong>${esc(item.label)}</strong><small>${esc(item.subtitle||item.type||'Place')}</small></span></button>`).join('');panel.classList.toggle('hidden',!unique.length)}
async function searchPlacesForInput(inputId){const input=$('#'+inputId);if(!input)return;const query=input.value.trim();const local=localPlaceSuggestions(query);if(query.length<2){renderPlaceSuggestions(inputId,local);return}try{const payload=await json('/api/journey?search='+encodeURIComponent(query));renderPlaceSuggestions(inputId,[...local,...(payload.suggestions||[])])}catch{renderPlaceSuggestions(inputId,local)}}
function queuePlaceSearch(inputId){clearTimeout(placeSearchTimers[inputId]);placeSearchTimers[inputId]=setTimeout(()=>searchPlacesForInput(inputId),180)}
function hidePlaceSuggestions(inputId){setTimeout(()=>$('#'+inputId+'Suggestions')?.classList.add('hidden'),140)}
function selectPlaceSuggestion(target,value){const input=$('#'+target);if(!input)return;input.value=value;$('#'+target+'Suggestions')?.classList.add('hidden');if(target==='tripTo')$('#journeyStatus').textContent='Destination selected. Ready to plan.'}
const navSections={today:'#todaySection',move:'#transportSection',places:'#placesSection',money:'#moneySection',account:'#accountSection'};
const legacyNavSections={transport:'#transportSection',travel:'#travelSection',freya:'#freyaSection'};
const canonicalNav=name=>name==='transport'||name==='travel'||name==='freya'?'move':name;
let navScrollLock=0;
function setActiveNav(name){$('.bottom-nav [data-nav-target]').forEach(b=>{const active=b.dataset.navTarget===name;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function navigateTo(name){if(window.SGBUDDY_VIEW_ROUTER?.show){window.SGBUDDY_VIEW_ROUTER.show(canonicalNav(name),{legacyTarget:name});if(name==='freya')window.SGBUDDY_VIEW_ROUTER.openFreya?.();return}const target=$(navSections[name]||legacyNavSections[name]);if(!target)return;setActiveNav(canonicalNav(name));navScrollLock=Date.now()+700;target.scrollIntoView({behavior:'smooth',block:'start'});if(name==='freya')setTimeout(()=>$('#advisorInput')?.focus({preventScroll:true}),450)}
function updateNavFromScroll(){if(Date.now()<navScrollLock)return;const probe=window.scrollY+Math.min(window.innerHeight*.32,240);let current='today';for(const [name,selector] of Object.entries(navSections)){const el=$(selector);if(el&&el.offsetTop<=probe)current=name}setActiveNav(current)}
function initBottomNav(){$('.bottom-nav [data-nav-target]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();navigateTo(b.dataset.navTarget)}));window.addEventListener('scroll',()=>requestAnimationFrame(updateNavFromScroll),{passive:true});updateNavFromScroll()}

function persistentPreferences(){return {savedBusStops:state.savedStops.map(({code,name,label,services})=>({code,name,label,services:Array.isArray(services)?services:[]})),savedRailStations:state.savedRailStations.map(({code,name})=>({code,name})),places:{...state.places},mode:state.mode,stayHorizon:state.stayHorizon||null,travelStyle:state.travelStyle||'balanced',walkingTolerance:state.walkingTolerance||'normal',personaOnboarded:Boolean(state.personaOnboarded),recentDestinations:state.recentDestinations.slice(0,8)}}
function cachePreferences(markDirty=false){localStorage.setItem('sgc-bus-stops',JSON.stringify(state.savedStops.map(({code,name,label,services})=>({code,name,label,services:Array.isArray(services)?services:[]}))));localStorage.setItem('sgc-rail-stations',JSON.stringify(state.savedRailStations));localStorage.setItem('sgc-places',JSON.stringify(state.places));localStorage.setItem('sgc-hotel',state.places.hotel||'');localStorage.setItem('sgc-mode',state.mode);localStorage.setItem('sgc-stay-horizon',state.stayHorizon||'');localStorage.setItem('sgc-travel-style',state.travelStyle||'balanced');localStorage.setItem('sgc-walking-tolerance',state.walkingTolerance||'normal');localStorage.setItem('sgc-persona-onboarded',state.personaOnboarded?'1':'0');localStorage.setItem('sgc-recent-destinations',JSON.stringify(state.recentDestinations));if(markDirty)localStorage.setItem('sgc-profile-dirty-at',String(Date.now()))}
function setProfileUi(status,profile=state.profile){state.cloudStatus=status;const coreProfile=$('#dataCoreProfile');if(coreProfile)coreProfile.textContent=status==='synced'?'Synced':status==='syncing'?'Syncing…':status==='pending'?'Pending':status==='error'?'Issue':'Local';const badge=$('#profileSyncBadge'),id=$('#profileId'),desc=$('#profileDescription');if(!badge||!id)return;badge.classList.remove('synced','error');if(status==='synced'){badge.textContent='Cloud synced';badge.classList.add('synced')}else if(status==='syncing'){badge.textContent='Syncing…'}else if(status==='pending'){badge.textContent='Pending sync'}else if(status==='error'){badge.textContent='Sync issue';badge.classList.add('error')}else badge.textContent='Local cache';id.textContent=profile?.displayId||'Not linked yet';if(desc){desc.textContent=profile?'Your favourites and saved places are stored in a private SGBuddy cloud profile, with an offline cache on this device.':'Your favourites and saved places can sync privately across your devices without a database or account.'}}
async function profileRequest(method,body){const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(state.profileToken)headers.Authorization='Bearer '+state.profileToken;const r=await fetch('/api/profile',{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let p={};try{p=await r.json()}catch{}if(!r.ok){const e=new Error(p.error||`Profile request failed ${r.status}`);e.status=r.status;throw e}return p}
function applyProfile(profile){if(!profile?.preferences)return;state.profile=profile;applyPreferenceObject(profile.preferences);setProfileUi('synced',profile)}
function consumeProfileHash(){if(!location.hash.startsWith('#'))return false;const params=new URLSearchParams(location.hash.slice(1));const token=params.get('profile');if(!token)return false;state.profileToken=token;localStorage.setItem('sgc-profile-token',token);localStorage.removeItem('sgc-profile-dirty-at');params.delete('profile');const rest=params.toString();history.replaceState(null,'',location.pathname+location.search+(rest?'#'+rest:''));return true}
async function ensureCloudProfile(){if(state.profileToken)return true;setProfileUi('syncing');try{const p=await profileRequest('POST',{preferences:persistentPreferences()});state.profileToken=p.token;state.profile=p.profile;localStorage.setItem('sgc-profile-token',state.profileToken);localStorage.removeItem('sgc-profile-dirty-at');setProfileUi('synced',state.profile);return true}catch(e){setProfileUi('error');return false}}
async function loadCloudProfile(){if(!state.profileToken){setProfileUi('local');return false}setProfileUi('syncing');try{const p=await profileRequest('GET');const dirtyAt=Number(localStorage.getItem('sgc-profile-dirty-at')||0);const remoteAt=Date.parse(p.profile?.updatedAt||0)||0;if(dirtyAt>remoteAt){state.profile=p.profile;setProfileUi('pending',state.profile);await syncProfileNow({quiet:true});return true}applyProfile(p.profile);localStorage.removeItem('sgc-profile-dirty-at');return true}catch(e){if(e.status===401){state.profileToken='';state.profile=null;localStorage.removeItem('sgc-profile-token');setProfileUi('error');toast('This SGBuddy profile link is invalid or expired. Your local cache is still available.')}else setProfileUi('error');return false}}
async function syncProfileNow({quiet=false}={}){if(!(await ensureCloudProfile())){if(!quiet)toast('Cloud sync is unavailable; changes are still saved locally.');return false}setProfileUi('syncing',state.profile);try{const p=await profileRequest('PUT',{preferences:persistentPreferences()});state.profile=p.profile;localStorage.removeItem('sgc-profile-dirty-at');setProfileUi('synced',state.profile);if(!quiet)toast('SGBuddy profile synced');return true}catch(e){setProfileUi('error',state.profile);if(!quiet)toast('Cloud sync failed; your local cache is safe.');return false}}
function queueProfileSync(){cachePreferences(true);setProfileUi(state.profileToken?'pending':'local',state.profile);clearTimeout(profileSyncTimer);clearTimeout(accountSyncTimer);profileSyncTimer=setTimeout(()=>syncProfileNow({quiet:true}),650);if(state.accountUser)accountSyncTimer=setTimeout(()=>syncAccountProfile({quiet:true}),700)}
function hasLocalProfileData(){return state.personaOnboarded||state.savedStops.length>0||state.savedRailStations.length>0||state.recentDestinations.length>0||Object.values(state.places).some(Boolean)}
async function initCloudProfile(){const linked=consumeProfileHash();if(state.profileToken){await loadCloudProfile();if(linked)toast('SGBuddy profile linked');return}if(hasLocalProfileData())await syncProfileNow({quiet:true});else setProfileUi('local');if(linked)toast('SGBuddy profile linked')}

function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function updateInstallUi(){const b=$('#installButton');if(!b)return;if(isStandalone()){b.textContent='✓ Installed';b.classList.add('installed');b.disabled=true}else{b.textContent='⇩ Install app';b.classList.remove('installed');b.disabled=false}}
async function installApp(){if(isStandalone())return;const sheet=$('#installSheet'),instructions=$('#installInstructions');if(deferredInstallPrompt){deferredInstallPrompt.prompt();const choice=await deferredInstallPrompt.userChoice;if(choice?.outcome==='accepted')toast('SGBuddy installed');deferredInstallPrompt=null;updateInstallUi();return}const ios=/iPad|iPhone|iPod/.test(navigator.userAgent);instructions.innerHTML=ios?'On iPhone/iPad: open SGBuddy in <strong>Safari</strong>, tap <strong>Share</strong>, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.':'Open your browser menu and choose <strong>Install SGBuddy</strong> or <strong>Add to Home screen</strong>.';sheet.classList.remove('hidden')}
function closeInstallSheet(){$('#installSheet').classList.add('hidden')}

async function showPairPanel(){if(!(await ensureCloudProfile()))return;await syncProfileNow({quiet:true});pairLink=`${location.origin}${location.pathname}#profile=${encodeURIComponent(state.profileToken)}`;try{const r=await fetch('/api/profile-qr',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+state.profileToken},body:JSON.stringify({origin:location.origin})});if(!r.ok)throw new Error('Could not make pairing QR');const svg=await r.text();if(pairQrObjectUrl)URL.revokeObjectURL(pairQrObjectUrl);pairQrObjectUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));$('#pairQr').src=pairQrObjectUrl;$('#pairPanel').classList.remove('hidden')}catch(e){toast(e.message)}}
async function copyPairLink(){if(!pairLink)await showPairPanel();try{await navigator.clipboard.writeText(pairLink);toast('Device-link copied')}catch{toast('Could not copy the link on this browser')}}
async function exportProfile(){if(!(await ensureCloudProfile()))return;await syncProfileNow({quiet:true});const payload={type:'sgbuddy-profile',version:1,exportedAt:new Date().toISOString(),warning:'This file contains a secret profile token. Anyone with it can access and change this SGBuddy profile.',token:state.profileToken,profile:state.profile,preferences:persistentPreferences()};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`sgbuddy-${state.profile?.displayId||'profile'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function importProfileFile(file){try{const data=JSON.parse(await file.text());if(!data.token||!String(data.token).startsWith('sgp_'))throw new Error('This is not a valid SGBuddy profile export.');state.profileToken=String(data.token);localStorage.setItem('sgc-profile-token',state.profileToken);localStorage.removeItem('sgc-profile-dirty-at');const ok=await loadCloudProfile();if(ok){await Promise.all([refreshSavedStops(),refreshSavedStations()]);toast('SGBuddy profile imported and linked')}}catch(e){toast(e.message)}}

function sourceLabel(){const sources=[state.nearby?.source,state.rail?.source,state.train?.source,state.traffic?.source,state.weather?.source,...state.savedStopData.map(x=>x.source)].filter(Boolean);const live=sources.some(x=>x==='live');const demo=sources.some(x=>String(x).startsWith('demo'));$('#sourceBadge').textContent=live&&!demo?'LIVE GOVERNMENT DATA':live?'MIXED LIVE + DEMO':'DEMO MODE';$('#updatedAt').textContent='Updated '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});updateDataCoreState()}
const loadText=x=>x==='SEA'?'Seats':x==='SDA'?'Standing':x==='LSD'?'Crowded':'—';
const lineClass=line=>'line-'+String(line||'rail').toLowerCase().replace(/[^a-z0-9]/g,'');
const isSaved=code=>state.savedStops.some(s=>s.code===String(code));
const isRailSaved=code=>state.savedRailStations.some(s=>s.code===String(code).toUpperCase());
const savedStopFor=code=>state.savedStops.find(s=>s.code===String(code));
function toggleServicePreference(stopCode,serviceNo){const saved=savedStopFor(stopCode);if(!saved)return toast('Save this bus stop first, then you can pin its services.');saved.services=Array.isArray(saved.services)?saved.services:[];const no=String(serviceNo);const i=saved.services.indexOf(no);if(i>=0)saved.services.splice(i,1);else saved.services.push(no);persistSavedStops(true);renderSavedStops();renderNearby();renderNextUp();toast(i>=0?`Unpinned bus ${no}`:`Pinned bus ${no} for this stop`)}
function renderStop(stop,{compact=false}={}){const savedRec=savedStopFor(stop.code),saved=Boolean(savedRec),prefs=savedRec?.services||[];const ordered=(stop.services||[]).slice().sort((a,b)=>(prefs.includes(String(b.no))?1:0)-(prefs.includes(String(a.no))?1:0));const services=(compact&&prefs.length?ordered.filter(s=>prefs.includes(String(s.no))):ordered).slice(0,10);const title=savedRec?.label||stop.name;const official=savedRec?.label&&savedRec.label!==stop.name?stop.name:'';return `<article class="card stop-card ${compact?'compact-stop':''}" data-stop="${esc(stop.code)}"><div class="stop-top"><div><div class="stop-name">${esc(title)}</div><div class="stop-code">${official?`${esc(official)} · `:''}Stop ${esc(stop.code)}${stop.roadName?` · ${esc(stop.roadName)}`:''}</div></div><div class="stop-actions">${stop.distance!=null?`<div class="distance">${stop.distance<1000?stop.distance+' m':(stop.distance/1000).toFixed(1)+' km'}</div>`:''}<button class="favorite-stop ${saved?'saved':''}" type="button" data-code="${esc(stop.code)}" aria-label="${saved?'Remove':'Save'} bus stop ${esc(stop.code)}">${saved?'★':'☆'}</button></div></div>${saved?`<div class="service-pref-note">${prefs.length?`Showing pinned services: ${prefs.map(esc).join(', ')}`:'Pin the services you use so this favourite stays focused.'}</div>`:''}<div class="services">${services.map(s=>{const pinned=prefs.includes(String(s.no));return `<div class="service ${pinned?'pinned':''}"><button class="pin-service ${pinned?'active':''}" type="button" data-stop="${esc(stop.code)}" data-service="${esc(s.no)}" aria-label="${pinned?'Unpin':'Pin'} bus ${esc(s.no)}">${pinned?'★':'＋'}</button><div class="service-no">${esc(s.no)}</div><div class="eta">${s.eta?.[0]??'—'} <small>min</small></div><div class="load">${loadText(s.load?.[0])}</div></div>`}).join('')||'<span class="distance">No estimated arrivals right now.</span>'}</div>${compact&&saved?`<div class="saved-stop-tools"><button type="button" class="rename-stop" data-code="${esc(stop.code)}">✎ Rename</button><button type="button" class="move-stop" data-code="${esc(stop.code)}" data-dir="-1" aria-label="Move favourite up">↑</button><button type="button" class="move-stop" data-code="${esc(stop.code)}" data-dir="1" aria-label="Move favourite down">↓</button></div>`:''}</article>`}
function renderNearby(){const stops=state.nearby?.stops||[];$('#nearbyStops').innerHTML=stops.map(s=>renderStop(s)).join('')||'<div class="card empty">Use your location to automatically find nearby bus stops.</div>';sourceLabel();renderMapMarkers();renderNextUp()}
function renderSavedStops(){const el=$('#savedStops');$('#savedStopCount').textContent=String(state.savedStops.length);if(!state.savedStops.length){el.innerHTML='<div class="empty-inline">No saved bus stops yet. Add a favourite or star a nearby stop.</div>';renderMapMarkers();renderNextUp();return}const byCode=new Map(state.savedStopData.map(x=>[x.stop?.code,x]));el.innerHTML=state.savedStops.map(saved=>{const item=byCode.get(saved.code);if(item?.stop)return renderStop(item.stop,{compact:true});return `<article class="card stop-card compact-stop"><div class="stop-top"><div><div class="stop-name">${esc(saved.name||`Bus Stop ${saved.code}`)}</div><div class="stop-code">Stop ${esc(saved.code)}</div></div><button class="favorite-stop saved" type="button" data-code="${esc(saved.code)}" aria-label="Remove bus stop ${esc(saved.code)}">★</button></div><div class="empty-inline">Refreshing arrivals…</div></article>`}).join('');sourceLabel();renderMapMarkers();renderNextUp()}
function renderSavedStations(){const el=$('#savedStations');if(!el)return;$('#savedStationCount').textContent=String(state.savedRailStations.length);if(!state.savedRailStations.length){el.innerHTML='<span class="empty-inline">No favourite stations yet. Star one below.</span>';renderMapMarkers();renderNextUp();return}el.innerHTML=state.savedRailStations.map(s=>`<button class="station-chip" type="button" data-station="${esc(s.code)}"><span>${esc(s.code)}</span>${s.name?` ${esc(s.name)}`:''}</button>`).join('');renderMapMarkers();renderNextUp()}
function groupedDepartures(station){const groups=new Map();for(const d of station.departures||[]){const key=`${d.line}|${d.destination}|${d.platform||''}`;if(!groups.has(key))groups.set(key,{...d,etas:[],hasRealtime:false,hasSchedule:false});const g=groups.get(key);g.etas.push(d.minutes);if(d.realtime===true)g.hasRealtime=true;else g.hasSchedule=true}return [...groups.values()].slice(0,6)}
function renderRail(){const stations=state.rail?.stations||[];const liveAvailable=state.rail?.realtimeAvailable===true;const boardNote=state.rail?.source==='live'?(liveAvailable?'Live predictions available · scheduled service fills any gaps':'Official scheduled times · live predictions temporarily unavailable'):'';$('#railStations').innerHTML=stations.map(station=>{const code=station.codes?.[0]||station.id||'';const saved=isRailSaved(code);return `<article class="card rail-card" data-station="${esc(code)}"><div class="stop-top"><div><div class="stop-name">${esc(station.name)}</div><div class="stop-code">${esc((station.codes||[]).join(' · '))}</div></div><div class="stop-actions">${station.distance!=null?`<div class="distance">${station.distance<1000?station.distance+' m':(station.distance/1000).toFixed(1)+' km'}</div>`:''}<button class="favorite-station ${saved?'saved':''}" type="button" data-station-code="${esc(code)}" data-station-name="${esc(station.name)}" aria-label="${saved?'Remove':'Save'} ${esc(station.name)}">${saved?'★':'☆'}</button></div></div>${boardNote?`<div class="rail-board-note">${esc(boardNote)}</div>`:''}<div class="train-list">${groupedDepartures(station).map(d=>{const mode=d.hasRealtime?'Realtime':'Scheduled';return `<div class="train-row"><div class="line-badge ${lineClass(d.line)}">${esc(d.line)}</div><div class="train-dest"><strong>${esc(d.destination)}</strong><span>${mode} · ${d.platform?`Platform ${esc(d.platform)} · `:''}${esc(d.lineName||'Train')}</span></div><div class="train-times">${d.etas.slice(0,3).map((m,i)=>`<span class="${i===0?'next':''}">${m===0?'Arr':m+'m'}</span>`).join('')}</div></div>`}).join('')||'<div class="empty-inline">No scheduled departures found in the next 90 minutes. Try Refresh; if this persists, the LTA timetable feed may be unavailable.</div>'}</div></article>`}).join('')||'<div class="card empty">Use your location, tap a favourite station, or search for an MRT/LRT station.</div>';sourceLabel();renderMapMarkers();renderNextUp()}
function allRailStationsForSummary(){const out=[];for(const s of state.rail?.stations||[])out.push(s);for(const p of state.savedRailData||[])for(const s of p?.stations||[])if(!out.some(x=>(x.codes?.[0]||x.id)===(s.codes?.[0]||s.id)))out.push(s);return out}
function departureCandidates(){const candidates=[];const seenStops=new Set();for(const item of state.savedStopData){const stop=item.stop;if(!stop)continue;seenStops.add(stop.code);const prefs=savedStopFor(stop.code)?.services||[];for(const s of stop.services||[]){if(s.eta?.[0]==null)continue;if(prefs.length&&!prefs.includes(String(s.no)))continue;candidates.push({kind:'bus',minutes:s.eta[0],label:`Bus ${s.no}`,detail:stop.name,priority:prefs.includes(String(s.no))?0:1})}}for(const stop of state.nearby?.stops||[]){if(seenStops.has(stop.code))continue;for(const s of stop.services||[]){if(s.eta?.[0]==null)continue;candidates.push({kind:'bus',minutes:s.eta[0],label:`Bus ${s.no}`,detail:stop.name,priority:2})}}for(const station of allRailStationsForSummary()){const stationCode=station.codes?.[0]||'';const saved=isRailSaved(stationCode);for(const d of station.departures||[]){if(d.minutes==null)continue;candidates.push({kind:'rail',minutes:d.minutes,label:`${d.line} → ${d.destination}`,detail:station.name,priority:saved?0:state.lat!=null?1:2})}}return candidates.sort((a,b)=>(a.priority-b.priority)||(a.minutes-b.minutes)).slice(0,6)}
function renderNextUp(){const title=$('#nextUpTitle'),copy=$('#nextUpCopy'),action=$('#nextUpAction'),options=$('#nextUpOptions');if(!title||!copy||!action||!options)return;const c=departureCandidates();if(!c.length){title.textContent='Make SGBuddy yours';copy.textContent='Allow location or save the bus stops and MRT/LRT stations you use most. SGBuddy will then prioritize the departures that matter to you.';action.textContent='Set up';options.innerHTML='';return}const first=c.slice().sort((a,b)=>a.minutes-b.minutes)[0];title.textContent=first.minutes<=3?'A departure is imminent':first.minutes<=7?'Head out soon':`Next useful departure in ${first.minutes} min`;copy.textContent=state.lat!=null?'Prioritized from nearby and saved transport.':'Prioritized from your saved stops and stations.';action.textContent=first.minutes===0?'Now':`${first.minutes} min`;options.innerHTML=c.slice(0,3).map(x=>`<div class="next-option"><span class="next-icon">${x.kind==='rail'?'▰':'▣'}</span><div><strong>${esc(x.label)}</strong><span>${esc(x.detail)}</span></div><b>${x.minutes===0?'Arr':x.minutes+'m'}</b></div>`).join('')}
function tripRiskContext(){let score=0;const signals=[];const forecast=state.weather?.forecast||state.weather?.summary||'';const severe=/thundery|heavy rain|heavy showers|storm/i.test(forecast);if(state.weather?.rain){score+=severe?3:2;signals.push({kind:'weather',text:severe?'Heavy rain / thunder risk':`Rain near ${state.weather?.area||'you'}`})}else if(state.weather)signals.push({kind:'ok',text:`${state.weather?.area||'Singapore'}: ${forecast||'Weather loaded'}`});if(state.train?.status===2){score+=3;signals.push({kind:'rail',text:'Rail disruption reported'})}else if(state.train)signals.push({kind:'ok',text:'Rail network normal'});const incidents=Number(state.traffic?.count||0);if(incidents>=6){score+=2;signals.push({kind:'traffic',text:`${incidents} road incidents`})}else if(incidents>0)signals.push({kind:'traffic',text:`${incidents} road incident${incidents===1?'':'s'}`});return {score,level:score>=4?'high':score>=2?'watch':'low',signals}}
function renderTripIntelligence(){const title=$('#tripIntelTitle'),level=$('#tripIntelLevel'),copy=$('#tripIntelCopy'),signals=$('#tripIntelSignals');if(!title||!level||!copy||!signals)return;const risk=tripRiskContext();level.textContent=risk.level==='high'?'HIGH':risk.level==='watch'?'WATCH':'LOW';level.className='risk-pill '+risk.level;if(risk.level==='high'){title.textContent='Build in extra time';copy.textContent='Travel conditions need attention. SGBuddy will prefer lower-risk routes and reduce exposed walking where possible.'}else if(risk.level==='watch'){title.textContent='A little planning helps';copy.textContent='Conditions are manageable, but one or more signals could affect the easiest route.'}else{title.textContent='Conditions look good';copy.textContent='No major weather or rail problem is affecting your current travel context.'}signals.innerHTML=risk.signals.map(s=>`<span class="trip-signal ${s.kind}">${esc(s.text)}</span>`).join('')}
function renderAlerts(){const a=[];if(state.weather?.rain)a.push({i:'☂',t:`Rain near ${state.weather.area||'your area'}`,c:`${state.weather.forecast||state.weather.summary||'Showers forecast'}. SGBuddy will favor routes with less exposed walking.`});if(state.train){if(state.train.status===2)(state.train.disruptions||[]).forEach(d=>a.push({i:'⚠',t:`${d.line||'Rail'} disruption`,c:d.message||'Service disruption'}));else a.push({i:'✓',t:'Rail network normal',c:'No major train service disruption reported.'})}if(state.traffic){(state.traffic.incidents||[]).slice(0,3).forEach(x=>a.push({i:'⌁',t:x.type||'Traffic incident',c:x.message||'Road incident reported.'}))}$('#alerts').innerHTML=a.map(x=>`<div class="card alert"><div class="alert-icon">${x.i}</div><div><div class="alert-title">${esc(x.t)}</div><div class="alert-copy">${esc(x.c)}</div></div></div>`).join('')||'<div class="card">No alerts loaded.</div>'}
function updateHero(){const w=state.weather;$('#weatherMetric').textContent=w?(w.rain?'☂':'☁︎'):'—';$('#weatherLabel').textContent=w?.summary||'Weather';$('#railMetric').textContent=state.train?(state.train.status===2?'⚠':'✓'):'—';$('#trafficMetric').textContent=state.traffic?.count??'—';renderTripIntelligence();renderAlerts();sourceLabel();renderEnvironment()}
async function json(url){const r=await fetch(url);const p=await r.json();if(!r.ok)throw new Error(p.error||`Request failed ${r.status}`);return p}
async function refreshContext(){try{const weatherUrl=Number.isFinite(state.lat)&&Number.isFinite(state.lon)?`/api/weather?lat=${state.lat}&lon=${state.lon}`:'/api/weather';const [train,traffic,weather]=await Promise.all([json('/api/train'),json('/api/traffic'),json(weatherUrl)]);Object.assign(state,{train,traffic,weather});updateHero()}catch(e){toast(e.message)}}
async function loadNearby(lat,lon){const busPromise=json(`/api/nearby?lat=${lat}&lon=${lon}`).then(p=>{state.nearby=p;renderNearby()}).catch(e=>toast('Bus: '+e.message));const railPromise=json(`/api/rail?lat=${lat}&lon=${lon}`).then(p=>{state.rail=p;renderRail()}).catch(e=>toast('MRT: '+e.message));const weatherPromise=json(`/api/weather?lat=${lat}&lon=${lon}`).then(p=>{state.weather=p;updateHero()}).catch(()=>{});await Promise.all([busPromise,railPromise,weatherPromise]);renderNextUp()}
function setLocationStatus(text){const el=$('#locationStatus');if(el)el.textContent=text}
function closeLocationSheet(){$('#locationSheet')?.classList.add('hidden')}
function showLocationSheet(){if(!navigator.geolocation)return;$('#locationSheet')?.classList.remove('hidden')}
async function locate({interactive=true}={}){if(!navigator.geolocation){setLocationStatus('Location is not supported on this device');if(interactive)toast('Location is not supported on this device.');return false}$('#placeLabel').textContent='Locating…';setLocationStatus('Finding nearby transport…');return new Promise(resolve=>navigator.geolocation.getCurrentPosition(async p=>{state.lat=p.coords.latitude;state.lon=p.coords.longitude;state.locationChoice='granted';localStorage.setItem('sgc-location-choice','granted');$('#placeLabel').textContent='Near you';setLocationStatus('Using your current location · not stored in cloud');closeLocationSheet();await loadNearby(state.lat,state.lon);if(state.transportView==='map')fitMap();resolve(true)},err=>{state.lat=null;state.lon=null;$('#placeLabel').textContent='Singapore';if(err?.code===1){state.locationChoice='denied';localStorage.setItem('sgc-location-choice','denied');setLocationStatus('Location permission denied · searches and favourites still work')}else setLocationStatus('Could not get location · try again');if(interactive)toast(err?.code===1?'Location permission was not granted. You can still use favourites and search.':'Could not get your location. Try again in a moment.');resolve(false)},{enableHighAccuracy:false,timeout:9000,maximumAge:180000}))}
async function maybeUseLocation(){if(!navigator.geolocation){setLocationStatus('Location unavailable on this device');return false}try{if(navigator.permissions?.query){const permission=await navigator.permissions.query({name:'geolocation'});if(permission.state==='granted')return locate({interactive:false});if(permission.state==='denied'){state.locationChoice='denied';localStorage.setItem('sgc-location-choice','denied');setLocationStatus('Location permission denied · favourites still work');return false}}}catch{}if(state.locationChoice==='granted')return locate({interactive:false});if(state.locationChoice==='denied'){setLocationStatus('Location permission denied · favourites still work');return false}if(state.locationChoice==='not-now'){setLocationStatus('Location off · tap Locate any time');return false}setLocationStatus('Location can personalize nearby transport');setTimeout(showLocationSheet,350);return false}
async function fetchStop(code){return json('/api/bus?stop='+encodeURIComponent(code))}
async function checkStop(code,{scroll=true}={}){const host=$('#nearbyStops');if(host)host.innerHTML='<div class="card empty">Checking live bus arrivals…</div>';try{const p=await fetchStop(code);state.nearby={source:p.source,stops:[p.stop]};renderNearby();if(scroll)host?.scrollIntoView({behavior:'smooth',block:'center'});return p}catch(e){if(host)host.innerHTML='<div class="card empty error-state">Bus arrivals could not be loaded. Try again.</div>';toast(e.message);return null}}
async function checkRail(query,{scroll=true}={}){const host=$('#railStations');if(host)host.innerHTML='<div class="card empty">Loading official train timetable…</div>';try{const p=await json('/api/rail?station='+encodeURIComponent(query));state.rail=p;renderRail();if(scroll)host?.scrollIntoView({behavior:'smooth',block:'center'});return p}catch(e){if(host)host.innerHTML='<div class="card empty error-state">Train data could not be loaded. Try again.</div>';toast(e.message);return null}}
function renameSavedStop(code){const saved=savedStopFor(code);if(!saved)return;const next=prompt('Name this bus stop',saved.label||saved.name||'');if(next===null)return;saved.label=String(next).trim().slice(0,80);persistSavedStops(true);renderSavedStops();renderNearby();toast(saved.label?'Favourite renamed':'Personal label cleared')}
function moveSavedStop(code,dir){const i=state.savedStops.findIndex(s=>s.code===String(code));const j=i+Number(dir);if(i<0||j<0||j>=state.savedStops.length)return;[state.savedStops[i],state.savedStops[j]]=[state.savedStops[j],state.savedStops[i]];persistSavedStops(true);renderSavedStops();renderNextUp()}
async function refreshSavedStops(){if(!state.savedStops.length){state.savedStopData=[];renderSavedStops();return}const results=await Promise.all(state.savedStops.map(async s=>{try{return await fetchStop(s.code)}catch(error){return {source:'error',stop:{code:s.code,name:s.name||`Bus Stop ${s.code}`,services:[]},error:error.message}}}));state.savedStopData=results;for(const result of results){const saved=state.savedStops.find(s=>s.code===result.stop?.code);if(saved&&result.stop?.name)saved.name=result.stop.name}persistSavedStops();renderSavedStops()}
async function refreshSavedStations(){if(!state.savedRailStations.length){state.savedRailData=[];renderSavedStations();return}const results=await Promise.all(state.savedRailStations.map(async s=>{try{return await json('/api/rail?station='+encodeURIComponent(s.code))}catch(error){return {source:'error',stations:[],error:error.message}}}));state.savedRailData=results;for(let i=0;i<results.length;i++){const station=results[i]?.stations?.[0];if(station?.name)state.savedRailStations[i].name=station.name}persistSavedStations();renderSavedStations()}
function persistSavedStops(sync=false){localStorage.setItem('sgc-bus-stops',JSON.stringify(state.savedStops.map(({code,name,label,services})=>({code,name,label,services:Array.isArray(services)?services:[]}))));if(sync)queueProfileSync()}
function persistSavedStations(sync=false){localStorage.setItem('sgc-rail-stations',JSON.stringify(state.savedRailStations));if(sync)queueProfileSync()}
async function toggleSavedStop(code){code=String(code);const idx=state.savedStops.findIndex(s=>s.code===code);if(idx>=0){state.savedStops.splice(idx,1);state.savedStopData=state.savedStopData.filter(x=>x.stop?.code!==code);persistSavedStops(true);renderSavedStops();renderNearby();toast(`Removed stop ${code}`);return}if(state.savedStops.length>=12)return toast('You can save up to 12 bus stops in this version.');let name='';try{const p=await fetchStop(code);name=p.stop?.name||'';state.savedStopData.push(p)}catch{}state.savedStops.push({code,name,label:'',services:[]});persistSavedStops(true);renderSavedStops();renderNearby();toast(`Saved stop ${code}`)}
async function toggleSavedStation(code,name=''){code=String(code||'').toUpperCase();if(!code)return;const idx=state.savedRailStations.findIndex(s=>s.code===code);if(idx>=0){state.savedRailStations.splice(idx,1);state.savedRailData=state.savedRailData.filter(p=>p?.stations?.[0]?.codes?.[0]!==code);persistSavedStations(true);renderSavedStations();renderRail();toast(`Removed ${code} from favourites`);return}if(state.savedRailStations.length>=12)return toast('You can save up to 12 MRT/LRT stations.');state.savedRailStations.push({code,name});persistSavedStations(true);try{const p=await json('/api/rail?station='+encodeURIComponent(code));state.savedRailData.push(p);const station=p.stations?.[0];if(station?.name)state.savedRailStations.find(s=>s.code===code).name=station.name}catch{}persistSavedStations(true);renderSavedStations();renderRail();toast(`Saved ${name||code}`)}
function firstRail(){let best=null;for(const station of allRailStationsForSummary()){for(const d of station.departures||[]){if(d.minutes==null)continue;if(!best||d.minutes<best.minutes)best={...d,stationName:station.name,stationCode:station.codes?.[0]||''}}}return best}
function firstBus(){const x=departureCandidates().filter(x=>x.kind==='bus').sort((a,b)=>a.minutes-b.minutes)?.[0];return x?{no:String(x.label).replace(/^Bus\s+/i,''),minutes:x.minutes,stop:x.detail}:null}
function advisor(q){const text=q.toLowerCase();let reply='I can use Singapore MRT, bus, weather and disruption data. Try “When is my next train?”, “Should I leave now?” or “Take me to Jewel.”';const rail=firstRail(),bus=firstBus(),risk=tripRiskContext();if(/next.*train|mrt.*time|train.*time/.test(text))reply=rail?`From ${rail.stationName||state.rail?.stations?.[0]?.name||'your station'}, the next ${rail.line} train towards ${rail.destination} is about ${rail.minutes} minute${rail.minutes===1?'':'s'} away${rail.platform?` from platform ${rail.platform}`:''}.`:'Search or locate an MRT station first, then I can tell you the next trains.';else if(/train|mrt|rail/.test(text))reply=state.train?.status===2?`There is a rail disruption: ${state.train.disruptions?.[0]?.message||'check the alert below.'}`:rail?`Rail service is currently normal. Your next nearby train is ${rail.line} towards ${rail.destination} in about ${rail.minutes} minutes.`:'No major train disruption is currently reported.';else if(/rain|weather|umbrella/.test(text))reply=state.weather?.rain?`${state.weather.area||'Your area'}: ${state.weather.forecast||state.weather.summary||'rain forecast'}. I’ll favor routes with less exposed walking in Travel.`:`Current forecast${state.weather?.area?` around ${state.weather.area}`:''}: ${state.weather?.summary||'weather data is not loaded yet'}. No rain signal is affecting route ranking right now.`;else if(/^(get|take|bring) me to |how do i get to |route to /.test(text)){const destination=q.replace(/^(get|take|bring) me to |^how do i get to |^route to /i,'').trim();if(destination){$('#tripTo').value=destination;navigateTo('travel');setTimeout(planNativeJourney,350);reply=`Planning a SGBuddy route to ${destination}…`}}else if(/leave|next.*bus|bus.*time/.test(text)){const candidates=[];if(bus)candidates.push({mode:`bus ${bus.no} at ${bus.stop}`,minutes:bus.minutes});if(rail)candidates.push({mode:`${rail.line} train`,minutes:rail.minutes});candidates.sort((a,b)=>a.minutes-b.minutes);if(candidates[0]){const urgency=candidates[0].minutes<=5?'I would head out now.':'You have a little time, but refresh before leaving.';const conditions=risk.level==='high'?' Conditions are elevated, so I’d add buffer time.':risk.level==='watch'?' Keep a small buffer for current conditions.':'';reply=`The soonest departure I can see is ${candidates[0].mode} in about ${candidates[0].minutes} minutes. ${urgency}${conditions}`}else reply='Locate yourself or save/search a stop first, then I can make that call.'}$('#advisorReply').textContent=reply}
function setMode(mode,sync=true){state.mode=normalizePersonaMode(mode);localStorage.setItem('sgc-mode',state.mode);renderPersonaContext();if(sync)queueProfileSync()}
function initPlaces(){for(const key of ['home','work','hotel'])$(`#${key}Input`).value=state.places[key]||'';updateHotelButton()}
function savePlaces(){state.places={home:$('#homeInput').value.trim(),work:$('#workInput').value.trim(),hotel:$('#hotelInput').value.trim()};cachePreferences(true);updateHotelButton();queueProfileSync();toast('Places saved — syncing to your SGBuddy profile')}
function updateHotelButton(){$('#goHotelButton').disabled=!state.places.hotel}
function openTransit(destination,origin=''){if(!destination)return toast('Add a destination first.');const u=new URL('https://www.google.com/maps/dir/');u.searchParams.set('api','1');u.searchParams.set('destination',destination);u.searchParams.set('travelmode','transit');if(origin)u.searchParams.set('origin',origin);window.open(u.toString(),'_blank','noopener')}
function journeyTime(iso){try{return new Intl.DateTimeFormat([],{hour:'numeric',minute:'2-digit'}).format(new Date(iso))}catch{return '—'}}
function journeyStepIcon(type){return type==='walk'?'↗':type==='bus'?'▣':type==='rail'?'▰':'⇄'}
function journeyStepMarkup(step){if(step.type==='walk')return `<div class="journey-step"><span class="journey-step-icon">${journeyStepIcon(step.type)}</span><div><strong>${esc(step.text||'Walk')}</strong><span>${step.distanceM?`${step.distanceM} m · `:''}${step.minutes||0} min</span></div></div>`;if(step.type==='transfer')return `<div class="journey-step transfer-step"><span class="journey-step-icon">⇄</span><div><strong>${esc(step.text||'Transfer')}</strong><span>Allow about ${step.minutes||5} min</span></div></div>`;if(step.type==='bus')return `<div class="journey-step"><span class="journey-step-icon bus-step-icon">${esc(step.service||'BUS')}</span><div><strong>${esc(step.text||`Take bus ${step.service}`)}</strong><span>${step.waitMinutes!=null?`Arrives in ${step.waitMinutes} min · `:''}${step.stops||0} stops · about ${step.minutes||0} min</span></div></div>`;return `<div class="journey-step"><span class="journey-step-icon rail-step-icon">${esc(step.line||'MRT')}</span><div><strong>${esc(step.text||`Take ${step.line}`)}</strong><span>${step.waitMinutes!=null?`Next train in ${step.waitMinutes} min · `:''}${step.platform?`Platform ${esc(step.platform)} · `:''}${step.stops||0} stops · about ${step.minutes||0} min</span></div></div>`}
function journeyOptionMarkup(option,index){const live=option.mode==='bus'&&option.realtime?'Live bus arrivals':option.mode==='mixed'&&option.realtime?'Live bus + scheduled rail':option.mode==='rail'?'Scheduled rail estimate':'Estimated timing';const mode=option.mode==='mixed'?'Bus + rail':option.mode==='bus'?'Bus':'Rail';const headline=option.recommended?'Recommended':`Alternative ${index}`;const timing=option.timingMode==='arrive-by'?(option.leaveNow?(option.lateByMinutes>0?`Leave now · ~${option.lateByMinutes} min late`:'Leave now'):`Leave by ${journeyTime(option.leaveAt)}`):`Arrive ${journeyTime(option.arrivalAt)}`;const weatherBadge=option.weatherAware?'<span class="weather-route-badge">Rain-smart</span>':'';return `<article class="journey-option ${option.recommended?'recommended':''}" data-journey-card="${esc(option.id)}"><div class="journey-option-head"><div><div class="label">${headline.toUpperCase()}</div><h4>${esc(option.title||option.mode)}</h4></div><div class="journey-duration"><strong>${option.totalMinutes} min</strong><span>${esc(timing)}</span></div></div><div class="journey-meta"><span>${mode}</span><span>${live}</span><span>${option.walkMinutes||0} min walk</span><span>${option.transfers||0} transfer${option.transfers===1?'':'s'}</span>${weatherBadge}</div><button class="show-journey-map" type="button" data-journey-id="${esc(option.id)}">◎ Show on map</button>${option.timingMode==='arrive-by'?`<div class="arrive-by-advice">${option.leaveNow?(option.lateByMinutes>0?`Target is tight: leaving now is estimated about ${option.lateByMinutes} min after your requested arrival.`:`Leave now to protect a ${option.bufferMinutes||0}-minute reliability buffer.`):`Leave by ${journeyTime(option.leaveAt)} to keep about ${option.bufferMinutes||0} minutes of buffer before your requested arrival.`}</div>`:''}<div class="journey-steps">${(option.steps||[]).map(journeyStepMarkup).join('')}</div></article>`}
function renderJourney(payload){const host=$('#journeyResults'),status=$('#journeyStatus');if(!host||!status)return;if(!payload?.options?.length){state.journeyPayload=null;host.classList.add('hidden');$('#journeyMapWrap')?.classList.add('hidden');status.textContent='No native route was found. You can still open the trip in Google Maps.';status.classList.add('error');return}state.journeyPayload=payload;rememberDestination(payload.destination);status.classList.remove('error');const weather=payload.weatherAware&&payload.weather?` · Weather-aware: ${payload.weather.origin?.forecast||'rain'}`:'';const timing=payload.timingMode==='arrive-by'&&payload.requestedArrivalAt?` · arrive by ${journeyTime(payload.requestedArrivalAt)}`:'';status.textContent=`${payload.origin?.label||'Origin'} → ${payload.destination?.label||'Destination'} · ${payload.options.length} option${payload.options.length===1?'':'s'}${timing}${weather}`;host.innerHTML=payload.options.map((o,i)=>journeyOptionMarkup(o,i+1)).join('')+`<div class="journey-limitations">${(payload.limitations||[]).map(x=>`<span>• ${esc(x)}</span>`).join('')}</div>`;host.classList.remove('hidden');setTimeout(()=>renderJourneyMap(payload.recommendedId||payload.options[0]?.id),30)}
function showJourneyError(message){const status=$('#journeyStatus'),host=$('#journeyResults');state.journeyPayload=null;if(status){status.textContent=message;status.classList.add('error')}if(host)host.classList.add('hidden');$('#journeyMapWrap')?.classList.add('hidden')}
async function planNativeJourney(){const destination=$('#tripTo').value.trim(),origin=$('#tripFrom').value.trim();if(!destination){toast('Add a destination first.');$('#tripTo').focus();return}if(!origin&&(!Number.isFinite(state.lat)||!Number.isFinite(state.lon))){const ok=await locate({interactive:true});if(!ok){showJourneyError('Use your location or enter an MRT/LRT station, bus stop code, or origin place.');return}}const arriveMode=$('#timingArriveButton')?.classList.contains('active');let arriveBy='';if(arriveMode){const raw=$('#arriveByInput')?.value;if(!raw){toast('Choose an arrival time.');$('#arriveByInput')?.focus();return}const target=new Date(raw);if(!Number.isFinite(target.getTime())){toast('Choose a valid arrival time.');return}arriveBy=target.toISOString()}const button=$('#planTrip');await withBusy(button,'Planning…',async()=>{const params=new URLSearchParams({to:destination});if(origin)params.set('from',origin);else if(Number.isFinite(state.lat)&&Number.isFinite(state.lon)){params.set('lat',String(state.lat));params.set('lon',String(state.lon))}if(arriveBy)params.set('arriveBy',arriveBy);const status=$('#journeyStatus');status.classList.remove('error');status.textContent=arriveMode?'Calculating when you should leave, with weather-aware routing…':'SGBuddy is comparing rail, direct bus, mixed feeder routes, and walking exposure…';try{const response=await fetch('/api/journey?'+params.toString(),{headers:{accept:'application/json'},cache:'no-store'});const payload=await response.json().catch(()=>({}));if(!response.ok){showJourneyError(payload.error||`Journey planner returned ${response.status}`);return}renderJourney(payload)}catch(e){showJourneyError('Journey planning is temporarily unavailable. '+e.message)}})}


function updateDataCoreState(){const lta=$('#dataCoreLta'),rail=$('#dataCoreRail'),weather=$('#dataCoreWeather'),profile=$('#dataCoreProfile');if(lta)lta.textContent=(state.nearby?.source==='live'||state.rail?.source==='live'||state.train?.source==='live')?'Live':'Waiting';if(rail)rail.textContent=state.rail?.realtimeAvailable===true?'Realtime':state.rail?.source==='live'?'Scheduled':'Waiting';if(weather)weather.textContent=state.weather?.source==='live'?'Live':state.weather?'Fallback':'Waiting';if(profile)profile.textContent=state.cloudStatus==='synced'?'Synced':state.cloudStatus==='syncing'?'Syncing…':state.cloudStatus==='pending'?'Pending':state.cloudStatus==='error'?'Issue':state.profileToken?'Linked':'Local'}
async function runDataCoreDiagnostics({quiet=false}={}){const status=$('#dataCoreStatus'),result=$('#dataCoreResult');if(status){status.textContent='Checking…';status.classList.remove('synced','error')}try{const [health,snapshot]=await Promise.all([json('/api/health'),json('/api/snapshot')]);if($('#dataCoreLta'))$('#dataCoreLta').textContent=health.ltaConfigured?'Live':'Not configured';if($('#dataCoreRail'))$('#dataCoreRail').textContent=state.rail?.realtimeAvailable===true?'Realtime':health.features?.railRealtime?'Scheduled + GTFS':'Unavailable';if($('#dataCoreWeather'))$('#dataCoreWeather').textContent=snapshot.weather?.source==='live'?'Live':snapshot.weather?'Fallback':'Unavailable';if($('#dataCoreProfile'))$('#dataCoreProfile').textContent=state.cloudStatus==='synced'?'Synced':state.profileToken?'Linked':'Local';if(status){status.textContent='Healthy';status.classList.add('synced')}if(result)result.textContent=`All core services responded · v${health.version} · checked ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;if(!quiet)toast('Data Core is healthy');return true}catch(e){if(status){status.textContent='Check failed';status.classList.add('error')}if(result)result.textContent='A core service did not respond: '+e.message;if(!quiet)toast('Data Core check found an issue');return false}}
async function refreshAllData(){const b=$('#dataCoreRefresh');if(b){b.disabled=true;b.textContent='Refreshing…'}try{await Promise.all([refreshContext(),refreshSavedStops(),refreshSavedStations()]);if(state.lat!=null&&state.lon!=null)await loadNearby(state.lat,state.lon);else if(state.savedRailStations[0])await checkRail(state.savedRailStations[0].code,{scroll:false});updateDataCoreState();await runDataCoreDiagnostics({quiet:true});toast('All SGBuddy data refreshed')}finally{if(b){b.disabled=false;b.textContent='Refresh all data'}}}
function openDataEndpoint(path){window.open(path,'_blank','noopener')}
function ensureJourneyMap(){if(state.journeyMap)return true;const host=$('#journeyMap');if(!host)return false;if(!window.L){host.innerHTML='<div class="map-unavailable">Route map unavailable. The itinerary still works normally.</div>';return false}state.journeyMap=L.map('journeyMap',{zoomControl:true,attributionControl:true}).setView([1.3521,103.8198],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.journeyMap);state.journeyMapLayer=L.layerGroup().addTo(state.journeyMap);return true}
function journeyStepPath(step){const raw=Array.isArray(step?.path)&&step.path.length?step.path:[step?.from,step?.to];return raw.filter(p=>Number.isFinite(Number(p?.lat))&&Number.isFinite(Number(p?.lon))).map(p=>[Number(p.lat),Number(p.lon)])}
function journeyMapStyle(type){if(type==='bus')return {color:'#80ed99',weight:5,opacity:.9};if(type==='rail')return {color:'#79a7ff',weight:5,opacity:.9};return {color:'#aebed0',weight:4,opacity:.8,dashArray:'6 7'}}
function renderJourneyMap(optionId){const payload=state.journeyPayload,wrap=$('#journeyMapWrap');if(!payload?.options?.length||!wrap)return;const option=payload.options.find(o=>o.id===optionId)||payload.options[0];if(!ensureJourneyMap())return;wrap.classList.remove('hidden');state.journeyMapLayer.clearLayers();const all=[];for(const step of option.steps||[]){if(step.type==='transfer')continue;const path=journeyStepPath(step);if(path.length<2)continue;all.push(...path);L.polyline(path,journeyMapStyle(step.type)).addTo(state.journeyMapLayer)}if(!all.length){wrap.classList.add('hidden');return}const first=all[0],last=all[all.length-1];L.circleMarker(first,{radius:7,color:'#fff',weight:3,fillColor:'#63e6be',fillOpacity:1}).bindTooltip('Start').addTo(state.journeyMapLayer);L.circleMarker(last,{radius:7,color:'#fff',weight:3,fillColor:'#ff7b8a',fillOpacity:1}).bindTooltip('Destination').addTo(state.journeyMapLayer);const title=$('#journeyMapTitle');if(title)title.textContent=option.recommended?`Recommended · ${option.title}`:option.title;$$('.show-journey-map').forEach(b=>b.classList.toggle('active',b.dataset.journeyId===option.id));setTimeout(()=>{state.journeyMap.invalidateSize();state.journeyMap.fitBounds(all,{padding:[24,24],maxZoom:16})},40)}
function ensureMap(){if(state.map)return true;if(!window.L){$('#transportMap').innerHTML='<div class="map-unavailable">Map library could not load. Bus/MRT cards still work normally.</div>';return false}state.map=L.map('transportMap',{zoomControl:true,attributionControl:true}).setView([1.3521,103.8198],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.map);state.mapLayer=L.layerGroup().addTo(state.map);return true}
function mapPointKey(p){return `${p.kind}:${p.code||p.name}:${Number(p.lat).toFixed(5)}:${Number(p.lon).toFixed(5)}`}
function collectMapPoints(){const pts=[];for(const item of state.savedStopData){const s=item.stop;if(Number.isFinite(Number(s?.lat))&&Number.isFinite(Number(s?.lon)))pts.push({kind:'bus',type:'saved',name:s.name,code:s.code,lat:Number(s.lat),lon:Number(s.lon),data:s})}for(const s of state.nearby?.stops||[]){if(Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon)))pts.push({kind:'bus',type:isSaved(s.code)?'saved':'bus',name:s.name,code:s.code,lat:Number(s.lat),lon:Number(s.lon),data:s})}for(const s of state.rail?.stations||[]){if(Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon))){const code=s.codes?.[0]||s.id;pts.push({kind:'rail',type:isRailSaved(code)?'savedrail':'rail',name:s.name,code,lat:Number(s.lat),lon:Number(s.lon),data:s})}}for(const payload of state.savedRailData||[])for(const s of payload?.stations||[]){if(Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon))){const code=s.codes?.[0]||s.id;pts.push({kind:'rail',type:'savedrail',name:s.name,code,lat:Number(s.lat),lon:Number(s.lon),data:s})}}const unique=new Map();for(const p of pts){const key=`${p.kind}:${p.code}`;const prior=unique.get(key);if(!prior||p.type==='saved'||p.type==='savedrail')unique.set(key,p)}return [...unique.values()]}
function markerStyle(type){if(type==='saved')return {radius:9,color:'#07111f',weight:3,fillColor:'#ffd166',fillOpacity:1};if(type==='savedrail')return {radius:9,color:'#07111f',weight:3,fillColor:'#c7a7ff',fillOpacity:1};if(type==='rail')return {radius:8,color:'#07111f',weight:3,fillColor:'#79a7ff',fillOpacity:1};return {radius:7,color:'#07111f',weight:3,fillColor:'#63e6be',fillOpacity:1}}
function mapPopup(p){if(p.kind==='bus'){const arrivals=(p.data?.services||[]).filter(s=>s.eta?.[0]!=null).slice(0,3).map(s=>`<span>${esc(s.no)} <b>${s.eta[0]}m</b></span>`).join(' · ');return `<div class="map-popup"><strong>${esc(p.name)}</strong><small>Bus stop ${esc(p.code)}</small><div>${arrivals||'No arrival estimates right now'}</div><button class="map-view-stop" data-stop="${esc(p.code)}">View arrivals</button></div>`}const dep=(p.data?.departures||[]).slice().sort((a,b)=>a.minutes-b.minutes)[0];return `<div class="map-popup"><strong>${esc(p.name)}</strong><small>${esc(p.code)} · MRT/LRT</small><div>${dep?`${esc(dep.line)} → ${esc(dep.destination)} · <b>${dep.minutes===0?'Arr':dep.minutes+'m'}</b>`:'No departure loaded'}</div><button class="map-view-station" data-station="${esc(p.code)}">View trains</button></div>`}
function renderMapMarkers(){if(!state.map)return;state.mapLayer.clearLayers();const points=collectMapPoints();for(const p of points)L.circleMarker([p.lat,p.lon],markerStyle(p.type)).bindPopup(mapPopup(p)).addTo(state.mapLayer);if(Number.isFinite(state.lat)&&Number.isFinite(state.lon))L.circleMarker([state.lat,state.lon],{radius:7,color:'#fff',weight:3,fillColor:'#ff7b8a',fillOpacity:1}).bindPopup('<strong>You are here</strong><br>Nearby transport is prioritized from this point.').addTo(state.mapLayer)}
function fitMap(){if(!ensureMap())return;renderMapMarkers();const coords=collectMapPoints().map(p=>[p.lat,p.lon]);if(Number.isFinite(state.lat)&&Number.isFinite(state.lon))coords.unshift([state.lat,state.lon]);setTimeout(()=>{state.map.invalidateSize();if(Number.isFinite(state.lat)&&Number.isFinite(state.lon)&&coords.length<=3)state.map.setView([state.lat,state.lon],15);else if(coords.length===1)state.map.setView(coords[0],16);else if(coords.length>1)state.map.fitBounds(coords,{padding:[28,28],maxZoom:16});else state.map.setView([1.3521,103.8198],11)},50)}
function setTransportView(view){state.transportView=view==='map'?'map':'cards';localStorage.setItem('sgc-transport-view',state.transportView);$('#cardsView').classList.toggle('hidden',state.transportView==='map');$('#mapView').classList.toggle('hidden',state.transportView!=='map');$('#cardsViewButton').classList.toggle('active',state.transportView==='cards');$('#mapViewButton').classList.toggle('active',state.transportView==='map');if(state.transportView==='map')fitMap()}

$('#locateButton').addEventListener('click',()=>locate({interactive:true}));
$('#allowLocationButton').addEventListener('click',()=>locate({interactive:true}));
$('#notNowLocationButton').addEventListener('click',()=>{state.locationChoice='not-now';localStorage.setItem('sgc-location-choice','not-now');closeLocationSheet();setLocationStatus('Location off · tap Locate any time');renderNextUp()});
$('#locationSheet').addEventListener('click',e=>{if(e.target===$('#locationSheet')){$('#notNowLocationButton').click()}});
$('#refreshButton').addEventListener('click',()=>withBusy($('#refreshButton'),'Refreshing…',async()=>{await Promise.all([refreshContext(),refreshSavedStops(),refreshSavedStations()]);if(state.lat!=null&&state.lon!=null)await loadNearby(state.lat,state.lon);else if(state.savedRailStations[0])await checkRail(state.savedRailStations[0].code,{scroll:false});renderNextUp();toast('Refreshed')}));
$('#stopForm').addEventListener('submit',e=>{e.preventDefault();const code=$('#stopInput').value.trim();if(!/^\d{5}$/.test(code))return toast('Enter a 5-digit bus stop code.');checkStop(code)});
$('#savedStopForm').addEventListener('submit',async e=>{e.preventDefault();const code=$('#savedStopInput').value.trim();if(!/^\d{5}$/.test(code))return toast('Enter a 5-digit bus stop code.');$('#savedStopInput').value='';if(isSaved(code))return toast(`Stop ${code} is already saved.`);await toggleSavedStop(code)});
$('#railForm').addEventListener('submit',e=>{e.preventDefault();const q=$('#railInput').value.trim();if(!q)return toast('Enter a station name or code.');checkRail(q)});
document.addEventListener('click',async e=>{const personaAction=e.target.closest('[data-persona-action]');if(personaAction){runPersonaAction(personaAction.dataset.personaAction);return}const suggestion=e.target.closest('.place-suggestion');if(suggestion){selectPlaceSuggestion(suggestion.dataset.target,suggestion.dataset.value);return}const recent=e.target.closest('.recent-destination');if(recent){selectPlaceSuggestion('tripTo',recent.dataset.value);navigateTo('travel');return}const planConditions=e.target.closest('#planAroundConditions');if(planConditions){navigateTo('travel');setTimeout(()=>$('#tripTo')?.focus(),400);return}
  const favoriteStop=e.target.closest('.favorite-stop');if(favoriteStop){await toggleSavedStop(favoriteStop.dataset.code);return}
  const favoriteStation=e.target.closest('.favorite-station');if(favoriteStation){await toggleSavedStation(favoriteStation.dataset.stationCode,favoriteStation.dataset.stationName);return}
  const pin=e.target.closest('.pin-service');if(pin){toggleServicePreference(pin.dataset.stop,pin.dataset.service);return}
  const rename=e.target.closest('.rename-stop');if(rename){renameSavedStop(rename.dataset.code);return}
  const move=e.target.closest('.move-stop');if(move){moveSavedStop(move.dataset.code,move.dataset.dir);return}
  const stationChip=e.target.closest('.station-chip');if(stationChip){await checkRail(stationChip.dataset.station);return}
  const mapStop=e.target.closest('.map-view-stop');if(mapStop){setTransportView('cards');await checkStop(mapStop.dataset.stop);return}
  const mapStation=e.target.closest('.map-view-station');if(mapStation){setTransportView('cards');await checkRail(mapStation.dataset.station);return}
  const journeyMapButton=e.target.closest('.show-journey-map');if(journeyMapButton){renderJourneyMap(journeyMapButton.dataset.journeyId);return}
});
$('#cardsViewButton').addEventListener('click',()=>setTransportView('cards'));$('#mapViewButton').addEventListener('click',()=>setTransportView('map'));$('#fitMapButton').addEventListener('click',fitMap);
$('#advisorForm').addEventListener('submit',e=>{e.preventDefault();const q=$('#advisorInput').value.trim();if(q)advisor(q)});$$('.chips button').forEach(b=>b.addEventListener('click',()=>advisor(b.dataset.q)));
$('#accountButton').addEventListener('click',openAccountSheet);$('#closeAccountSheet').addEventListener('click',closeAccountSheet);$('#accountSheet').addEventListener('click',e=>{if(e.target===$('#accountSheet')&&!state.recoveryMode)closeAccountSheet()});$('#signInButton').addEventListener('click',signInAccount);$('#createAccountButton').addEventListener('click',createAccount);$('#forgotPasswordButton').addEventListener('click',sendPasswordReset);$('#signOutButton').addEventListener('click',signOutAccount);$('#accountSyncButton').addEventListener('click',()=>syncAllProfiles());$('#updatePasswordButton').addEventListener('click',updateAccountPassword);$('#accountPassword').addEventListener('keydown',e=>{if(e.key==='Enter')signInAccount()});
$('#modeButton').addEventListener('click',()=>openPersonaSheet(false));$('#editPersonaButton').addEventListener('click',()=>openPersonaSheet(false));$('#closePersonaSheet').addEventListener('click',closePersonaSheet);$('#savePersonaButton').addEventListener('click',savePersonaContext);$$('.persona-option').forEach(b=>b.addEventListener('click',()=>choosePersona(b.dataset.persona)));
$('#savePlaces').addEventListener('click',savePlaces);$('#timingNowButton').addEventListener('click',()=>setJourneyTiming('now'));$('#timingArriveButton').addEventListener('click',()=>setJourneyTiming('arrive'));$$('.quick-destinations button').forEach(b=>b.addEventListener('click',()=>{const value=state.places[b.dataset.place]||'';if(!value)return toast(`Save your ${b.dataset.place} first.`);$('#tripTo').value=value;$('#tripToSuggestions')?.classList.add('hidden')}));$$('.popular-destinations [data-destination]').forEach(b=>b.addEventListener('click',()=>{selectPlaceSuggestion('tripTo',b.dataset.destination);$('#tripTo').focus()}));$('#tripFrom').addEventListener('input',()=>queuePlaceSearch('tripFrom'));$('#tripTo').addEventListener('input',()=>queuePlaceSearch('tripTo'));$('#tripFrom').addEventListener('focus',()=>searchPlacesForInput('tripFrom'));$('#tripTo').addEventListener('focus',()=>searchPlacesForInput('tripTo'));$('#tripFrom').addEventListener('blur',()=>hidePlaceSuggestions('tripFrom'));$('#tripTo').addEventListener('blur',()=>hidePlaceSuggestions('tripTo'));$('#planTrip').addEventListener('click',planNativeJourney);$('#openGoogleTrip').addEventListener('click',()=>openTransit($('#tripTo').value.trim(),$('#tripFrom').value.trim()));$('#swapTrip').addEventListener('click',()=>{const a=$('#tripFrom').value,b=$('#tripTo').value;$('#tripFrom').value=b;$('#tripTo').value=a;$('#journeyResults').classList.add('hidden');$('#journeyMapWrap').classList.add('hidden');$('#journeyStatus').textContent='Ready to plan a new route.'});$('#goHotelButton').addEventListener('click',()=>{if(!state.places.hotel)return;$('#tripTo').value=state.places.hotel;navigateTo('travel');setTimeout(planNativeJourney,350)});
$('#installButton').addEventListener('click',installApp);$('#closeInstallSheet').addEventListener('click',closeInstallSheet);$('#installSheet').addEventListener('click',e=>{if(e.target===$('#installSheet'))closeInstallSheet()});
$('#dataCoreRefresh').addEventListener('click',refreshAllData);$('#dataCoreDiagnostics').addEventListener('click',()=>runDataCoreDiagnostics());document.addEventListener('click',e=>{const endpoint=e.target.closest('.endpoint-button');if(endpoint)openDataEndpoint(endpoint.dataset.endpoint)});
$('#syncProfileButton').addEventListener('click',()=>syncAllProfiles());$('#linkDeviceButton').addEventListener('click',showPairPanel);$('#copyPairLinkButton').addEventListener('click',copyPairLink);$('#closePairPanelButton').addEventListener('click',()=>$('#pairPanel').classList.add('hidden'));$('#exportProfileButton').addEventListener('click',exportProfile);$('#importProfileButton').addEventListener('click',()=>$('#importProfileInput').click());$('#importProfileInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(file)await importProfileFile(file);e.target.value=''});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;updateInstallUi()});window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updateInstallUi();toast('SGBuddy installed')});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

async function bootstrap(){setVersionBadge();greet();setJourneyTiming('now');renderRecentDestinations();renderTripIntelligence();initBottomNav();setMode(state.mode,false);initPlaces();setTransportView(state.transportView);updateInstallUi();renderSavedStops();renderSavedStations();renderNextUp();await initCloudProfile();await initAccount();renderPersonaContext();await Promise.all([refreshContext(),refreshSavedStops(),refreshSavedStations()]);let located=false;if(!state.personaOnboarded&&!state.recoveryMode)openPersonaSheet(true);else if(!state.recoveryMode)located=await maybeUseLocation();if(!located){if(state.savedRailStations[0])await checkRail(state.savedRailStations[0].code,{scroll:false});else{state.rail={source:'live',stations:[]};renderRail()}if(!state.nearby){state.nearby={source:'live',stops:[]};renderNearby()}}renderNextUp();updateDataCoreState();await runDataCoreDiagnostics({quiet:true});await initTravelLivingWave();updateNavFromScroll()}
bootstrap();


const FEATURED_PLACES=[
{name:'Marina Bay Sands',category:'Landmark',description:'Marina Bay landmark for skyline views, dining, shopping and ArtScience Museum.',personas:['visitor','executive'],transit:'Bayfront MRT',rain:'Good',best:'Late afternoon → evening'},
{name:'Gardens by the Bay',category:'Gardens',description:'Supertrees plus indoor conservatories; mix outdoor walking with rain-safe domes.',personas:['visitor','resident','new_in_sg'],transit:'Gardens by the Bay / Bayfront MRT',rain:'Mixed',best:'Late afternoon → evening'},
{name:'Jewel Changi Airport',category:'Airport attraction',description:'Rain Vortex, dining and indoor attractions linked directly to Changi Airport.',personas:['visitor','executive','new_in_sg'],transit:'Changi Airport MRT',rain:'Excellent',best:'Arrival/departure day'},
{name:'Merlion Park',category:'Landmark',description:'Short waterfront stop for the Merlion and classic Marina Bay view.',personas:['visitor'],transit:'Raffles Place MRT',rain:'Poor',best:'Early morning / after sunset'},
{name:'Sentosa',category:'Island',description:'Beaches, attractions and Resorts World; plan enough time for internal transfers.',personas:['visitor','resident','executive'],transit:'HarbourFront MRT + Sentosa Express',rain:'Mixed',best:'Half-day / full-day'},
{name:'Universal Studios Singapore',category:'Theme park',description:'Resorts World theme park; arrive early if it is a priority attraction.',personas:['visitor','resident'],transit:'HarbourFront MRT + Sentosa Express',rain:'Mixed',best:'Opening time on a weekday'},
{name:'Singapore Zoo',category:'Wildlife',description:'Open-concept Mandai wildlife park; city-to-Mandai travel time matters.',personas:['visitor','resident','new_in_sg'],transit:'Mandai shuttle / bus',rain:'Poor',best:'Morning'},
{name:'Night Safari',category:'Wildlife',description:'Evening Mandai wildlife experience designed around nocturnal viewing.',personas:['visitor','resident'],transit:'Mandai shuttle / bus',rain:'Poor',best:'After sunset'},
{name:'Bird Paradise',category:'Wildlife',description:'Large walk-through aviaries at Mandai with substantial outdoor movement.',personas:['visitor','resident','new_in_sg'],transit:'Mandai shuttle / bus',rain:'Mixed',best:'Morning'},
{name:'Singapore Botanic Gardens',category:'Gardens',description:'UNESCO-listed tropical garden for a slower walk close to central Singapore.',personas:['visitor','resident','new_in_sg'],transit:'Botanic Gardens MRT',rain:'Poor',best:'Early morning / late afternoon'},
{name:'Orchard Road',category:'Shopping',description:'Dense retail corridor with malls, food and strong indoor shelter options.',personas:['visitor','executive','resident','new_in_sg'],transit:'Orchard / Somerset MRT',rain:'Excellent',best:'Afternoon → evening'},
{name:'Chinatown',category:'Heritage',description:'Temples, food centres, conserved streets and markets in a compact district.',personas:['visitor','new_in_sg','resident'],transit:'Chinatown MRT',rain:'Mixed',best:'Late morning → evening'},
{name:'Little India',category:'Heritage',description:'Serangoon Road, Tekka and cultural landmarks in a highly walkable district.',personas:['visitor','new_in_sg','resident'],transit:'Little India MRT',rain:'Mixed',best:'Late morning / evening'},
{name:'Kampong Glam / Haji Lane',category:'Heritage',description:'Sultan Mosque, Arab Street, cafés, independent shops and street art.',personas:['visitor','new_in_sg','resident'],transit:'Bugis MRT',rain:'Mixed',best:'Late afternoon → evening'},
{name:'Clarke Quay',category:'River / nightlife',description:'Singapore River dining and nightlife with easy onward access to Boat Quay.',personas:['visitor','executive','resident'],transit:'Clarke Quay MRT',rain:'Good',best:'Evening'},
{name:'National Gallery Singapore',category:'Museum',description:'Major Southeast Asian art museum in the former City Hall and Supreme Court.',personas:['visitor','executive','resident','new_in_sg'],transit:'City Hall MRT',rain:'Excellent',best:'Midday / rainy weather'},
{name:'ArtScience Museum',category:'Museum',description:'Rotating art, science and digital exhibitions at Marina Bay Sands.',personas:['visitor','executive','resident'],transit:'Bayfront MRT',rain:'Excellent',best:'Midday / rainy weather'},
{name:'Singapore Flyer',category:'Observation',description:'Observation wheel overlooking Marina Bay; visibility matters more than clock time.',personas:['visitor'],transit:'Promenade MRT',rain:'Good',best:'Golden hour / evening'},
{name:'Fort Canning Park',category:'Historic park',description:'Central hill park linking Orchard, museums and the Singapore River area.',personas:['visitor','resident','new_in_sg'],transit:'Fort Canning MRT',rain:'Poor',best:'Morning / late afternoon'},
{name:'Haw Par Villa',category:'Culture',description:'Distinctive mythology park and Ten Courts of Hell beside the Circle Line.',personas:['visitor','resident','new_in_sg'],transit:'Haw Par Villa MRT',rain:'Mixed',best:'Morning / late afternoon'}
];
const FX_CURRENCIES=['SGD','USD','EUR','GBP','AUD','JPY','CNY','MYR','IDR','THB','KRW','INR','BRL'];
const MONEY_AREAS={orchard:{lat:1.3048,lon:103.8318},bugis:{lat:1.3009,lon:103.8558},chinatown:{lat:1.2837,lon:103.8439},marina:{lat:1.2839,lon:103.8607}};
function fmtObserved(value){if(!value)return 'Timestamp unavailable';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString([],{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):String(value)}
function renderEnvironment(){const host=$('#environmentCard');if(!host)return;const w=state.weather||{},c=w.conditions||{},air=w.airQuality||{},risk=w.travelRisk||{};$('#envHeadline').textContent=(w.area||'Singapore')+' conditions';$('#envForecast').textContent=(w.summary||'Weather unavailable')+(w.day24?.temperatureLowC!=null?' · 24h '+w.day24.temperatureLowC+'–'+w.day24.temperatureHighC+'°C':'');$('#envTemp').textContent=c.temperatureC==null?'—':Number(c.temperatureC).toFixed(1)+'°C';$('#envHumidity').textContent=c.humidityPct==null?'—':Math.round(c.humidityPct)+'%';$('#envRain').textContent=c.rainfallMm==null?'—':Number(c.rainfallMm).toFixed(1)+' mm';$('#envWind').textContent=c.windSpeedKnots==null?'—':Math.round(c.windSpeedKnots)+' kt'+(c.windDirectionDeg==null?'':' · '+Math.round(c.windDirectionDeg)+'°');$('#envPsi').textContent=air.psi24h?.overall==null?'—':Math.round(air.psi24h.overall)+' · '+(air.psi24h.category||'');$('#envPm25').textContent=air.pm25OneHour?.value==null?'—':Math.round(air.pm25OneHour.value)+' µg/m³';const badge=$('#envRiskBadge');badge.textContent=(risk.level||'unknown').toUpperCase();badge.className='risk-pill '+(risk.level==='high'?'high':risk.level==='watch'?'watch':'low');$('#envDetails').textContent=(risk.message||air.interpretation||'')+' '+(air.region?'Air region: '+air.region+'. ':'')+'1-hour PM2.5 is a concentration reading, not “1-hour PSI”.';$('#envSource').textContent=w.provider||'NEA / data.gov.sg';$('#envUpdated').textContent='Updated '+fmtObserved(air.psi24h?.updatedAt||w.updatedAt)}
function renderFeaturedPlaces(){const grid=$('#placesGrid');if(!grid)return;const q=($('#placeSearch')?.value||'').trim().toLowerCase();const ordered=FEATURED_PLACES.filter(p=>!q||[p.name,p.category,p.description,p.transit].join(' ').toLowerCase().includes(q)).sort((a,b)=>(a.personas.includes(state.mode)?0:1)-(b.personas.includes(state.mode)?0:1)||FEATURED_PLACES.indexOf(a)-FEATURED_PLACES.indexOf(b));$('#placesPersonaHint').textContent='Prioritized for '+(personaConfig()?.label||'your mode')+' · '+ordered.length+' useful destinations';$('#placesBackHotel').disabled=!state.places.hotel;grid.innerHTML=ordered.map((p,i)=>'<article class="place-card card"><div class="place-card-top"><div><span class="place-rank">'+String(i+1).padStart(2,'0')+'</span><div class="label">'+esc(p.category.toUpperCase())+'</div><h3>'+esc(p.name)+'</h3></div>'+(p.personas.includes(state.mode)?'<span class="place-fit">Good fit</span>':'')+'</div><p>'+esc(p.description)+'</p><div class="place-intel"><span>◎ '+esc(p.transit)+'</span><span>☂ Rain: '+esc(p.rain)+'</span><span>◷ '+esc(p.best)+'</span></div><button class="primary place-route" data-featured-place="'+esc(p.name)+'" type="button">Take me there</button></article>').join('')||'<div class="card empty">No featured places match that filter.</div>'}
function initFxSelects(){const from=$('#fxFrom'),to=$('#fxTo');if(!from||!to)return;const options=FX_CURRENCIES.map(c=>'<option value="'+c+'">'+c+'</option>').join('');from.innerHTML=options;to.innerHTML=options;from.value='SGD';to.value='USD'}
async function convertFx(){const amount=Number($('#fxAmount').value),from=$('#fxFrom').value,to=$('#fxTo').value;if(!Number.isFinite(amount)||amount<0)return toast('Enter a valid amount.');await withBusy($('#fxConvert'),'Converting…',async()=>{try{const p=await json('/api/money?action=fx&amount='+encodeURIComponent(amount)+'&from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to));const digits=['JPY','IDR','KRW'].includes(to)?0:2;$('#fxResult').innerHTML='<strong>'+esc(from)+' '+amount.toLocaleString(undefined,{maximumFractionDigits:2})+' ≈ '+esc(to)+' '+Number(p.result).toLocaleString(undefined,{minimumFractionDigits:digits,maximumFractionDigits:digits})+'</strong><span>1 '+esc(from)+' = '+Number(p.rate).toLocaleString(undefined,{maximumFractionDigits:6})+' '+esc(to)+'</span>';$('#fxRateMeta').textContent=(p.provider||'Reference source')+' · rate date '+(p.rateDate||fmtObserved(p.observedAt))+' · Reference only, not a cash-shop quote.'}catch(error){$('#fxResult').textContent='Reference conversion unavailable: '+error.message}})}
function renderMoneyChangers(payload){const host=$('#moneyChangerResults');if(!host)return;const rows=payload?.items||[];host.innerHTML=rows.map(row=>'<article class="changer-row"><div><strong>'+esc(row.name)+'</strong><span>'+esc(row.address||'Address unavailable')+(row.postalCode?' Singapore '+esc(row.postalCode):'')+'</span><small>'+esc(row.licenceType||'Money-changing Licensee')+' · '+esc(row.licenceStatus||'MAS listed')+'</small></div><div class="changer-trust">'+(row.distanceM==null?'':'<span>'+(row.distanceM<1000?Math.round(row.distanceM)+' m':(row.distanceM/1000).toFixed(1)+' km')+'</span>')+'<b>MAS</b></div></article>').join('')||'<div class="empty-inline">No MAS-listed location matched that search.</div>';$('#moneySourceNote').textContent=(payload?.source==='supabase'?'SGBuddy catalog synced from MAS':'Live fallback from the MAS/data.gov.sg location dataset')+'. MAS listing data does not provide a live shop buy/sell rate.'}
async function loadMoneyChangers({lat,lon,query=''}={}){const host=$('#moneyChangerResults');if(!host)return;host.innerHTML='<div class="empty-inline">Checking MAS-listed locations…</div>';const params=new URLSearchParams({action:'changers',limit:'12'});if(Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))){params.set('lat',String(lat));params.set('lon',String(lon))}if(query)params.set('query',query);try{renderMoneyChangers(await json('/api/money?'+params.toString()))}catch(error){host.innerHTML='<div class="empty-inline error-state">'+esc(error.message)+'</div>'}}
async function moneyNearMe(){if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon)){const ok=await locate({interactive:true});if(!ok)return}await loadMoneyChangers({lat:state.lat,lon:state.lon})}
function renderAccountHub(){const title=$('#accountHubTitle'),copy=$('#accountHubCopy'),badge=$('#accountHubStatus');if(!title||!copy||!badge)return;const signedIn=Boolean(state.accountUser&&state.accountSession?.accessToken);title.textContent=signedIn?'Signed in as '+(state.accountUser?.email||'SGBuddy user'):'Your SGBuddy';copy.textContent=signedIn?'Cross-device profile sync is active. Local offline data remains available on this device.':'Sign in to carry your mode, saved places and transport favourites across devices.';badge.textContent=signedIn?(state.accountStatus==='syncing'?'Syncing…':'Synced'):'Local';badge.className='sync-badge'+(signedIn?' synced':'')}
async function initTravelLivingWave(){renderEnvironment();renderFeaturedPlaces();renderAccountHub();initFxSelects();await convertFx();await loadMoneyChangers({query:'Orchard'})}
$('#placeSearch')?.addEventListener('input',renderFeaturedPlaces);$('#placesBackHotel')?.addEventListener('click',()=>{if(!state.places.hotel)return toast('Save your hotel first.');$('#tripTo').value=state.places.hotel;navigateTo('travel')});$('#fxConvert')?.addEventListener('click',convertFx);$('#fxAmount')?.addEventListener('keydown',e=>{if(e.key==='Enter')convertFx()});$('#fxSwap')?.addEventListener('click',()=>{const from=$('#fxFrom'),to=$('#fxTo'),v=from.value;from.value=to.value;to.value=v;convertFx()});$('#moneyChangerSearchButton')?.addEventListener('click',()=>loadMoneyChangers({query:$('#moneyChangerSearch').value.trim()}));$('#moneyChangerSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')loadMoneyChangers({query:e.target.value.trim()})});$('#moneyChangerNearMe')?.addEventListener('click',moneyNearMe);$('#accountHubOpen')?.addEventListener('click',openAccountSheet);
document.addEventListener('click',e=>{const route=e.target.closest('.place-route');if(route){$('#tripTo').value=route.dataset.featuredPlace;navigateTo('travel');return}const areaButton=e.target.closest('[data-money-area]');if(areaButton){const a=MONEY_AREAS[areaButton.dataset.moneyArea];if(a)loadMoneyChangers({lat:a.lat,lon:a.lon})}});


/* === v0.9.1-dev correction wave: weather units, richer places, map actions, money maps === */
const V091_VERSION='0.9.1-dev';
window.__SGBUDDY_CLIENT_VERSION__=V091_VERSION;
if($('#appVersion'))$('#appVersion').textContent='v'+V091_VERSION;

const _v091StoredPlaces=safeParse(localStorage.getItem('sgc-places')||'{}',{});
state.units=localStorage.getItem('sgc-units')==='imperial'?'imperial':'metric';
state.places.saved=Array.isArray(_v091StoredPlaces.saved)?_v091StoredPlaces.saved.filter(x=>x&&x.address).slice(0,20):[];

const _v091PlaceCoords={
'Marina Bay Sands':[1.283399,103.860722],'Gardens by the Bay':[1.281568,103.863613],'Jewel Changi Airport':[1.360208,103.989759],'Merlion Park':[1.286788,103.854519],'Sentosa':[1.249404,103.830321],'Universal Studios Singapore':[1.254042,103.823809],'Singapore Zoo':[1.404344,103.793023],'Night Safari':[1.402347,103.788953],'Bird Paradise':[1.41197,103.78565],'Singapore Botanic Gardens':[1.313839,103.81534],'Orchard Road':[1.304041,103.831944],'Chinatown':[1.283598,103.843868],'Little India':[1.306629,103.852568],'Kampong Glam / Haji Lane':[1.302475,103.859561],'Clarke Quay':[1.290602,103.84655],'National Gallery Singapore':[1.29027,103.851956],'ArtScience Museum':[1.286266,103.859257],'Singapore Flyer':[1.289297,103.863137],'Fort Canning Park':[1.295506,103.846453],'Haw Par Villa':[1.283726,103.767245]};
for(const p of FEATURED_PLACES){const c=_v091PlaceCoords[p.name];if(c){p.lat=c[0];p.lon=c[1]}}

function v091CtoF(c){return Number(c)*9/5+32}
function v091Temp(c){if(c==null||!Number.isFinite(Number(c)))return '—';return state.units==='imperial'?v091CtoF(c).toFixed(0)+'°F':Number(c).toFixed(1)+'°C'}
function v091Rain(mm,w){if(mm!=null&&Number.isFinite(Number(mm)))return state.units==='imperial'?(Number(mm)/25.4).toFixed(2)+' in':Number(mm).toFixed(1)+' mm';return w?.rain?'Rain nearby':'No rain detected'}
function v091Wind(knots){if(knots==null||!Number.isFinite(Number(knots)))return '—';return state.units==='imperial'?Math.round(Number(knots)*1.15078)+' mph':Math.round(Number(knots)*1.852)+' km/h'}
function v091DistanceMeters(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180;const p1=toRad(Number(lat1)),p2=toRad(Number(lat2)),dp=toRad(Number(lat2)-Number(lat1)),dl=toRad(Number(lon2)-Number(lon1));const a=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(a))}
function v091DistanceLabel(m){if(!Number.isFinite(Number(m)))return '';if(state.units==='imperial'){const mi=Number(m)/1609.344;return mi<0.2?Math.round(Number(m)*3.28084)+' ft':mi.toFixed(1)+' mi'}return Number(m)<1000?Math.round(Number(m))+' m':(Number(m)/1000).toFixed(1)+' km'}
function v091EstimatedMinutes(m){if(!Number.isFinite(Number(m)))return null;const km=Number(m)/1000;return Math.max(7,Math.round(7+km*3.0))}
function v091WeatherLabel(w){const humidity=w?.conditions?.humidityPct;const rain=w?.conditions?.rainfallMm;const extras=[];if(humidity!=null)extras.push(Math.round(humidity)+'% humidity');if(rain!=null)extras.push(v091Rain(rain,w)+' rain');else extras.push(w?.rain?'rain nearby':'dry now');return [w?.summary||'Weather',...extras].join(' · ')}

renderEnvironment=function(){const host=$('#environmentCard');if(!host)return;const w=state.weather||{},c=w.conditions||{},air=w.airQuality||{},risk=w.travelRisk||{};$('#envHeadline').textContent=(w.area||'Singapore')+' conditions';const low=w.day24?.temperatureLowC,high=w.day24?.temperatureHighC;$('#envForecast').textContent=(w.summary||'Weather unavailable')+(low!=null&&high!=null?' · 24h '+v091Temp(low)+'–'+v091Temp(high):'');$('#envTemp').textContent=v091Temp(c.temperatureC);$('#envHumidity').textContent=c.humidityPct==null?'Unavailable':Math.round(c.humidityPct)+'%';$('#envRain').textContent=v091Rain(c.rainfallMm,w);$('#envWind').textContent=v091Wind(c.windSpeedKnots)+(c.windDirectionDeg==null?'':' · '+Math.round(c.windDirectionDeg)+'°');$('#envPsi').textContent=air.psi24h?.overall==null?'—':Math.round(air.psi24h.overall)+' · '+(air.psi24h.category||'');$('#envPm25').textContent=air.pm25OneHour?.value==null?'Unavailable':Math.round(air.pm25OneHour.value)+' µg/m³';const badge=$('#envRiskBadge');badge.textContent=(risk.level||'unknown').toUpperCase();badge.className='risk-pill '+(risk.level==='high'?'high':risk.level==='watch'?'watch':'low');const missing=w.dataQuality?.unavailableSignals||[];$('#envDetails').textContent=(risk.message||air.interpretation||'')+(missing.length?' Some live sensors are temporarily unavailable: '+missing.join(', ')+'.':'')+' 1-hour PM2.5 is a concentration reading, not “1-hour PSI”.';$('#envSource').textContent=w.provider||'NEA / data.gov.sg';$('#envUpdated').textContent='Updated '+fmtObserved(air.psi24h?.updatedAt||w.updatedAt);const toggle=$('#unitsToggle');if(toggle)toggle.textContent=state.units==='imperial'?'Imperial · °F':'Metric · °C'}
updateHero=function(){const w=state.weather;$('#weatherMetric').textContent=w?v091Temp(w.conditions?.temperatureC):'—';$('#weatherLabel').textContent=w?v091WeatherLabel(w):'Weather loading';$('#railMetric').textContent=state.train?(state.train.status===2?'⚠':'✓'):'—';$('#trafficMetric').textContent=state.traffic?.count??'—';renderTripIntelligence();renderAlerts();sourceLabel();renderEnvironment()}
$('#unitsToggle')?.addEventListener('click',()=>{state.units=state.units==='metric'?'imperial':'metric';localStorage.setItem('sgc-units',state.units);updateHero();renderFeaturedPlaces();if(!$('#placesMapCard')?.classList.contains('hidden'))v091RenderPlacesMap();toast(state.units==='metric'?'Using metric units':'Using imperial units')});

function v091EnsureSavedPlaces(){if(!Array.isArray(state.places.saved))state.places.saved=[];for(const type of ['home','work','hotel']){if(state.places[type]&&!state.places.saved.some(p=>p.type===type))state.places.saved.push({id:type+'-legacy',type,label:type[0].toUpperCase()+type.slice(1),street:state.places[type],unit:'',postal:'',address:state.places[type]})}state.places.saved=state.places.saved.slice(0,20)}
function v091Address(street,unit,postal){const parts=[String(street||'').trim(),String(unit||'').trim()].filter(Boolean);let out=parts.join(' ');if(postal)out+=(out?', ':'')+'Singapore '+postal;else if(out&&!/singapore/i.test(out))out+=', Singapore';return out}
function v091HydrateQuickFields(){v091EnsureSavedPlaces();for(const type of ['home','work','hotel']){const row=state.places.saved.find(p=>p.type===type);if(row?.street&&$('#'+type+'Input'))$('#'+type+'Input').value=row.street;const postal=$('#'+type+'Postal');if(postal)postal.value=row?.postal||''}}
function v091RenderSavedPlaces(){v091EnsureSavedPlaces();const host=$('#savedPlacesList');if(!host)return;const rows=state.places.saved;host.innerHTML=rows.map(p=>'<article class="saved-address-row"><div><strong>'+esc(p.label||'Saved place')+'</strong><span>'+esc(p.address||'')+'</span></div><div class="saved-address-actions"><button class="secondary saved-place-go" type="button" data-saved-place-go="'+esc(p.id)+'">Take me there</button><button class="text-button saved-place-remove" type="button" data-saved-place-remove="'+esc(p.id)+'">Remove</button></div></article>').join('')||'<div class="empty-inline">No saved places yet.</div>'}
function v091CommitPlaces(message){cachePreferences(true);updateHotelButton();v091RenderSavedPlaces();queueProfileSync();toast(message)}
function v091SaveQuickPlaces(){v091EnsureSavedPlaces();for(const type of ['home','work','hotel']){const street=$('#'+type+'Input')?.value.trim()||'',postal=$('#'+type+'Postal')?.value.trim()||'';if(postal&&!/^\d{6}$/.test(postal)){toast(type[0].toUpperCase()+type.slice(1)+' postal code must be 6 digits.');return}state.places.saved=state.places.saved.filter(p=>p.type!==type);if(street){const label=type[0].toUpperCase()+type.slice(1),address=v091Address(street,'',postal);state.places.saved.push({id:type+'-'+Date.now(),type,label,street,unit:'',postal,address});state.places[type]=address}else state.places[type]=''}v091CommitPlaces('Quick places saved')}
function v091AddCustomPlace(){const label=$('#customPlaceLabel')?.value.trim()||'',street=$('#customPlaceStreet')?.value.trim()||'',unit=$('#customPlaceUnit')?.value.trim()||'',postal=$('#customPlacePostal')?.value.trim()||'';if(!label)return toast('Add a name for this saved place.');if(!street)return toast('Add a street or building.');if(postal&&!/^\d{6}$/.test(postal))return toast('Singapore postal code must be 6 digits.');v091EnsureSavedPlaces();if(state.places.saved.length>=20)return toast('You can save up to 20 places in this preview.');state.places.saved.push({id:'custom-'+Date.now(),type:'custom',label,street,unit,postal,address:v091Address(street,unit,postal)});for(const id of ['customPlaceLabel','customPlaceStreet','customPlaceUnit','customPlacePostal'])if($('#'+id))$('#'+id).value='';v091CommitPlaces('Saved '+label)}
function v091RemoveSavedPlace(id){v091EnsureSavedPlaces();const row=state.places.saved.find(p=>p.id===id);if(!row)return;state.places.saved=state.places.saved.filter(p=>p.id!==id);if(['home','work','hotel'].includes(row.type)){state.places[row.type]='';if($('#'+row.type+'Input'))$('#'+row.type+'Input').value='';if($('#'+row.type+'Postal'))$('#'+row.type+'Postal').value=''}v091CommitPlaces('Saved place removed')}
const _v091BaseApplyPreferenceObject=applyPreferenceObject;
applyPreferenceObject=function(prefs){const saved=Array.isArray(prefs?.places?.saved)?prefs.places.saved.filter(x=>x&&x.address).slice(0,20):[];_v091BaseApplyPreferenceObject(prefs);state.places.saved=saved;v091HydrateQuickFields();v091RenderSavedPlaces();cachePreferences(false)}
const _v091BaseInitPlaces=initPlaces;
initPlaces=function(){_v091BaseInitPlaces();v091HydrateQuickFields();v091RenderSavedPlaces()}
$('#savePlaces')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();v091SaveQuickPlaces()},true);
$('#addCustomPlace')?.addEventListener('click',v091AddCustomPlace);

function v091PlaceMetric(p){if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon)||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lon)))return {label:'Locate for ETA',distance:null,minutes:null};const distance=v091DistanceMeters(state.lat,state.lon,p.lat,p.lon),minutes=v091EstimatedMinutes(distance);return {label:'≈ '+minutes+' min est. · '+v091DistanceLabel(distance),distance,minutes}}
renderFeaturedPlaces=function(){const grid=$('#placesGrid');if(!grid)return;const q=($('#placeSearch')?.value||'').trim().toLowerCase();const ordered=FEATURED_PLACES.filter(p=>!q||[p.name,p.category,p.description,p.transit].join(' ').toLowerCase().includes(q)).sort((a,b)=>(a.personas.includes(state.mode)?0:1)-(b.personas.includes(state.mode)?0:1)||FEATURED_PLACES.indexOf(a)-FEATURED_PLACES.indexOf(b));$('#placesPersonaHint').textContent='Prioritized for '+(personaConfig()?.label||'your mode')+' · '+ordered.length+' useful destinations';$('#placesBackHotel').disabled=!state.places.hotel;grid.innerHTML=ordered.map((p,i)=>{const m=v091PlaceMetric(p);return '<article class="place-card card"><div class="place-card-top"><div><span class="place-rank">'+String(i+1).padStart(2,'0')+'</span><div class="label">'+esc(p.category.toUpperCase())+'</div><h3>'+esc(p.name)+'</h3></div>'+(p.personas.includes(state.mode)?'<span class="place-fit">Good fit</span>':'')+'</div><p>'+esc(p.description)+'</p><div class="place-eta" data-place-eta="'+esc(p.name)+'">'+esc(m.label)+'</div><div class="place-intel"><span>◎ '+esc(p.transit)+'</span><span>☂ Rain: '+esc(p.rain)+'</span><span>◷ '+esc(p.best)+'</span></div><div class="place-card-actions"><button class="secondary place-map-focus" data-featured-place="'+esc(p.name)+'" type="button">Show map</button><button class="primary place-route" data-featured-place="'+esc(p.name)+'" type="button">Take me there</button></div></article>'}).join('')||'<div class="card empty">No featured places match that filter.</div>'}

function v091EnsurePlacesMap(){if(state.v091PlacesMap)return true;const host=$('#placesMap');if(!host)return false;if(!window.L){host.innerHTML='<div class="map-unavailable">Map library could not load.</div>';return false}state.v091PlacesMap=L.map('placesMap',{zoomControl:true,attributionControl:true}).setView([1.3521,103.8198],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.v091PlacesMap);state.v091PlacesLayer=L.layerGroup().addTo(state.v091PlacesMap);state.v091PlaceMarkers=new Map();return true}
function v091RenderPlacesMap(focusName=''){if(!v091EnsurePlacesMap())return;state.v091PlacesLayer.clearLayers();state.v091PlaceMarkers.clear();const coords=[];for(const p of FEATURED_PLACES){if(!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lon)))continue;const m=v091PlaceMetric(p);const marker=L.circleMarker([p.lat,p.lon],{radius:8,color:'#07111f',weight:3,fillColor:'#63e6be',fillOpacity:1}).bindPopup('<div class="map-popup"><strong>'+esc(p.name)+'</strong><small>'+esc(p.category)+' · '+esc(m.label)+'</small><div>'+esc(p.transit)+'</div><button class="place-route" data-featured-place="'+esc(p.name)+'">Take me there</button></div>').addTo(state.v091PlacesLayer);state.v091PlaceMarkers.set(p.name,marker);coords.push([p.lat,p.lon])}if(Number.isFinite(state.lat)&&Number.isFinite(state.lon)){L.circleMarker([state.lat,state.lon],{radius:7,color:'#fff',weight:3,fillColor:'#ff7b8a',fillOpacity:1}).bindPopup('<strong>You are here</strong>').addTo(state.v091PlacesLayer);coords.unshift([state.lat,state.lon])}setTimeout(()=>{state.v091PlacesMap.invalidateSize();const marker=state.v091PlaceMarkers.get(focusName);if(marker){state.v091PlacesMap.setView(marker.getLatLng(),14);marker.openPopup()}else if(coords.length>1)state.v091PlacesMap.fitBounds(coords,{padding:[28,28],maxZoom:14});else state.v091PlacesMap.setView([1.3521,103.8198],11)},40)}
function v091SetPlacesView(view,focusName=''){const map=view==='map';$('#placesGrid')?.classList.toggle('hidden',map);$('#placesMapCard')?.classList.toggle('hidden',!map);$('#placesCardsButton')?.classList.toggle('active',!map);$('#placesMapButton')?.classList.toggle('active',map);if(map)v091RenderPlacesMap(focusName)}
$('#placesCardsButton')?.addEventListener('click',()=>v091SetPlacesView('cards'));
$('#placesMapButton')?.addEventListener('click',()=>v091SetPlacesView('map'));
$('#fitPlacesMap')?.addEventListener('click',()=>v091RenderPlacesMap());
const _v091BaseLoadNearby=loadNearby;
loadNearby=async function(lat,lon){const result=await _v091BaseLoadNearby(lat,lon);renderFeaturedPlaces();if(!$('#placesMapCard')?.classList.contains('hidden'))v091RenderPlacesMap();return result}

function v091MoneyCoords(row){return {lat:Number(row?.lat??row?.latitude),lon:Number(row?.lon??row?.longitude)}}
function v091EnsureMoneyMap(){if(state.v091MoneyMap)return true;const host=$('#moneyChangerMap');if(!host)return false;if(!window.L){host.innerHTML='<div class="map-unavailable">Map library could not load.</div>';return false}state.v091MoneyMap=L.map('moneyChangerMap',{zoomControl:true,attributionControl:true}).setView([1.3007,103.8558],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.v091MoneyMap);state.v091MoneyLayer=L.layerGroup().addTo(state.v091MoneyMap);return true}
function v091RenderMoneyMap(focusIndex=null){if(!v091EnsureMoneyMap())return;state.v091MoneyLayer.clearLayers();const coords=[],markers=[];for(const [i,row] of (state.v091MoneyRows||[]).entries()){const p=v091MoneyCoords(row);if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon))continue;const destination=[row.address,row.postalCode?'Singapore '+row.postalCode:''].filter(Boolean).join(', ');const marker=L.circleMarker([p.lat,p.lon],{radius:8,color:'#07111f',weight:3,fillColor:'#ffd166',fillOpacity:1}).bindPopup('<div class="map-popup"><strong>'+esc(row.name)+'</strong><small>Licensed money changer</small><div>'+esc(destination)+'</div><button class="money-go" data-money-index="'+i+'">Take me there</button></div>').addTo(state.v091MoneyLayer);markers[i]=marker;coords.push([p.lat,p.lon])}if(Number.isFinite(state.lat)&&Number.isFinite(state.lon)){L.circleMarker([state.lat,state.lon],{radius:7,color:'#fff',weight:3,fillColor:'#ff7b8a',fillOpacity:1}).bindPopup('<strong>You are here</strong>').addTo(state.v091MoneyLayer);coords.unshift([state.lat,state.lon])}setTimeout(()=>{state.v091MoneyMap.invalidateSize();if(focusIndex!=null&&markers[focusIndex]){state.v091MoneyMap.setView(markers[focusIndex].getLatLng(),15);markers[focusIndex].openPopup()}else if(coords.length>1)state.v091MoneyMap.fitBounds(coords,{padding:[28,28],maxZoom:15})},40)}
function v091SetMoneyView(view){const map=view==='map';$('#moneyChangerResults')?.classList.toggle('hidden',map);$('#moneyChangerMapWrap')?.classList.toggle('hidden',!map);$('#moneyCardsButton')?.classList.toggle('active',!map);$('#moneyMapButton')?.classList.toggle('active',map);if(map)v091RenderMoneyMap()}
renderMoneyChangers=function(payload){const host=$('#moneyChangerResults');if(!host)return;const rows=payload?.items||[];state.v091MoneyRows=rows;host.innerHTML=rows.map((row,i)=>{const destination=[row.address,row.postalCode?'Singapore '+row.postalCode:''].filter(Boolean).join(', ');return '<article class="changer-row"><div><strong>'+esc(row.name)+'</strong><span>'+esc(destination||'Address unavailable')+'</span><small>Licensed money changer · verified against Singapore regulator directory</small><div class="changer-actions"><button class="secondary money-map-focus" type="button" data-money-index="'+i+'">Show map</button><button class="primary money-go" type="button" data-money-index="'+i+'">Take me there</button></div></div><div class="changer-trust">'+(row.distanceM==null?'':'<span>'+v091DistanceLabel(row.distanceM)+'</span>')+'<b>Licensed</b></div></article>'}).join('')||'<div class="empty-inline">No licensed location matched that search.</div>';$('#moneySourceNote').textContent=(payload?.source==='supabase'?'SGBuddy catalog synced from the official Singapore directory':'Live fallback from the Monetary Authority of Singapore / data.gov.sg location dataset')+'. MAS means Monetary Authority of Singapore, the country’s financial regulator. The directory does not provide live counter rates.';if(!$('#moneyChangerMapWrap')?.classList.contains('hidden'))v091RenderMoneyMap()}
$('#moneyCardsButton')?.addEventListener('click',()=>v091SetMoneyView('cards'));
$('#moneyMapButton')?.addEventListener('click',()=>v091SetMoneyView('map'));

document.addEventListener('click',e=>{
  const savedGo=e.target.closest('.saved-place-go');if(savedGo){const p=state.places.saved?.find(x=>x.id===savedGo.dataset.savedPlaceGo);if(p)openTransit(p.address,Number.isFinite(state.lat)&&Number.isFinite(state.lon)?state.lat+','+state.lon:'');return}
  const savedRemove=e.target.closest('.saved-place-remove');if(savedRemove){v091RemoveSavedPlace(savedRemove.dataset.savedPlaceRemove);return}
  const mapFocus=e.target.closest('.place-map-focus');if(mapFocus){v091SetPlacesView('map',mapFocus.dataset.featuredPlace);return}
  const route=e.target.closest('.place-route');if(route){setTimeout(()=>planNativeJourney(),420);return}
  const moneyMap=e.target.closest('.money-map-focus');if(moneyMap){v091SetMoneyView('map');v091RenderMoneyMap(Number(moneyMap.dataset.moneyIndex));return}
  const moneyGo=e.target.closest('.money-go');if(moneyGo){const row=state.v091MoneyRows?.[Number(moneyGo.dataset.moneyIndex)];if(row){const destination=[row.address,row.postalCode?'Singapore '+row.postalCode:''].filter(Boolean).join(', ');openTransit(destination||row.name,Number.isFinite(state.lat)&&Number.isFinite(state.lon)?state.lat+','+state.lon:'')}return}
});

v091EnsureSavedPlaces();v091HydrateQuickFields();v091RenderSavedPlaces();renderFeaturedPlaces();renderEnvironment();

/* === v0.9.2-dev Trust & Accuracy === */
window.__SGBUDDY_CLIENT_VERSION__='0.9.2-dev';
if($('#appVersion'))$('#appVersion').textContent='v0.9.2-dev';
const _v092RenderEnvironment=renderEnvironment;
renderEnvironment=function(){
  _v092RenderEnvironment();
  const q=state.weather?.dataQuality||{};
  const stale=q.staleSignals||[];
  if(stale.length&&$('#envDetails')){
    const ages=q.signalAgesMinutes||{};
    const detail=stale.map(k=>k+(Number.isFinite(Number(ages[k]))?' ('+ages[k]+'m old)':'')).join(', ');
    $('#envDetails').textContent+=' Last-known-good data in use: '+detail+'.';
  }
  if(state.weather?.airQuality?.pm25OneHour?.category&&$('#envPm25')){
    $('#envPm25').textContent=Math.round(state.weather.airQuality.pm25OneHour.value)+' µg/m³ · '+state.weather.airQuality.pm25OneHour.category;
  }
};
const _v092UpdateHero=updateHero;
updateHero=function(){_v092UpdateHero();renderEnvironment()};
runDataCoreDiagnostics=async function({quiet=false}={}){
  const status=$('#dataCoreStatus'),result=$('#dataCoreResult');
  if(status){status.textContent='Checking…';status.classList.remove('synced','error')}
  try{
    const [health,snapshot]=await Promise.all([json('/api/health'),json('/api/snapshot')]);
    const q=snapshot.weather?.dataQuality||{};
    const weatherState=q.status==='complete'?'Live':q.status==='partial'?'Degraded':'Unavailable';
    if($('#dataCoreLta'))$('#dataCoreLta').textContent=health.ltaConfigured?'Live':'Not configured';
    if($('#dataCoreRail'))$('#dataCoreRail').textContent=state.rail?.realtimeAvailable===true?'Realtime':health.features?.railRealtime?'Scheduled + GTFS':'Unavailable';
    if($('#dataCoreWeather'))$('#dataCoreWeather').textContent=weatherState;
    if($('#dataCoreProfile'))$('#dataCoreProfile').textContent=health.database?.connected?'Connected':health.database?.configured?'Configured':'Local';
    const degraded=weatherState!=='Live'||health.database?.configured&&!health.database?.connected;
    if(status){status.textContent=degraded?'Degraded':'Healthy';status.classList.toggle('synced',!degraded);status.classList.toggle('error',degraded)}
    if(result)result.textContent=(degraded?'Core services are responding with partial data':'All core services responded')+' · v'+health.version+' · checked '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    if(!quiet)toast(degraded?'Data Core is responding with partial data':'Data Core is healthy');
    return !degraded;
  }catch(e){
    if(status){status.textContent='Unavailable';status.classList.add('error')}
    if(result)result.textContent='A core service did not respond: '+e.message;
    if(!quiet)toast('Data Core check found an issue');
    return false;
  }
};

/* === v0.9.3-dev Navigation & Location === */
window.__SGBUDDY_CLIENT_VERSION__='0.9.3-dev';if($('#appVersion'))$('#appVersion').textContent='v0.9.3-dev';
state.v093Etas={};state.v093AddressSelections={};state.v093EtaLoading=false;

const _v093BasePlaceMetric=v091PlaceMetric;
v091PlaceMetric=function(p){
  const eta=state.v093Etas?.[p.name];
  if(eta?.minutes)return {label:eta.minutes+' min route · '+(eta.mode==='mixed'?'Bus + rail':eta.mode==='bus'?'Bus':'Rail'),distance:null,minutes:eta.minutes,routeDerived:true};
  return _v093BasePlaceMetric(p);
};

async function v093LoadPlaceEtas(){
  if(state.v093EtaLoading||!Number.isFinite(state.lat)||!Number.isFinite(state.lon))return;
  state.v093EtaLoading=true;
  try{
    const names=FEATURED_PLACES.map(p=>p.name);
    for(let i=0;i<names.length;i+=5){
      const batch=names.slice(i,i+5);
      const p=await json('/api/place-etas?lat='+encodeURIComponent(state.lat)+'&lon='+encodeURIComponent(state.lon)+'&names='+encodeURIComponent(batch.join('|')));
      for(const row of p.items||[])if(row.ok)state.v093Etas[row.name]=row;
      renderFeaturedPlaces();
      if(!$('#placesMapCard')?.classList.contains('hidden'))v091RenderPlacesMap();
    }
  }catch(error){console.warn('Place ETA refresh:',error.message)}
  finally{state.v093EtaLoading=false}
}

const _v093LoadNearby=loadNearby;
loadNearby=async function(lat,lon){const result=await _v093LoadNearby(lat,lon);v093LoadPlaceEtas();return result};

function v093SuggestionBox(input){
  let box=input.parentElement?.querySelector('.v093-address-suggestions');
  if(!box){box=document.createElement('div');box.className='v093-address-suggestions hidden';input.insertAdjacentElement('afterend',box)}
  return box;
}
let v093AddressTimer;
async function v093SearchAddress(input){
  const q=input.value.trim(),box=v093SuggestionBox(input);
  clearTimeout(v093AddressTimer);
  if(q.length<3){box.classList.add('hidden');return}
  v093AddressTimer=setTimeout(async()=>{
    try{
      const p=await json('/api/geocode?q='+encodeURIComponent(q));
      const items=p.items||[];
      box.innerHTML=items.map((x,i)=>'<button type="button" data-address-pick="'+esc(input.id)+'" data-address-index="'+i+'"><strong>'+esc(x.label||x.address)+'</strong><span>'+esc(x.address||'')+(x.postal?' · '+esc(x.postal):'')+'</span><small>'+(x.verified?'Verified by OneMap':'SGBuddy match')+'</small></button>').join('');
      box._items=items;box.classList.toggle('hidden',!items.length);
      input.dataset.geocodeConfigured=p.configured?'1':'0';
    }catch{box.classList.add('hidden')}
  },260);
}
for(const id of ['homeInput','workInput','hotelInput','customPlaceStreet']){
  const input=$('#'+id);if(input){input.setAttribute('autocomplete','off');input.addEventListener('input',()=>v093SearchAddress(input))}
}
document.addEventListener('click',e=>{
  const pick=e.target.closest('[data-address-pick]');if(!pick)return;
  const input=$('#'+pick.dataset.addressPick),box=pick.closest('.v093-address-suggestions'),row=box?._items?.[Number(pick.dataset.addressIndex)];
  if(!input||!row)return;
  input.value=row.address||row.label||input.value;
  state.v093AddressSelections[input.id]=row;
  const type=input.id.replace('Input','');
  const postalId=type==='customPlaceStreet'?'customPlacePostal':type+'Postal';
  if(row.postal&&$('#'+postalId))$('#'+postalId).value=row.postal;
  box.classList.add('hidden');
});

const _v093SaveQuickPlaces=v091SaveQuickPlaces;
v091SaveQuickPlaces=function(){
  _v093SaveQuickPlaces();
  for(const type of ['home','work','hotel']){
    const inputId=type+'Input',sel=state.v093AddressSelections[inputId];
    if(!sel)continue;
    const row=state.places.saved.find(p=>p.type===type);
    if(row&&row.address===$('#'+inputId)?.value.trim()){row.lat=sel.lat;row.lon=sel.lon;row.verified=Boolean(sel.verified);row.source=sel.source||null}
  }
  cachePreferences(true);queueProfileSync();v091RenderSavedPlaces();
};
const _v093AddCustomPlace=v091AddCustomPlace;
$('#addCustomPlace')?.addEventListener('click',e=>{
  const sel=state.v093AddressSelections.customPlaceStreet;if(!sel)return;
  setTimeout(()=>{
    const last=state.places.saved?.[state.places.saved.length-1];
    if(last?.type==='custom'){last.lat=sel.lat;last.lon=sel.lon;last.verified=Boolean(sel.verified);last.source=sel.source||null;cachePreferences(true);queueProfileSync();v091RenderSavedPlaces()}
  },0);
},true);

function v093InitViewRouter(){
  const main=document.querySelector('main');if(!main||main.dataset.v093Routed)return;
  main.dataset.v093Routed='1';
  const order=['today','move','places','money','account'],views={};
  for(const name of order){const el=document.createElement('div');el.className='v1-view hidden';el.dataset.view=name;views[name]=el;main.appendChild(el)}
  const add=(view,el)=>{if(el&&views[view]&&!views[view].contains(el))views[view].appendChild(el)};
  ['#todaySection','#nextUpCard','#tripIntelligence','#environmentCard','#personaFocus','#travellerPanel'].forEach(s=>add('today',$(s)));
  ['#transportSection','.saved-rail','#railStations','#railStations + .manual','.transport-heading','#cardsView','#mapView','#travelSection'].forEach(s=>add('move',$(s)));
  ['.saved.card','#placesSection','.places-toolbar','#placesGrid','#placesMapCard'].forEach(s=>add('places',$(s)));
  add('money',$('#moneySection'));$$('.money-card').forEach(el=>add('money',el));
  add('account',$('#accountSection'));add('account',$('.profile-card'));
  const alerts=$('#alerts');if(alerts){add('account',alerts.previousElementSibling);add('account',alerts)}add('account',$('#dataCorePanel'));
  const freya=$('#freyaSection');if(freya){freya.classList.add('v1-freya-panel');document.body.appendChild(freya);const close=document.createElement('button');close.className='v1-freya-close';close.type='button';close.textContent='×';close.addEventListener('click',()=>freya.classList.remove('v1-freya-open'));freya.prepend(close)}
  const fab=document.createElement('button');fab.className='v1-freya-fab';fab.type='button';fab.setAttribute('aria-label','Open FREYA');fab.textContent='F';fab.addEventListener('click',()=>{freya?.classList.add('v1-freya-open');setTimeout(()=>$('#advisorInput')?.focus(),120)});document.body.appendChild(fab);
  function show(name,{legacyTarget}={}){
    name=canonicalNav(name);if(!views[name])name='today';
    Object.entries(views).forEach(([k,v])=>v.classList.toggle('hidden',k!==name));
    setActiveNav(name);window.scrollTo({top:0,behavior:'instant'});
    if(name==='places')v093LoadPlaceEtas();
    if(name==='move'&&legacyTarget==='travel')setTimeout(()=>$('#travelSection')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
  }
  window.SGBUDDY_VIEW_ROUTER={show,openFreya:()=>freya?.classList.add('v1-freya-open')};
  document.querySelector('.bottom-nav')?.addEventListener('click',e=>{const a=e.target.closest('[data-nav-target]');if(!a)return;e.preventDefault();e.stopImmediatePropagation();show(a.dataset.navTarget)},true);
  show('today');
}
v093InitViewRouter();

/* === v0.9.4-dev Personal Intelligence === */
window.__SGBUDDY_CLIENT_VERSION__='0.9.4-dev';if($('#appVersion'))$('#appVersion').textContent='v0.9.4-dev';

state.homeCurrency=localStorage.getItem('sgc-home-currency')||'SGD';
state.preferredLanguage=localStorage.getItem('sgc-language')||((navigator.language||'en').split('-')[0]||'en');
state.walkingTolerance=state.walkingTolerance||localStorage.getItem('sgc-walking-tolerance')||'normal';

const _v094PersistentPreferences=persistentPreferences;
persistentPreferences=function(){
  return {..._v094PersistentPreferences(),units:state.units||'metric',homeCurrency:state.homeCurrency||'SGD',preferredLanguage:state.preferredLanguage||'en',walkingTolerance:state.walkingTolerance||'normal'};
};
const _v094ApplyPreferenceObject=applyPreferenceObject;
applyPreferenceObject=function(prefs){
  _v094ApplyPreferenceObject(prefs);
  if(prefs?.units){state.units=prefs.units==='imperial'?'imperial':'metric';localStorage.setItem('sgc-units',state.units)}
  if(prefs?.homeCurrency){state.homeCurrency=String(prefs.homeCurrency).toUpperCase().slice(0,3);localStorage.setItem('sgc-home-currency',state.homeCurrency)}
  if(prefs?.preferredLanguage){state.preferredLanguage=String(prefs.preferredLanguage).slice(0,12);localStorage.setItem('sgc-language',state.preferredLanguage)}
  if(prefs?.walkingTolerance){state.walkingTolerance=['low','normal','high'].includes(prefs.walkingTolerance)?prefs.walkingTolerance:'normal';localStorage.setItem('sgc-walking-tolerance',state.walkingTolerance)}
  v094SyncSettingsUi();renderPersonaContext();renderEnvironment();
};
const _v094AccountRowPayload=accountRowPayload;
accountRowPayload=function(){
  const row=_v094AccountRowPayload();
  row.home_currency=state.homeCurrency||'SGD';
  row.preferred_language=state.preferredLanguage||'en';
  row.walking_tolerance=state.walkingTolerance||'normal';
  row.preferences=accountPreferences();
  return row;
};

function v094SettingsCard(){
  const section=document.createElement('section');
  section.id='settingsCard';section.className='settings-card card';
  section.innerHTML=`
    <div class="settings-head"><div><div class="label">PREFERENCES</div><h3>Make SGBuddy yours</h3></div><span class="sync-badge" id="settingsSyncBadge">This device</span></div>
    <p class="settings-copy">These choices shape what SGBuddy prioritizes. Sign in to carry them across devices.</p>
    <div class="settings-grid">
      <label>Using Singapore as
        <select id="settingPersona">
          <option value="resident">Resident</option><option value="visitor">Visitor</option><option value="executive">Executive</option><option value="new_in_sg">New in SG</option>
        </select>
      </label>
      <label>Units
        <select id="settingUnits"><option value="metric">Metric · °C / km</option><option value="imperial">Imperial · °F / mi</option></select>
      </label>
      <label>Home currency
        <select id="settingCurrency">${FX_CURRENCIES.map(c=>'<option value="'+c+'">'+c+'</option>').join('')}</select>
      </label>
      <label>Language preference
        <select id="settingLanguage"><option value="en">English</option><option value="zh">简体中文</option><option value="ms">Bahasa Melayu</option><option value="ta">தமிழ்</option><option value="pt">Português</option></select>
      </label>
      <label>Walking preference
        <select id="settingWalking"><option value="low">Keep walking low</option><option value="normal">Balanced</option><option value="high">Walking is fine</option></select>
      </label>
    </div>
    <p class="settings-note">Language is a preference signal for now; full interface translation is not claimed in v1.0.</p>
  `;
  return section;
}
function v094SyncSettingsUi(){
  if($('#settingPersona'))$('#settingPersona').value=state.mode;
  if($('#settingUnits'))$('#settingUnits').value=state.units||'metric';
  if($('#settingCurrency'))$('#settingCurrency').value=state.homeCurrency||'SGD';
  if($('#settingLanguage'))$('#settingLanguage').value=state.preferredLanguage||'en';
  if($('#settingWalking'))$('#settingWalking').value=state.walkingTolerance||'normal';
  if($('#settingsSyncBadge')){$('#settingsSyncBadge').textContent=state.accountUser?'Account sync':'This device';$('#settingsSyncBadge').classList.toggle('synced',Boolean(state.accountUser))}
}
function v094PersistSettings(){
  localStorage.setItem('sgc-units',state.units||'metric');localStorage.setItem('sgc-home-currency',state.homeCurrency||'SGD');localStorage.setItem('sgc-language',state.preferredLanguage||'en');localStorage.setItem('sgc-walking-tolerance',state.walkingTolerance||'normal');
  cachePreferences(true);queueProfileSync();renderPersonaContext();renderEnvironment();renderFeaturedPlaces();v094RenderTodayBrief();v094SyncSettingsUi();
}

function v094InstallSettings(){
  if($('#settingsCard'))return;
  const card=v094SettingsCard(),account=$('#accountSection');
  if(account?.parentElement)account.insertAdjacentElement('afterend',card);
  const title=account?.querySelector('h3');if(title&&title.id==='accountHubTitle'&&!state.accountUser)title.textContent='Account & settings';
  $('#settingPersona')?.addEventListener('change',e=>{setMode(e.target.value,false);v094PersistSettings()});
  $('#settingUnits')?.addEventListener('change',e=>{state.units=e.target.value==='imperial'?'imperial':'metric';v094PersistSettings()});
  $('#settingCurrency')?.addEventListener('change',e=>{state.homeCurrency=e.target.value;v094PersistSettings();if($('#fxFrom')){$('#fxFrom').value=state.homeCurrency;convertFx()}});
  $('#settingLanguage')?.addEventListener('change',e=>{state.preferredLanguage=e.target.value;v094PersistSettings()});
  $('#settingWalking')?.addEventListener('change',e=>{state.walkingTolerance=e.target.value;v094PersistSettings()});
  v094SyncSettingsUi();
}
v094InstallSettings();

function v094BriefData(){
  const risk=state.weather?.travelRisk?.level||'unknown';
  const rain=Boolean(state.weather?.rain);
  const next=state.nextUp||null;
  if(state.mode==='visitor'){
    const rainPlace=FEATURED_PLACES.find(p=>rain&&String(p.rain).toLowerCase()==='excellent')||FEATURED_PLACES[0];
    return {icon:'🎒',eyebrow:'VISITOR NOW',title:rain?'Keep today rain-friendly':'Make the most of where you are',copy:rain?'Rain is affecting the context. Indoor or well-covered places move up your list.':'Use your location for exact route times, then keep your hotel one tap away.',actions:[['Explore '+rainPlace.name,'place:'+rainPlace.name],['Back to hotel','saved:hotel'],['Plan a trip','move']]};
  }
  if(state.mode==='executive'){
    return {icon:'💼',eyebrow:'SCHEDULE NOW',title:risk==='high'?'Protect your next arrival':'Protect your schedule',copy:risk==='high'?'Current conditions justify extra buffer time. Use Arrive by before the next meeting.':'Use Arrive by to work backwards from the time you must be there.',actions:[['Plan arrival time','arrive'],['Saved places','places'],['Conditions','today']]};
  }
  if(state.mode==='new_in_sg'){
    return {icon:'🌏',eyebrow:'SETTLE IN',title:'Make the routine familiar',copy:'Home, work, saved places and nearby transport are your shortcuts while you learn Singapore.',actions:[['Route home','saved:home'],['Route to work','saved:work'],['Explore nearby','places']]};
  }
  return {icon:'🇸🇬',eyebrow:'YOUR DAY',title:risk==='high'?'Conditions need attention':'Your Singapore at a glance',copy:'Prioritize saved routes, live departures and disruptions instead of searching from scratch every time.',actions:[['Plan to work','saved:work'],['Plan home','saved:home'],['Nearby transport','move']]};
}
function v094RenderTodayBrief(){
  let card=$('#v094TodayBrief');
  if(!card){
    card=document.createElement('section');card.id='v094TodayBrief';card.className='today-brief card';
    const focus=$('#personaFocus');if(focus)focus.insertAdjacentElement('beforebegin',card);
  }
  const d=v094BriefData();
  card.innerHTML='<div class="today-brief-head"><span class="today-brief-icon">'+d.icon+'</span><div><div class="label">'+esc(d.eyebrow)+'</div><h3>'+esc(d.title)+'</h3></div></div><p>'+esc(d.copy)+'</p><div class="today-brief-actions">'+d.actions.map(([label,a])=>'<button type="button" data-v094-action="'+esc(a)+'">'+esc(label)+'</button>').join('')+'</div>';
}
const _v094RenderPersonaContext=renderPersonaContext;
renderPersonaContext=function(){_v094RenderPersonaContext();v094RenderTodayBrief();v094SyncSettingsUi()};
const _v094UpdateHero=updateHero;
updateHero=function(){_v094UpdateHero();v094RenderTodayBrief()};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-v094-action]');if(!b)return;
  const action=b.dataset.v094Action;
  if(action==='move'||action==='places'||action==='today'){navigateTo(action);return}
  if(action==='arrive'){navigateTo('travel');setTimeout(()=>$('#timingArriveButton')?.click(),160);return}
  if(action.startsWith('saved:')){const key=action.slice(6),value=state.places[key];if(!value)return toast('Save your '+key+' first.');$('#tripTo').value=value;navigateTo('travel');setTimeout(planNativeJourney,260);return}
  if(action.startsWith('place:')){$('#tripTo').value=action.slice(6);navigateTo('travel');setTimeout(planNativeJourney,260)}
});

const _v094InitFxSelects=initFxSelects;
initFxSelects=function(){_v094InitFxSelects();if($('#fxFrom')&&FX_CURRENCIES.includes(state.homeCurrency))$('#fxFrom').value=state.homeCurrency;};
v094RenderTodayBrief();v094SyncSettingsUi();
