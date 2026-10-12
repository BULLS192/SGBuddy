/* V3.11 homepage localization, source-locked to enumerated app-authored UI.
 * Do not rewrite operator routes, train names, weather payloads, street addresses
 * or user data. Applied after UX re-renders and on language changes.
 */
import {HOME_MESSAGES,homeText} from './lib/i18n-home-v311.mjs';
import {CORE_UI} from './lib/i18n-interface-v290.mjs';
import {CONTEXT_MODES,CONTEXT_MESSAGES,contextMode} from './lib/i18n-context-v370.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document,lang=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const mode=()=>{const m=window.SGBUDDY_CORE?.state?.mode;return CONTEXT_MODES.includes(m)?m:'resident'};
 const fixed=[
  ['.manual.card > div > .label','stationCheck','home'],
  ['.manual.card > div > h3','stationName','core'],
  ['#railForm button','checkStation','core'],
  ['#todaySection .hero-row .label','currentContext','home'],
  ['#todaySection .hero-grid > div:nth-child(2) .metric-label','railStatus','home'],
  ['#todaySection .hero-grid > div:nth-child(3) .metric-label','roadIncidents','home'],
  ['#nextUpCard .next-up-head .label','nextUp','home'],
  ['#uxChangeMode','changeMode','home'],
  ['#uxAccountChangeMode','changeMode','home'],
  ['#uxExploreModeChange','changeMode','home'],
  ['#uxMerliHomeAsk','merliAsk','home'],
  ['#uxMerliHomeTitle','merliTips','special'],
  ['#uxMerliHomeCopy','residentIntro','resident'],
  ['#uxPersonaDescription','residentPrompt','resident'],
  ['#uxPersonaName','modeSuffix','special'],
  ['#todaySection .place','nearYou','core'],
  ['#uxPersonaBanner','changeMode','none']
 ];
 const extra=[
  ['.ux-primary-shortcuts .ux-shortcut:nth-child(1) strong','quickNear'],
  ['.ux-primary-shortcuts .ux-shortcut:nth-child(1) small','nearbySummary'],
  ['.ux-primary-shortcuts .ux-shortcut:nth-child(2) strong','quickFood'],
  ['.ux-primary-shortcuts .ux-shortcut:nth-child(2) small','foodSummary'],
  ['.ux-primary-shortcuts .ux-shortcut:nth-child(3) strong','quickTrip'],
  ['.ux-primary-shortcuts .ux-shortcut:nth-child(3) small','tripSummary'],
  ['.ux-primary-shortcuts .ux-shortcut:nth-child(4) strong','quickApps'],
  ['.ux-primary-shortcuts .ux-shortcut:nth-child(4) small','appsSummary']
 ];
 const oldAliases={
   quickNear:['Near me'],nearbySummary:['Clinics, shops and essentials'],
   quickFood:['Find food'],foodSummary:['Neighbourhood hawkers'],
   quickTrip:['Get moving'],tripSummary:['Buses, MRT and routes'],
   quickApps:['Everyday apps'],appsSummary:['Singpass, Grab, banking and delivery']
 };
 const previous=new WeakMap();
 const canWrite=(node,key,text,variants)=>{
  if(!node)return;
  const current=(node.textContent||'').trim(),prior=previous.get(node);
  if(!variants.includes(current)&&!(prior?.key===key&&prior.text===current))return;
  if(current!==text)node.textContent=text;
  previous.set(node,{key,text});
 };
 const variantsFor=(key,source='home')=>Object.values(source==='core'?CORE_UI:HOME_MESSAGES).map(x=>x[key]).filter(Boolean);
 function fixedText(selector,key,source){
  if(source==='none')return;
  const node=doc.querySelector(selector);
  if(!node)return;
  if(source==='resident'&&mode()!=='resident')return;
  if(source==='special'){
   if(key==='merliTips'){
    const current=(node.textContent||'').trim(),prior=previous.get(node);
    if(!/^(Merli · |Merli[ ·])/.test(current)&&prior?.text!==current)return;
    const title='Merli · '+contextMode(lang(),mode(),'label')+' · '+homeText(lang(),'merliTips');
    node.textContent=title;previous.set(node,{key,text:title});
   }else{
    const current=(node.textContent||'').trim(),prior=previous.get(node);
    const sourceText=Object.values(CONTEXT_MESSAGES).flatMap(p=>CONTEXT_MODES.map(m=>p.modes[m].label+' mode'));
    if(!sourceText.includes(current)&&prior?.text!==current)return;
    const text=contextMode(lang(),mode(),'label')+' · '+homeText(lang(),'modeSuffix');
    node.textContent=text;previous.set(node,{key,text});
   }
   return;
  }
  canWrite(node,key,source==='core'?CORE_UI[lang()][key]:homeText(lang(),key),variantsFor(key,source));
 }
 const nextUp=()=>{
  const node=doc.querySelector('#nextUpTitle'),copy=doc.querySelector('#nextUpCopy');
  if(node){
   const current=node.textContent.trim();
   const keys=['imminent','soon'];
   for(const key of keys){
    const options=variantsFor(key);
    if(options.includes(current)){canWrite(node,key,homeText(lang(),key),options);break}
   }
   const match=current.match(/^Next useful departure in (\d+) min$/);
   if(match)node.textContent=homeText(lang(),'nextIn',{count:match[1]});
  }
  if(copy){
   for(const [key,source] of [['nearSaved','Prioritized from nearby and saved transport.'],['savedOnly','Prioritized from your saved stops and stations.']]){
    const variants=[source,...variantsFor(key)];
    if(variants.includes(copy.textContent.trim())){canWrite(copy,key,homeText(lang(),key),variants);break}
   }
  }
 };
 const home=()=>{
  for(const [selector,key,source] of fixed)fixedText(selector,key,source);
  if(mode()==='resident')for(const [selector,key] of extra){
   const n=doc.querySelector(selector);
   canWrite(n,key,homeText(lang(),key),[...oldAliases[key],...variantsFor(key)]);
  }
  nextUp();
  // Never translate the actual location string: it may be a named area/address.
  const hint=doc.querySelector('#locationStatus');
  if(hint)canWrite(hint,'locationPrivate',homeText(lang(),'locationPrivate'),['Using your current location · not stored in cloud',...variantsFor('locationPrivate')]);
  const exp=doc.querySelector('.ux-home-title > h2');
  if(exp&&mode()==='resident'){
   const source=['Your everyday Singapore',...Object.values(CONTEXT_MESSAGES).map(p=>p.modes.resident.title)];
   canWrite(exp,'residentTitle',contextMode(lang(),'resident','title'),source);
  }
 };
 let scheduled=false;
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;home()})}
 for(const type of ['sgbuddy:language','sgbuddy:persona','sgbuddy:translations-ready','sgbuddy:weather'])doc.addEventListener(type,schedule);
 for(const sel of ['#todaySection','#nextUpCard','#uxPersonaBanner','.ux-primary-shortcuts','#uxMerliHomeTitle','#uxMerliHomeCopy','#railForm']){
  const node=doc.querySelector(sel);
  if(node)new MutationObserver(schedule).observe(node,{subtree:true,childList:true,characterData:true});
 }
 window.SGBUDDY_HOME_I18N={refresh:schedule,locale:lang};
 schedule();
})();
