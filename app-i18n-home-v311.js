/* V3.11 first-party home/dashboard labels only. Strict source matches:
 * no blanket DOM translation, no edits to place names, train destinations,
 * numeric measurements, user notes, API payloads or unsupported forecasts. */
import {HOME_KEYS,HOME_ENGLISH,HOME_MESSAGES,homeText} from './lib/i18n-home-v311.mjs';
import {WEATHER_MESSAGES,weatherTerm} from './lib/i18n-weather-home-v311.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
import {contextMode} from './lib/i18n-context-v370.mjs';
(()=>{
 'use strict';
 const doc=document, locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const variants=Object.fromEntries(HOME_KEYS.map(key=>[key,new Set(Object.values(HOME_MESSAGES).map(pack=>pack[key]))]));
 const sources=[
  ['#transportSection .manual.card > div:first-child .label','stationEyebrow'],
  ['#transportSection .manual.card > div:first-child h3','stationName'],
  ['#railForm button','stationCheck'],
  ['#todaySection .hero-row > div:first-child .label','currentContext'],
  ['#placeLabel','nearYou'],
  ['#locationStatus','locationPrivacy'],
  ['#todaySection .hero-grid > div:nth-child(2) .metric-label','railStatus'],
  ['#todaySection .hero-grid > div:nth-child(3) .metric-label','roadIncidents'],
  ['#uxViewConditions','fullConditions'],
  ['#nextUpCard .next-up-head .label','nextUp'],
  ['#uxExtraConditions > summary','weatherInsights'],
  ['#nextUpTitle','imminent'],
  ['#nextUpTitle','headOutSoon'],
  ['#nextUpTitle','nextSetupTitle'],
  ['#nextUpCopy','prioritizedNearby'],
  ['#nextUpCopy','prioritizedSaved'],
  ['#nextUpCopy','nextSetupCopy'],
  ['#nextUpAction','setup'],
  ['#nextUpAction','now']
 ];
 const prior=new WeakMap();
 const legacySource={'nextSetupCopy':'Allow location or use your saved stops and stations so SGBuddy can prioritize what matters to you.'};
 const escapeRe=s=>String(s).replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');
 function replacement(node,key){
  const current=(node.textContent||'').trim(),last=prior.get(node);
  if(!variants[key].has(current)&&legacySource[key]!==current&&
    !(last?.key===key&&last?.rendered===current))return false;
  const next=homeText(locale(),key);
  if(current!==next)node.textContent=next;
  prior.set(node,{key,rendered:next});
  return true;
 }
 function dynamic(node,key,field){
  if(!node)return;
  const current=(node.textContent||'').trim();
  for(const row of Object.values(HOME_MESSAGES)){
   const pattern='^'+escapeRe(row[key]).replace('\\{'+field+'\\}','([0-9]+)')+'$';
   const hit=current.match(new RegExp(pattern));
   if(!hit)continue;
   const target=homeText(locale(),key,{[field]:hit[1]});
   if(current!==target)node.textContent=target;
   return;
  }
 }
 function updateTime(node){
  if(!node)return;
  const current=(node.textContent||'').trim();
  for(const row of Object.values(HOME_MESSAGES)){
   const hit=current.match(new RegExp('^'+escapeRe(row.updated).replace('\\{time\\}','(.+)')+'$'));
   if(!hit||!/^\d{1,2}:\d{2}(?:\s*[AP]M)?$/i.test(hit[1]))continue;
   const next=homeText(locale(),'updated',{time:hit[1]});
   if(current!==next)node.textContent=next;
   return;
  }
 }
 function updateWeather(node){
  if(!node)return;
  const current=(node.textContent||'').trim();
  for(const row of Object.values(WEATHER_MESSAGES)){
   const humidity=escapeRe(row.humidity),rain=escapeRe(row.rain);
   const hit=current.match(new RegExp('^(.*?) · ([0-9]{1,3})% '+humidity+' · ([0-9]+(?:\\.[0-9]+)?) mm '+rain+'$'));
   if(!hit)continue;
   const translated=weatherTerm(locale(),hit[1])+' · '+hit[2]+'% '+weatherTerm(locale(),'humidity')+' · '+hit[3]+' mm '+weatherTerm(locale(),'rain');
   if(current!==translated)node.textContent=translated;
   return;
  }
 }
 function updateAir(node){
  if(!node)return;
  const raw=(node.textContent||'').trim(),m=raw.match(/^([0-9]+) · (.+)$/);
  if(!m)return;
  const label=weatherTerm(locale(),m[2]);
  if(label!==m[2])node.textContent=m[1]+' · '+label;
 }
 function updateHumidity(){
  const row=doc.querySelector('#uxHomeSummary > span:nth-child(3)');
  if(!row||!row.firstChild||row.firstChild.nodeType!==Node.TEXT_NODE)return;
  const node=row.firstChild,current=node.textContent.trim(),priorValue=prior.get(node);
  if(!variants.humidity.has(current)&&priorValue?.rendered!==current)return;
  const next=homeText(locale(),'humidity')+' ';
  if(node.textContent!==next)node.textContent=next;
  prior.set(node,{rendered:next.trim()});
 }
 function apply(){
  // A selector is a first-party ownership boundary; every replacement checks
  // a known source/translation to avoid overwriting live or user-authored text.
  for(const [selector,key] of sources){
   for(const node of doc.querySelectorAll(selector))replacement(node,key);
  }
  dynamic(doc.querySelector('#nextUpTitle'),'nextDeparture','count');
  dynamic(doc.querySelector('#nextUpAction'),'minutes','count');
  updateTime(doc.querySelector('#updatedAt'));
  updateWeather(doc.querySelector('#weatherLabel'));
  updateAir(doc.querySelector('#envPsi'));
  updateHumidity();
 }
 let queued=false;
 function schedule(){
  if(queued)return;
  queued=true;requestAnimationFrame(()=>{queued=false;apply()});
 }
 for(const event of ['sgbuddy:language','sgbuddy:persona','sgbuddy:weather','sgbuddy:translations-ready','sgbuddy:rail','sgbuddy:transport'])
  doc.addEventListener(event,schedule);
 for(const selector of ['#transportSection','#todaySection','#nextUpCard','#uxExtraConditions','#updatedAt','#weatherLabel','#uxHomeSummary','#envPsi']){
  const root=doc.querySelector(selector);
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});
 }
 window.SGBUDDY_HOME_LOCALE={homeText,contextMode};
 window.SGBUDDY_HOME_I18N={locale,keys:HOME_KEYS.length,refresh:schedule};
 doc.dispatchEvent(new Event('sgbuddy:translations-ready'));
 schedule();
})();
