/* V3.10 first-party homepage localization fix. Explicit anchors, exact source values.
 * Dynamic transport names, measured temperatures, provider notices and user values are never translated. */
import {HOME_KEYS,HOME_MESSAGES,homeText} from './lib/i18n-home-v310.mjs';
import {CONTEXT_MESSAGES,contextMode} from './lib/i18n-context-v370.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document, lang=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const known=Object.fromEntries(HOME_KEYS.map(key=>[key,new Set(Object.values(HOME_MESSAGES).map(row=>row[key]))]));
 const targets=[
  ['#railForm .label','stationLabel'],
  ['#railForm h3','stationHeading'],
  ['#transportSection .rail-search .label','stationLabel'],
  ['#transportSection .rail-search h3','stationHeading'],
  ['#railForm button','check'],
  ['#uxChangeMode','changeMode'],
  ['#uxMerliHomeAsk','askMerli'],
  ['#uxMerliHomeCopy','merliPrompt'],
  ['#nextUpCard .next-up-head .label','nextLabel'],
  ['#nextUpTitle','departureImminent','departureSoon'],
  ['#nextUpCopy','departureCopy'],
  ['#nextUpAction','setup'],
  ['#placeLabel','locationNear'],
  ['#locationStatus','locationPrivacy'],
  ['#environmentCard .label','weatherDetails'],
  ['#uxHomeWeatherDetails','weatherDetails']
 ];
 // Actual static heading on the home context card, not raw weather/provider values.
 const structural=[
  ['#todaySection .context-card .label','contextLabel'],
  ['#todaySection .today-context .label','contextLabel'],
  ['#contextCard .label','contextLabel'],
  ['.context-card > .label','contextLabel'],
  ['#stationForm .label','stationLabel'],
  ['#stationForm h3','stationHeading']
 ];
 const state=new WeakMap();
 function change(node,keys){
  if(!node)return;
  const current=(node.textContent||'').trim(),prev=state.get(node);
  const key=keys.find(k=>known[k].has(current))||
    (prev&&keys.includes(prev.key)&&prev.rendered===current?prev.key:null);
  if(!key)return;
  const value=homeText(lang(),key);
  if(value!==current)node.textContent=value;
  state.set(node,{key,rendered:value});
 }
 function persona(){
  const mode=window.SGBUDDY_CORE?.state?.mode||'resident';
  if(!CONTEXT_MESSAGES.en.modes[mode])return;
  const title=doc.querySelector('#uxPersonaName');
  if(title){
   const current=(title.textContent||'').trim();
   const variants=Object.values(CONTEXT_MESSAGES).map(d=>d.modes[mode].label+' '+d.globals?.modeSuffix).filter(Boolean);
   // Legacy suffix is English "mode", in all old mode-specific labels.
   const authorized=Object.values(CONTEXT_MESSAGES).some(d=>current===d.modes[mode].label+' mode')||
    current===contextMode(lang(),mode,'label')+' '+homeText(lang(),'modeSuffix')||
    state.get(title)?.rendered===current;
   if(authorized){
    const value=contextMode(lang(),mode,'label')+' '+homeText(lang(),'modeSuffix');
    if(current!==value)title.textContent=value;
    state.set(title,{rendered:value});
   }
  }
  if(mode==='resident'){
   change(doc.querySelector('#uxPersonaDescription'),['residentPrompt']);
   const headline=doc.querySelector('#uxMerliHomeTitle');
   if(headline){
    const current=headline.textContent.trim();
    const authorized=Object.values(CONTEXT_MESSAGES).some(d=>current==='Merli · '+d.modes.resident.label+' tips')||
       (state.get(headline)?.rendered===current);
    if(authorized){
     const value='Merli · '+contextMode(lang(),'resident','label')+' '+homeText(lang(),'merliTips');
     if(current!==value)headline.textContent=value;
     state.set(headline,{rendered:value});
    }
   }
  }
 }
 let queued=false;
 function apply(){
  for(const [sel,...keys] of [...targets,...structural])
   doc.querySelectorAll(sel).forEach(el=>change(el,keys));
  // The following stable home labels are unique within the Today's context block.
  for(const el of doc.querySelectorAll('#todaySection .label,#todaySection h3')){
   const current=(el.textContent||'').trim();
   if(known.contextLabel.has(current))change(el,['contextLabel']);
   if(known.railStatus.has(current))change(el,['railStatus']);
   if(known.roadIncidents.has(current))change(el,['roadIncidents']);
   if(known.weatherDetails.has(current))change(el,['weatherDetails']);
  }
  persona();
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}
 for(const evt of ['sgbuddy:language','sgbuddy:persona','sgbuddy:weather','sgbuddy:translations-ready','sgbuddy:transport','sgbuddy:location'])
  doc.addEventListener(evt,schedule);
 for(const root of ['#todaySection','#nextUpCard','#transportSection']){
  const el=doc.querySelector(root);
  if(el)new MutationObserver(schedule).observe(el,{childList:true,characterData:true,subtree:true});
 }
 window.SGBUDDY_HOME_I18N={locale:lang,keys:HOME_KEYS.length,refresh:schedule};
 schedule();
})();
