import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {PRIORITY_V440_KEYS,PRIORITY_V440_MESSAGES,priorityText} from '../lib/i18n-priority-v440.mjs';
assert.equal(LOCALES.length,12);
assert.equal(PRIORITY_V440_KEYS.length,28);
assert.equal(new Set(PRIORITY_V440_KEYS).size,28);
for(const {code} of LOCALES){
 const row=PRIORITY_V440_MESSAGES[code];
 assert.equal(Object.keys(row||{}).length,28,code+' dictionary incomplete');
 for(const key of PRIORITY_V440_KEYS){
  assert.ok(typeof row[key]==='string'&&row[key].trim(),code+' '+key+' empty');
  assert.equal(priorityText(code,key),row[key]);
  assert.ok(!/[{}]/.test(row[key]),code+' unexpected placeholders in '+key);
 }
 if(code!=='en')assert.ok(PRIORITY_V440_KEYS.filter(key=>row[key]!==PRIORITY_V440_MESSAGES.en[key]).length>=26,code+' needs proper authored translations');
}
const module=readFileSync('app-i18n-priority-v440.js','utf8');
for(const term of ['#accountSheet','#uxSavedView','#foodCards .food-stall','#discoverQuality','#tripIntelligence','MutationObserver','aria-pressed',"sgbuddy:language"]){
 assert.ok(module.includes(term),'Missing localized surface '+term);
}
assert.ok(!module.includes('innerHTML=')&&!module.includes('querySelectorAll("*")'),'Unsafe first-party text scope');
const boot=readFileSync('app-v090.js','utf8');
assert.ok(boot.includes("import('/app-i18n-priority-v440.js')"),'Priority runtime not booted');
assert.ok(boot.includes("='4.2.0'"),'Do not change production badge on development branch');
const sw=readFileSync('sw.js','utf8');
assert.ok(sw.includes('/lib/i18n-priority-v440.mjs')&&sw.includes('/app-i18n-priority-v440.js'),'Offline shell must include localized patch');
assert.ok(readFileSync('scripts/check-all.mjs','utf8').includes("scripts/check-v440.mjs"),'Full suite missing V4.4');
console.log('V4.4 STATIC PASS: 28 high-priority texts x 12 languages, strict source-lock, shell and regressions.');
