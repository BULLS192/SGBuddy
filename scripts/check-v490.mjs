import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {RUNTIME_V490_KEYS,RUNTIME_V490_MESSAGES,runtimeV490Text} from '../lib/i18n-runtime-v490.mjs';
assert.equal(LOCALES.length,12);
assert.equal(RUNTIME_V490_KEYS.length,17);
assert.equal(new Set(RUNTIME_V490_KEYS).size,17);
for(const {code} of LOCALES){
 const pack=RUNTIME_V490_MESSAGES[code];
 assert.equal(Object.keys(pack||{}).length,17,code+' missing keys');
 for(const key of RUNTIME_V490_KEYS){
  assert.ok(typeof pack[key]==='string'&&pack[key].trim().length>2,code+' incomplete '+key);
  const variables=x=>[...x.matchAll(/\{(count|areas|publisher|name)\}/g)].map(m=>m[1]).sort();
  assert.deepEqual(variables(pack[key]),variables(RUNTIME_V490_MESSAGES.en[key]),code+' placeholders differ '+key);
 }
 assert.equal(runtimeV490Text(code,'readPublisher',{publisher:'MICHELIN'}).includes('MICHELIN'),true);
 assert.equal(runtimeV490Text(code,'pickerLoaded',{count:7,areas:3}).includes('7'),true);
 assert.equal(runtimeV490Text(code,'pickerLoaded',{count:7,areas:3}).includes('3'),true);
 if(code!=='en')assert.ok(RUNTIME_V490_KEYS.filter(k=>pack[k]!==RUNTIME_V490_MESSAGES.en[k]).length>=16,code+' not localized');
}
const js=readFileSync('app-i18n-runtime-v490.js','utf8');
for(const id of ['#foodPickNote','#foodPickResult .food-picked-card','#foodServiceResults .food-provider-card','#accountButton','#modeButton','#swapTrip','#fxSwap','sgbuddy:language'])assert.ok(js.includes(id),id+' missing');
assert.ok(!js.includes('innerHTML=')&&!js.includes('querySelectorAll("*")'),'unsafe DOM sweep');
const boot=readFileSync('app-v090.js','utf8');
assert.ok(boot.includes("import('/app-i18n-runtime-v490.js')"),'bootstrap not wired');
assert.ok(boot.includes("import('/app-offline-v480.js')"),'offline boot lost');
assert.ok(boot.includes("import('/app-events-v470.js')"),'events boot lost');
assert.ok(boot.includes("='4.19.0'"),'production version not to be changed yet');
const sw=readFileSync('sw.js','utf8');
for(const path of ['/app-i18n-runtime-v490.js','/lib/i18n-runtime-v490.mjs'])assert.ok(sw.includes(path),'offline shell missing '+path);
assert.ok(sw.includes("sgbuddy-offline-packs-v480"),'offline pack cache lost');
assert.ok(sw.includes('SHELL_PATHS.has(url.pathname)'),'source-limited caching changed');
assert.ok(readFileSync('scripts/check-all.mjs','utf8').includes('scripts/check-v490.mjs'));
console.log('V4.9 STATIC PASS: 17 messages x 12 locales; original user/provider data and V4.8 offline cache preserved.');
