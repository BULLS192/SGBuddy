import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {UX_KEYS,UX_MESSAGES,uxText} from '../lib/i18n-ux-v311.mjs';
assert.equal(LOCALES.length,12);assert.equal(UX_KEYS.length,19);
for(const {code} of LOCALES){assert.equal(Object.keys(UX_MESSAGES[code]||{}).length,19);for(const key of UX_KEYS)assert.ok(uxText(code,key).trim(),code+'/'+key)}
const ux=readFileSync('app-ux-v170.js','utf8'),boot=readFileSync('app-v090.js','utf8'),sw=readFileSync('sw.js','utf8');
assert.ok(ux.includes('ut(buddyKeys[x])')&&ux.includes("ut('airCopy')")&&ux.includes("ut('accountCopy')"));
assert.ok(boot.includes("import('/app-i18n-ux-v311.js')"));
for(const f of ['/lib/i18n-ux-v311.mjs','/app-i18n-ux-v311.js'])assert.ok(sw.includes(f));
console.log('V3.11 additional UX PASS: 19 messages × 12 locales, direct render bindings, PWA precache.');
