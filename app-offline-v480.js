/* V4.8: explicit offline packs, CacheStorage, no map-tile or API caching. */
import {OFFLINE_CACHE,OFFLINE_PACKS,packDone,validateOfflineRequest} from './lib/offline-packs-v480.mjs';
import {offlineText} from './lib/offline-i18n-v480.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
import {inspectOfflinePack,estimateOfflineStorage} from './lib/offline-resilience-v415.mjs';
import {durableOfflineUpdate,recoverInterruptedPack} from './lib/offline-transaction-v415.mjs';
import {offline415Text} from './lib/offline-resilience-i18n-v415.mjs';
import {checkDownloadedPublicPacks,planSelectiveOfflineUpdate} from './lib/offline-freshness-v416.mjs';
import {offline416Text} from './lib/offline-freshness-i18n-v416.mjs';
import {inspectOfflineDevice} from './lib/offline-device-v417.mjs';
import {offlineDeviceText} from './lib/offline-device-i18n-v417.mjs';
import {fetchOfflineWithTimeout} from './lib/offline-network-v417.mjs';
import {canLockOfflinePacks,withOfflinePackLock} from './lib/offline-tab-lock-v417.mjs';
(()=>{
'use strict';
const core=window.SGBUDDY_CORE,home=document.querySelector('.v1-view[data-view="today"]'),account=document.querySelector('.v1-view[data-view="account"]');
if(!core||!home)return;
const key='sgbuddy-v480-offline-downloads';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=k=>offlineText(normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),k);
const tx=(k,args)=>offline415Text(normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),k,args);
const v416=(key,args)=>offline416Text(normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),key,args);
const v417=(key,args)=>offlineDeviceText(normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),key,args);
const dates=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
let last=dates(),busy=null,status='',freshnessCheck=null,deviceCheck=null;
const online=()=>navigator.onLine;
const canLock=()=>canLockOfflinePacks(navigator.locks);
const lock=(id,callback)=>withOfflinePackLock(id,callback,navigator.locks);
// Match the download/remove lock when recovering at boot. Otherwise a second
// tab could roll back the first tab's still-active transaction.
const recovery=(async()=>{
 if(!('caches' in window)||!canLock())return [];
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
   // Reading the panel must not create an empty user-download cache.
   const existing=await caches.keys();
   if(existing.includes(OFFLINE_CACHE)){
    const cache=await caches.open(OFFLINE_CACHE);
    for(const p of OFFLINE_PACKS)details.set(p.id,await inspectOfflinePack(cache,p,last[p.id]));
   }
  }
 }catch{hasCache=false;details=new Map();}
 const scanRows=freshnessCheck?[...freshnessCheck.values()]:[];
 const scanTotals={present:0,changed:0,same:0,unknown:0};
 for(const row of scanRows)for(const field of Object.keys(scanTotals))scanTotals[field]+=row[field];
 const scanSummary=freshnessCheck?(!scanTotals.present?v416('noPacks'):
  [scanTotals.changed?v416('changed',{count:scanTotals.changed}):'',
   scanTotals.same?v416('same',{count:scanTotals.same}):'',
   scanTotals.unknown?v416('unknown',{count:scanTotals.unknown}):''].filter(Boolean).join(' · ')):'';
 const diagnostics=deviceCheck?[deviceCheck.level==='unavailable'?v417('unavailable'):
 deviceCheck.level==='attention'?v417('attention'):deviceCheck.level==='ready'?
 v417('ready',{count:deviceCheck.ready,total:deviceCheck.total}):v417('none'),
 deviceCheck.supported&&!deviceCheck.controlled?v417('uncontrolled'):'',
 deviceCheck.supported&&!deviceCheck.shellCached?v417('shellMissing'):'',
 deviceCheck.storage?.low?v417('storagePressure'):'',v417('privacy')].filter(Boolean).join(' · '):'';
 const storage=await estimateOfflineStorage(navigator.storage),mb=n=>(n/1048576).toFixed(1)+' MB';
 const connected=online(),writesSupported=canLock();
 const buttons=OFFLINE_PACKS.map(p=>{
  const info=details.get(p.id)||{valid:0,total:p.files.length,complete:false,damaged:false,partial:false,freshness:'unknown'};
  const when=info.complete&&last[p.id]?new Date(last[p.id]).toLocaleString(normalizeLocale(window.SGBUDDY_LANGUAGE||'en')):'';
  const warning=info.damaged?tx('damaged'):info.partial?tx('incomplete'):info.complete&&info.freshness!=='recent'?tx('stale'):'';
  const scan=freshnessCheck?.get(p.id);
  const scanText=scan?.present?[scan.changed?v416('changed',{count:scan.changed}):'',scan.same?v416('same',{count:scan.same}):'',scan.unknown?v416('unknown',{count:scan.unknown}):''].filter(Boolean).join(' · '):'';
  return '<div class="offline-pack" data-offline-pack="'+p.id+'"><div class="offline-pack-info"><strong>'+esc(t(p.id))+'</strong><small>'+info.valid+'/'+info.total+' '+esc(t('files'))+' · '+esc(info.complete?t('ready'):t('missing'))+'</small>'+(when?'<small>'+esc(t('lastDownload'))+': '+esc(when)+'</small>':'')+(warning?'<small class="offline-integrity">'+esc(warning)+'</small>':'')+(scanText?'<small class="offline-integrity">'+esc(scanText)+'</small>':'')+'</div><div class="offline-pack-actions"><button type="button" data-offline-download="'+p.id+'" '+(busy||!hasCache||!connected||!writesSupported?'disabled':'')+'>'+esc(busy===p.id?t('downloading'):info.complete?t('update'):t('download'))+'</button>'+(info.present?'<button type="button" data-offline-remove="'+p.id+'" '+(busy||!writesSupported?'disabled':'')+'>'+esc(t('remove'))+'</button>':'')+'</div></div>';
 }).join('');
 const readyCount=[...details.values()].filter(x=>x.complete).length;
 homeTile.innerHTML='<div><strong>'+esc(t('heading'))+'</strong><small>'+esc(connected?t('online'):t('offlineWarning'))+'</small></div><button type="button" id="offlineHomeOpen">'+esc(t('choose'))+'</button>';
 const usage=storage.supported?tx('usage',{used:mb(storage.usage),total:mb(storage.quota)}):'';
 panel.innerHTML='<div class="label">'+esc(t('offline'))+'</div><h2>'+esc(t('heading'))+'</h2><p>'+esc(t('intro'))+'</p>'+
 '<div class="offline-status">'+esc(status||(!connected?t('offlineWarning'):scanSummary||t('local')))+'</div>'+
 (storage.supported?'<div class="offline-storage">'+esc(usage)+(storage.low?' · '+esc(tx('lowStorage')):'')+'</div>':'')+
 '<div class="offline-readiness"><strong>'+esc(tx('offlineSummary'))+'</strong><small>'+esc(tx('readyCount',{count:readyCount,total:OFFLINE_PACKS.length}))+'</small><small>'+esc(t('disclaimer'))+'</small></div>'+
 (!writesSupported?'<p class="offline-integrity" role="status">'+esc(v417('lockUnavailable'))+'</p>':'')+
 (deviceCheck?'<div class="offline-device-diagnostics" role="status">'+esc(diagnostics)+'</div>':'')+
 '<div class="offline-manager-actions"><button type="button" data-offline-device-check '+(busy?'disabled':'')+'>'+esc(busy==='device'?v417('checking'):v417('check'))+'</button><button type="button" data-offline-check-changes '+(busy||!connected||!hasCache||![...details.values()].some(x=>x.present)?'disabled':'')+'>'+esc(busy==='checking'?v416('checking'):v416('check'))+'</button><button type="button" data-offline-apply-changes '+(busy||!connected||!hasCache||!writesSupported||!freshnessCheck||!scanRows.some(row=>row.changed||row.unknown||(row.present&&!details.get(row.id)?.complete))?'disabled':'')+'>'+esc(busy==='applying'?v416('applying'):v416('apply'))+'</button><button type="button" data-offline-refresh-all '+(busy||!connected||!hasCache||!writesSupported||![...details.values()].some(x=>x.present)?'disabled':'')+'>'+esc(tx('refreshAll'))+'</button>'+
 (typeof navigator.storage?.persist==='function'?'<button type="button" data-offline-persist>'+esc(tx('persistence'))+'</button>':'')+'</div>'+
 '<div class="offline-packs">'+buttons+'</div><p class="offline-disclaimer">'+esc(v416('note'))+' '+esc(v416('sourceHint'))+' '+esc(t('freshness'))+'</p>';
}
async function checkDevice(){
 if(busy)return;
 await recovery;busy='device';await present();
 try{deviceCheck=await inspectOfflineDevice({
  cacheStorage:caches,storage:navigator.storage,serviceWorker:navigator.serviceWorker,
  dates:last
 });}
 catch{deviceCheck={supported:false,level:'unavailable'};}
 busy=null;await present();
}
async function checkForChanges(){
 if(busy||!online()||!('caches' in window))return;
 await recovery;
 busy='checking';status=v416('checking');await present();
 try{
  const cache=await caches.open(OFFLINE_CACHE);
  const rows=await checkDownloadedPublicPacks(cache,OFFLINE_PACKS,{
   origin:location.origin,
   probe:file=>fetchOfflineWithTimeout(file,{method:'HEAD',cache:'no-store',credentials:'same-origin',redirect:'error'})
  });
  freshnessCheck=new Map(rows.map(row=>[row.id,row]));
  status=''; // Derived from scan rows during render so language changes retranslate it.
 }catch{status=v416('unknown',{count:0})}
 busy=null;await present();
}
async function applyCheckedChanges(){
 if(busy||!online()||!freshnessCheck||!('caches' in window))return;
 await recovery;
 busy='applying';status=v416('applying');await present();
 let updated=0,errors=0;
 try{
  const cache=await caches.open(OFFLINE_CACHE);
  for(const pack of OFFLINE_PACKS){
   const checked=freshnessCheck.get(pack.id);
   if(!checked?.present)continue; // Preserve opt-in: never add a new pack.
   try{
    const count=await lock(pack.id,async()=>{
     const info=await inspectOfflinePack(cache,pack,last[pack.id]);
     const plan=planSelectiveOfflineUpdate(pack,info,checked);
     if(!plan.files.length)return 0;
     const result=await durableOfflineUpdate(caches,pack,{
      filesToUpdate:plan.files,
      validateFile:file=>validateOfflineRequest(file,location.origin),
      fetchFile:file=>fetchOfflineWithTimeout(file,{cache:'no-store',credentials:'same-origin'})
     });
     // The full-pack download timestamp is intentionally not reset by a subset
     // refresh. This avoids falsely claiming every unchanged file is new.
     if(plan.mode==='repair'||plan.files.length===pack.files.length){
      last={...last,[pack.id]:new Date().toISOString()};
      try{localStorage.setItem(key,JSON.stringify(last))}catch{}
     }
     return result.files;
    });
    updated+=count;
   }catch{errors++}
  }
  freshnessCheck=null;deviceCheck=null;
  status=errors?v416('applyFailed'):updated?v416('applied',{count:updated}):v416('applyNone');
 }catch{status=v416('applyFailed')}
 busy=null;await present();
}
async function downloadPack(id){
 const pack=OFFLINE_PACKS.find(p=>p.id===id);if(!pack||busy||!online())return;
 await recovery;
 busy=id;status=t('downloading');await present();
 try{
  await lock(id,()=>durableOfflineUpdate(caches,pack,{
   validateFile:file=>validateOfflineRequest(file,location.origin),
   fetchFile:file=>fetchOfflineWithTimeout(file,{cache:'no-store',credentials:'same-origin'})
  }));
  freshnessCheck=null;deviceCheck=null;
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
    fetchFile:file=>fetchOfflineWithTimeout(file,{cache:'no-store',credentials:'same-origin'})
   }));
   freshnessCheck=null;deviceCheck=null;
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
  freshnessCheck=null;deviceCheck=null;
  const copy={...last};delete copy[id];last=copy;
  try{localStorage.setItem(key,JSON.stringify(last))}catch{}
  status=t('missing');
 }catch{status=tx('recoveryFailed')}
 busy=null;await present();
}
panel.addEventListener('click',event=>{
 const d=event.target.closest('[data-offline-download]'),r=event.target.closest('[data-offline-remove]');
 if(event.target.closest('[data-offline-device-check]')){checkDevice();return}
 if(event.target.closest('[data-offline-check-changes]')){checkForChanges();return}
 if(event.target.closest('[data-offline-apply-changes]')){applyCheckedChanges();return}
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
// Cross-tab download/removal updates the public pack status, never starts a fetch.
window.addEventListener('storage',event=>{
 if(event.key!==key)return;
 last=dates();freshnessCheck=null;deviceCheck=null;present();
});
window.addEventListener('online',()=>{status=tx('reconnected');present()});
window.addEventListener('offline',()=>{status='';present()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)present()});
present();
window.SGBUDDY_OFFLINE_V480={packs:OFFLINE_PACKS.map(x=>x.id),cache:OFFLINE_CACHE,version:'4.17',freshnessPreview:'4.17-release-candidate'};
})();
