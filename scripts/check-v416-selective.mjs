/* V4.16 selective transactional updates, deterministic Node.js CacheStorage. */
import assert from 'node:assert/strict';
import {OFFLINE_CACHE,OFFLINE_PACKS,validateOfflineRequest} from '../lib/offline-packs-v480.mjs';
import {durableOfflineUpdate,recoverInterruptedPack,transactionName,TXN_MARKER} from '../lib/offline-transaction-v415.mjs';
import {checkDownloadedPublicPacks,planSelectiveOfflineUpdate,compareOfflineEvidence} from '../lib/offline-freshness-v416.mjs';
import {inspectOfflinePack} from '../lib/offline-resilience-v415.mjs';
const good=(s,tag='"old"')=>new Response(JSON.stringify({data:s}),{headers:{'content-type':'application/json',etag:tag}});
const broken=()=>new Response('{bad',{headers:{'content-type':'application/json'}});
function fakeStorage(){
 const groups=new Map();let failAt=null;
 return {keys:async()=>[...groups.keys()],open:async name=>{
  if(!groups.has(name))groups.set(name,new Map());
  const data=groups.get(name);
  return {match:async key=>data.get(key)?.clone(),
   put:async(key,res)=>{if(key===failAt){failAt=null;throw Object.assign(Error('quota'),{name:'QuotaExceededError'})}data.set(key,res.clone())},
   delete:async key=>data.delete(key),keys:async()=>[...data.keys()]};
 },delete:async key=>groups.delete(key),failAt:key=>failAt=key};
}
const [calendar,essentials,food]=OFFLINE_PACKS;
const store=fakeStorage(),cache=await store.open(OFFLINE_CACHE);
for(const file of calendar.files)await cache.put(file,good('old '+file));
for(const file of essentials.files)await cache.put(file,good('saved '+file));
let downloaded=[];
const opts={validateFile:file=>validateOfflineRequest(file,'https://sgbuddy.omnidite.com'),
 fetchFile:async file=>{downloaded.push(file);return good('new '+file,'"new"')}};
const item=calendar.files[1];
const check=await checkDownloadedPublicPacks(cache,OFFLINE_PACKS,{origin:'https://sgbuddy.omnidite.com',probe:async file=>new Response(null,{headers:{etag:file===item?'"new"':'"old"'}})});
assert.equal(check[0].changed,1);assert.equal(check[0].same,2);
assert.equal(check[1].present,5);assert.equal(check[2].present,0);
assert.equal(check[0].items[1].evidence,'strong-etag');
const plan=planSelectiveOfflineUpdate(calendar,await inspectOfflinePack(cache,calendar,'2026-10-13T00:00:00Z'),check[0]);
assert.deepEqual(plan,{mode:'selective',files:[item]});
const completed=await durableOfflineUpdate(store,calendar,{...opts,filesToUpdate:plan.files});
assert.equal(completed.files,1);assert.deepEqual(downloaded,[item]);
for(const f of calendar.files)assert.equal((await(await cache.match(f)).json()).data,(f===item?'new ':'old ')+f);
for(const f of essentials.files)assert.equal((await(await cache.match(f)).json()).data,'saved '+f);
assert.equal((await store.keys()).some(k=>k.startsWith('sgbuddy-offline-txn-v415-')),false);
await assert.rejects(durableOfflineUpdate(store,calendar,{...opts,filesToUpdate:['/api/weather']}),/invalid selected/);
await assert.rejects(durableOfflineUpdate(store,calendar,{...opts,filesToUpdate:[item,item]}),/invalid selected/);
const baseline=await(await cache.match(item)).text();
store.failAt(item);
await assert.rejects(durableOfflineUpdate(store,calendar,{...opts,filesToUpdate:[item]}),/quota/);
assert.equal(await(await cache.match(item)).text(),baseline,'quota rollback changed previous JSON');
assert.equal((await store.keys()).includes(transactionName(calendar)),false);
// A crashed selective write uses the full pack journal, just like full V4.15.
const journal=await store.open(transactionName(calendar));
for(const f of calendar.files)await journal.put(f,(await cache.match(f)).clone());
await journal.put(TXN_MARKER,new Response(JSON.stringify({version:1,files:calendar.files,existed:calendar.files.map(()=>true)}),{headers:{'content-type':'application/json'}}));
await cache.put(item,broken());
assert.equal((await recoverInterruptedPack(store,calendar)).state,'restored');
assert.equal(await(await cache.match(item)).text(),baseline);
assert.equal((await store.keys()).includes(transactionName(calendar)),false);
// A damaged pack cannot be partially repaired: full repair is required.
await cache.put(calendar.files[0],broken());
assert.deepEqual(planSelectiveOfflineUpdate(calendar,await inspectOfflinePack(cache,calendar),check[0]),{mode:'repair',files:calendar.files});
await assert.rejects(durableOfflineUpdate(store,calendar,{...opts,filesToUpdate:[item]}),/full pack repair/);
await durableOfflineUpdate(store,calendar,opts);
assert.equal((await inspectOfflinePack(cache,calendar)).complete,true);
const old=await(await cache.match(item)).text();
const impossible={...opts,fetchFile:async f=>f===item?broken():good('other')};
await assert.rejects(durableOfflineUpdate(store,calendar,{...impossible,filesToUpdate:[item]}),/invalid offline JSON/);
assert.equal(await(await cache.match(item)).text(),old);
assert.deepEqual(planSelectiveOfflineUpdate(food,{present:0,complete:false},check[2]),{mode:'skip',files:[]});
assert.deepEqual(compareOfflineEvidence(good('a','W/"weak"'),new Response(null,{headers:{etag:'W/"new"'}})),{state:'unknown',evidence:'unavailable'});
console.log('V4.16 SELECTIVE TRANSACTIONS PASS: changed-only GET, skipped packs, full-journal recovery, quota, malformed JSON, partial-pack repair, privacy.');
