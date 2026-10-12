/* SGBuddy UX 4–6: persona-led experiences, contextual Merli and accessible feedback.
   Progressive enhancement only. No extra data providers or generative AI. */
(()=>{
'use strict';
const core=window.SGBUDDY_CORE;
if(!core||!window.SGBUDDY_VIEW_ROUTER)return;
const state=core.state;
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MODES={
 resident:{
  label:'Resident',title:'Your everyday Singapore',description:'Quick answers for everyday places, routes and neighbourhood essentials.',
  prompt:'Find hawker food, healthcare, parks or the best route home.',
  shortcuts:[['⌖','Near me','Clinics, shops and essentials','nearby'],['♨','Find food','Neighbourhood hawkers','eat'],['↗','Get moving','Buses, MRT and routes','move'],['▦','Everyday apps','Singpass, Grab, banking and delivery','apps']],
  discover:'Discover local favourites and everyday services, with nearby essentials one tap away.',
  search:'Search hawker centres, parks or neighbourhoods',journey:'Your nearby departures and regular routes are ready when you are.',
  merli:['eat','transit','fact'],merliIntro:'Ask me about hawker food, transport and Singapore facts.'
 },
 visitor:{
  label:'Tourist',title:'Make the most of Singapore',description:'Explore, navigate and get back to your hotel with confidence.',
  prompt:'Find sights, places to eat and a route back to your hotel.',
  shortcuts:[['◇','Things to do','Places and experiences','do'],['♨','Find food','Try local favourites','eat'],['↗','Plan a trip','Attractions and hotel routes','move'],['⇄','Currency','Check reference exchange rates','money']],
  discover:'Iconic sights, neighbourhoods and useful travel services for your stay.',
  search:'Search attractions, heritage sites or hawker food',journey:'Plan your next attraction, or use your saved hotel as a shortcut.',
  merli:['do','eat','home'],merliIntro:'I can help you discover Singapore and navigate back to your hotel.'
 },
 executive:{
  label:'Business',title:'Keep your day moving',description:'Make punctual travel and practical stops easier during a busy visit.',
  prompt:'Plan a meeting arrival, check routes and find places nearby.',
  shortcuts:[['↗','Plan arrival','Get to meetings on time','move'],['⌖','Near me','Practical stops nearby','nearby'],['⇄','Currency','Reference rates and changers','money'],['♨','Find dining','Food for a working day','eat']],
  discover:'Business districts, convenient dining and practical essentials for your schedule.',
  search:'Search dining, business districts or nearby services',journey:'Use “Arrive by” to plan meeting travel with some time to spare.',
  merli:['transit','eat','weather'],merliIntro:'I can help with timely routes, dining and local conditions.'
 },
 student:{
  label:'Student',title:'Study, eat and explore',description:'Affordable everyday options, campus routes and useful Singapore discoveries.',
  prompt:'Look for affordable food, study places or the route to campus.',
  shortcuts:[['♨','Budget-friendly food','Hawkers and markets','eat'],['⌖','Find essentials','Libraries and nearby places','nearby'],['↗','Campus travel','Plan the next trip','move'],['☆','Saved places','Your favourite spots','saved']],
  discover:'Affordable food, libraries and accessible local experiences for student life.',
  search:'Search libraries, budget food or activities',journey:'Plan trips to campus, libraries or home; compare walking and transit.',
  merli:['eat','transit','apps'],merliIntro:'I can help you find food, transport and useful apps for student life.'
 },
 new_in_sg:{
  label:'New in SG',title:'Settle in, one day at a time',description:'Find practical services and learn the routes you will use most.',
  prompt:'Discover your new neighbourhood and learn how to get around.',
  shortcuts:[['⌖','Essentials nearby','Groceries, clinics and parks','nearby'],['♨','Local food','Hawker centres and markets','eat'],['↗','Learn the routes','Buses, MRT and walking','move'],['▦','Everyday apps','Essential tools for Singapore life','apps']],
  discover:'Useful local places and services first while you settle in.',
  search:'Search supermarkets, clinics or neighbourhoods',journey:'Save home and familiar stops to make everyday travel easier.',
  merli:['home','transit','apps'],merliIntro:'I can help you get home, learn public transport and find useful apps.'
 }
};
const safeMode=()=>Object.prototype.hasOwnProperty.call(MODES,state.mode)?state.mode:'resident';
const cfg=()=>MODES[safeMode()];
const locale=()=>window.SGBUDDY_LANGUAGE||'en';
let localePacks=null;
const contextMode=(code,mode,field)=>localePacks?.context?.contextMode(code,mode,field)||({
 label:MODES[mode].label,title:MODES[mode].title,copy:MODES[mode].description,
 panelLabel:MODES[mode].label+' mode',placesCopy:MODES[mode].merliIntro
}[field]||MODES[mode].description);
const homeText=(code,key,fields={})=>localePacks?.home?.homeText(code,key,fields)||({
 changeMode:'Change mode',merliAsk:'Ask Merli',merliTips:'Merli · '+(fields.mode||'')+' tips',
 merliAir:'Check Singapore air quality',merliAirCopy:'Check the latest available NEA 24-hour PSI reading.',
 merliMore:'More ways Merli can help',merliLess:'Hide extra actions',
 exploringAs:'Exploring as '+(fields.mode||''),searchHint:'Search places and services',
 skipTo:'Skip to '+(fields.target||'')
}[key]||key);
const homeShortcut=(code,target)=>localePacks?.shortcuts?.homeShortcut(code,target)||null;
const modeLabel=()=>contextMode(locale(),safeMode(),'label');
const contextual=(field)=>contextMode(locale(),safeMode(),field);
const readLocal=(store,key)=>{try{return store.getItem(key)}catch{return null}};
const writeLocal=(store,key,val)=>{try{store.setItem(key,val)}catch{}};
const section=$('.v1-view[data-view="today"]');
const title=$('.ux-home-title');
const grid=$('.ux-primary-shortcuts');
let banner=null,personaSummary=null;
function openMode(){
 const current=$('#modeButton');
 if(current)current.click();
 else core.navigateTo('account');
}
if(section&&title){
 banner=document.createElement('section');
 banner.id='uxPersonaBanner';banner.className='ux-persona-banner';
 banner.setAttribute('aria-label','Current Singapore mode');
 banner.innerHTML='<span class="ux-persona-icon" aria-hidden="true">✦</span><div class="ux-persona-banner-text"><strong id="uxPersonaName"></strong><p id="uxPersonaDescription"></p></div><button type="button" id="uxChangeMode">Change mode</button>';
 title.insertAdjacentElement('afterend',banner);
 $('#uxChangeMode').addEventListener('click',openMode);
}
const account=$('#accountSection');
if(account){
 personaSummary=document.createElement('section');personaSummary.className='ux-persona-preferences';
 personaSummary.innerHTML='<div><span class="label">YOUR CONTEXT</span><strong id="uxAccountMode"></strong><p>Recommendations follow your chosen mode. Your other saved preferences remain intact.</p></div><button type="button" id="uxAccountChangeMode">Change mode</button>';
 account.appendChild(personaSummary);
 $('#uxAccountChangeMode').addEventListener('click',openMode);
}
const moveIntro=$('.ux-move-intro');
let moveMessage=null;
if(moveIntro){
 moveMessage=document.createElement('p');
 moveMessage.id='uxPersonaJourney';moveMessage.className='ux-persona-journey';
 moveIntro.appendChild(moveMessage);
}
const explore=$('#discoverHub');
let exploreMessage=null;
if(explore){
 exploreMessage=document.createElement('div');exploreMessage.className='ux-explore-context';exploreMessage.id='uxExploreContext';
 exploreMessage.innerHTML='<strong id="uxExploreMode"></strong><p id="uxExploreHint"></p><button type="button" id="uxExploreModeChange">Change mode</button>';
 explore.querySelector('.discover-intro')?.insertAdjacentElement('afterend',exploreMessage);
 $('#uxExploreModeChange')?.addEventListener('click',openMode);
}
function renderPersona(){
 const c=cfg();
 const heading=title?.querySelector('h2'),sub=title?.querySelector('p');
 // Keep the existing shell-localized homepage heading/subtitle; that surface
 // already has complete 12-locale coverage and should not be overwritten here.
 if($('#uxPersonaName'))$('#uxPersonaName').textContent=contextual('panelLabel');
 if($('#uxPersonaDescription'))$('#uxPersonaDescription').textContent=contextual('copy');
 if($('#uxAccountMode'))$('#uxAccountMode').textContent=modeLabel();
 if($('#uxPersonaJourney'))$('#uxPersonaJourney').textContent=contextual('copy');
 if($('#uxExploreMode'))$('#uxExploreMode').textContent=homeText(locale(),'exploringAs',{mode:modeLabel()});
 if($('#uxExploreHint'))$('#uxExploreHint').textContent=contextual('placesCopy');
 if($('#discoverSearch'))$('#discoverSearch').placeholder=homeText(locale(),'searchHint');
 if($('#placeSearch'))$('#placeSearch').placeholder=homeText(locale(),'searchHint');
 if(grid)grid.innerHTML=c.shortcuts.map(([symbol,name,summary,target])=>{
  const entry=homeShortcut(locale(),target)||{title:name,description:summary};
  return '<button class="ux-shortcut" type="button" data-ux-go="'+target+'"><span class="ux-shortcut-icon" aria-hidden="true">'+symbol+'</span><span class="ux-shortcut-copy"><strong>'+escapeText(entry.title)+'</strong><small>'+escapeText(entry.description)+'</small></span></button>';
 }).join('');
 for(const id of ['#uxChangeMode','#uxAccountChangeMode','#uxExploreModeChange'])if($(id))$(id).textContent=homeText(locale(),'changeMode');
 if($('#uxMerliHomeAsk'))$('#uxMerliHomeAsk').textContent=homeText(locale(),'merliAsk');
 updateMerli();
 updateHint();
}
const panel=$('#buddyPanel');
let merliContext=null,merliMore=null,showAllMerli=false;
const buddyLabels={eat:'Find food',do:'Discover activities',shop:'Find shops',apps:'Useful apps',weather:'Air quality',transit:'Next train',fact:'Singapore fact',saved:'Saved facts',home:'Saved place'};
if(panel){
 const group=panel.querySelector('.buddy-chips');
 merliContext=document.createElement('div');
 merliContext.className='ux-merli-context';merliContext.id='uxMerliContext';
 merliContext.innerHTML='<strong id="uxMerliHeadline"></strong><p id="uxMerliCopy"></p><div id="uxMerliSuggestions" class="ux-merli-suggestions" role="group" aria-label="Suggested actions"></div>';
 group?.insertAdjacentElement('beforebegin',merliContext);
 merliMore=document.createElement('button');merliMore.id='uxMerliMore';merliMore.type='button';merliMore.className='ux-merli-more';
 merliMore.setAttribute('aria-expanded','false');
 if(group){group.id='uxAllMerliActions';merliMore.setAttribute('aria-controls','uxAllMerliActions')}
 group?.insertAdjacentElement('afterend',merliMore);
 merliMore.addEventListener('click',()=>{showAllMerli=!showAllMerli;updateMerli()});
 $('#uxMerliSuggestions')?.addEventListener('click',e=>{
  const action=e.target.closest('[data-ux-merli]');
  if(!action)return;
  const target=panel.querySelector('.buddy-chips [data-buddy-action="'+action.dataset.uxMerli+'"]');
  target?.click();
 });
 panel.querySelector('.buddy-chips')?.setAttribute('aria-label','All Merli actions');
}
function validAir(){
 const w=state.weather,air=w?.airQuality,psi=air?.psi24h;
 const n=Number(psi?.overall),timestamp=Date.parse(psi?.updatedAt||'');
 const age=Date.now()-timestamp;
 if(!psi||psi.overall==null||!Number.isFinite(n)||!Number.isFinite(timestamp)||age<0||age>120*60*1000)return null;
 if(w?.source==='device-cache'||w?.dataQuality?.staleSignals?.includes('psi'))return null;
 return n;
}
function merliSuggestions(){
 const c=cfg(),psi=validAir();
 const list=psi!==null&&psi>100?['weather',...c.merli.filter(x=>x!=='weather')]:c.merli;
 return [...new Set(list)].slice(0,3);
}
function updateMerli(){
 if(!merliContext||!panel)return;
 const mode=cfg(),reading=validAir(),elevated=reading!==null&&reading>100;
 const actions=merliSuggestions();
 $('#uxMerliHeadline').textContent=elevated?homeText(locale(),'merliAir'):modeLabel()+' · '+homeText(locale(),'merliAsk');
 $('#uxMerliCopy').textContent=elevated?homeText(locale(),'merliAirCopy'):contextual('placesCopy');
 const targetMap={eat:'eat',do:'do',shop:'nearby',apps:'apps',weather:null,transit:'move',fact:null,saved:'saved',home:'saved'};
 $('#uxMerliSuggestions').innerHTML=actions.map(x=>{
  const match=homeShortcut(locale(),targetMap[x]);
  return '<button type="button" data-ux-merli="'+x+'">'+escapeText(match?.title||(x==='weather'?homeText(locale(),'merliAir'):buddyLabels[x]||x))+'</button>';
 }).join('');
 const all=panel.querySelector('.buddy-chips');
 if(all){
  all.hidden=!showAllMerli;
  all.querySelectorAll('button').forEach(b=>{b.hidden=false});
 }
 if(merliMore){
  merliMore.textContent=showAllMerli?'Hide extra actions':'More ways Merli can help'; // V3.5 owns the localized toggle
  merliMore.setAttribute('aria-expanded',String(showAllMerli));
 }
}
const tipKey='sgbuddy-merli-home-tip-dismissed-v1';
let hint=null,dismissed=readLocal(sessionStorage,tipKey)==='1';
const shortcuts=$('.ux-primary-shortcuts');
if(shortcuts){
 hint=document.createElement('aside');hint.id='uxMerliHint';hint.className='ux-merli-home-hint';
 hint.innerHTML='<img src="/assets/merlion-companion.webp" alt="" width="54" height="54" decoding="async" />'+
 '<div><strong id="uxMerliHomeTitle">Merli is here to help</strong><p id="uxMerliHomeCopy"></p></div>'+
 '<button type="button" id="uxMerliHomeAsk">Ask Merli</button><button type="button" id="uxMerliHomeDismiss" aria-label="Dismiss Merli suggestion">×</button>';
 shortcuts.insertAdjacentElement('afterend',hint);
 $('#uxMerliHomeAsk').addEventListener('click',()=>window.SGBUDDY_OPEN_MERLI?.());
 $('#uxMerliHomeDismiss').addEventListener('click',()=>{dismissed=true;writeLocal(sessionStorage,tipKey,'1');updateHint()});
}
function updateHint(){
 if(!hint)return;
 hint.hidden=dismissed;
 $('#uxMerliHomeTitle').textContent=homeText(locale(),'merliTips',{mode:modeLabel()});
 $('#uxMerliHomeCopy').textContent=contextual('placesCopy');
 if($('#uxMerliHomeAsk'))$('#uxMerliHomeAsk').textContent=homeText(locale(),'merliAsk');
}
// Nearby places use existing verified Place Index sources; mode-specific cues only
// re-rank the fetched entries and never invent destinations or attributes.
const studentCue=/library|campus|university|polytechnic|hawker|market|sport|park|museum|community|food centre/i;
const rawRenderer=window.SGBUDDY_PLACE_INDEX_RENDERER;
if(typeof rawRenderer==='function'){
 window.SGBUDDY_PLACE_INDEX_RENDERER=function(...args){
  if(state.mode==='student'&&Array.isArray(state.v110Places)){
    state.v110Places.sort((a,b)=>{
      const isFit=r=>studentCue.test([r?.name,r?.category,r?.kind].join(' '))?1:0;
      return isFit(b)-isFit(a)||Number(b?.personaScore||0)-Number(a?.personaScore||0);
    });
  }
  return rawRenderer(...args);
 };
}
// Quality: announce meaningful loading/empty/error states without reading hundreds of cards.
const messages={
 places:{selector:'#placesGrid',label:'Nearby places'},
 discover:{selector:'#discoverResults',label:'Discover results'},
 trains:{selector:'#railStations',label:'Train arrivals'},
 buses:{selector:'#nearbyStops',label:'Bus arrivals'}
};
const announcer=document.createElement('div');announcer.id='uxStatusAnnouncer';announcer.className='ux-visually-hidden';
announcer.setAttribute('role','status');announcer.setAttribute('aria-live','polite');announcer.setAttribute('aria-atomic','true');
document.body.appendChild(announcer);
const statusTimers=new Map(),lastStates=new Map();
function currentStatus(host){
 if(!host)return'loading';
 const txt=(host.textContent||'').trim().toLowerCase();
 if(host.querySelector('.skeleton')||/^(loading|checking|finding|switching)/.test(txt))return'loading';
 if(host.querySelector('.error-state')||/unavailable|could not load|failed to load/.test(txt))return'error';
 if(/no matches|no places|no saved|no nearby|no .* found|nothing .* yet/.test(txt))return'empty';
 return'available';
}
for(const [id,config] of Object.entries(messages)){
 const host=$(config.selector);if(!host)continue;
 host.setAttribute('aria-busy',currentStatus(host)==='loading'?'true':'false');
 const observer=new MutationObserver(()=>{
  const s=currentStatus(host);
  host.setAttribute('aria-busy',s==='loading'?'true':'false');
  if(s===lastStates.get(id))return;
  lastStates.set(id,s);
  clearTimeout(statusTimers.get(id));
  statusTimers.set(id,setTimeout(()=>{
   if(currentStatus(host)!==s)return;
   const text=s==='loading'?config.label+' loading':s==='error'?config.label+' are currently unavailable':s==='empty'?'No matching '+config.label.toLowerCase():config.label+' updated';
   announcer.textContent=text;
  },250));
 });
 observer.observe(host,{childList:true,subtree:true,characterData:true});
}
const journeyStatus=$('#journeyStatus');
journeyStatus?.setAttribute('role','status');
journeyStatus?.setAttribute('aria-live','polite');
// Keyboard Discover tab navigation includes the added Near me tab (which
// predates the original Discover roving-tab-keyboard implementation).
const tabGroup=$('#discoverHub .discover-tabs');
if(tabGroup)document.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 const target=e.target.closest?.('#discoverHub .discover-tabs [role="tab"]');
 if(!target)return;
 const items=$$('#discoverHub .discover-tabs [role="tab"]');
 const current=items.indexOf(target);if(current<0)return;
 e.preventDefault();e.stopImmediatePropagation();
 const next=e.key==='Home'?0:e.key==='End'?items.length-1:(current+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;
 items[next].click();items[next].focus();
},true);
const skip=$('.skip-link'),nav=$('.bottom-nav');
function updateSkip(){
 if(!skip||!nav)return;
 const active=nav.querySelector('[data-nav-target].active')?.dataset.navTarget||'today';
 const anchors={today:'todaySection',places:'discoverTitle',move:'travelSection',saved:'uxSavedView',account:'accountSection'};
 skip.setAttribute('href','#'+(anchors[active]||anchors.today));
 const name=nav.querySelector('[data-nav-target="'+active+'"] span')?.textContent||active;
 skip.textContent=homeText(locale(),'skipTo',{target:name});
}
updateSkip();
if(nav)new MutationObserver(updateSkip).observe(nav,{attributes:true,subtree:true,attributeFilter:['class']});
skip?.addEventListener('click',e=>{
 const target=document.querySelector(skip.getAttribute('href'));
 if(!target)return;
 e.preventDefault();target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({behavior:'instant',block:'start'});
});
// Keep PWA/desktop viewport and offline labels straightforward; no "LIVE" claims
// when a value comes from a local cache or a partial server response.
const net=$('#v1NetworkStatus');
function signalNetwork(){if(!net)return;net.setAttribute('aria-live','polite')}
window.addEventListener('online',signalNetwork);
window.addEventListener('offline',signalNetwork);
signalNetwork();
document.addEventListener('sgbuddy:persona',()=>queueMicrotask(renderPersona));
document.addEventListener('sgbuddy:language',()=>queueMicrotask(()=>{renderPersona();updateSkip()}));
Promise.all([
 import('./lib/i18n-context-v370.mjs'),import('./lib/i18n-home-v311.mjs'),
 import('./lib/i18n-shortcuts-v311.mjs')
]).then(([context,home,shortcuts])=>{
 localePacks={context,home,shortcuts};renderPersona();updateSkip();
}).catch(error=>console.warn('V3.11 locale packs',error?.message));

document.addEventListener('sgbuddy:weather',updateMerli);
renderPersona();
window.__SGBUDDY_UX_WAVES__='1-6';
window.__SGBUDDY_CLIENT_VERSION__='1.6.0';
if($('#appVersion'))$('#appVersion').textContent='v1.6.0';
})();
