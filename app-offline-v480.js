/* V4.8: explicit offline packs, CacheStorage, no map-tile or API caching. */
import {OFFLINE_CACHE,OFFLINE_PACKS,packDone,validateOfflineRequest} from './lib/offline-packs-v480.mjs';
import {offlineText} from './lib/offline-i18n-v480.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
import {inspectOfflinePack,estimateOfflineStorage} from './lib/offline-resilience-v415.mjs';
import {durableOfflineUpdate,recoverInterruptedPack} from './lib/offline-transaction-v415.mjs';
import {offline415Text} from './lib/offline-resilience-i18n-v415.mjs';
import {checkDownloadedPublicPacks} from './lib/offline-freshness-v416.mjs';
import {offline416Text} from './lib/offline-freshness-i18n-v416.mjs';
(()=>{
'use strict';
const core=window.SGBUDDY_CORE,home=document.querySelector('.v1-view[data-view="today"]'),account=document.querySelector('.v1-view[data-view="account"]');
if(!core||!home)return;
const key='sgbuddy-v480-offline-downloads';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=k=>offlineText(normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),k);
const tx=(k,args)=>offline415Text(normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),k,args);
const v416=(key,args)=>offline416Text(normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),key,args);
const dates=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
let last=dates(),busy=null,status='',freshnessCheck=null;
const online=()=>navigator.onLine;
const lock=(id,callback)=>navigator.locks?.request?navigator.locks.request('sgbuddy-offline-'+id,callback):callback();
// Match the download/remove lock when recovering at boot. Otherwise a second
// tab could roll back the first tab's still-active transaction.
const recovery=(async()=>{
 if(!('caches' in window))return [];
 try{
  const rows=[];
  for(const pack of OFFLINE_PACKS){
   rows.push({id:pack.id,...await lock(pack.id,()=>recoverInterruptedPack(caches,pack))});
  }
  return rows;
 }catch{return [{state:'failed'}]}
})();
recovery.then(rows=>{if(rows.some(r=>r.state==='failed'))status=tx('recoveryFailed');else if(rows.some(r=>r.state==='restored'))status=tx('restored');present()});
const panel=document.createElement('section');panel.id='sgbuddyOffline';panel.className='offline-panel card';panel.setAttribute('aria-live','polite');
const homeTile=document.createElement('section');homeTile.id='sgbuddyOfflineHome';homeTile.className='offline-home card';
const target=account||home;target.append(panel);
home.append(homeTile);
async function present(){
 await recovery;
 let hasCache='caches' in window,details=new Map();
 try{
  if(hasCache){
   const cache=await caches.open(OFFLINE_CACHE);
   for(const p of OFFLINE_PACKS)details.set(p.id,await inspectOfflinePack(cache,p,last[p.id]));
  }
 }catch{hasCache=false;details=new Map();}
 const storage=await estimateOfflineStorage(navigator.storage),mb=n=>(n/1048576).toFixed(1)+' MB';
 const connected=online();
 const buttons=OFFLINE_PACKS.map(p=>{
  const info=details.get(p.id)||{valid:0,total:p.files.length,complete:false,damaged:false,partial:false,freshness:'unknown'};
  const when=info.complete&&last[p.id]?new Date(last[p.id]).toLocaleString(normalizeLocale(window.SGBUDDY_LANGUAGE||'en')):'';
  const warning=info.damaged?tx('damaged'):info.partial?tx('incomplete'):info.complete&&info.freshness!=='recent'?tx('stale'):'';
  const scan=freshnessCheck?.get(p.id);
  const scanText=scan?.present?[scan.changed?v416('changed',{count:scan.changed}):'',scan.same?v416('same',{count:scan.same}):'',scan.unknown?v416('unknown',{count:scan.unknown}):''].filter(Boolean).join(' · '):'';
  return '<div class="offline-pack" data-offline-pack="'+p.id+'"><div class="offline-pack-info"><strong>'+esc(t(p.id))+'</strong><small>'+info.valid+'/'+info.total+' '+esc(t('files'))+' · '+esc(info.complete?t('ready'):t('missing'))+'</small>'+(when?'<small>'+esc(t('lastDownload'))+': '+esc(when)+'</small>':'')+(warning?'<small class="offline-integrity">'+esc(warning)+'</small>':'')+(scanText?'<small class="offline-integrity">'+esc(scanText)+'</small>':'')+'</div><div class="offline-pack-actions"><button type="button" data-offline-download="'+p.id+'" '+(busy||!hasCache||!connected?'disabled':'')+'>'+esc(busy===p.id?t('downloading'):info.complete?t('update'):t('download'))+'</button>'+(info.present?'<button type="button" data-offline-remove="'+p.id+'" '+(busy?'disabled':'')+'>'+esc(t('remove'))+'</button>':'')+'</div></div>';
 }).join('');
 const readyCount=[...details.values()].filter(x=>x.complete).length;
 homeTile.innerHTML='<div><strong>'+esc(t('heading'))+'</strong><small>'+esc(connected?t('online'):t('offlineWarning'))+'</small></div><button type="button" id="offlineHomeOpen">'+esc(t('choose'))+'</button>';
 const usage=storage.supported?tx('usage',{used:mb(storage.usage),total:mb(storage.quota)}):'';
 panel.innerHTML='<div class="label">'+esc(t('offline'))+'</div><h2>'+esc(t('heading'))+'</h2><p>'+esc(t('intro'))+'</p>'+
 '<div class="offline-status">'+esc(status||(!connected?t('offlineWarning'):t('local')))+'</div>'+
 (storage.supported?'<div class="offline-storage">'+esc(usage)+(storage.low?' · '+esc(tx('lowStorage')):'')+'</div>':'')+
 '<div class="offline-readiness"><strong>'+esc(tx('offlineSummary'))+'</strong><small>'+esc(tx('readyCount',{count:readyCount,total:OFFLINE_PACKS.length}))+'</small><small>'+esc(t('disclaimer'))+'</small></div>'+
 '<div class="offline-manager-actions"><button type="button" data-offline-check-changes '+(busy||!connected||!hasCache||![...details.values()].some(x=>x.present)?'disabled':'')+'>'+esc(busy==='checking'?v416('checking'):v416('check'))+'</button><button type="button" data-offline-refresh-all '+(busy||!connected||!hasCache||![...details.values()].some(x=>x.present)?'disabled':'')+'>'+esc(tx('refreshAll'))+'</button>'+
 (typeof navigator.storage?.persist==='function'?'<button type="button" data-offline-persist>'+esc(tx('persistence'))+'</button>':'')+'</div>'+
 '<div class="offline-packs">'+buttons+'</div><p class="offline-disclaimer">'+esc(v416('note'))+' '+esc(t('freshness'))+'</p>';
}
async function checkForChanges(){
 if(busy||!online()||!('caches' in window))return;
 await recovery;
 busy='checking';status=v416('checking');await present();
 try{
  const cache=await caches.open(OFFLINE_CACHE);
  const rows=await checkDownloadedPublicPacks(cache,OFFLINE_PACKS,{
   origin:location.origin,
   probe:file=>fetch(file,{method:'HEAD',cache:'no-store',credentials:'same-origin',redirect:'error'})
  });
  freshnessCheck=new Map(rows.map(row=>[row.id,row]));
  const totals={present:0,changed:0,same:0,unknown:0};
  for(const row of rows)for(const key of Object.keys(totals))totals[key]+=row[key];
  status=!totals.present?v416('noPacks'):[totals.changed?v416('changed',{count:totals.changed}):'',
   totals.same?v416('same',{count:totals.same}):'',totals.unknown?v416('unknown',{count:totals.unknown}):''].filter(Boolean).join(' · ');
 }catch{status=v416('unknown',{count:0})}
 busy=null;await present();
}
async function downloadPack(id){
 const pack=OFFLINE_PACKS.find(p=>p.id===id);if(!pack||busy||!online())return;
 await recovery;
 busy=id;status=t('downloading');await present();
 try{
  await lock(id,()=>durableOfflineUpdate(caches,pack,{
   validateFile:file=>validateOfflineRequest(file,location.origin),
   fetchFile:file=>fetch(file,{cache:'no-store',credentials:'same-origin'})
  }));
  freshnessCheck=null;
  last={...last,[id]:new Date().toISOString()};
  try{localStorage.setItem(key,JSON.stringify(last))}catch{}
  status=t('ready');
 }catch(error){
  status=error?.name==='QuotaExceededError'||/quota|storage/i.test(String(error?.message||''))?tx('lowStorage'):t('interrupted');
 }
 busy=null;await present();
}
async function refreshDownloadedPacks(){
 if(busy||!online()||!('caches' in window))return;
 await recovery;
 busy='all';status=tx('refreshingAll');await present();
 let count=0,errors=0;
 const previous=await caches.open(OFFLINE_CACHE);
 for(const pack of OFFLINE_PACKS){
  const info=await inspectOfflinePack(previous,pack,last[pack.id]);
  if(!info.present)continue; // never silently opt a user into a new pack
  try{
   await lock(pack.id,()=>durableOfflineUpdate(caches,pack,{
    validateFile:file=>validateOfflineRequest(file,location.origin),
    fetchFile:file=>fetch(file,{cache:'no-store',credentials:'same-origin'})
   }));
   freshnessCheck=null;
   last={...last,[pack.id]:new Date().toISOString()};
   try{localStorage.setItem(key,JSON.stringify(last))}catch{}
   count++;
  }catch{errors++;}
 }
 status=count?tx('refreshedAll',{count})+(errors?' · '+t('interrupted'):''):tx(errors?'recoveryFailed':'refreshNone');
 busy=null;await present();
}
async function requestPersistence(){
 if(busy||typeof navigator.storage?.persist!=='function')return;
 try{const granted=await navigator.storage.persist();status=tx(granted?'persisted':'persistDenied')}
 catch{status=tx('persistDenied')}
 await present();
}
async function removePack(id){
 const p=OFFLINE_PACKS.find(x=>x.id===id);if(!p||busy)return;
 await recovery;
 busy=id;await present();
 try{
  // An opt-out must never interleave with a refresh in another browser tab.
  await lock(id,async()=>{
   const previous=await recoverInterruptedPack(caches,p);
   if(previous.state==='failed')throw Error('offline recovery unresolved');
   const cache=await caches.open(OFFLINE_CACHE);
   for(const file of p.files)await cache.delete(file);
  });
  freshnessCheck=null;
  const copy={...last};delete copy[id];last=copy;
  try{localStorage.setItem(key,JSON.stringify(last))}catch{}
  status=t('missing');
 }catch{status=tx('recoveryFailed')}
 busy=null;await present();
}
panel.addEventListener('click',event=>{
 const d=event.target.closest('[data-offline-download]'),r=event.target.closest('[data-offline-remove]');
 if(event.target.closest('[data-offline-check-changes]')){checkForChanges();return}
 if(event.target.closest('[data-offline-refresh-all]')){refreshDownloadedPacks();return}
 if(event.target.closest('[data-offline-persist]')){requestPersistence();return}
 if(d)downloadPack(d.dataset.offlineDownload);
 if(r)removePack(r.dataset.offlineRemove);
});
homeTile.addEventListener('click',event=>{
 if(!event.target.closest('#offlineHomeOpen'))return;
 window.SGBUDDY_VIEW_ROUTER?.show?.('account');
 requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}));
});
document.addEventListener('sgbuddy:language',present);
window.addEventListener('online',()=>{status=tx('reconnected');present()});
window.addEventListener('offline',()=>{status='';present()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)present()});
present();
window.SGBUDDY_OFFLINE_V480={packs:OFFLINE_PACKS.map(x=>x.id),cache:OFFLINE_CACHE,version:'4.15',freshnessPreview:'4.16-wave1'};
})();
