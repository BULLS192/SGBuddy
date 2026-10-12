/* V3.10 only recognized official weather category names and PSI quality
 * labels within first-party UI anchors. Never modify numbers, forecasts,
 * operator alerts, user places or unrecognized provider text. */
import {localizedWeatherLabel,localizedPsiLabel} from './lib/i18n-weather-display-v310.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
 const doc=document,locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const fields=[['#weatherLabel',localizedWeatherLabel],['#envPsi',localizedPsiLabel]];
 function apply(){
  for(const [selector,translate] of fields){
   const node=doc.querySelector(selector);if(!node)continue;
   const current=(node.textContent||'').trim(),next=translate(locale(),current);
   if(next!==current)node.textContent=next;
  }
 }
 let pending=false;
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply()})}
 for(const event of ['sgbuddy:language','sgbuddy:weather','sgbuddy:translations-ready'])doc.addEventListener(event,schedule);
 for(const [selector] of fields){
  const node=doc.querySelector(selector);
  if(node)new MutationObserver(schedule).observe(node,{childList:true,characterData:true,subtree:true});
 }
 window.SGBUDDY_WEATHER_DISPLAY_I18N={locale,refresh:schedule};
 schedule();
})();
