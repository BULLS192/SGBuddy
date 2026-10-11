import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const base=JSON.parse(read('data/discover-v120.json'));
const official=JSON.parse(read('data/official-places-v200.json'));
const ui=read('app-v120.js'),sw=read('sw.js'),html=read('index.html');
const facts=JSON.parse(read('data/facts-published.json'));
const stalls=JSON.parse(read('data/food-stalls-v180.json'));
const dishes=JSON.parse(read('data/singapore-dishes-v180.json'));
assert.equal(official.schemaVersion,1);
assert.equal(base.places.length,271,'Do not remove curated places');
assert.ok(official.places.length>=550,'Government expansion must contain 550+ additional places');
assert.ok(official.sources.filter(x=>x.status==='ok').length>=4,'Need four working official publishers');
assert.equal(official.counts.added,official.places.length,'Summary and published places out of sync');
assert.equal(official.counts.baseCurated,base.places.length,'Snapshot references a stale baseline');
assert.equal(official.counts.totalUniqueApprox,base.places.length+official.places.length);
assert.ok(official.places.some(p=>p.kind==='Eat'));
assert.ok(official.places.some(p=>p.kind==='Do'));
assert.ok(official.places.some(p=>p.kind==='Essentials'));
assert.ok(facts.verifiedCount>=130&&stalls.stalls.length>=57&&dishes.dishes.length>=82,'Existing collections regressed');
const ids=new Set(),names=new Set(base.places.map(p=>p.name.toLowerCase().replace(/[^a-z0-9]/g,'')));
for(const p of official.places){
 assert.ok(/^SGO-[a-f0-9]{12}$/.test(p.id),'Unexpected source ID: '+p.id);
 assert.ok(!ids.has(p.id),'Duplicate official record ID: '+p.id);ids.add(p.id);
 assert.ok(p.name&&p.name.length>=4&&p.name.length<=120,'Invalid official name');
 assert.ok(['Eat','Do','Essentials'].includes(p.kind));
 assert.ok(p.kinds.includes(p.kind));
 assert.ok(p.lat>=1.12&&p.lat<=1.48&&p.lon>=103.58&&p.lon<=104.12,'Out of Singapore');
 assert.ok(/^d_[a-f0-9]{32}$/.test(p.sourceDatasetId),'Missing dataset provenance');
 assert.ok(/^https:\/\/data\.gov\.sg\/datasets\//.test(p.sourceUrl));
 assert.equal(p.status,'official-source-snapshot');
 assert.equal(p.operatingStatus,'unverified','Do not conflate an agency record with a currently open venue');
 assert.ok(['point','indicative-polygon-centroid'].includes(p.coordinatesKind));
 assert.ok(Array.isArray(p.modes)&&p.modes.length>=3);
 const key=p.name.toLowerCase().replace(/[^a-z0-9]/g,'');
 assert.ok(!names.has(key),'Duplicate curated/official venue: '+p.name);names.add(key);
}
for(const k of ["['essentials','Essentials']", "essentials:'Essentials'",'discoverSourceFilter','official-source-snapshot','/data/official-places-v200.json','data-discover-tab','visibleCount+=','sgbuddy:library-ready']){
 if(k==='visibleCount+=')assert.ok(ui.includes('visibleCount+24')||ui.includes('visibleCount+=24'),'Pagination required');
 else assert.ok(ui.includes(k),'Discover missing V2 feature: '+k);
}
for(const asset of ['/data/official-places-v200.json','/library-v200.css'])assert.ok(sw.includes(asset),'PWA needs '+asset);
assert.ok(html.includes('/library-v200.css'),'Missing stylesheet');
assert.ok(read('app-v140.js').includes("act('essentials')"),'Merli should route library and club queries');
assert.ok(/sgbuddy-shell-v(4[6-9]|[5-9]\d|\d{3,})/.test(sw),'PWA cache must move forward');
console.log('SGBuddy V2 source-checked directory PASS: '+official.places.length+' additional, '+(base.places.length+official.places.length)+' unique place entries from '+official.sources.filter(x=>x.status==='ok').length+' official feeds.');
