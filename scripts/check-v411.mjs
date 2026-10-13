import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {V411_OPTION_KEYS,V411_TEXT_KEYS,V411_OPTIONS,V411_TEXTS,v411Option,v411Text} from '../lib/i18n-remaining-v411.mjs';
assert.equal(LOCALES.length,12);
assert.equal(V411_OPTION_KEYS.length,12);
assert.equal(V411_TEXT_KEYS.length,10);
for(const {code} of LOCALES){
 assert.equal(Object.keys(V411_OPTIONS[code]||{}).length,12,code+' options');
 assert.equal(Object.keys(V411_TEXTS[code]||{}).length,10,code+' text');
 for(const key of V411_OPTION_KEYS)assert.ok(v411Option(code,key).length>1,code+' '+key);
 for(const key of V411_TEXT_KEYS)assert.ok(v411Text(code,key).length>1,code+' '+key);
 if(code!=='en'){
  assert.ok(V411_OPTION_KEYS.filter(k=>v411Option(code,k)!==k).length>=11,code+' untranslated options');
  assert.ok(V411_TEXT_KEYS.filter(k=>v411Text(code,k)!==k).length>=9,code+' untranslated account/app/food');
 }
}
const boot=readFileSync('app-v090.js','utf8'),sw=readFileSync('sw.js','utf8');
assert.ok(boot.includes("import('/app-i18n-remaining-v411.js')"));
assert.ok(boot.includes("import('/app-offline-v480.js')")&&boot.includes("import('/app-events-v470.js')"));
assert.ok(boot.includes("='4.11.0'"),'production badge changed');
for(const path of ['/app-i18n-remaining-v411.js','/lib/i18n-remaining-v411.mjs'])assert.ok(sw.includes(path),path+' missing');
assert.ok(sw.includes('sgbuddy-offline-packs-v480')&&sw.includes('SHELL_PATHS.has(url.pathname)'),'offline caching changed');
const runtime=readFileSync('app-i18n-remaining-v411.js','utf8');
for(const word of ['#foodMeal','#foodCuisine','#discoverCategoryFilter','#accountMessage','#foodCards','#everydayApps','sgbuddy:language'])assert.ok(runtime.includes(word),word+' missing');
assert.ok(!runtime.includes('innerHTML=')&&!runtime.includes('querySelectorAll("*")'),'unsafe translation');
assert.ok(readFileSync('scripts/check-all.mjs','utf8').includes('scripts/check-v411.mjs'));
console.log('V4.11 STATIC PASS: 12 source-locked options + 10 authored messages x 12 locales; offline/event cache preserved.');
