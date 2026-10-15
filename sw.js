const CACHE = 'sgbuddy-shell-v86';
const SHELL = ['/', '/styles.css', '/app-v090.js', '/app-v100.js', '/app-v110.js', '/app-v120.js', '/app-v140.js', '/app-i18n-v312.js', '/lib/i18n-v312.mjs', '/lib/i18n-food-status-v400.mjs', '/lib/i18n-discover-status-v400.mjs', '/lib/i18n-directory-v410.mjs', '/lib/i18n-contextual-v420.mjs', '/app-ux-v160.js', '/app-i18n-v290.js', '/app-i18n-v300.js', '/app-device-translate-v300.js', '/lib/i18n-extended-v300.mjs', '/lib/i18n-explainers-v300.mjs', '/i18n-v300.css', '/lib/i18n-interface-v290.mjs', '/lib/i18n-shell-v281.mjs', '/ux-v160.css', '/app-i18n-ux-v311.js', '/lib/i18n-ux-v311.mjs', '/app-ux-v170.js', '/app-ux-v422.js', '/ux-v422.css', '/ux-v170.css', '/app-food-v180.js', '/app-apps-v240.js', '/app-travel-v250.js', '/lib/i18n-v280.mjs', '/lib/i18n-content-taxonomy-v310.mjs', '/lib/i18n-facts-v310.mjs', '/lib/i18n-nature-v311.mjs', '/lib/i18n-dishes-v311.mjs', '/lib/i18n-stall-notes-v311.mjs', '/lib/i18n-app-content-v312.mjs', '/lib/i18n-water-v312.mjs', '/lib/i18n-extra-apps-v314.mjs', '/lib/i18n-merli-replies-v315.mjs', '/lib/i18n-app-status-v315.mjs', '/lib/i18n-service-safety-v315.mjs', '/lib/i18n-runtime-v320.mjs', '/lib/i18n-system-v330.mjs', '/app-i18n-system-v330.js', '/lib/i18n-dynamic-v340.mjs', '/app-i18n-dynamic-v340.js', '/lib/i18n-audit-v350.mjs', '/app-i18n-audit-v350.js', '/lib/i18n-classified-v360.mjs', '/app-i18n-classified-v360.js', '/lib/i18n-context-v370.mjs', '/app-i18n-context-v370.js', '/lib/i18n-fallback-v390.mjs', '/app-i18n-fallback-v390.js', '/app-i18n-home-v310.js', '/lib/i18n-home-v310.mjs', '/app-i18n-weather-display-v310.js', '/lib/i18n-weather-display-v310.mjs', '/lib/i18n-home-v311.mjs', '/lib/i18n-weather-home-v311.mjs', '/app-i18n-priority-v440.js', '/app-i18n-food-discover-v450.js', '/app-calendar-v460.js', '/calendar-v460.css', '/lib/calendar-v460.mjs', '/lib/calendar-i18n-v460.mjs', '/data/holidays-2026-2027-v460.json', '/data/event-sources-v470.json', '/app-events-v470.js', '/events-v470.css', '/lib/events-v470.mjs', '/lib/events-i18n-v470.mjs', '/lib/events-content-v480.mjs', '/lib/events-identity-v414.mjs', '/lib/events-weekend-v414.mjs', '/lib/events-explore-v414.mjs', '/lib/events-explore-i18n-v414.mjs', '/lib/events-discovery-v418.mjs', '/lib/events-discovery-i18n-v418.mjs', '/lib/events-source-health-v418.mjs', '/data/events-v470.json', '/app-offline-v480.js', '/app-i18n-runtime-v490.js', '/app-i18n-categories-v4100.js', '/app-i18n-remaining-v411.js', '/app-i18n-home-surface-v412.js', '/lib/i18n-home-surface-v412.mjs', '/lib/i18n-air-v413.mjs', '/lib/i18n-remaining-v411.mjs', '/lib/i18n-categories-v4100.mjs', '/lib/i18n-runtime-v490.mjs', '/offline-v480.css', '/lib/offline-packs-v480.mjs', '/lib/offline-i18n-v480.mjs', '/lib/offline-resilience-v415.mjs', '/lib/offline-resilience-i18n-v415.mjs', '/lib/offline-transaction-v415.mjs', '/lib/offline-freshness-v416.mjs', '/lib/offline-freshness-i18n-v416.mjs', '/lib/offline-device-v417.mjs', '/lib/offline-device-i18n-v417.mjs', '/lib/offline-network-v417.mjs', '/lib/offline-tab-lock-v417.mjs', '/lib/i18n-food-discover-v450.mjs', '/lib/i18n-priority-v440.mjs', '/app-i18n-home-v311.js', '/lib/i18n-place-eta-v320.mjs', '/lib/i18n-civic-v313.mjs', '/lib/i18n-parks-v313.mjs', '/lib/i18n-history-v313.mjs', '/lib/i18n-heritage-v313.mjs', '/lib/i18n-culture-v313.mjs', '/lib/i18n-awards-v313.mjs', '/lib/i18n-app-content2-v313.mjs', '/lib/i18n-app-content3-v313.mjs', '/lib/i18n-app-content4-v313.mjs', '/lib/i18n-app-content5-v313.mjs', '/lib/i18n-guides-v280.mjs', '/lib/i18n-trip-v280.mjs', '/lib/i18n-apps-v280.mjs', '/app-trip-extras-v421.js', '/trip-extras-v421.css', '/lib/trip-calendar-v421.mjs', '/lib/trip-published-events-v421.mjs', '/app-trip-quality-v420.js', '/trip-quality-v420.css', '/lib/trip-insights-v420.mjs', '/app-trip-v260.js', '/app-food-tools-v261.js', '/app-share-v270.js', '/lib/trip-share-v270.mjs', '/trip-share-v270.css', '/food-tools-v261.css', '/data/food-leads-v261.json', '/data/dining-services-v261.json', '/lib/trip-v260.mjs', '/trip-v260.css', '/travel-v250.css', '/data/travel-essentials-v250.json', '/everyday-apps-v240.css', '/theme-polish-v241.css', '/data/everyday-apps-v240.json', '/food-v180.css', '/data/food-stalls-v180.json', '/data/singapore-dishes-v180.json', '/data/nea-closures-v180.json', '/data/official-places-v200.json', '/data/services-v210.json', '/data/vendor-menus-v210.json', '/data/operator-listings-v230.json', '/data/neighbourhoods-v230.json', '/data/guide-stalls-v230.json', '/data/operator-menus-v230.json', '/food-discover-v230.css', '/library-v200.css', '/library-quality-v220.css', '/knowledge-v140.css', '/buddy-v130.css', '/merli-avatar-v3111.css', '/merli-avatar-v3111.js', '/assets/merlion-companion.webp', '/data/facts-published.json', '/discover-v120.css', '/data/discover-v120.json', '/manifest.webmanifest', '/sgbuddy-icon-v2.png', '/sgbuddy-icon-v2.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(c => c.addAll([...new Set(SHELL)]))); });
// V4.8: protect user-downloaded packs across service-worker upgrades.
const PACK_CACHE='sgbuddy-offline-packs-v480';
const SHELL_PATHS=new Set(SHELL.map(path=>new URL(path,self.location.origin).pathname));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
 caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sgbuddy-shell-v')&&key!==CACHE).map(key=>caches.delete(key)))),
 self.clients.claim()
])));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 // Never intercept off-origin maps/tiles, payment flows, or live API routes.
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(!SHELL_PATHS.has(url.pathname)&&request.mode!=='navigate')return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(request);
   if(response.ok&&response.type==='basic'&&SHELL_PATHS.has(url.pathname)){
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,response.clone())).catch(()=>{}));
   }
   return response;
  }catch{
   const downloaded=await caches.open(PACK_CACHE);
   const stored=await downloaded.match(request,{ignoreSearch:true});
   if(stored){
    if(!url.pathname.endsWith('.json'))return stored;
    try{
     if(String(stored.headers.get('content-type')||'').toLowerCase().includes('json')){
      const data=await stored.clone().json();
      if(data&&typeof data==='object'&&!(Object.hasOwn(data,'error')&&Object.keys(data).length===1))return stored;
     }
    }catch{} // corrupt downloaded JSON: prefer the shell snapshot, never fake valid data
   }
   const shell=await caches.open(CACHE);
   return (await shell.match(request,{ignoreSearch:true}))||
          (request.mode==='navigate'?(await shell.match('/')):null)||
          Response.error();
  }
 })());
});
