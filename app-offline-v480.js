/* V4.8: explicit offline packs, CacheStorage, no map-tile or API caching. */
import {OFFLINE_CACHE,OFFLINE_PACKS,packDone,validateOfflineRequest} from './lib/offline-packs-v480.mjs';
import {offlineText} from './lib/offline-i18n-v480.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
(()=>{
'use strict';
const core=window.SGBUDDY_CORE,home=document.querySelector('.v1-view[data-view="today"]'),account=document.querySelector('.v1-view[data-view="account"]');
if(!core||!home)return;
const key='sgbuddy-v480-offline-downloads';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=k=>offlineText(normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),k);
const dates=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
let last=dates(),busy=null,status='';
const panel=document.createElement('section');panel.id='sgbuddyOffline';panel.className='offline-panel card';panel.setAttribute('aria-live','polite');
const homeTile=document.createElement('section');homeTile.id='sgbuddyOfflineHome';homeTile.className='offline-home card';
const target=account||home;target.append(panel);
home.append(homeTile);
async function present(){
 let hasCache='caches' in window;
 let cache=null,paths=[];
 try{if(hasCache){cache=await caches.open(OFFLINE_CACHE);paths=(await cache.keys()).map(request=>new URL(request.url).pathname)}}catch{hasCache=false}
 const ready=(p)=>hasCache&&packDone(paths,p);
 let buttons=OFFLINE_PACKS.map(p=>{
  const isReady=ready(p),count=p.files.filter(f=>paths.includes(f)).length,when=last[p.id]&&isReady?new Date(last[p.id]).toLocaleString(normalizeLocale(window.SGBUDDY_LANGUAGE||'en')):'';
  return '<div class="offline-pack" data-offline-pack="'+p.id+'"><div class="offline-pack-info"><strong>'+esc(t(p.id))+'</strong><small>'+count+'/'+p.files.length+' '+esc(t('files'))+' · '+esc(isReady?t('ready'):t('missing'))+'</small>'+(when?'<small>'+esc(t('lastDownload'))+': '+esc(when)+'</small>':'')+'</div><div class="offline-pack-actions"><button type="button" data-offline-download="'+p.id+'" '+(busy||!hasCache?'disabled':'')+'>'+esc(busy===p.id?t('downloading'):isReady?t('update'):t('download'))+'</button>'+(count?'<button type="button" data-offline-remove="'+p.id+'" '+(busy?'disabled':'')+'>'+esc(t('remove'))+'</button>':'')+'</div></div>';
 }).join('');
 const online=navigator.onLine;
 homeTile.innerHTML='<div><strong>'+esc(t('heading'))+'</strong><small>'+esc(online?t('online'):t('offlineWarning'))+'</small></div><button type="button" id="offlineHomeOpen">'+esc(t('choose'))+'</button>';
 panel.innerHTML='<div class="label">'+esc(t('offline'))+'</div><h2>'+esc(t('heading'))+'</h2><p>'+esc(t('intro'))+'</p>'+
 '<div class="offline-status">'+esc(status||(!online?t('offlineWarning'):t('local')))+'</div>'+
 '<div class="offline-packs">'+buttons+'</div><p class="offline-disclaimer">'+esc(t('disclaimer'))+'</p><p class="offline-disclaimer">'+esc(t('freshness'))+'</p>';
}
async function downloadPack(id){
 const pack=OFFLINE_PACKS.find(p=>p.id===id);if(!pack||busy||!navigator.onLine)return;
 busy=id;status=t('downloading');await present();
 const cache=await caches.open(OFFLINE_CACHE);
 try{
  // Always fetch from server, validate response and only cache allowlisted same-origin resources.
  const fresh=[];
  for(const file of pack.files){
   if(!validateOfflineRequest(file,location.origin))throw Error('disallowed file');
   const response=await fetch(file,{cache:'no-store',credentials:'same-origin'});
   if(!response.ok||response.type==='opaque'||!String(response.headers.get('content-type')||'').includes('json'))throw Error('file unavailable: '+file);
   fresh.push([file,response.clone()]);
  }
  // Only update after all fetches succeed; previous cached pack remains available on error.
  for(const [file,response] of fresh)await cache.put(file,response);
  last={...last,[id]:new Date().toISOString()};
  try{localStorage.setItem(key,JSON.stringify(last))}catch{}
  status=t('ready');
 }catch{status=t('interrupted')}
 busy=null;await present();
}
async function removePack(id){
 const p=OFFLINE_PACKS.find(x=>x.id===id);if(!p||busy)return;
 const cache=await caches.open(OFFLINE_CACHE);for(const f of p.files)await cache.delete(f);
 const copy={...last};delete copy[id];last=copy;try{localStorage.setItem(key,JSON.stringify(last))}catch{}
 status=t('missing');await present();
}
panel.addEventListener('click',event=>{
 const d=event.target.closest('[data-offline-download]'),r=event.target.closest('[data-offline-remove]');
 if(d)downloadPack(d.dataset.offlineDownload);
 if(r)removePack(r.dataset.offlineRemove);
});
homeTile.addEventListener('click',event=>{
 if(!event.target.closest('#offlineHomeOpen'))return;
 window.SGBUDDY_VIEW_ROUTER?.show?.('account');
 requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}));
});
document.addEventListener('sgbuddy:language',present);
window.addEventListener('online',present);
window.addEventListener('offline',present);
present();
window.SGBUDDY_OFFLINE_V480={packs:OFFLINE_PACKS.map(x=>x.id),cache:OFFLINE_CACHE};
})();
