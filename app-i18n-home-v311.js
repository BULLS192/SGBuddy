/* V3.11 exact-anchor localization for dynamically recreated home widgets.
 * No document-wide machine translation. Transport destinations, station names,
 * service data, numbers, URLs and user content remain owned by the original source. */
import {HOME_KEYS,HOME_MESSAGES,homeText} from './lib/i18n-home-v311.mjs';
import {WEATHER_CODES,WEATHER_TRANSLATIONS,translatedWeatherSummary} from './lib/i18n-weather-codes-v311.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
import {PSI_CATEGORIES,PSI_MESSAGES,translatedPsi} from './lib/i18n-psi-v311.mjs';
(()=>{
 'use strict';
 const doc=document;
 const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const all=Object.values(HOME_MESSAGES);
 const targets=[
  ['#todaySection .hero-row .label','context'],
  ['#todaySection .hero-grid > div:nth-child(2) .metric-label','rail'],
  ['#todaySection .hero-grid > div:nth-child(3) .metric-label','road'],
  ['#railForm','stationKicker','closest','.manual .label'],
  ['#railForm','stationPrompt','closest','.manual h3'],
  ['#railForm button','check'],
  ['#placeLabel','near'],
  ['#locationStatus','locationPrivate'],
  ['#nextUpCard .next-up-head .label','next'],
  ['#nextUpTitle','imminent','soon','makeYours','nextIn'],
  ['#nextUpCopy','nearSaved','savedOnly','allowLoc'],
  ['#nextUpAction','setup','now','minute'],
  ['#uxExtraConditions summary','weatherAir'],
  ['#uxViewConditions','fullConditions'],
  ['#updatedAt','updated']
 ];
 const variants=Object.fromEntries(HOME_KEYS.map(k=>[k,new Set(all.map(a=>a[k]))]));
 const dynamic=['nextIn','minute','updated'];
 function pattern(template,key){
  const escaped=template.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const slot=key==='nextIn'||key==='minute'?'count':'time';
  return new RegExp('^'+escaped.replace('\\{'+slot+'\\}',slot==='time'?'(.+)':'([0-9]+)')+'$');
 }
 const patterns=Object.fromEntries(dynamic.map(key=>[key,all.map(a=>pattern(a[key],key))]));
 const memory=new WeakMap();
 function currentText(node){return (node?.textContent||'').trim()}
 function applyExact(node,keys){
  if(!node)return;
  const current=currentText(node),previous=memory.get(node);
  let found=null;
  for(const key of keys){
   if(dynamic.includes(key)){
    const slot=key==='updated'?'time':'count';
    for(const regex of patterns[key]){
     const match=current.match(regex);
     if(match){found={key,fields:{[slot]:match[1]}};break}
    }
   }else if(variants[key].has(current)){
    found={key,fields:{}};break;
   }
   if(found)break;
  }
  if(!found&&previous?.text===current&&keys.includes(previous.key))found=previous;
  if(!found)return;
  const value=homeText(locale(),found.key,found.fields);
  if(current!==value)node.textContent=value;
  memory.set(node,{...found,text:value});
 }
 function apply(){
  for(const entry of targets){
   const [selector,key,mode,sub]=entry;
   const root=doc.querySelector(selector);
   const node=mode==='closest'?root?.closest(sub?.split(' ')[0])?.querySelector(sub?.split(' ').slice(1).join(' ')):root;
   if(!node)continue;
   const keys=mode==='closest'?[key]:entry.slice(1);
   applyExact(node,keys);
  }
  // Don't replace the humidity measurement or its strong element.
  const summary=doc.querySelector('#uxHomeSummary > span:nth-child(3)');
  const first=summary?.firstChild;
  if(first?.nodeType===3){
   const before=first.nodeValue.trim();
   if(variants.humidity.has(before))first.nodeValue=homeText(locale(),'humidity')+' ';
  }
  // Official 24-hour PSI numeric value stays immutable; localize only recognized category labels.
  const psi=doc.querySelector('#uxPsi'),rawPsi=doc.querySelector('#envPsi')?.textContent?.trim();
  if(psi&&rawPsi){
   const current=currentText(psi),known=new Set(Object.values(PSI_MESSAGES).flatMap(pack=>PSI_CATEGORIES.map(category=>{
     const match=rawPsi.match(/^([0-9]+(?:[.][0-9]+)?)\s*·/);
     return match?match[1]+' · '+pack[category]:'';
   })));
   if(current===rawPsi||known.has(current)){
    const category=PSI_CATEGORIES.find(k=>rawPsi.endsWith(' · '+k));
    if(category)psi.textContent=translatedPsi(locale(),rawPsi);
   }
  }
  // Display translated descriptions only for recognized weather phrases.
  const target=doc.querySelector('#weatherLabel');
  const source=window.SGBUDDY_CORE?.state?.weather?.summary;
  if(target&&typeof source==='string'){
   const original=source.trim(),observed=currentText(target);
   const known=WEATHER_CODES.includes(original)||/^.+?\s*·\s*\d+(?:\.\d+)?% humidity\s*·\s*\d+(?:\.\d+)? mm rain$/.test(original);
   const possibilities=new Set(Object.keys(WEATHER_TRANSLATIONS).map(l=>translatedWeatherSummary(l,original)));
   if(known&&(observed===original||possibilities.has(observed))) {
    const translated=translatedWeatherSummary(locale(),original);
    if(observed!==translated)target.textContent=translated;
   }
  }
 }
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
 for(const event of ['sgbuddy:language','sgbuddy:persona','sgbuddy:weather','sgbuddy:translations-ready','sgbuddy:food-tools-ready'])
  doc.addEventListener(event,schedule);
 for(const selector of ['#todaySection','#nextUpCard','#uxHomeSummary','#uxExtraConditions','#railForm']){
  const node=doc.querySelector(selector);
  if(node)new MutationObserver(schedule).observe(node,{childList:true,subtree:true,characterData:true});
 }
 window.SGBUDDY_HOME_I18N={locale,refresh:schedule,keys:HOME_KEYS.length};
 schedule();
})();
