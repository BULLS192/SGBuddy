import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {MERLI_MESSAGE_KEYS,MERLI_MESSAGES,merliMessage} from '../lib/i18n-merli-replies-v315.mjs';
import {APP_STATUS_KEYS,APP_STATUS,appStatus} from '../lib/i18n-app-status-v315.mjs';
import {SERVICE_NOTE_IDS,SERVICE_NOTE_SOURCE,SERVICE_NOTE_PACK,serviceNote} from '../lib/i18n-service-safety-v315.mjs';
const read=p=>readFileSync(p,'utf8'),j=p=>JSON.parse(read(p));
const appRecords=[...j('data/everyday-apps-v240.json').catalogue,...j('data/dining-services-v261.json').additions];
assert.equal(LOCALES.length,12);
assert.equal(MERLI_MESSAGE_KEYS.length,20);
assert.equal(APP_STATUS_KEYS.length,5);
assert.equal(SERVICE_NOTE_IDS.length,4);
const protectedTokens=['SG Arrival Card','Singpass','DBS/POSB','go.gov.sg/cdcv','Chope'];
for(const {code} of LOCALES){
 assert.equal(Object.keys(MERLI_MESSAGES[code]||{}).length,20,'Incomplete Merli '+code);
 assert.equal(Object.keys(APP_STATUS[code]||{}).length,5,'Incomplete statuses '+code);
 for(const key of MERLI_MESSAGE_KEYS)assert.ok(merliMessage(code,key).trim(),'Missing Merli message '+code+' '+key);
 for(const key of APP_STATUS_KEYS)assert.ok(appStatus(code,key).trim(),'Missing app message '+code+' '+key);
 assert.ok(appStatus(code,'count',{matched:7,mobile:65,web:17,saved:3}).includes('7'),code+' missing count interpolation');
 assert.ok(merliMessage(code,'airOfficial',{measurements:'24h PSI 44'}).includes('24h PSI 44'),'Official readings must retain units '+code);
 if(code==='en'){for(const id of SERVICE_NOTE_IDS){const a=appRecords.find(a=>a.id===id);assert.equal(serviceNote(code,a,'accountNeeded'),null)}continue;}
 assert.equal(Object.keys(SERVICE_NOTE_PACK[code]||{}).length,4,'Missing service requirements '+code);
 for(const id of SERVICE_NOTE_IDS){
  const a=appRecords.find(x=>x.id===id);
  assert.ok(a,'Missing app '+id);
  assert.deepEqual(SERVICE_NOTE_SOURCE[id],{notes:a.notes,accountNeeded:a.accountNeeded},'Stale source '+id);
  for(const field of ['notes','accountNeeded']){
   const tr=serviceNote(code,a,field);
   assert.ok(tr&&tr!==a[field],code+' missing '+id+' '+field);
   assert.equal(serviceNote(code,{...a,accountNeeded:'Changed eligibility'},field),null,'Never translate mismatched eligibility');
   assert.equal(serviceNote(code,{...a,notes:'Changed publisher warning'},field),null,'Never translate mismatched warning');
  }
 }
}
for(const [code,name] of [['zh-CN','SG Arrival Card'],['fr','SG Arrival Card'],['pt-BR','SG Arrival Card']]){
 const app=appRecords.find(x=>x.id==='V24-APP-004');
 assert.ok(serviceNote(code,app,'notes').includes(name),'Preserve card product name '+code);
}
const app=read('app-apps-v240.js'),merli=read('app-v140.js'),sw=read('sw.js');
for(const s of ['serviceNote(currentLocale(),a','appStatus(currentLocale()','app-guide-english-original','lang="en"','data-content-localized'])assert.ok(app.includes(s),'Service text integration missing '+s);
for(const s of ['merliMessage(locale()','sayLocalized(','lastLocalReply','sgbuddy:language'])assert.ok(merli.includes(s),'Merli reactive reply missing '+s);
for(const p of ['/lib/i18n-merli-replies-v315.mjs','/lib/i18n-app-status-v315.mjs','/lib/i18n-service-safety-v315.mjs'])assert.ok(sw.includes(p),'Offline cache missing '+p);
console.log('V3.1 APPLICATION-STRING PASS: 12-language Merli and dynamic app messages; four source-locked risk services in 11 languages, exact original English always accessible.');
