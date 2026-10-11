import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const data=p=>JSON.parse(read(p));
const operator=data('data/operator-listings-v230.json');
const guides=data('data/guide-stalls-v230.json');
const menus=data('data/operator-menus-v230.json');
const nbs=data('data/neighbourhoods-v230.json');
const legacy=data('data/food-stalls-v180.json');
const ui=read('app-v120.js'),food=read('app-food-v180.js'),sw=read('sw.js'),page=read('index.html');
assert.equal(legacy.stalls.length,93,'Historic/NEA baseline must be preserved');
assert.equal(operator.places.length,42,'Expected 42 first-party address listings');
assert.equal(guides.stalls.length,9,'Nine MICHELIN 2026 guide stalls');
assert.equal(menus.hawkerMenus.length,5,'Five Tian Tian first-party brand menu items');
assert.equal(menus.vendorMenus.length,41,'Ya Kun and Original Vadai first-party items');
assert.equal(nbs.neighbourhoods.length,26,'Neighbourhood facet coverage');
const ids=new Set(),names=new Set();
for(const x of operator.places){
 assert.ok(x.id&&!ids.has(x.id),'Duplicate operator listing id');ids.add(x.id);
 assert.ok(/^\d{6}$/.test(x.postal),'Invalid postal code '+x.id);
 assert.ok(x.status==='operator-listed'&&x.operatingStatus==='not-live-confirmed','First-party listing cannot claim live status');
 assert.ok(x.hoursCurrentNow===false&&x.verifiedScope&&x.sourceCheckedOn&&new URL(x.sourceUrl).protocol==='https:');
 assert.ok(Array.isArray(x.modes)&&x.modes.includes('resident'));
 const signature=x.operator+'|'+x.postal;
 assert.ok(!names.has(signature),'Duplicate operator and postcode');names.add(signature);
}
for(const x of guides.stalls){
 assert.ok(x.reviewStatus==='guide-listed-2026'&&x.operatingStatus==='unverified');
 assert.ok(x.guideAsOf==='2026-07-28'&&/^\d{6}$/.test(x.postal));
 assert.ok(x.priceSgd===null&&x.halalCertified===null&&x.openingHours===null);
 assert.ok(new URL(x.sourceUrl).hostname==='guide.michelin.com');
}
for(const x of menus.vendorMenus){
 assert.ok(x.vendor&&x.name&&x.status==='vendor-website-listed'&&x.sourceUrl.startsWith('https://'));
 assert.equal(x.availabilityCurrent,false);
 assert.equal(x.halalCertified,null);
 assert.equal(x.operatingStatus,'unverified');
 if(x.priceSgd!==null)assert.ok(x.priceSgd>0&&x.priceSource==='vendor-published');
 else assert.equal(x.priceSource,'not-listed');
}
for(const x of menus.hawkerMenus){
 assert.equal(x.stallSpecificAvailabilityVerified,false,'Brand menu cannot claim outlet availability');
 assert.equal(x.priceSgd,null);
 assert.equal(x.halalCertified,null);
 assert.ok(x.stallId==='STL-0001'&&x.sourceUrl.startsWith('https://'));
}
for(const x of nbs.neighbourhoods){
 assert.ok(x.name&&x.id&&x.aliases.length,'Empty neighbourhood');
 assert.ok(x.aliases.every(s=>s.length>=4));
}
for(const token of ['operator-listings-v230.json','neighbourhoods-v230.json','discoverNeighbourhoodFilter','sourceCheckedOn','operator-listed','superseded','matchesNeighbourhood','Business website'])assert.ok(ui.includes(token),'Missing operator UX: '+token);
for(const token of ['guide-stalls-v230.json','operator-menus-v230.json','hawker-menus','guide-listed-2026','MICHELIN 2026','cardHawkerMenu','stallSpecificAvailabilityVerified'])assert.ok(food.includes(token),'Missing food UX: '+token);
for(const path of ['/data/operator-listings-v230.json','/data/guide-stalls-v230.json','/data/operator-menus-v230.json','/data/neighbourhoods-v230.json','/food-discover-v230.css'])assert.ok(sw.includes(path),'Offline cache missing '+path);
assert.ok(page.includes('food-discover-v230.css'));
execFileSync(process.execPath,['scripts/library-evidence-v230.mjs'],{stdio:'inherit'});
const audit=data('reports/library-evidence-v230.json');
assert.equal(audit.counts.directoryWithOperator,2991);
assert.equal(audit.counts.liveOperationConfirmed,0);
assert.ok(fs.existsSync('reports/library-review-queue-v230.csv'));
console.log('SGBuddy V2.3 PASS: 42 operator branches, 9 guide stalls, 46 new menus, 26 neighbourhoods, no open-now assertions');
