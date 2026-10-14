/* V4.15 — corrupted cache, quota rollback and 12-locale public pack safeguards. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OFFLINE_PACKS,OFFLINE_CACHE,validateOfflineRequest} from '../lib/offline-packs-v480.mjs';
import {usableOfflineJson,offlineAge,inspectOfflinePack,estimateOfflineStorage,updateOfflinePack} from '../lib/offline-resilience-v415.mjs';
import {OFFLINE_V415_KEYS,OFFLINE_V415,offline415Text} from '../lib/offline-resilience-i18n-v415.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
const good=(value='{"events":[]}')=>new Response(value,{status:200,headers:{'content-type':'application/json; charset=utf-8'}});
const bad=()=>new Response('{broken',{status:200,headers:{'content-type':'application/json'}});
assert.equal(await usableOfflineJson(good()),true);
assert.equal(await usableOfflineJson(bad()),false);
assert.equal(await usableOfflineJson(new Response('{"error":"nope"}',{headers:{'content-type':'application/json'}})),false);
assert.equal(await usableOfflineJson(new Response('<html/>',{headers:{'content-type':'text/html'}})),false);
assert.equal(offlineAge('2026-10-13T00:00:00.000Z',new Date('2026-10-14T00:00:00Z')),'recent');
assert.equal(offlineAge('2026-09-01T00:00:00.000Z',new Date('2026-10-14T00:00:00Z')),'stale');
assert.equal(offlineAge(undefined),'unknown');
assert.equal(offlineAge('2026-12-01T00:00:00.000Z',new Date('2026-10-14T00:00:00Z')),'unknown');
assert.equal((await estimateOfflineStorage(null)).supported,false);
assert.equal((await estimateOfflineStorage({estimate:async()=>({usage:90,quota:100})})).low,true);
assert.equal((await estimateOfflineStorage({estimate:async()=>({usage:35,quota:100})})).low,false);
assert.equal((await estimateOfflineStorage({estimate:async()=>{throw Error('blocked')}})).supported,false);
const primary=OFFLINE_PACKS[0],store=new Map(primary.files.map((file,i)=>[file,good(JSON.stringify({version:i+1}))]));
let failedAt=null,puts=0;
const cache={
 match:async key=>store.get(key)?.clone(),
 put:async(key,res)=>{
  puts++;
  if(key===failedAt){failedAt=null;throw Object.assign(new Error('quota'),{name:'QuotaExceededError'})}
  store.set(key,res.clone());
 },
 delete:async key=>store.delete(key)
};
assert.equal((await inspectOfflinePack(cache,primary,'2026-09-01T00:00:00Z',new Date('2026-10-14T00:00:00Z'))).freshness,'stale');
assert.equal((await inspectOfflinePack(cache,primary,null)).complete,true);
store.set(primary.files[1],bad());
let check=await inspectOfflinePack(cache,primary,'2026-10-14T00:00:00Z');
assert.equal(check.complete,false);
assert.equal(check.damaged,true);
store.set(primary.files[1],good('{"restored":"yes"}'));
const old=await Promise.all(primary.files.map(async file=>(await store.get(file).clone().text())));
const opts={fetchFile:async file=>good(JSON.stringify({file,version:2})),validateFile:file=>validateOfflineRequest(file,'https://sgbuddy.omnidite.com')};
failedAt=primary.files[1];
await assert.rejects(updateOfflinePack(cache,primary,opts),/quota/);
for(let i=0;i<primary.files.length;i++)assert.equal(await store.get(primary.files[i]).clone().text(),old[i],'Failed refresh erased old cached file '+i);
await assert.rejects(updateOfflinePack(cache,primary,{fetchFile:async file=>file===primary.files[1]?bad():good(),validateFile:opts.validateFile}),/invalid JSON/);
for(let i=0;i<primary.files.length;i++)assert.equal(await store.get(primary.files[i]).clone().text(),old[i],'Invalid downloaded JSON altered cache');
assert.equal((await updateOfflinePack(cache,primary,opts)).files,3);
assert.equal((await inspectOfflinePack(cache,primary,'2026-10-14T00:00:00Z',new Date('2026-10-14T01:00:00Z'))).complete,true);
assert.equal(OFFLINE_PACKS.length,3);
assert.equal(OFFLINE_PACKS.flatMap(p=>p.files).length,13);
assert.equal(OFFLINE_CACHE,'sgbuddy-offline-packs-v480','User data cache name must persist');
for(const {code} of LOCALES){
 assert.equal(Object.keys(OFFLINE_V415[code]||{}).length,OFFLINE_V415_KEYS.length,code+' key count');
 for(const key of OFFLINE_V415_KEYS)assert.ok(offline415Text(code,key,{used:'1 MB',total:'4 MB'}).length>6,code+' '+key);
}
const sw=readFileSync('sw.js','utf8');
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v81'"),'Production cache key must stay until release');
assert.ok(sw.includes('/lib/offline-resilience-v415.mjs')&&sw.includes('/lib/offline-resilience-i18n-v415.mjs'));
assert.ok(sw.includes('sgbuddy-offline-packs-v480')&&!sw.includes("caches.delete('sgbuddy-offline-packs-v480')"));
const ui=readFileSync('app-offline-v480.js','utf8');
for(const needle of ['inspectOfflinePack','estimateOfflineStorage','durableOfflineUpdate','offline415Text'])assert.ok(ui.includes(needle));
console.log('V4.15 STATIC PASS: verified JSON and corruption repair, failed-update rollback, quota, freshness, storage, 12 languages, 13 allowed assets.');
