/* SGBuddy V3: first-party UI strings for every supported locale.
   Proper names, addresses, source facts and user entries are NOT overwritten. */
import {extendedUi,EXTENDED_UI,EXTENDED_KEYS} from './lib/i18n-extended-v300.mjs';
import {normalizeLocale,TRAVEL_UI} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const doc=document;
 const ui=()=>extendedUi(window.SGBUDDY_LANGUAGE||'en');
 const code=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const languageTables=Object.values(EXTENDED_UI);
 const selectors=[
  ['#buddyLauncher > span:last-child','askMerli'],
  ['#merliPersonaNote','merliSubtitle'],
  ['#buddyAskForm button','askButton'],
  ['#merliKnowledgeLibrary .sgb-library-controls option[value="all"]','discoverAllTypes'],
  ['#merliSaveFact','saveFact','icon'],
  ['#merliKnowledgeLibrary .merli-save','save','icon'],
  ['#merliSource','readSource','link'],
  ['.buddy-note','merliNote'],
  ['[data-buddy-action="fact"]','merliTip','icon'],
  ['[data-buddy-action="saved"]','savedFacts','icon'],
  ['#discoverSavedOnly + span','discoverSavedOnly'],
  ['#discoverAreaFilter option[value="all"]','discoverAllAreas'],
  ['#discoverSourceFilter option[value="all"]','discoverAllTypes'],
  ['#discoverQuality summary','discoverAbout'],
  ['#foodExplorer > .label','foodLibrary'],
  ['#foodExplorer > h3','foodTitle'],
  ['#foodExplorer .food-note','foodGuideOnly','skip'],
  ['[data-food-view="stalls"]','foodStalls'],
  ['[data-food-view="dishes"]','foodDishes'],
  ['[data-food-view="menus"]','vendorMenus'],
  ['[data-food-view="hawker-menus"]','brandMenus'],
  ['#foodArea option[value="all"]','allAreas'],
  ['#foodCuisine option[value="all"]','allCuisines'],
  ['#foodMeal option[value="all"]','anyMeal'],
  ['#foodDish option[value="all"]','anyDish'],
  ['#foodLoadMore','showMore'],
  ['#foodPickArea option[value="all"]','anywhere'],
  ['#foodPickCraving option[value="any"]','surprise'],
  ['#foodPickCraving option[value="noodles"]','noodles'],
  ['#foodPickCraving option[value="rice"]','rice'],
  ['#foodPickCraving option[value="soup"]','soup'],
  ['#foodPickCraving option[value="snack"]','snack'],
  ['#foodToolsTitle','foodToolsTitle'],
  ['#foodToolPicker','foodPicker','icon'],
  ['#foodToolServices','foodServices'],
  ['#foodPickButton','foodPickButton','icon'],
  ['#foodPickSaved','foodMyPicks','icon'],
  ['[data-app-view="saved"]','appShortlist','icon'],
  ['[data-app-view="recommended"]','appForMode'],
  ['[data-app-view="essentials"]','appStart'],
  ['[data-app-view="all"]','appAll'],
  ['#appLibraryMore','appShowMore','suffix'],
  ['.app-guide-controls label:nth-child(1)','appSearch','label'],
  ['.app-guide-controls label:nth-child(2)','appCategory','label'],
  ['.app-guide-controls label:nth-child(3)','appDownload','label'],
  ['#sgbFactQuery','askInput','skip'],
  ['#merliKnowledgeLibrary .merli-saved-filter','discoverSavedOnly','label'],
  ['#merliKnowledgeLibrary .merli-more','showMore','suffix']
 ];
 const textSlots=[
  ['#discoverSavedOnly','discoverSavedOnly','checkboxLabel'],
  ['#foodSavedOnly','savedStalls','checkboxLabel'],
  ['#buddyAskInput','askInput','placeholder'],
  ['#foodSearch','foodSearch','placeholder'],
  ['#foodPickResult [data-food-pick-save]','save','buttonIcon'],
  ['#foodCards [data-stall-save]','save','buttonIcon'],
  ['#appLibrarySearch','appSearch','placeholder']
 ];
 const selection=[
  ['#foodExplorer .food-view-tabs','button'],
  ['#foodExplorer .food-controls','option'],
  ['#foodToolsV261 .food-tool-filters','option'],
  ['#everydayApps .app-guide-packs','button']
 ];
 const iconPrefix=/^([☆★✨🍜🌿🛍️📱🩺📚]\s*)+/u;
 // Replace a label only if it matches a known UI translation in any language.
 const matches=(key,text)=>languageTables.some(o=>o[key]===text)||text===EXTENDED_UI.en[key];
 function assign(el,key,mode){
  if(!el||!EXTENDED_KEYS.includes(key))return;
  const label=ui()[key];if(!label)return;
  if(mode==='skip')return;
  if(mode==='placeholder'){
   const current=el.getAttribute('placeholder')||'';
   if(matches(key,current)&&current!==label)el.setAttribute('placeholder',label);
   return;
  }
  if(mode==='checkboxLabel'){
   const parent=el.closest('label'),text=[...(parent?.childNodes||[])].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
   if(text&&matches(key,text.textContent.trim()))text.textContent=' '+label;
   return;
  }
  if(mode==='label'){
   const text=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
   if(text&&matches(key,text.textContent.trim()))text.textContent=label;
   return;
  }
  if(mode==='suffix'){
   const raw=el.textContent?.trim()||'',source=raw.split(' · ')[0].trim();
   if(matches(key,source))el.textContent=label+raw.slice(raw.indexOf(source)+source.length);
   return;
  }
  const current=el.textContent?.trim()||'';
  const prefix=current.match(iconPrefix)?.[0]||'';
  const value=prefix?current.slice(prefix.length).trim():current;
  const icon=mode==='icon'||mode==='buttonIcon';
  if(matches(key,value)||value===label){
   const next=icon?prefix+label:label;
   if(current!==next)el.textContent=next;
  }
 }
 function localize(){
  for(const [selector,key,mode] of selectors){const el=doc.querySelector(selector);assign(el,key,mode);}
  for(const [selector,key,mode] of textSlots)for(const el of doc.querySelectorAll(selector))assign(el,key,mode);
  const search=doc.getElementById('sgbFactQuery');
  if(search && search.placeholder==='Search facts…')search.placeholder=ui().discoverIntro;
  // Stable machine-readable values remain in English; only rendered labels change.
  for(const [container,selector] of selection)for(const el of doc.querySelectorAll(container+' '+selector)){
    if(el.matches('[data-food-view],[data-app-view]'))continue;
    if(el.closest('.food-card,.app-guide-item,.sgb-fact'))continue;
    for(const key of ['allAreas','allCuisines','anyMeal','anyDish','anywhere','surprise','noodles','rice','soup','snack']){
      const value=(el.textContent||'').trim();
      if(matches(key,value)){assign(el,key);break;}
    }
  }
  doc.documentElement.lang=code();
 }
 let queued=false;
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{localize()}catch(e){console.warn('SGBuddy translation surface:',e?.message)}})}
 doc.addEventListener('sgbuddy:language',schedule);
 for(const name of ['sgbuddy:persona','sgbuddy:discover-tab','sgbuddy:knowledge-saved'])doc.addEventListener(name,schedule);
 const roots=['#discoverHub','#buddyPanel','#everydayApps','#foodExplorer','#accountSheet'];
 for(const selector of roots){const el=doc.querySelector(selector);if(el)new MutationObserver(schedule).observe(el,{subtree:true,childList:true,characterData:true});}
 window.SGBUDDY_I18N_V300={lookup:key=>ui()[key],locale:code,coverage:()=>EXTENDED_KEYS.length};
 schedule();
})();
