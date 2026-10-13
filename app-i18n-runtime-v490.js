/* V4.9 — deterministic localization for remaining authored dynamic Food UI.
 * Restrict all writes to explicitly first-party text. Do not infer translations
 * from user values, business/venue identities, original notices or API messages.
 */
import {RUNTIME_V490_KEYS,RUNTIME_V490_MESSAGES,runtimeV490Text} from './lib/i18n-runtime-v490.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
'use strict';
const doc=document, locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
const original=RUNTIME_V490_MESSAGES.en;
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
const templates=['pickerLoaded','readPublisher','openProvider'];
const escRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const matchers=Object.fromEntries(templates.map(key=>[key,Object.values(RUNTIME_V490_MESSAGES).map(pack=>{
 const template=pack[key],slots=[...template.matchAll(/\{(count|areas|publisher|name)\}/g)].map(x=>x[1]);
 const pattern=escRx(template).replace(/\\\{(?:count|areas|publisher|name)\\\}/g,'(.+?)');
 return {slots,regex:new RegExp('^'+pattern+'$')};
})]));
const values=Object.fromEntries(RUNTIME_V490_KEYS.map(key=>[key,new Set(Object.values(RUNTIME_V490_MESSAGES).map(pack=>pack[key]))]));
const previous=new WeakMap();
function findMatch(current,key,node){
 const prior=previous.get(node);
 if(templates.includes(key)){
  for(const {regex,slots} of matchers[key]){
   const hit=current.match(regex);
   if(hit)return Object.fromEntries(slots.map((n,i)=>[n,hit[i+1]]));
  }
  if(prior?.key===key&&prior.rendered===current)return prior.fields;
  return null;
 }
 if(values[key].has(current)||prior?.key===key&&prior.rendered===current)return {};
 return null;
}
function write(el,key,field='textContent',guard=null){
 if(!el)return;
 const current=norm(field==='aria-label'?el.getAttribute(field):el.textContent);
 const fields=findMatch(current,key,el);
 if(fields===null)return;
 if(guard&&!guard(fields,el))return;
 const next=runtimeV490Text(locale(),key,fields);
 if(next!==current){
  if(field==='aria-label')el.setAttribute('aria-label',next);
  else el.textContent=next;
 }
 previous.set(el,{key,fields,rendered:next});
}
const access=[
 ['#accountButton','accountOpen'],['#modeButton','changeMode'],['#unitsToggle','weatherUnits'],
 ['#swapTrip','swapJourney'],['#fxSwap','swapCurrency'],['#transportMap','transportMap'],
 ['#placesMap','placesMap'],['#moneyChangerMap','moneyMap']
];
function apply(){
 for(const [selector,key] of access)write(doc.querySelector(selector),key,'aria-label');
 const dock=doc.getElementById('foodToolsV261');
 if(!dock)return;
 const notice=dock.querySelector('#foodPickNote');
 if(notice){
  // Only known authored statuses. Source-reported guide safety replies are
  // translated by the pre-existing contextual module, not overridden here.
  for(const key of ['pickerLoading','pickerUnavailable','pickerLoaded']){
   if(findMatch(norm(notice.textContent),key,notice)!==null){write(notice,key);break}
  }
 }
 for(const card of dock.querySelectorAll('#foodPickResult .food-picked-card')){
  const label=card.querySelector('.label');
  if(label)for(const key of ['guideMichelin','guideCna'])if(findMatch(norm(label.textContent),key,label)!==null){write(label,key);break}
  const publisher=card.querySelector('.food-picked-actions a[href*="michelinguide"],.food-picked-actions a[href*="channelnewsasia"]');
  // The source URL isn't always those domains; use the exact human-readable
  // MICHELIN/CNA signature instead while preserving its href.
  for(const link of card.querySelectorAll('.food-picked-actions a')){
   write(link,'readPublisher','textContent',fields=>['MICHELIN','CNA'].includes(fields.publisher));
  }
  const save=card.querySelector('[data-food-pick-save]');
  if(save)write(save,save.getAttribute('aria-pressed')==='true'?'savedPick':'savePick');
 }
 for(const card of dock.querySelectorAll('#foodServiceResults .food-provider-card')){
  const name=norm(card.querySelector('h5')?.textContent);
  if(!name)continue;
  for(const link of card.querySelectorAll('a')){
   write(link,'openProvider','textContent',fields=>fields.name===name);
  }
 }
}
let pending=false;
function schedule(){
 if(pending)return;
 pending=true;
 requestAnimationFrame(()=>{pending=false;apply()});
}
for(const event of ['sgbuddy:language','sgbuddy:food-tools-ready','sgbuddy:translations-ready','sgbuddy:persona'])doc.addEventListener(event,schedule);
for(const selector of ['#foodToolsV261','#accountButton','#modeButton','#unitsToggle','#swapTrip','#fxSwap','#transportMap','#placesMap','#moneyChangerMap']){
 const node=doc.querySelector(selector);
 if(node)new MutationObserver(schedule).observe(node,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','aria-pressed']});
}
window.SGBUDDY_RUNTIME_V490={refresh:schedule,text:runtimeV490Text,keys:RUNTIME_V490_KEYS.length};
schedule();
})();