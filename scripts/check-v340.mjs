import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {DYNAMIC_KEYS,DYNAMIC_ENGLISH,DYNAMIC_MESSAGES,dynamicText} from '../lib/i18n-dynamic-v340.mjs';
const source=file=>readFileSync(file,'utf8');
const fields=s=>[...s.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort();
assert.equal(LOCALES.length,12);
assert.equal(DYNAMIC_KEYS.length,28);
assert.equal(new Set(DYNAMIC_KEYS).size,28);
for(const {code} of LOCALES){
 const messages=DYNAMIC_MESSAGES[code];
 assert.equal(Object.keys(messages||{}).length,28,code+' dictionary count');
 for(const key of DYNAMIC_KEYS){
  assert.ok(messages[key]?.trim(),code+' missing '+key);
  assert.deepEqual(fields(messages[key]),fields(DYNAMIC_ENGLISH[key]),code+' fields mismatch '+key);
 }
}
assert.equal(dynamicText('ko','accountSignedInAs',{email:'a@example.com'}).includes('a@example.com'),true);
assert.equal(dynamicText('fr','weatherRegion',{region:'South'}).includes('South'),true);
assert.equal(dynamicText('pt-BR','adultFare',{amount:'3.50'}).includes('SGD 3.50'),true);
assert.equal(dynamicText('th','raw-provider-text'),'raw-provider-text');
const app=source('app-v090.js'),transport=source('app-v110.js'),merli=source('app-v140.js');
for(const key of ['accountSignedInAs','accountGuestCopy','weatherRegion','pm25Explanation'])assert.ok(app.includes(key),key+' missing');
for(const key of ['renderComparison','lastComparison','if(lastComparison)renderComparison','escText(note','escText(p.disclaimer','escText(error.message)'])assert.ok(transport.includes(key),key+' missing');
for(const key of ['merliCapability','merliPrivacy','merliBooking','translateNewChips','lastDynamicKey'])assert.ok(merli.includes(key),key+' missing');
assert.ok(!transport.includes("+'<small>'+note"),'Do not inject provider HTML');
const sw=source('sw.js');
assert.ok(sw.includes('sgbuddy-shell-v84'));
for(const file of ['/lib/i18n-dynamic-v340.mjs','/app-i18n-dynamic-v340.js'])assert.ok(sw.includes(file),'Missing PWA translation asset '+file);
assert.ok(app.includes("import('/app-i18n-dynamic-v340.js')"));
assert.ok(source('index.html').includes('v4.19.0')&&app.includes("='4.19.0'"));
console.log('V3.4 PASS: 28 authored runtime keys in all 12 locales, interpolated source identifiers, safe provider output and offline assets.');
