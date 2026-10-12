import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {FALLBACK_KEYS,FALLBACK_MESSAGES,FALLBACK_SOURCE,fallbackMessage} from '../lib/i18n-fallback-v390.mjs';
const vars=s=>[...String(s).matchAll(/\{(count|areas)\}/g)].map(x=>x[1]).sort();
assert.equal(FALLBACK_KEYS.length,12);
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 const pack=FALLBACK_MESSAGES[code];
 assert.equal(Object.keys(pack||{}).length,12,'Missing locale '+code);
 for(const key of FALLBACK_KEYS){
  assert.ok(pack[key]?.trim(),code+'/'+key);
  assert.deepEqual(vars(pack[key]),vars(FALLBACK_SOURCE[key]),code+'/'+key+' placeholders');
  assert.ok(fallbackMessage(code,key,{count:'14',areas:'2'}).length);
 }
}
const source=readFileSync('app-i18n-fallback-v390.js','utf8');
for(const selector of ['#foodPickNote','.food-address','#foodCount','#discoverStatus','#discoverResults .discover-empty','#placeSearch','.places-toolbar > span'])
 assert.ok(source.includes(selector),'Missing owned UI anchor '+selector);
assert.ok(source.includes('prior=new WeakMap()')&&source.includes('MutationObserver'));
const boot=readFileSync('app-v090.js','utf8');
assert.ok(boot.includes("import('/app-i18n-fallback-v390.js')"));
assert.ok(boot.includes("='3.11.1'"));
assert.ok(readFileSync('index.html','utf8').includes('v3.11.1'));
const worker=readFileSync('sw.js','utf8');
assert.ok(worker.includes('sgbuddy-shell-v69'));
for(const filename of ['/app-i18n-fallback-v390.js','/lib/i18n-fallback-v390.mjs'])
 assert.ok(worker.includes(filename),'Offline asset missing '+filename);
const report=JSON.parse(execFileSync(process.execPath,['scripts/classify-localization-v390.mjs','--json'],{encoding:'utf8',maxBuffer:35*1024*1024}));
assert.equal(report.wholeAppTranslationPercent,null);
assert.ok(report.client.scanned>=90);
assert.ok(report.editorial.scanned>=300);
assert.ok(report.server.scanned>=10);
assert.equal(Object.values(report.client.byDecision).reduce((a,b)=>a+b,0),report.client.scanned);
assert.equal(Object.values(report.editorial.byDecision).reduce((a,b)=>a+b,0),report.editorial.scanned);
console.log('V3.9 PASS: 12 locales x 12 fallback messages, exact-source DOM bindings, 7 source-locked target groups; '+report.client.scanned+' JS and '+report.editorial.scanned+' editorial candidates classified.');
