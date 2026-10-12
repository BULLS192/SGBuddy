/* V3.5 — explicit first-party screen strings only.
   Never scan/translate arbitrary DOM text, operator messages, account values,
   weather payloads, prices, user input or source-owned notices. */
import {AUDIT_SURFACES,AUDIT_KEYS,AUDIT_ENGLISH,AUDIT_MESSAGES,auditText} from './lib/i18n-audit-v350.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document;
 const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const history=new WeakMap();
 const screenEntries=Object.entries(AUDIT_SURFACES).flatMap(([screen,slots])=>slots.map(([selector,key,weight])=>({screen,selector,key,weight})));
 const dictionaryValues=Object.fromEntries(AUDIT_KEYS.map(key=>[key,new Set(Object.values(AUDIT_MESSAGES).map(pack=>pack[key]))]));
 let queued=false;
 function applyOne(node,key){
  if(!node)return false;
  const current=(node.textContent||'').trim();
  const previous=history.get(node);
  // Source lock: only authored source/known translations for the same message
  // can be touched. Preserve all unexpected values (live state or providers).
  if(!dictionaryValues[key].has(current) &&
     !(previous?.key===key && previous.rendered===current))return false;
  const next=auditText(locale(),key);
  if(current!==next)node.textContent=next;
  history.set(node,{key,rendered:next});
  return true;
 }
 function apply(){
  const visited=new Set();
  for(const {selector,key} of screenEntries){
   const node=doc.querySelector(selector);
   if(!node||visited.has(node))continue;
   // Two messages share the Merli More control and depend on its current state.
   if(selector==='#uxMerliMore'){
    const current=(node.textContent||'').trim();
    const active=AUDIT_KEYS.filter(k=>k==='merliMore'||k==='merliLess').find(k=>dictionaryValues[k].has(current));
    if(active)applyOne(node,active);
    else if(history.get(node)?.rendered===current)applyOne(node,history.get(node).key);
   }else applyOne(node,key);
   visited.add(node);
  }
 }
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
 }
 for(const event of ['sgbuddy:language','sgbuddy:persona','sgbuddy:weather','sgbuddy:translations-ready'])doc.addEventListener(event,schedule);
 // Observe only reviewed app-owned anchors. Not the document or provider containers.
 for(const selector of new Set(screenEntries.map(x=>x.selector))){
  const node=doc.querySelector(selector);
  if(node)new MutationObserver(schedule).observe(node,{subtree:true,childList:true,characterData:true});
 }
 window.SGBUDDY_SCREEN_I18N={locale,keys:AUDIT_KEYS.length,surfaces:Object.keys(AUDIT_SURFACES),refresh:schedule};
 schedule();
})();
