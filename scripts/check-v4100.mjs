import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {DISCOVER_KIND_V4100,CONTROL_V4100_KEYS,KIND_V4100,CONTROL_V4100,kindText,controlText} from '../lib/i18n-categories-v4100.mjs';
assert.equal(LOCALES.length,12);
assert.equal(DISCOVER_KIND_V4100.length,15);
assert.equal(CONTROL_V4100_KEYS.length,15);
assert.equal(new Set(DISCOVER_KIND_V4100).size,15);
assert.equal(new Set(CONTROL_V4100_KEYS).size,15);
for(const {code} of LOCALES){
 assert.equal(Object.keys(KIND_V4100[code]||{}).length,15,code+' category count');
 assert.equal(Object.keys(CONTROL_V4100[code]||{}).length,15,code+' control count');
 for(const key of DISCOVER_KIND_V4100)assert.ok(kindText(code,key).trim().length>1,code+' category '+key);
 for(const key of CONTROL_V4100_KEYS)assert.ok(controlText(code,key).trim().length>1,code+' control '+key);
 if(code!=='en'){
  assert.ok(DISCOVER_KIND_V4100.filter(k=>kindText(code,k)!==k).length>=14,code+' untranslated categories');
  assert.ok(CONTROL_V4100_KEYS.filter(k=>controlText(code,k)!==controlText('en',k)).length>=14,code+' untranslated controls');
 }
}
const boot=readFileSync('app-v090.js','utf8'),sw=readFileSync('sw.js','utf8');
assert.ok(boot.includes("import('/app-i18n-categories-v4100.js')"));
assert.ok(boot.includes("import('/app-offline-v480.js')"));
assert.ok(boot.includes("='4.13.0'"),'shipping version must not change');
for(const path of ['/app-i18n-categories-v4100.js','/lib/i18n-categories-v4100.mjs'])assert.ok(sw.includes(path),'offline shell lacks '+path);
assert.ok(sw.includes('sgbuddy-offline-packs-v480'),'offline cache must remain');
assert.ok(sw.includes('SHELL_PATHS.has(url.pathname)'),'origin cache policy must remain');
const runtime=readFileSync('app-i18n-categories-v4100.js','utf8');
for(const selector of ['#discoverCategoryFilter','#foodAwardYear','#accountSheet','#dataCorePanel','#newPasswordInput','sgbuddy:language'])assert.ok(runtime.includes(selector),'missing '+selector);
assert.ok(runtime.includes('option.value'),'category stable values missing');
assert.ok(!runtime.includes('innerHTML=')&&!runtime.includes('querySelectorAll("*")'),'unsafe DOM localization');
assert.ok(readFileSync('scripts/check-all.mjs','utf8').includes("scripts/check-v4100.mjs"));
console.log('V4.10 STATIC PASS: 15 Discover taxonomies + 15 Account/Food labels × 12 locales (360 messages).');
