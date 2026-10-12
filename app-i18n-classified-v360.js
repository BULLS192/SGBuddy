/* V3.6 — exact-source UI labels from reviewed HTML classification.
 * Do not rewrite any unlisted DOM text. Never translate API messages, route
 * operator data, official claims, account names or user-entered content. */
import {CLASSIFIED_KEYS,CLASSIFIED_MESSAGES,classifiedText} from './lib/i18n-classified-v360.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document;
 const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const bindings=[
  ['#greeting',['greetMorning','greetAfternoon','greetEvening']],
  ['#accountButtonText',['guestAccount']],
  ['#locationStatus',['locationUnset']],
  ['#sourceBadge',['sourceLive','sourceMixed','sourceDemo']],
  ['#unitsToggle',['unitsMetric','unitsImperial']],
  ['#editPersonaButton',['editMode']],
  ['#goHotelButton',['goHotel']],
  ['#placesCardsButton',['placesCards']],
  ['#placesMapButton',['placesMap']],
  ['#fitPlacesMap',['placesFit']],
  ['#signInButton',['signIn']],
  ['#createAccountButton',['createAccount']],
  ['#allowLocationButton',['useLocation']],
  ['#notNowLocationButton',['notNow']]
 ];
 const variants=Object.fromEntries(CLASSIFIED_KEYS.map(k=>[k,new Set(Object.values(CLASSIFIED_MESSAGES).map(pack=>pack[k]))]));
 const previous=new WeakMap();
 let pending=false;
 function apply(){
  for(const [selector,keys] of bindings){
   const node=doc.querySelector(selector);if(!node)continue;
   // Signed-in button may hold a truncated username, not a "guest" label.
   if(selector==='#accountButtonText'&&doc.querySelector('#accountButton')?.classList.contains('signed-in'))continue;
   const text=(node.textContent||'').trim(),prior=previous.get(node);
   const key=keys.find(k=>variants[k].has(text))||
     (prior&&keys.includes(prior.key)&&prior.rendered===text?prior.key:null);
   if(!key)continue;
   const translated=classifiedText(locale(),key);
   if(text!==translated)node.textContent=translated;
   previous.set(node,{key,rendered:translated});
  }
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply()})}
 for(const evt of ['sgbuddy:language','sgbuddy:persona','sgbuddy:weather','sgbuddy:translations-ready'])doc.addEventListener(evt,schedule);
 for(const [selector] of bindings){
  const node=doc.querySelector(selector);
  if(node)new MutationObserver(schedule).observe(node,{childList:true,characterData:true,subtree:true});
 }
 window.SGBUDDY_CLASSIFIED_I18N={locale,keys:CLASSIFIED_KEYS.length,controls:bindings.length,refresh:schedule};
 schedule();
})();
