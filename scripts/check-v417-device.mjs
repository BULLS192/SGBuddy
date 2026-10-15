/* V4.17 local-only device check + cancelable offline network checks. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectOfflineDevice} from '../lib/offline-device-v417.mjs';
import {fetchOfflineWithTimeout} from '../lib/offline-network-v417.mjs';
import {canLockOfflinePacks,withOfflinePackLock} from '../lib/offline-tab-lock-v417.mjs';
import {DEVICE_KEYS,DEVICE_TEXT,offlineDeviceText} from '../lib/offline-device-i18n-v417.mjs';
import {OFFLINE_PACKS,OFFLINE_CACHE} from '../lib/offline-packs-v480.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
const json=()=>new Response('{"ok":true}',{headers:{'content-type':'application/json'}});
const stored=new Map();
let opens=0,reads=0;
const cacheStorage={
 keys:async()=>[...stored.keys()],
 open:async name=>{
  opens++;
  if(!stored.has(name))throw Error('Cache absent');
  return {match:async path=>{reads++;return stored.get(name).get(path)?.clone()}};
 }
};
const storage={estimate:async()=>({usage:900,quota:1000})};
let state=await inspectOfflineDevice({cacheStorage,storage,serviceWorker:{controller:null}});
assert.equal(state.level,'none');assert.equal(state.ready,0);assert.equal(state.supported,true);
assert.equal(state.shellCached,false);assert.equal(state.storage.low,true);
assert.equal(opens,0,'Not opted into a pack: should not create a new cache');
stored.set('sgbuddy-shell-v86',new Map());
stored.set(OFFLINE_CACHE,new Map(OFFLINE_PACKS[0].files.map(f=>[f,json()])));
state=await inspectOfflineDevice({cacheStorage,storage,serviceWorker:{controller:{}},dates:{calendar:new Date().toISOString()}});
assert.equal(state.level,'ready');assert.equal(state.ready,1);assert.equal(state.packs[0].valid,3);
assert.equal(state.packs[1].present,0);assert.equal(state.packs[2].present,0);
assert.equal(state.shellCached,true);assert.equal(state.controlled,true);
assert.equal(reads,13,'Read only the 13 published JSON paths');
stored.get(OFFLINE_CACHE).set(OFFLINE_PACKS[0].files[1],new Response('{broken',{headers:{'content-type':'application/json'}}));
state=await inspectOfflineDevice({cacheStorage,storage,serviceWorker:{controller:{}}});
assert.equal(state.level,'attention');assert.equal(state.packs[0].damaged,true);
stored.set('sgbuddy-offline-txn-v415-calendar',new Map());
state=await inspectOfflineDevice({cacheStorage,storage,serviceWorker:{controller:{}}});
assert.equal(state.pendingRecovery,true);
assert.equal((await inspectOfflineDevice({})).level,'unavailable');
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 assert.equal(Object.keys(DEVICE_TEXT[code]||{}).length,DEVICE_KEYS.length);
 for(const key of DEVICE_KEYS){
  const label=offlineDeviceText(code,key,{count:1,total:3});
  assert.ok(label.trim().length>=2&&!label.includes('{count}')&&!label.includes('{total}'),code+' '+key);
 }
}
const goodAbortController=new AbortController();
let seenOptions;
const success=await fetchOfflineWithTimeout('/data/events-v470.json',{method:'HEAD',credentials:'same-origin'},{
 fetchImpl:async(path,options)=>{seenOptions=options;return new Response(null,{status:200});},timeoutMs:50
});
assert.equal(success.status,200);assert.equal(seenOptions.method,'HEAD');
assert.equal(seenOptions.credentials,'same-origin');
assert.equal(typeof seenOptions.signal,'object');
assert.equal(seenOptions.signal.aborted,false);
let aborted=false;
await assert.rejects(fetchOfflineWithTimeout('/data/events-v470.json',{method:'HEAD'},{
 timeoutMs:15,fetchImpl:(_path,{signal})=>new Promise((_resolve,reject)=>{
  signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'))},{once:true});
 })
}),/timed out/);
assert.equal(aborted,true);
const calls=[],fakeLocks={request:async (name,options,action)=>{calls.push([name,options.mode]);return action()}};
assert.equal(canLockOfflinePacks(fakeLocks),true);
assert.equal(canLockOfflinePacks(null),false);
assert.equal(await withOfflinePackLock('calendar',async()=>17,fakeLocks),17);
assert.deepEqual(calls,[['sgbuddy-offline-calendar','exclusive']]);
await assert.rejects(withOfflinePackLock('calendar',async()=>true,null),/unavailable/);
await assert.rejects(withOfflinePackLock('../bad',async()=>true,fakeLocks),/invalid offline pack/);
await assert.rejects(fetchOfflineWithTimeout('/data/food-stalls-v180.json',{},{fetchImpl:async()=>{throw Error('offline');}}),/offline/);
await assert.rejects(fetchOfflineWithTimeout('/data/events-v470.json',{},{AbortControllerImpl:null}),/cancelable/);
await assert.rejects(fetchOfflineWithTimeout('/data/events-v470.json',{},{timeoutMs:0}),/invalid offline timeout/);
const app=readFileSync('app-offline-v480.js','utf8'),sw=readFileSync('sw.js','utf8');
assert.ok(app.includes('data-offline-device-check')&&app.includes('inspectOfflineDevice'));
assert.ok(app.includes('withOfflinePackLock')&&app.includes("window.addEventListener('storage'"));
assert.ok(app.includes('fetchOfflineWithTimeout')&&app.includes("method:'HEAD'"));
assert.ok(!app.includes('localStorage.clear(')&&!app.includes('caches.delete(OFFLINE_CACHE)'));
for(const f of ['/lib/offline-device-v417.mjs','/lib/offline-device-i18n-v417.mjs','/lib/offline-network-v417.mjs','/lib/offline-tab-lock-v417.mjs'])assert.ok(sw.includes(f));
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v86'"));
assert.ok(readFileSync('index.html','utf8').includes('v4.21.0'),'Release candidate version, development-only');
console.log('V4.17 DEVICE PASS — local-only, explicit check, all 12 locales, no cache creation, read-only, cancelable requests, preserved production version.');
