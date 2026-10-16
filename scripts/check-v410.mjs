import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {DIRECTORY_V410_KEYS,DIRECTORY_V410_MESSAGES,directoryText} from '../lib/i18n-directory-v410.mjs';

const keys=new Set(DIRECTORY_V410_KEYS);
assert.equal(LOCALES.length,12);
assert.equal(DIRECTORY_V410_KEYS.length,45,'V4.1 directory key inventory drift');
assert.equal(keys.size,DIRECTORY_V410_KEYS.length,'Duplicate V4.1 key');
const slots=s=>[...String(s).matchAll(/\{([a-zA-Z]+)\}/g)].map(m=>m[1]).sort();
for(const {code} of LOCALES){
 const pack=DIRECTORY_V410_MESSAGES[code];
 assert.ok(pack,'Locale catalogue missing: '+code);
 assert.equal(Object.keys(pack).length,45,'Incomplete locale '+code);
 for(const key of DIRECTORY_V410_KEYS){
  assert.ok(typeof pack[key]==='string'&&pack[key].trim(),code+':'+key+' empty');
  assert.deepEqual(slots(pack[key]),slots(DIRECTORY_V410_MESSAGES.en[key]),code+':'+key+' placeholders');
  const rendered=directoryText(code,key,{name:'<Marina & Bay>',hours:'9:00–18:00',operator:'Sample Operator',start:'2026-10-01',end:'2026-10-03',reason:'Scheduled cleaning'});
  assert.ok(!/\{(?:name|hours|operator|start|end|reason)\}/.test(rendered),code+':'+key+' did not render');
 }
 if(code!=='en')assert.ok(DIRECTORY_V410_KEYS.filter(key=>pack[key]!==DIRECTORY_V410_MESSAGES.en[key]).length>=42,code+' insufficient authored translations');
}
const source=readFileSync('app-v120.js','utf8'),sw=readFileSync('sw.js','utf8');
for(const part of [
 'directoryText(locale(),key,fields)',
 "contextMode(locale(),state.mode,'placesCopy')",
 "safe(d(marked?'removeAria':'saveAria',{name:place.name}))",
 "safe(d(marked?'removeAria':'saveAria',{name:app.name}))",
 "d('reportedHours',{hours:place.sourceReportedHours})",
 "d('closure',{start:row.start,end:row.end,reason:row.reason})",
 "d('addressMatched')","d('publisherDownload')","d('catalogFallback')",
 "safe(displayPlaceName(place))","safe(place.area)","safe(a.address)","safe(factTranslation(locale(),fact)||fact.text)"
])assert.ok(source.includes(part),'Missing V4.1 runtime/source-lock: '+part);
assert.ok(!source.includes("'Hours shown by business: '"),'English-only reported hours remain');
assert.ok(!source.includes("'Official publisher reference; check"),'English-only publisher status remains');
for(const name of ['sgbuddy-shell-v90','/lib/i18n-directory-v410.mjs','/lib/i18n-food-status-v400.mjs','/lib/i18n-discover-status-v400.mjs','/merli-avatar-v3111.js'])assert.ok(sw.includes(name),'PWA asset missing: '+name);
assert.ok(readFileSync('app-v090.js','utf8').includes("='4.24.0'"),'V4.1 development must preserve production release badge until promotion');
const audit=JSON.parse(execFileSync(process.execPath,['scripts/audit-app-v380.mjs','--json'],{encoding:'utf8',maxBuffer:30*1024*1024}));
assert.equal(audit.globalWholeAppCompletionPercent,null,'Do not claim unaudited whole-app completion');
assert.equal(audit.locales.en.byArea.authoredUiCatalogue.total,553);
for(const {code} of LOCALES)assert.equal(audit.locales[code].knownAuthoredInventory.total,audit.classifiedEligibleEntries);
console.log('V4.1 STATIC PASS: 45 source-locked card/context messages × 12 locales, 540 authored entries; app and PWA integrity, source safety, audit scope.');
