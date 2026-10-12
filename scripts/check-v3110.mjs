import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {HOME_KEYS,HOME_MESSAGES,homeText} from '../lib/i18n-home-v311.mjs';
const vars=x=>[...String(x).matchAll(/\{([a-z]+)\}/g)].map(m=>m[1]).sort();
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 const p=HOME_MESSAGES[code];assert.ok(p,'Missing '+code);
 assert.equal(Object.keys(p).length,HOME_KEYS.length,code+' incomplete');
 for(const key of HOME_KEYS){
  assert.ok(p[key]?.trim(),code+'/'+key);
  assert.deepEqual(vars(p[key]),vars(HOME_MESSAGES.en[key]),code+'/'+key);
 }
 assert.ok(homeText(code,'nextIn',{count:3}).includes('3'));
}
const app=readFileSync('app-i18n-home-v311.js','utf8');
for(const ref of ['#todaySection','#nextUpTitle','#railForm button','#uxPersonaDescription','#uxMerliHomeCopy','sgbuddy:language','MutationObserver','CORE_UI','contextMode','oldAliases'])assert.ok(app.includes(ref),'Missing '+ref);
assert.ok(!app.includes('innerHTML='),'Do not overwrite source-owned route, provider or user HTML');
const boot=readFileSync('app-v090.js','utf8');assert.ok(boot.includes("import('/app-i18n-home-v311.js')"));
const sw=readFileSync('sw.js','utf8');
assert.ok(sw.includes("sgbuddy-shell-v68"));
for(const asset of ['/app-i18n-home-v311.js','/lib/i18n-home-v311.mjs'])assert.ok(sw.includes(asset));
console.log('V3.11 PASS: '+HOME_KEYS.length+' home translations across 12 locales, source-protected selectors, updated PWA assets.');
