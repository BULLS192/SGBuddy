/* SGBuddy V2.9: broad, reactive localization of app-owned interface.
 * Deliberately does NOT alter original names, addresses, user content, live measurements,
 * provider descriptions or source claims. Those require separately reviewed translations.
 */
import {CORE_UI,coreUi} from './lib/i18n-interface-v290.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document;
 const mapping=[
  ['#installButton','install','prefix','⇩'],
  ['#locateButton','locate','prefix','◎'],
  ['#refreshButton','refresh'],
  ['#transportSection h2','trains'],
  ['.saved-rail .saved-bus-head .label','stations'],
  ['.saved-rail .saved-bus-head h3','favourites'],
  ['#railForm button','checkStation'],
  ['.transport-heading h2','stopsNearby'],
  ['#cardsViewButton','cards'],['#mapViewButton','map'],
  ['.saved-buses .saved-bus-head .label','myStops'],
  ['.saved-buses .saved-bus-head h3','favourites'],
  ['#savedStopForm button','addSaved','custom','Add'],
  ['.section-head.subhead h3','nearbyStops'],
  ['#stopForm button','checkStation','custom','Check'],
  ['#mapView .map-head .label','transportMap'],
  ['#fitMapButton','fitAll'],
  ['#travelSection .planner-title-row .label','route'],
  ['.quick-destinations [data-place="home"]','home'],
  ['.quick-destinations [data-place="work"]','work'],
  ['.quick-destinations [data-place="hotel"]','hotel'],
  ['.popular-destinations > span','popular'],
  ['#timingNowButton','leaveNow'],
  ['#timingArriveButton','arriveBy'],
  ['#arriveByWrap label','arriveBy'],
  ['#planTrip','planWith'],
  ['#journeyMapWrap .journey-map-head .label','routeMap'],
  ['.saved.card > h3','savedAddresses'],
  ['.saved.card .quick-address:nth-child(1) > strong','home'],
  ['.saved.card .quick-address:nth-child(2) > strong','work'],
  ['.saved.card .quick-address:nth-child(3) > strong','hotel'],
  ['#savePlaces','saveQuick'],
  ['.saved.card > .label:last-of-type','addAnother'],
  ['#addCustomPlace','addSaved'],
  ['.profile-card .profile-summary .label','profile'],
  ['#profileTitle','privateSync'],
  ['#syncProfileButton','syncNow'],
  ['#linkDeviceButton','linkDevice'],
  ['#exportProfileButton','export'],
  ['#importProfileButton','import'],
  ['#moneySection .label','money'],
  ['#moneySection h2','rates'],
  ['#fxConvert','convert'],
  ['#moneyChangerSearchButton','search'],
  ['#accountSection .account-hub-head .label','account'],
  ['#accountHubOpen','accountOpen'],
  ['#dataCorePanel .data-core-head h3','liveData'],
  ['#dataCoreRefresh','refreshData'],
  ['#dataCoreDiagnostics','diagnostics']
 ];
 const labelSelectors=[
  ['#fxAmount','amount'],['#fxFrom','from'],['#fxTo','to']
 ];
 const placeholderSelectors=[
  ['#tripFrom','from'],['#tripTo','to'],['#savedStopInput','checkStop']
 ];
 const dictionaries=Object.values(CORE_UI);
 const accepted=(key,actual)=>dictionaries.some(x=>x[key]?.trim().toLocaleLowerCase()===actual.trim().toLocaleLowerCase());
 // Do not replace a transient functional state like "Refreshing…" or "Locating…".
 function setLabel(el,key,translated,{prefix='',custom=''}={}){
  if(!el||!translated)return false;
  const raw=el.textContent?.trim()||'';
  const unprefixed=prefix&&raw.startsWith(prefix)?raw.slice(prefix.length).trim():raw;
  if(!accepted(key,unprefixed)&&unprefixed!==custom)return false;
  const next=prefix?prefix+' '+translated:translated;
  if(el.textContent!==next){el.textContent=next;return true}
  return false;
 }
 function apply(){
  const locale=normalizeLocale(window.SGBUDDY_LANGUAGE||localStorage.getItem('sgbuddy-language-v250')||'en');
  const labels=coreUi(locale);
  let changes=0;
  for(const [selector,key,type,argument] of mapping){
   const node=doc.querySelector(selector);
   if(setLabel(node,key,labels[key],type==='prefix'?{prefix:argument}:type==='custom'?{custom:argument}:{}))changes++;
  }
  for(const [selector,key] of labelSelectors){
   const input=doc.querySelector(selector),label=input?.closest('label');
   const first=label?.firstChild;
   if(!first||first.nodeType!==Node.TEXT_NODE)continue;
   const raw=first.nodeValue.trim();
   if(accepted(key,raw)&&raw!==labels[key]){first.nodeValue=labels[key];changes++}
  }
  for(const [selector,key] of placeholderSelectors){
   const input=doc.querySelector(selector);if(!input)continue;
   const v=input.getAttribute('placeholder')||'';
   if(!v||v===labels[key])continue;
   // The historic English placeholders contain examples; preserve typed input values.
   if(selector==='#tripFrom' && (v.startsWith('From')||accepted(key,v)))input.placeholder=labels[key]+' — Singapore';
   else if(selector==='#tripTo' && (v.startsWith('To ')||accepted(key,v)))input.placeholder=labels[key]+' — Jewel, MBS, Zoo…';
   else if(selector==='#savedStopInput' && (v.startsWith('Bus stop code')||v.includes('84009')))input.placeholder=labels[key]+' · 84009';
  }
  const money=doc.querySelectorAll('.money-card .money-card-head');
  const assign=(node,key)=>{if(setLabel(node,key,labels[key]))changes++};
  if(money[0]){assign(money[0].querySelector('.label'),'converter');assign(money[0].querySelector('h3'),'worth');}
  if(money[1]){assign(money[1].querySelector('.label'),'exchangers');assign(money[1].querySelector('h3'),'licensed');}
  const alertTitle=doc.querySelector('#alerts')?.previousElementSibling?.querySelector('h2');
  assign(alertTitle,'disruptions');
  const staticMap=[
   ['#dataCorePanel .data-core-head .label','liveData','custom','DATA CORE'],
   ['#dataCorePanel .data-core-head h3','liveData'],
   ['#accountSection .account-hub-head .label','account'],
   ['#travelSection .planner-title-row .label','route']
  ];
  // Restore app-owned labels after legacy modules reconstruct their DOM.
  for(const [selector,key,unused,source] of staticMap){
   const el=doc.querySelector(selector);if(setLabel(el,key,labels[key],{custom:source||''}))changes++;
  }
  doc.documentElement.lang=locale;
  return changes;
 }
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{apply()}catch(error){console.warn('SGBuddy locale UI',error?.message)}})};
 doc.addEventListener('sgbuddy:language',schedule);
 for(const event of ['sgbuddy:persona','sgbuddy:weather','sgbuddy:discover-tab','sgbuddy:trip-rendered'])doc.addEventListener(event,schedule);
 const main=doc.querySelector('main');
 if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
 schedule();
 window.__SGBUDDY_I18N_INTERFACE__='v2.9';
})();
