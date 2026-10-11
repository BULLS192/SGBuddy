import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const services=JSON.parse(read('data/services-v210.json')),venues=JSON.parse(read('data/official-places-v200.json')),base=JSON.parse(read('data/discover-v120.json'));
const food=JSON.parse(read('data/food-stalls-v180.json')),menu=JSON.parse(read('data/vendor-menus-v210.json')),facts=JSON.parse(read('data/facts-published.json'));
const ui=read('app-v120.js'),buddy=read('app-v140.js'),foodui=read('app-food-v180.js'),sw=read('sw.js');
assert.ok(services.places.length>=1400,'Healthcare, pharmacy and social-service source dataset missing');
assert.ok(venues.places.length>=700,'Original V2 official catalogue missing');
assert.equal(base.places.length,271,'Preserve curated venue list');
assert.ok(services.sources.filter(s=>s.status==='ok').length>=4,'Need at least four authoritative source feeds');
assert.ok(services.places.filter(p=>p.category==='CHAS clinic').length>=1100);
assert.ok(services.places.filter(p=>p.category==='Registered pharmacy').length>=200);
assert.ok(services.places.filter(p=>p.category==='Social Service Office').length>=20);
assert.ok(services.places.filter(p=>p.category==='Polyclinic').length>=8);
const ids=new Set();
for(const p of services.places){
 assert.ok(/^SGS-[0-9a-f]{16}$/.test(p.id)&&!ids.has(p.id),'Duplicate or malformed service ID');ids.add(p.id);
 assert.ok(p.sourceUrl.startsWith('https://data.gov.sg/datasets/'),'Missing government dataset provenance');
 assert.ok(p.sourceCoverageAsOf&&p.operatingStatus==='unverified','Historical data must never imply live operating status');
 assert.ok(p.name&&p.name.length>3&&Array.isArray(p.modes));
 if(p.lat!=null||p.lon!=null)assert.ok(p.lat>1.12&&p.lat<1.48&&p.lon>103.58&&p.lon<104.12,'Invalid location');
 if(p.category==='CHAS clinic')assert.notEqual(p.serviceEligibilityVerified,true,'CHAS eligibility not verified by old dataset');
}
assert.ok(menu.items.length>=30,'First-party menu section too small');
for(const item of menu.items){
 assert.equal(item.status,'vendor-website-listed');assert.ok(/^https:\/\//.test(item.sourceUrl));
 assert.ok(item.vendor&&item.name&&item.observedOn);
 assert.equal(item.availabilityCurrent,false,'Cannot imply a price or item is in stock now');
 assert.equal(item.halalCertified,null,'Cannot infer dietary certification');
 if(item.priceSgd!=null){assert.ok(item.priceSgd>0&&item.priceSource==='vendor-published')}
 else assert.equal(item.priceSource,'not-listed');
}
assert.ok(food.stalls.length>=57,'Legacy hawker-stall data lost');
assert.ok(facts.facts.length>=152,'Source-checked Singapore facts expansion missing');
for(const x of ['healthcare','services-v210.json','sourceCoverageAsOf','Check current CHAS participation','Supermarket'])assert.ok(ui.includes(x),'Discover missing '+x);
for(const x of ['data-food-view="menus"','cardMenu','vendor-menus-v210.json'])assert.ok(foodui.includes(x),'Vendor menu UX missing '+x);
assert.ok(buddy.includes("act('healthcare')"),'Merli healthcare intent missing');
for(const file of ['/data/services-v210.json','/data/vendor-menus-v210.json'])assert.ok(sw.includes(file),'Offline asset missing '+file);
assert.ok(read('.github/workflows/library-freshness-v210.yml').includes('cron:'),'Weekly freshness audit schedule missing');
assert.ok(read('.github/workflows/library-freshness-v210.yml').includes('upload-artifact'),'Non-destructive review report missing');
console.log('SGBuddy V2.1 validation PASS:',base.places.length+venues.places.length+services.places.length,'listed places;',menu.items.length,'vendor-linked menu items;',facts.facts.length,'source-reviewed facts');
