import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {HOME_V412_KEYS,HOME_V412,home412Text,home412SourceKey} from '../lib/i18n-home-surface-v412.mjs';
assert.equal(HOME_V412_KEYS.length,27);
assert.equal(LOCALES.length,12);
assert.equal(new Set(HOME_V412_KEYS).size,27);
for(const {code} of LOCALES){
 const row=HOME_V412[code];assert.equal(Object.keys(row||{}).length,27,code+' lacks rows');
 for(const k of HOME_V412_KEYS){
  assert.ok(typeof row[k]==='string'&&row[k].trim().length>0,code+' '+k); // ideographic badges may be one character
  assert.equal(home412Text(code,k),row[k]);
  assert.equal(home412SourceKey(row[k]),k,'unexpected ambiguous string '+code+' '+k);
 }
 if(code!=='en')assert.ok(HOME_V412_KEYS.filter(k=>row[k]!==HOME_V412.en[k]).length>=25,code+' missing translations');
}
for(const key of ['weatherLoading','locationOff','riskTitleLow','riskCopyLow','riskLow','rain5'])assert.ok(home412SourceKey(HOME_V412.en[key])===key,key);
assert.equal(home412SourceKey('Singapore'),null);
assert.equal(home412SourceKey('24h PSI'),null);
assert.equal(home412SourceKey('NEA / data.gov.sg'),null);
assert.equal(home412SourceKey('Private customer message'),null);
const runtime=readFileSync('app-i18n-home-surface-v412.js','utf8');
for(const fragment of ['#weatherLabel','#locationStatus','#tripIntelTitle','#tripIntelCopy','#envRiskBadge','#environmentCard','sgbuddy:language','MutationObserver'])assert.ok(runtime.includes(fragment));
assert.ok(!runtime.includes('innerHTML=')&&!runtime.includes('querySelectorAll("*")'),'must not rewrite source content');
const boot=readFileSync('app-v090.js','utf8'),sw=readFileSync('sw.js','utf8');
assert.ok(boot.includes("import('/app-i18n-remaining-v411.js')).then(()=>import('/app-i18n-home-surface-v412.js')"),'boot order regression');
for(const asset of ['/app-i18n-home-surface-v412.js','/lib/i18n-home-surface-v412.mjs'])assert.ok(sw.includes("'"+asset+"'"),'PWA file missing '+asset);
assert.ok(sw.includes("sgbuddy-offline-packs-v480")&&sw.includes("c.addAll([...new Set(SHELL)])"),'offline safety regression');
assert.ok(boot.includes("='4.22.0'"),'release badge must match version 4.22.0');
const workflow=readFileSync('.github/workflows/check-v412.yml','utf8');
assert.ok(workflow.includes('scripts/browser-qa-v412.mjs'));
console.log('V4.12 STATIC PASS: 27 scoped authored Home messages × 12 locales; original source readings protected.');
