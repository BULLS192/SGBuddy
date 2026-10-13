/* SGBuddy V4.4: explicit source-locked first-party DOM translation.
 * Scoped selectors only; never translate operator/user fields or original MUIS notices.
 * Re-rendered Food buttons and saved panels update without losing selection.
 */
import {PRIORITY_V440_KEYS,PRIORITY_V440_MESSAGES,priorityText} from './lib/i18n-priority-v440.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 'use strict';
 const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 // All text here is authored by SGBuddy; never target whole cards or external data.
 const anchors=[
  ['#discoverHub .discover-intro > .label','discoverEyebrow'],
  ['#discoverHub .discover-tabs','discoverCategories','aria-label'],
  ['#discoverQuality summary','discoverAbout'],
  ['#discoverQuality a[href*="chas.sg/clinic-locator"]','discoverChas'],
  ['#discoverQuality a[href*="sfa.gov.sg"]','discoverFoodLic'],
  ['#accountSheetTitle','accountTitle'],
  ['#accountSheet .account-intro','accountIntro'],
  ['#forgotPasswordButton','accountForgot'],
  ['#accountSignedOut > .account-note','accountNewNote'],
  ['#accountSignedIn > .account-note','accountOffline'],
  ['#uxSavedView .ux-saved-header h2','savedTitle'],
  ['#uxSavedView .ux-saved-header p','savedIntro'],
  ['#uxSavedView > section.card:nth-of-type(1) > .label','savedEyebrow'],
  ['#uxSavedView > section.card:nth-of-type(1) > h3','savedItems'],
  ['#uxSavedView > section.card:nth-of-type(2) > .label','savedJourneys'],
  ['#uxSavedView > section.card:nth-of-type(2) > h3','savedTransport'],
  ['#uxSavedView > section.card:nth-of-type(2) > p','savedTransportIntro'],
  ['#uxSavedView > section.card:nth-of-type(2) > button','savedOpen'],
  ['#foodExplorer > .label','foodLibrary'],
  ['#foodExplorer label.food-saved','foodSavedOnly','textNode'],
  ['#foodLoadMore','foodMore'],
  ['#foodCards .food-stall [data-stall-save]','foodSave','saveState'],
  ['#foodCards .food-stall .food-card-actions a','foodSearch','findText'],
  ['#foodCards .food-stall [data-stall-address]','foodAddress'],
  ['#tripIntelligence .trip-intelligence-head .label','todayTrip'],
  ['#personaFocus .persona-focus-head .label','todayForYou'],
  ['#editPersonaButton','todayChange']
 ];
 const forms=Object.fromEntries(PRIORITY_V440_KEYS.map(key=>[key,new Set(Object.values(PRIORITY_V440_MESSAGES).map(dict=>dict[key]))]));
 const history=new WeakMap();
 const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
 const textNode=el=>[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&norm(n.textContent));
 function applyNode(el,key,kind='textContent'){
  if(kind==='findText'&&el.tagName==='A'&&!norm(el.textContent).includes('Search location')&&!forms[key].has(norm(el.textContent)))return;
  if(kind==='saveState'){
   key=el.getAttribute('aria-pressed')==='true'?'foodSaved':'foodSave';
  }
  const text=kind==='textNode'?textNode(el):null;
  const current=norm(kind==='aria-label'?el.getAttribute(kind):text?text.textContent:el.textContent);
  const previous=history.get(kind==='textNode'?text:el);
  // Allow source-English and our authored locale variants, but never unknown/user text.
  if(!forms[key]?.has(current)&&!(key==='discoverEyebrow'&&current==='SINGAPORE DISCOVER')&&!(previous?.key===key&&previous.rendered===current))return;
  const translated=priorityText(locale(),key);
  if(!translated||translated===current)return;
  if(kind==='aria-label')el.setAttribute('aria-label',translated);
  else if(kind==='textNode')text.textContent=' '+translated;
  else el.textContent=translated;
  history.set(kind==='textNode'?text:el,{key,rendered:translated});
 }
 function apply(){
  for(const [selector,key,kind] of anchors){
   for(const el of document.querySelectorAll(selector))applyNode(el,key,kind);
  }
 }
 let pending=false;
 function schedule(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;apply()});
 }
 for(const event of ['sgbuddy:language','sgbuddy:translations-ready','sgbuddy:persona','sgbuddy:discover-tab','sgbuddy:food-view','sgbuddy:knowledge-saved','sgbuddy:account'])
  document.addEventListener(event,schedule);
 const observer=new MutationObserver(schedule);
 for(const selector of ['#accountSheet','#uxSavedView','#discoverHub','#foodExplorer','#tripIntelligence','#personaFocus']){
  const node=document.querySelector(selector);
  if(node)observer.observe(node,{subtree:true,childList:true,characterData:true});
 }
 window.SGBUDDY_PRIORITY_V440={apply,keys:PRIORITY_V440_KEYS.length,text:priorityText};
 schedule();
})();
