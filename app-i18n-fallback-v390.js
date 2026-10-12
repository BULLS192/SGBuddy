/* SGBuddy V3.9: narrowly scoped, source-locked first-party fallback UI.
 * Never traverse or translate arbitrary copy. Status/error origin is retained;
 * provider payloads, addresses, fares, freeform user data are untouched. */
import {FALLBACK_KEYS,FALLBACK_MESSAGES,FALLBACK_SOURCE,fallbackMessage} from './lib/i18n-fallback-v390.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document;
 const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const sources=[
   ['#foodPickNote',['foodGuideLoading','foodNoMatch','foodToolUnavailable','foodPicked','foodCandidates'],'textContent'],
   ['.food-address',['foodCheckingCentre','foodOneMapUnavailable'],'textContent'],
   ['#foodCount',['foodLibraryUnavailable'],'textContent'],
   ['#discoverStatus',['discoverCatalogUnavailable'],'textContent'],
   ['#discoverResults .discover-empty',['discoverDirectoryUnavailable'],'textContent'],
   ['#placeSearch',['placeSearchPlaceholder'],'placeholder'],
   ['.places-toolbar > span',['placesToolbarNote'],'textContent']
 ];
 const originalValues=Object.fromEntries(FALLBACK_KEYS.map(key=>[key,new Set(Object.values(FALLBACK_MESSAGES).map(row=>row[key]))]));
 const prior=new WeakMap();
 const templateKeys=new Set(['foodPicked','foodCandidates']);
 const escapeReg=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const compiled=Object.fromEntries([...templateKeys].map(key=>[key,Object.values(FALLBACK_MESSAGES).map(row=>{
  const template=row[key],names=[...template.matchAll(/\{(count|areas)\}/g)].map(m=>m[1]);
  const pattern=escapeReg(template).replace(/\\\{(?:count|areas)\\\}/g,'([0-9]+)');
  return {names,regex:new RegExp('^'+pattern+'$')};
 })]));
 function read(node,field){return (field==='placeholder'?node.getAttribute('placeholder'):node.textContent)||'';}
 function write(node,field,value){if(field==='placeholder')node.setAttribute('placeholder',value);else node.textContent=value;}
 function match(current,keys,node){
  const last=prior.get(node);
  for(const key of keys){
   if(templateKeys.has(key)){
    for(const {names,regex} of compiled[key]){
     const hit=current.match(regex);
     if(hit)return {key,fields:Object.fromEntries(names.map((n,i)=>[n,hit[i+1]]))};
    }
    if(last?.key===key&&last?.value===current)return {key,fields:last.fields};
   }else if(originalValues[key].has(current) || last?.key===key&&last?.value===current){
    return {key,fields:{}};
   }
  }
  return null;
 }
 function apply(){
  let rewritten=0;
  for(const [selector,keys,field] of sources){
   for(const node of doc.querySelectorAll(selector)){
    const current=read(node,field).trim(),found=match(current,keys,node);
    if(!found)continue;
    const next=fallbackMessage(locale(),found.key,found.fields);
    if(current!==next){write(node,field,next);rewritten++}
    prior.set(node,{key:found.key,fields:found.fields,value:next});
   }
  }
  return rewritten;
 }
 let pending=false;
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply()})}
 for(const event of ['sgbuddy:language','sgbuddy:persona','sgbuddy:translations-ready','sgbuddy:food-tools-ready','sgbuddy:discover-places-ready']){
  doc.addEventListener(event,schedule);
 }
 for(const selector of ['#foodExplorer','#discoverHub','#placesSection','#discoverResults']){
  const root=doc.querySelector(selector);
  if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder']});
 }
 window.SGBUDDY_FALLBACK_I18N={locale,keys:FALLBACK_KEYS.length,refresh:schedule};
 schedule();
})();
