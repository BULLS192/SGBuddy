/* V4.11 source-locked localization: selected Food options, discover taxonomy,
 * app guide instructions and first-party account validation. No source data.
 */
import {V411_OPTION_KEYS,V411_TEXT_KEYS,V411_OPTIONS,V411_TEXTS,v411Option,v411Text} from './lib/i18n-remaining-v411.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
'use strict';
const doc=document,locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
const norm=x=>String(x??'').replace(/\s+/g,' ').trim();
const allowedOptions=Object.fromEntries(V411_OPTION_KEYS.map(key=>[key,new Set(Object.values(V411_OPTIONS).map(pack=>pack[key]))]));
const allowedTexts=Object.fromEntries(V411_TEXT_KEYS.map(key=>[key,new Set(Object.values(V411_TEXTS).map(pack=>pack[key]))]));
const fields=[
 ['#everydayApps .app-guide-head h3','Apps worth having in Singapore'],
 ['#everydayApps .app-guide-head .label','THE EVERYDAY SINGAPORE APP GUIDE · V2.5'],
 ['#everydayApps .app-guide-safety','Install only from official publishers or individually verified store links. SGBuddy never asks for bank passwords, Singpass credentials or OTPs. Availability, eligibility and merchant acceptance can change.']
];
const accountKeys=[
 'Enter your email and password.','Enter an email and password.',
 'Enter your email address first.','Use a password with at least 8 characters.'
];
const sourceActions=[
 'MICHELIN 2026 listing ↗','CNA 2026 selection ↗','NEA historical award ↗'
];
function setKnown(node,key){
 if(!node||!allowedTexts[key]?.has(norm(node.textContent)))return;
 const next=v411Text(locale(),key);
 if(norm(node.textContent)!==next)node.textContent=next;
}
function updateOption(select,source){
 const opt=[...select.options].find(x=>x.value===source);
 if(!opt||!allowedOptions[source].has(norm(opt.textContent)))return;
 const next=v411Option(locale(),source);
 if(norm(opt.textContent)!==next)opt.textContent=next;
}
function apply(){
 for(const [selector,key] of fields)setKnown(doc.querySelector(selector),key);
 for(const [selector,sources] of [
  ['#discoverCategoryFilter',['Supermarket — operator locator']],
  ['#foodCuisine',['Local hawker','Singapore hawker']],
  ['#foodMeal',['Breakfast','Dessert','Dinner','Drinks','Lunch','Main meals','Snack','Snacks and desserts','Unknown']]
 ]){
  const select=doc.querySelector(selector);
  if(select)for(const source of sources)updateOption(select,source);
 }
 const msg=doc.querySelector('#accountMessage');
 if(msg)for(const key of accountKeys)if(allowedTexts[key].has(norm(msg.textContent))){setKnown(msg,key);break;}
 for(const card of doc.querySelectorAll('#foodCards .food-stall')){
  for(const a of card.querySelectorAll('.food-card-actions a')){
   for(const key of sourceActions){
    if(allowedTexts[key].has(norm(a.textContent))){setKnown(a,key);break}
   }
  }
 }
}
let scheduled=false;
function schedule(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;apply()});
}
for(const ev of ['sgbuddy:language','sgbuddy:discover-tab','sgbuddy:app-library-ready','sgbuddy:discover-places-ready','sgbuddy:persona','sgbuddy:food-view','sgbuddy:translations-ready'])doc.addEventListener(ev,schedule);
for(const selector of ['#discoverCategoryFilter','#foodCuisine','#foodMeal','#foodCards','#everydayApps','#accountMessage']){
 const target=doc.querySelector(selector);
 if(target)new MutationObserver(schedule).observe(target,{subtree:true,childList:true,characterData:true});
}
window.SGBUDDY_V411={apply,option:v411Option,text:v411Text,keys:V411_OPTION_KEYS.length+V411_TEXT_KEYS.length};
schedule();
})();