/* SGBuddy V4.10 scoped category + Account/Food control localization.
 * Distinguish stable filter value from displayed label, never translate provider
 * identity, source records, raw API endpoints, official location or operator text. */
import {DISCOVER_KIND_V4100,CONTROL_V4100_KEYS,KIND_V4100,CONTROL_V4100,kindText,controlText} from './lib/i18n-categories-v4100.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
'use strict';
const doc=document, locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
const known=Object.fromEntries(CONTROL_V4100_KEYS.map(key=>[key,new Set(Object.values(CONTROL_V4100).map(pack=>pack[key]))]));
const controlled=[
 ['#accountSheet .install-sheet-card > .label','accountBadge'],
 ['#dataCorePanel .developer-data > summary','developerEndpoints'],
 ['#dataCorePanel [data-endpoint="/api/snapshot"] > span','unifiedContext'],
 ['#dataCorePanel [data-endpoint="/api/health"] > span','systemHealth'],
 ['#passwordResetPanel .account-field','accountNewPassword','directText'],
 ['#newPasswordInput','accountResetPlaceholder','placeholder'],
 ['#foodExplorer .food-view-tabs','foodViewAria','aria-label'],
 ['#foodSearch','foodSearchAria','aria-label'],
 ['#foodArea','foodAreaAria','aria-label'],
 ['#foodCuisine','foodCuisineAria','aria-label'],
 ['#foodMeal','foodMealAria','aria-label'],
 ['#foodDish','foodDishAria','aria-label'],
 ['#foodAwardYear','foodAwardAria','aria-label'],
 ['#foodAwardYear option[value="all"]','allEvidenceYears'],
 ['#foodAwardYear option[value="editorial"]','editorialLeads']
];
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
const directText=el=>[...el.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&norm(node.textContent));
function get(node,field){return field==='aria-label'?node.getAttribute('aria-label'):field==='placeholder'?node.getAttribute('placeholder'):node.textContent}
function set(node,field,text){if(field==='aria-label'||field==='placeholder')node.setAttribute(field,text);else node.textContent=text}
function updateControls(){
 for(const [selector,key,mode] of controlled){
  const el=doc.querySelector(selector);if(!el)continue;
  const node=mode==='directText'?directText(el):el;
  if(!node)continue;
  const field=mode==='aria-label'||mode==='placeholder'?mode:'textContent';
  const current=norm(get(node,field));
  if(!known[key].has(current))continue;
  const desired=controlText(locale(),key);
  if(desired&&current!==desired)set(node,field,desired);
 }
}
function updateCategories(){
 const select=doc.querySelector('#discoverCategoryFilter');
 if(!select)return;
 for(const option of select.querySelectorAll('option')){
  const source=option.value;
  if(!DISCOVER_KIND_V4100.includes(source))continue;
  const rendered=norm(option.textContent);
  // Exact source and 12 authored translations are eligible. Keep unexpected
  // provider text untouched, even if an external dataset reuses the value.
  const valid=Object.values(KIND_V4100).some(pack=>pack[source]===rendered);
  if(!valid)continue;
  const desired=kindText(locale(),source);
  if(desired!==rendered)option.textContent=desired;
 }
}
function apply(){updateCategories();updateControls()}
let pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply()})}
for(const ev of ['sgbuddy:language','sgbuddy:discover-places-ready','sgbuddy:discover-tab','sgbuddy:translations-ready','sgbuddy:food-view','sgbuddy:account'])doc.addEventListener(ev,schedule);
for(const selector of ['#discoverCategoryFilter','#foodExplorer','#accountSheet','#dataCorePanel']){
 const node=doc.querySelector(selector);
 if(node)new MutationObserver(schedule).observe(node,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder']});
}
window.SGBUDDY_V4100={apply,kindText,controlText,count:DISCOVER_KIND_V4100.length+CONTROL_V4100_KEYS.length};
schedule();
})();