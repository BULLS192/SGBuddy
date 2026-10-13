import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {V312_KEYS,V312_MESSAGES,v312Text} from '../lib/i18n-v312.mjs';
assert.equal(V312_KEYS.length,25);
assert.equal(LOCALES.length,12);
const holders=s=>[...s.matchAll(/\{([a-z]+)\}/g)].map(x=>x[1]).sort();
for(const {code} of LOCALES){
 const pack=V312_MESSAGES[code];assert.ok(pack,code);
 assert.deepEqual(Object.keys(pack),V312_KEYS,code+' keys');
 for(const key of V312_KEYS){
  assert.ok(typeof pack[key]==='string'&&pack[key].trim(),code+'/'+key);
  assert.deepEqual(holders(pack[key]),holders(V312_MESSAGES.en[key]),code+'/'+key+' parameters');
  if(code!=='en'&&!['tripSearchPlaceholder','hotel','destination','alternative','optionsOne','optionsMany'].includes(key))assert.notEqual(pack[key],V312_MESSAGES.en[key],code+'/'+key+' untranslated');
 }
 assert.ok(v312Text(code,'optionsMany',{count:'7'}).includes('7'));
 assert.equal(v312Text(code,'missing'), '');
}
const read=p=>readFileSync(p,'utf8');
const app=read('app-v090.js'),ux=read('app-ux-v160.js'),trip=read('app-trip-v260.js'),sw=read('sw.js');
for(const s of ['recentDestination','optionsMany','noRoute','showOnMap','weatherAware'])assert.ok(app.includes('ui312(\''+s+'\'')||app.includes('\''+s+'\''));
for(const s of ['savedFact','savedItem','savedNearby','verifiedFact','openDetails'])assert.ok(ux.includes("'"+s+"'"));
for(const s of ['tripNamePlaceholder','tripSearchPlaceholder','defaultTripName'])assert.ok(trip.includes("'"+s+"'"));
for(const s of ['/app-i18n-v312.js','/lib/i18n-v312.mjs'])assert.ok(sw.includes(s));
assert.ok(app.includes("import('/app-i18n-v312.js')"));
assert.ok(app.includes("='4.12.0'"));
assert.ok(read('index.html').includes('v4.12.0'));
assert.ok(sw.includes('sgbuddy-shell-v77'));
console.log('V3.12 PASS: 25 generated message keys x 12 locales, interpolation, Saved, recent destinations, journey summary, itinerary placeholders, offline bundle.');
