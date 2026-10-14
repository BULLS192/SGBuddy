import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {HOME_KEYS,HOME_MESSAGES,homeText} from '../lib/i18n-home-v310.mjs';
assert.equal(LOCALES.length,12);
assert.equal(HOME_KEYS.length,21);
for(const {code} of LOCALES){
 const pack=HOME_MESSAGES[code];
 assert.equal(Object.keys(pack||{}).length,HOME_KEYS.length,'Missing message group '+code);
 for(const key of HOME_KEYS)assert.ok(homeText(code,key)?.trim(),code+'/'+key);
}
const bridge=readFileSync('app-i18n-home-v310.js','utf8');
for(const text of ['#uxPersonaDescription','#uxMerliHomeTitle','#uxMerliHomeCopy','#uxPersonaName','#uxChangeMode','#nextUpTitle','#nextUpCopy','#locationStatus','#placeLabel','MutationObserver','sgbuddy:language','HOME_MESSAGES'])
 assert.ok(bridge.includes(text),'Missing first-party reactive anchor '+text);
assert.ok(bridge.includes("current===d.modes[mode].label+' mode'"));
const boot=readFileSync('app-v090.js','utf8');
// The V3.10 message catalogue remains regression-tested, but V3.11 owns
// these DOM anchors to avoid two observers racing after rerenders.
assert.ok(boot.includes("import('/app-i18n-home-v311.js')"));
assert.ok(!boot.includes("import('/app-i18n-home-v310.js')"));
const sw=readFileSync('sw.js','utf8');
for(const asset of ['/app-i18n-home-v310.js','/lib/i18n-home-v310.mjs'])assert.ok(sw.includes(asset));
assert.ok(sw.includes('sgbuddy-shell-v79'));
assert.ok(!bridge.includes('document.body.textContent'),'No broad text rewriting');
console.log('V3.10 HOME PASS: 21 first-party messages × 12 locales and source-locked contextual bindings.');
