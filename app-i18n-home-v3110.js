/* SGBuddy V3.11 — source-locked live home localization.
 * This is deliberately an allowlist, never a DOM-wide translator.
 * Never translate transport destinations, fares, official source labels,
 * weather values, addresses, GPS coordinates or user-supplied text. */
import {HOME_KEYS,HOME_MESSAGES,homeText} from './lib/i18n-home-v3110.mjs';
import {CORE_UI,coreUi} from './lib/i18n-interface-v290.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
import {RUNTIME_MESSAGES,runtimeText} from './lib/i18n-runtime-v320.mjs';
(()=>{
 'use strict';
 const doc=document,locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const packs=Object.values(HOME_MESSAGES),oldCore=Object.values(CORE_UI);
 const checkLabels={en:'Check','zh-CN':'查询','zh-TW':'查詢',ms:'Semak',id:'Periksa',ja:'確認',ko:'조회',th:'ตรวจสอบ',vi:'Tra cứu',fr:'Vérifier',es:'Consultar','pt-BR':'Consultar'};
 const slots=[
  ['#todaySection .hero-row .label','context'],
  ['#todaySection .hero-grid > div:nth-child(2) .metric-label','rail'],
  ['#todaySection .hero-grid > div:nth-child(3) .metric-label','roads'],
  ['#locationStatus','locationCurrent'],
  ['#nextUpCard .next-up-head .label','nextUp'],
  ['#nextUpTitle','imminent','soon','nextIn','setupTitle'],
  ['#nextUpCopy','nearPriority','savedPriority','setupCopy'],
  ['#nextUpAction','now','shortMinute','setupAction'],
  ['#uxPersonaName','modeSuffix'],
  ['#uxPersonaDescription','residentPrompt'],
  ['#uxMerliHomeTitle','merliTips'],
  ['#uxMerliHomeCopy','residentMerli'],
  ['#uxMerliHomeAsk','askMerli'],
  ['#uxChangeMode','changeMode'],
  ['#uxExploreModeChange','changeMode'],
  ['#uxExtraConditions summary','weatherSection'],
  ['.ux-primary-shortcuts [data-ux-go="nearby"] strong','nearName'],
  ['.ux-primary-shortcuts [data-ux-go="nearby"] small','nearCopy'],
  ['.ux-primary-shortcuts [data-ux-go="eat"] strong','foodName'],
  ['.ux-primary-shortcuts [data-ux-go="eat"] small','foodCopy'],
  ['.ux-primary-shortcuts [data-ux-go="move"] strong','moveName'],
  ['.ux-primary-shortcuts [data-ux-go="move"] small','moveCopy'],
  ['.ux-primary-shortcuts [data-ux-go="apps"] strong','appsName'],
  ['.ux-primary-shortcuts [data-ux-go="apps"] small','appsCopy']
 ];
 const fromCore=[
  ['.manual.card .label','checkStation'],
  ['.manual.card h3','stationName'],
  ['#placeLabel','nearYou']
 ];
 const coreVariants=Object.fromEntries(['checkStation','stationName','nearYou'].map(k=>[k,new Set(oldCore.map(p=>p[k]).filter(Boolean))]));
 const known=Object.fromEntries(HOME_KEYS.map(k=>[k,new Set(packs.map(p=>p[k]).filter(Boolean))]));
 const escapes=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const sourceTemplates=Object.fromEntries(['nextIn','shortMinute'].map(k=>[k,packs.map(p=>({
  template:p[k],regex:new RegExp('^'+escapes(p[k]).replace('\\{count\\}','([0-9]+)')+'$')
 }))]));
 const last=new WeakMap();
 function match(text,keys,node){
  const previous=last.get(node);
  for(const key of keys){
   if(sourceTemplates[key]){
    for(const {regex} of sourceTemplates[key]){
     const match=text.match(regex);
     if(match)return {key,fields:{count:match[1]}};
    }
   }else if(known[key]?.has(text))return {key,fields:{}};
   if(previous?.key===key&&previous?.rendered===text)return {key,fields:previous.fields||{}};
  }
  return null;
 }
 function applyOne(node,keys){
  if(!node)return;
  const text=(node.textContent||'').trim(),parsed=match(text,keys,node);
  if(!parsed)return;
  const next=homeText(locale(),parsed.key,parsed.fields);
  if(next!==text)node.textContent=next;
  last.set(node,{key:parsed.key,fields:parsed.fields,rendered:next});
 }
 function applyCore(node,key){
  if(!node)return;
  const text=(node.textContent||'').trim();
  if([...coreVariants[key]].some(value=>value.toLocaleLowerCase()===text.toLocaleLowerCase())){
   const next=coreUi(locale())[key];
   if(next!==text)node.textContent=next;
  }
 }
 function applyStationAction(){
  const node=doc.querySelector('#railForm button');
  if(!node)return;
  const text=node.textContent.trim();
  if(Object.values(checkLabels).includes(text))node.textContent=checkLabels[locale()];
 }
 function applyWeatherLabel(){
  const node=doc.querySelector('#weatherLabel');if(!node)return;
  const text=(node.textContent||'').trim();
  // This is a bounded, known condition descriptor, NOT translation of arbitrary
  // NEA forecast prose. Preserve humidity, rainfall and their units verbatim.
  for(const row of packs){
   const expr=new RegExp('^'+escapes(row.cloudyDay)+' · ([0-9]+(?:\\.[0-9]+)?)% '+escapes(row.humidity)+' · ([0-9]+(?:\\.[0-9]+)?) mm '+escapes(row.rain)+'$');
   const found=text.match(expr);if(!found)continue;
   const next=homeText(locale(),'cloudyDay')+' · '+found[1]+'% '+homeText(locale(),'humidity')+' · '+found[2]+' mm '+homeText(locale(),'rain');
   if(next!==text)node.textContent=next;
   return;
  }
 }

 function applyPsiCategory(){
  const node=doc.querySelector('#envPsi');if(!node)return;
  const found=(node.textContent||'').trim().match(/^([0-9]{1,3}) · (.+)$/);
  if(!found)return;
  const keys=['psiGood','psiModerate','psiUnhealthy','psiVeryUnhealthy','psiHazardous'];
  const key=keys.find(k=>packs.some(pack=>pack[k]===found[2]));
  if(!key)return;
  const next=found[1]+' · '+homeText(locale(),key);
  if(next!==node.textContent)node.textContent=next;
 }
 function applyUpdated(){
  const node=doc.querySelector('#updatedAt');if(!node)return;
  const current=(node.textContent||'').trim();
  for(const pack of Object.values(RUNTIME_MESSAGES)){
   const template=pack.weatherUpdated;
   if(!template||!template.includes('{time}'))continue;
   const expr=new RegExp('^'+escapes(template).replace('\\{time\\}','(.+?)')+'$');
   const found=current.match(expr);
   if(!found||!/^[0-2]?\d:[0-5]\d(?:\s*(?:AM|PM))?$/i.test(found[1]))continue;
   const next=runtimeText(locale(),'weatherUpdated',{time:found[1]});
   if(next!==current)node.textContent=next;
   return;
  }
 }
 function apply(){
  for(const [selector,...keys] of slots)for(const node of doc.querySelectorAll(selector))applyOne(node,keys);
  for(const [selector,key] of fromCore)applyCore(doc.querySelector(selector),key);
  applyStationAction();
  applyWeatherLabel();
  applyPsiCategory();
  applyUpdated();
 }
 let scheduled=false;
 function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;try{apply()}catch(e){console.warn('Home locale update',e?.message)}});
 }
 for(const event of ['sgbuddy:language','sgbuddy:persona','sgbuddy:weather','sgbuddy:translations-ready','sgbuddy:location','sgbuddy:transport'])doc.addEventListener(event,schedule);
 // Dynamically rendered widgets can overwrite captions after locale changes.
 // Observe only explicit first-party UI hosts, never all of main/document body.
 for(const selector of ['#todaySection','#nextUpCard','.manual.card','.ux-home-title','#uxPersonaBanner','.ux-primary-shortcuts','#uxMerliHint','#uxExtraConditions']){
  const root=doc.querySelector(selector);if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true});
 }
 window.SGBUDDY_HOME_I18N={locale,refresh:schedule,keys:HOME_KEYS.length};
 schedule();
})();
