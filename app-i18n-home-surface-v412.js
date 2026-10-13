/* V4.12 precise authored Home UI: keep official location names, readings,
 * source/weather descriptions, warnings and user-provided content untouched.
 */
import {HOME_V412_KEYS,HOME_V412,home412Text} from './lib/i18n-home-surface-v412.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document,locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const known=Object.fromEntries(HOME_V412_KEYS.map(key=>[key,new Set(Object.values(HOME_V412).map(pack=>pack[key]))]));
 const mapping=[
  ['#weatherLabel',['weatherLoading']],
  ['#locationStatus',['locationOff','locationNotSet','locationUnsupported','locationUnavailable','locationDenied','locationDeniedSearch','locationFailure','locationFinding','locationPersonalize']],
  ['#uxHumidity',['unavailable']],
  ['#tripIntelTitle',['riskTitleLow','riskTitleWatch','riskTitleHigh']],
  ['#tripIntelCopy',['riskCopyLow','riskCopyWatch','riskCopyHigh']],
  ['#tripIntelLevel',['riskLow','riskWatch','riskHigh']],
  ['#envRiskBadge',['riskLow','riskWatch','riskHigh','riskUnknown']],
  // V4.11 already owns the Trip Intelligence heading; avoid competing translations.
  ['#environmentCard .environment-head .label',['conditionsHeading']],
  ['#environmentCard .environment-grid > div:nth-child(1) > span:nth-child(2)',['temperature']],
  ['#environmentCard .environment-grid > div:nth-child(2) > span:nth-child(2)',['humidity']],
  ['#environmentCard .environment-grid > div:nth-child(3) > span:nth-child(2)',['rain5']],
  ['#environmentCard .environment-grid > div:nth-child(4) > span:nth-child(2)',['wind']],
  ['#envForecast',['loadingConditions']]
 ];
 function apply(){
  for(const [selector,keys] of mapping){
   const node=doc.querySelector(selector);
   if(!node)continue;
   const source=String(node.textContent??'').replace(/\s+/g,' ').trim();
   for(const key of keys){
    if(!known[key].has(source))continue;
    const desired=home412Text(locale(),key);
    if(desired&&source!==desired)node.textContent=desired;
    break;
   }
  }
 }
 let scheduled=false;
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}
 for(const name of ['sgbuddy:language','sgbuddy:translations-ready','sgbuddy:weather','sgbuddy:location','sgbuddy:transport','sgbuddy:persona'])doc.addEventListener(name,schedule);
 for(const rootSelector of ['#todaySection','#tripIntelligence','#environmentCard']){
  const node=doc.querySelector(rootSelector);
  if(node)new MutationObserver(schedule).observe(node,{childList:true,characterData:true,subtree:true});
 }
 window.SGBUDDY_V412={apply,text:home412Text,keys:HOME_V412_KEYS.length};
 schedule();
})();
