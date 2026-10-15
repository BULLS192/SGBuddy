/* V4.17 Wave 1: user-initiated, local-only offline device readiness.
 * No fetch, no forced persistence, and no personal settings/trip reads.
 */
import {inspectOfflinePack,estimateOfflineStorage} from './offline-resilience-v415.mjs';
import {OFFLINE_CACHE,OFFLINE_PACKS} from './offline-packs-v480.mjs';
export async function inspectOfflineDevice({
 cacheStorage, storage, serviceWorker, packs=OFFLINE_PACKS,
 packCache=OFFLINE_CACHE, shellCache='sgbuddy-shell-v85', dates={}
}={}){
 if(!cacheStorage||typeof cacheStorage.keys!=='function')return {
  supported:false,level:'unavailable',ready:0,total:packs.length,packs:[],pendingRecovery:false,
  shellCached:false,controlled:false,storage:{supported:false}
 };
 let keys;
 try{keys=await cacheStorage.keys()}catch{return {
  supported:false,level:'unavailable',ready:0,total:packs.length,packs:[],pendingRecovery:false,
  shellCached:false,controlled:false,storage:{supported:false}
 }}
 const pendingRecovery=keys.some(k=>k.startsWith('sgbuddy-offline-txn-v415-'));
 const shellCached=keys.includes(shellCache);
 const controlled=Boolean(serviceWorker?.controller);
 const present=keys.includes(packCache);
 let cache=null;
 if(present)try{cache=await cacheStorage.open(packCache)}catch{}
 const checked=[];
 for(const pack of packs){
  let state={id:pack.id,valid:0,present:0,total:pack.files.length,complete:false,
   partial:false,damaged:false,freshness:'unknown'};
  if(cache)try{state={id:pack.id,...await inspectOfflinePack(cache,pack,dates[pack.id])}}catch{
   state={...state,damaged:true};
  }
  checked.push(state);
 }
 const usage=await estimateOfflineStorage(storage);
 const ready=checked.filter(x=>x.complete).length;
 const needsRepair=pendingRecovery||checked.some(x=>x.damaged||x.partial);
 const level=needsRepair?'attention':ready?'ready':'none';
 return {supported:true,level,ready,total:packs.length,packs:checked,
  pendingRecovery,shellCached,controlled,storage:usage};
}
