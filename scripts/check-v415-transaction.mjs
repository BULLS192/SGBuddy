/* V4.15 Wave 2: recovery journal survives crashed updates; no personal data touched. */
import assert from 'node:assert/strict';
import {OFFLINE_PACKS,OFFLINE_CACHE,validateOfflineRequest} from '../lib/offline-packs-v480.mjs';
import {TXN_PREFIX,TXN_MARKER,transactionName,recoverInterruptedPack,recoverAllInterruptedPacks,durableOfflineUpdate} from '../lib/offline-transaction-v415.mjs';
const good=v=>new Response(JSON.stringify({data:v}),{headers:{'content-type':'application/json'}});
function storage(){
 const map=new Map();let fail=null;
 const caches={keys:async()=>[...map.keys()],open:async name=>{
  if(!map.has(name))map.set(name,new Map());
  const data=map.get(name);
  return {
   match:async key=>data.get(key)?.clone(),
   put:async(key,value)=>{if(fail===key){fail=null;throw Object.assign(Error('quota'),{name:'QuotaExceededError'})}data.set(key,value.clone())},
   delete:async key=>data.delete(key),
   keys:async()=>[...data.keys()]
  };
 },delete:async name=>map.delete(name),failAt:key=>fail=key};
 return caches;
}
const packs=OFFLINE_PACKS,pack=packs[0],store=storage();
const options={validateFile:p=>validateOfflineRequest(p,'https://sgbuddy.omnidite.com'),fetchFile:async file=>good('new '+file)};
const original=await store.open(OFFLINE_CACHE);
for(const file of pack.files)await original.put(file,good('old '+file));
assert.equal((await recoverInterruptedPack(store,pack)).state,'none');
store.failAt(pack.files[1]);
await assert.rejects(durableOfflineUpdate(store,pack,options),/quota/);
for(const file of pack.files)assert.equal((await(await original.match(file)).json()).data,'old '+file);
assert.equal((await store.keys()).some(x=>x.startsWith(TXN_PREFIX)),false);
await durableOfflineUpdate(store,pack,options);
for(const file of pack.files)assert.equal((await(await original.match(file)).json()).data,'new '+file);
assert.equal((await store.keys()).some(x=>x.startsWith(TXN_PREFIX)),false);
// Simulate a browser crash AFTER staging the journal and AFTER overwriting one
// public file: recovery must restore the entire old pack on next launch.
const journal=await store.open(transactionName(pack));
for(const file of pack.files)await journal.put(file,good('saved '+file));
await journal.put(TXN_MARKER,new Response(JSON.stringify({
 version:1,files:pack.files,existed:pack.files.map(()=>true)
}),{headers:{'content-type':'application/json'}}));
await original.put(pack.files[1],good('partially committed'));
const r=await recoverInterruptedPack(store,pack);
assert.equal(r.state,'restored');
for(const file of pack.files)assert.equal((await(await original.match(file)).json()).data,'saved '+file);
// Malformed marker may not wipe public data.
const badJournal=await store.open(transactionName(pack));
await badJournal.put(TXN_MARKER,good('invalid marker'));
assert.equal((await recoverInterruptedPack(store,pack)).state,'failed');
assert.ok(await original.match(pack.files[0]));
await store.delete(transactionName(pack));
// Incomplete staged transaction without marker must not affect public files.
const incomplete=await store.open(transactionName(pack));
await incomplete.put(pack.files[0],good('staged'));
assert.equal((await recoverInterruptedPack(store,pack)).state,'discarded');
assert.equal((await recoverAllInterruptedPacks(store,packs)).length,3);
// New pack interrupted during initial download must not leave partial entries.
const empty=storage(),clean=await empty.open(OFFLINE_CACHE),j=await empty.open(transactionName(pack));
await j.put(TXN_MARKER,new Response(JSON.stringify({version:1,files:pack.files,existed:pack.files.map(()=>false)}),{headers:{'content-type':'application/json'}}));
await clean.put(pack.files[0],good('partial'));
assert.equal((await recoverInterruptedPack(empty,pack)).state,'restored');
for(const file of pack.files)assert.equal(await clean.match(file),undefined);
console.log('V4.15 TRANSACTIONS PASS: preflight, quota rollback, crash recovery, corrupt-journal preservation and fresh-pack cleanup.');
