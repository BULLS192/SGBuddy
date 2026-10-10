import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectOneMapMatch,matchingConfidence} from '../lib/discover-geo.js';
const read=p=>fs.readFileSync(p,'utf8');
const main=read('app-v090.js'),discover=read('app-v120.js'),food=read('app-food-v180.js');
const sw=read('sw.js'),index=read('index.html');
const catalog=JSON.parse(read('data/discover-v120.json'));
const stalls=JSON.parse(read('data/food-stalls-v180.json'));
const dishes=JSON.parse(read('data/singapore-dishes-v180.json'));
const published=JSON.parse(read('data/facts-published.json'));
assert.ok(catalog.places.length>=271,'Place catalog should include NEA award-associated centres');
assert.ok(stalls.stalls.length>=45,'Expected expanded stall lead directory');
assert.ok(dishes.dishes.length>=80,'Expected expanded dish library');
assert.ok(published.verifiedCount>=130,'Expected 130 officially sourced Singapore facts');
const ids=new Set(catalog.places.map(p=>p.id));
const stallIds=new Set();
for(const s of stalls.stalls){
 assert.ok(!stallIds.has(s.id));stallIds.add(s.id);
 assert.ok(ids.has(s.centreId),'Dangling hawker centre: '+s.name);
 assert.equal(s.operatingStatus,'unverified');
 assert.ok(['research-candidate','nea-award-listed-2025'].includes(s.reviewStatus));
 if(s.reviewStatus==='nea-award-listed-2025'){assert.ok(s.stallNumber&&/^https:\/\/www\.nea\.gov\.sg\//.test(s.sourceUrl),'NEA award stall needs official source and stall number')}
 assert.equal(s.halalCertified,null,'Do not guess halal certification');
 assert.equal(s.priceSgd,null,'Do not guess prices');
 assert.equal(s.vegetarianAvailable,null,'Do not guess vegetarian options');
}
for(const d of dishes.dishes){
 assert.ok(d.id&&d.name&&d.cuisine);
 assert.equal(d.priceSgd,null);
 assert.equal(d.halalCertified,null);
}
assert.ok(main.includes("import('/app-food-v180.js')"),'Food module must load after existing UX scripts');
assert.ok(index.includes('/food-v180.css'),'Food styling missing');
for(const url of ['/data/food-stalls-v180.json','/data/singapore-dishes-v180.json','/app-food-v180.js'])assert.ok(sw.includes(url),'Offline shell missing '+url);
assert.ok(discover.includes('data-verify-address'),'Places must support OneMap checks');
assert.ok(discover.includes('/api/discover-address?id='),'OneMap endpoint must be used');
for(const feature of ['foodArea','foodMeal','foodCuisine','foodDish','foodSavedOnly','foodSearch','foodLoadMore'])assert.ok(food.includes(feature),'Food filter absent: '+feature);
const addr=read('api/discover-address.js');
assert.ok(addr.includes('hasOneMapCredentials()')&&addr.includes('operationalStatus'), 'OneMap server gate missing');
assert.ok(!addr.includes('req.query.q'),'Open-ended OneMap query would permit unnecessary abuse');
const place={name:'Maxwell Food Centre',area:'Chinatown'};
const good={label:'MAXWELL FOOD CENTRE',address:'1 Kadayanallur Street Singapore 069184',postal:'069184',lat:1.2803,lon:103.8445};
assert.equal(selectOneMapMatch(place,[good]).status,'address-matched');
const other={label:'RANDOM FOOD CENTRE',address:'Maxwell Road Singapore',postal:'069186',lat:1.2803,lon:103.8445};
assert.equal(selectOneMapMatch(place,[other]).status,'ambiguous','Street alone must not count as verified name');
const bad={...good,lat:50};assert.equal(selectOneMapMatch(place,[bad]).status,'not-found','Outside Singapore must not match');
const nameOnly=matchingConfidence('Hawker Centre','',other);assert.equal(nameOnly.score,0,'Generic category is not enough');
console.log('Food v1.8 checks passed:',stalls.stalls.length,'stalls,',dishes.dishes.length,'dishes,',published.verifiedCount,'source-checked facts; OneMap matcher cases passed.');
