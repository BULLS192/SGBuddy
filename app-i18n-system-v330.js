/* V3.3: reviewable, scoped localizations for remaining account and transport UI.
 * Only exact first-party English source strings are eligible. Never sweep arbitrary DOM,
 * vendor/API errors, prices, addresses, account email or server-generated cautions. */
import {SYSTEM_KEYS,SYSTEM_ENGLISH,SYSTEM_MESSAGES,SYSTEM_SOURCE_KEYS,systemText} from './lib/i18n-system-v330.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 const doc=document;
 const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const bindings=[
  ['#accountSheetTitle','accountTitle'],['#accountSheet .account-intro','accountIntro'],
  ['#accountSignedOut .account-note','accountVerificationNote'],
  ['#accountSignedIn .account-note','accountOfflineNote'],
  ['#passwordResetPanel .account-reset-head strong','resetTitle'],
  ['#passwordResetPanel .account-reset-head span','resetHint'],
  ['#forgotPasswordButton','forgotPassword'],
  ['#updatePasswordButton','resetAction'],
  ['#accountSyncButton','accountSyncAction'],
  ['#accountHubOpen','accountHubOpen'],
  ['#accountHubCopy','accountHubIntro'],
  ['#profileId','notLinked'],
  ['#v110CompareCard .compare-head .label','compareTitle'],
  ['#v110CompareCard .compare-head h3','compareHeadline'],
  ['#v110CompareCard > p','compareDescription'],
  ['#v110CompareCard #v110CompareDestination','comparePlaceholder','placeholder'],
  ['#v110PlaceSort option[value="best"]','sortBest'],
  ['#v110PlaceSort option[value="nearest"]','sortNearest']
 ];
 const dynamicSelectors=['#profileDescription','#profileSyncBadge','#v110CompareResults .empty-inline','#v110OpenTransitRoute'];
 const seen=new WeakMap();
 let queued=false;
 function attempt(node,key,field='textContent'){
  if(!node)return;
  const original=SYSTEM_ENGLISH[key];
  const current=String(field==='placeholder'?node.getAttribute('placeholder')??'':node.textContent??'').trim();
  const last=seen.get(node);
  // Source lock: never overwrite unexpected text owned by users, APIs or another component.
  if(current!==original&&!(last?.key===key&&current===last?.rendered))return;
  const next=systemText(locale(),key);
  if(current!==next){if(field==='placeholder')node.setAttribute('placeholder',next);else node.textContent=next}
  seen.set(node,{key,rendered:next});
 }
 function dynamic(node){
  if(!node)return;
  const current=(node.textContent||'').trim();
  const previous=seen.get(node);
  const key=SYSTEM_SOURCE_KEYS[current]||(previous?.rendered===current?previous.key:null);
  if(key)attempt(node,key);
 }
 function apply(){
  for(const [selector,key,field] of bindings)attempt(doc.querySelector(selector),key,field||'textContent');
  for(const selector of dynamicSelectors)dynamic(doc.querySelector(selector));
 }
 function schedule(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
 }
 doc.addEventListener('sgbuddy:language',schedule);
 doc.addEventListener('sgbuddy:persona',schedule);
 const targets=['#accountSheet','#accountSection','#v110CompareCard','#v110PlaceFilters','#profileDescription','#profileSyncBadge','#profileId'];
 for(const selector of targets){const target=doc.querySelector(selector);if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:true,characterData:true,attributes:false})}
 // The comparison card can be mounted after translations initialize.
 // v1.1 mounts synchronously before this module, but expose refresh for future additions.
 window.SGBUDDY_SYSTEM_I18N={text:systemText,locale,keys:SYSTEM_KEYS.length,refresh:schedule};
 schedule();
})();