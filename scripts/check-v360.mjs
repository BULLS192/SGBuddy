import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CLASSIFIED_KEYS,CLASSIFIED_MESSAGES,HTML_CLASSIFICATION,classifiedText} from '../lib/i18n-classified-v360.mjs';
const read=p=>readFileSync(p,'utf8');
assert.equal(LOCALES.length,12);
assert.equal(CLASSIFIED_KEYS.length,19);
assert.equal(new Set(CLASSIFIED_KEYS).size,19);
assert.equal(Object.values(HTML_CLASSIFICATION).flat().length,33);
for(const {code} of LOCALES){
 assert.equal(Object.keys(CLASSIFIED_MESSAGES[code]||{}).length,19,code+' missed message states');
 for(const key of CLASSIFIED_KEYS)assert.ok(classifiedText(code,key).trim(),code+' missing '+key);
}
const app=read('app-i18n-classified-v360.js'),sw=read('sw.js'),boot=read('app-v090.js');
for(const value of ['SGBUDDY_CLASSIFIED_I18N','MutationObserver','sgbuddy:language','signed-in','CLASSIFIED_MESSAGES','requestAnimationFrame','new WeakMap()'])
 assert.ok(app.includes(value),'Missing safe localization bridge: '+value);
for(const unsafe of ['document.body.innerHTML','translateElement','innerHTML=translated'])assert.ok(!app.includes(unsafe),'Unsafe DOM translation '+unsafe);
for(const sensitive of HTML_CLASSIFICATION.providerOwned)assert.ok(!app.includes('#'+sensitive),'Must leave provider data: '+sensitive);
for(const name of ['/lib/i18n-classified-v360.mjs','/app-i18n-classified-v360.js'])assert.ok(sw.includes(name),'Offline cache missing '+name);
assert.ok(sw.includes('sgbuddy-shell-v80'));
assert.ok(boot.includes("import('/app-i18n-classified-v360.js')"),'Bootstrap must load V3.6');
assert.ok(boot.includes("='4.15.0'"),'Client version must advance');
assert.ok(read('index.html').includes('v4.15.0'));
const csv=read('docs/native-review-v360.csv').trim().split('\n');
assert.equal(csv.length,34,'11 locales × 3 domains plus CSV header');
assert.ok(csv[0].includes('status')&&csv[0].includes('reviewer'));
assert.ok(csv.slice(1).every(x=>x.includes(',pending,,')),'No claim of native review before it happens');
console.log('V3.6 STATIC PASS: 33 HTML candidates categorized, 19 source-safe message states / 12 locales, review gates pending, PWA v65.');
