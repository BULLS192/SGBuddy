/* V3.7 source-aware, first-party persona and dynamic status localization.
 * Confine writes to named UI anchors; never translate arbitrary DOM, route
 * titles/provider suffixes, fares, addresses, inputs or account identifiers. */
import {CONTEXT_MODES,CONTEXT_MESSAGES,contextMode,contextText} from './lib/i18n-context-v370.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document;
 const state=()=>window.SGBUDDY_CORE?.state||{};
 const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const selectors={
  '#modeText':'label','#personaFocusTitle':'title','#personaFocusCopy':'copy',
  '#personaPanelLabel':'panelLabel','#personaPanelTitle':'panelTitle',
  '#personaPanelCopy':'panelCopy','#placesSection h2':'placesTitle'
 };
 const globals={ '#dataCoreStatus':['coreChecking','coreHealthy','coreDegraded','coreCheckFailed'] };
 const seen=new WeakMap();
 const escapeRe=value=>String(value).replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');
 function mode(){
  const current=state().mode;
  return CONTEXT_MODES.includes(current)?current:'resident';
 }
 function sourceOwned(node,key,which){
  const current=(node.textContent||'').trim(),prior=seen.get(node);
  // Only exactly enumerated source messages (or their earlier translations).
  const candidates=Object.values(CONTEXT_MESSAGES).map(dict=>dict.modes[which]?.[key]).filter(Boolean);
  if(!candidates.includes(current)&&!(prior?.key===key&&prior?.mode===which&&prior?.rendered===current))return false;
  const translated=contextMode(locale(),which,key);
  if(translated!==current)node.textContent=translated;
  seen.set(node,{key,mode:which,rendered:translated});
  return true;
 }
 function globalState(node,keys){
  const current=(node.textContent||'').trim(),prior=seen.get(node);
  const key=keys.find(k=>Object.values(CONTEXT_MESSAGES).some(p=>p.globals[k]===current))||
    (prior&&keys.includes(prior.key)&&prior.rendered===current?prior.key:null);
  if(!key)return;
  const translated=contextText(locale(),key);
  if(translated!==current)node.textContent=translated;
  seen.set(node,{key,rendered:translated});
 }
 function matchTemplate(node,kind,which){
  const current=(node.textContent||'').trim();
  if(!current)return;
  const templateKey=kind==='ranked'?'placesRanking':'placesPrioritized';
  for(const dict of Object.values(CONTEXT_MESSAGES)){
   const original=dict.globals[templateKey];
   const params=kind==='ranked'?
    {label:dict.modes[which].placesLabel,copy:dict.modes[which].placesCopy}:
    {label:dict.modes[which].label};
   // Build a verified dynamic string with one safe numeric hole.
   const open=original.replace(/\{(label|copy)\}/g,(_,key)=>params[key]);
   const re=new RegExp('^'+escapeRe(open).replace('\\{count\\}','([0-9]+)')+'$');
   const found=current.match(re);
   if(!found)continue;
   const target=kind==='ranked'?contextText(locale(),templateKey,{
    label:contextMode(locale(),which,'placesLabel'),
    copy:contextMode(locale(),which,'placesCopy'),count:found[1]
   }):contextText(locale(),templateKey,{label:contextMode(locale(),which,'label'),count:found[1]});
   if(target!==current)node.textContent=target;
   return;
  }
 }
 function recommended(node){
  const raw=node.textContent||'';
  for(const dict of Object.values(CONTEXT_MESSAGES)){
   const prefix=dict.globals.recommendedPrefix;
   if(!raw.startsWith(prefix)||raw.length<=prefix.length)continue;
   // Route/transport titles are provider or planner-owned: preserve suffix verbatim.
   const title=raw.slice(prefix.length);
   const result=contextText(locale(),'recommendedPrefix')+title;
   if(result!==raw)node.textContent=result;
   return;
  }
 }
 function apply(){
  const which=mode();
  for(const [selector,key] of Object.entries(selectors)){
   const node=doc.querySelector(selector);
   if(node)sourceOwned(node,key,which);
  }
  for(const [selector,keys] of Object.entries(globals)){
   const node=doc.querySelector(selector);if(node)globalState(node,keys);
  }
  const hint=doc.querySelector('#placesPersonaHint');
  if(hint){matchTemplate(hint,'ranked',which);matchTemplate(hint,'prioritized',which)}
  const routeTitle=doc.querySelector('#journeyMapTitle');
  if(routeTitle)recommended(routeTitle);
 }
 let pending=false;
 function schedule(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;apply()});
 }
 for(const event of ['sgbuddy:language','sgbuddy:persona','sgbuddy:translations-ready'])doc.addEventListener(event,schedule);
 for(const selector of [...Object.keys(selectors),...Object.keys(globals),'#placesPersonaHint','#journeyMapTitle']){
  const node=doc.querySelector(selector);
  if(node)new MutationObserver(schedule).observe(node,{childList:true,characterData:true,subtree:true});
 }
 window.SGBUDDY_CONTEXT_I18N={locale,mode,refresh:schedule,keys:CONTEXT_MODES.length*9+7};
 schedule();
})();
