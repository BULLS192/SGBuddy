/* V4.5 — source-locked runtime translation of Merli Makan & Discover controls.
 * NEVER traverse arbitrary strings or provider data. Protect filters' machine values,
 * active selections, menus, original MUIS safety warning and source links.
 */
import {FOOD_DISCOVER_V450_KEYS,FOOD_DISCOVER_V450_MESSAGES,foodDiscoverText} from './lib/i18n-food-discover-v450.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document;
 const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const bindings=[
  ['#foodToolsV261 .food-tools-heading .label','makanHeading','text'],
  ['#foodToolsSubtitle','makanSubtitle','text'],
  ['#foodToolPickerPanel .food-tool-filters > label:nth-child(1)','makanArea','directText'],
  ['#foodToolPickerPanel .food-tool-filters > label:nth-child(2)','makanCraving','directText'],
  ['#foodToolsV261','makanRegionAria','aria-label'],
  ['#foodToolsV261 .food-tools-nav','makanToolsAria','aria-label'],
  ['#foodPickNote','makanCaution','text'],
  ['#foodToolServicesPanel > p.food-tool-note','makanServicesIntro','text'],
  ['#discoverSearch','discoverSearchAria','aria-label'],
  ['#discoverAreaFilter','discoverAreaAria','aria-label'],
  ['#discoverSourceFilter','discoverSourceAria','aria-label'],
  ['#discoverNeighbourhoodFilter','discoverNeighbourhoodAria','aria-label'],
  ['#discoverCategoryFilter','discoverCategoryAria','aria-label'],
  ['#discoverQuality','discoverQualityAria','aria-label'],
  ['#discoverQuality > p:first-of-type','discoverQualityCaution','text']
 ];
 const known=Object.fromEntries(FOOD_DISCOVER_V450_KEYS.map(key=>[key,new Set(Object.values(FOOD_DISCOVER_V450_MESSAGES).map(pack=>pack[key]))]));
 const last=new WeakMap();
 const normalize=s=>String(s??'').replace(/\s+/g,' ').trim();
 function directText(el){return [...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&normalize(n.textContent))||null}
 function renderOne(el,key,kind){
  const node=kind==='directText'?directText(el):el;
  if(!node)return;
  const current=normalize(kind==='aria-label'?el.getAttribute('aria-label'):node.textContent);
  const prior=last.get(node);
  // Owned, exact first-party messages only. Never touch unknown provider/user copy.
  if(!known[key].has(current)&&!(prior?.key===key&&prior.rendered===current))return;
  const next=foodDiscoverText(locale(),key);
  if(!next||next===current)return;
  if(kind==='aria-label')el.setAttribute('aria-label',next);
  else if(kind==='directText')node.textContent=next;
  else el.textContent=next;
  last.set(node,{key,rendered:next});
  // Keep English canonical for audit/review without displaying duplicate warnings.
  if((key==='makanCaution'||key==='discoverQualityCaution'||key==='makanServicesIntro')&&!el.dataset.sourceEnglish)el.dataset.sourceEnglish=FOOD_DISCOVER_V450_MESSAGES.en[key];
 }
 function apply(){
  for(const [selector,key,kind] of bindings){
   const el=doc.querySelector(selector);
   if(el)renderOne(el,key,kind);
  }
 }
 let queued=false;
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
 }
 for(const event of ['sgbuddy:language','sgbuddy:discover-tab','sgbuddy:translations-ready','sgbuddy:food-tools-ready','sgbuddy:persona'])
  doc.addEventListener(event,schedule);
 const observer=new MutationObserver(schedule);
 for(const selector of ['#discoverHub','#foodToolsV261']){
  const node=doc.querySelector(selector);
  if(node)observer.observe(node,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label']});
 }
 window.SGBUDDY_FOOD_DISCOVER_V450={refresh:schedule,text:foodDiscoverText,keys:FOOD_DISCOVER_V450_KEYS.length};
 schedule();
})();
