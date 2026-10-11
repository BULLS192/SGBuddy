import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {EXTRA_APP_IDS,EXTRA_APP_SOURCE,EXTRA_APP_LOCALIZED} from '../lib/i18n-extra-apps-v314.mjs';
import {appContentTranslation,translatedExtraAppCount} from '../lib/i18n-app-content-v312.mjs';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const travel=load('data/travel-essentials-v250.json').catalogue;
const dining=load('data/dining-services-v261.json').additions;
const combined=[...travel,...dining];
assert.equal(EXTRA_APP_IDS.length,10,'Expected six travel and four dining service entries');
assert.equal(translatedExtraAppCount,10,'Extended app registry must include all ten extra apps');
assert.equal(new Set(EXTRA_APP_IDS).size,EXTRA_APP_IDS.length,'Duplicate extra app IDs');
assert.equal(combined.length,EXTRA_APP_IDS.length,'Travel or dining catalogue changed; update translation pack');
for(const app of combined){
 assert.ok(EXTRA_APP_SOURCE[app.id],'Untranslated travel or dining app '+app.id);
 assert.deepEqual(EXTRA_APP_SOURCE[app.id],{summary:app.summary,purpose:app.purpose},'Source changed '+app.id);
 for(const field of ['summary','purpose']){
  assert.equal(appContentTranslation('en',app,field),null);
  assert.equal(appContentTranslation('fr',{...app,summary:'Source changed'},field),null,'Source mismatch must fallback');
 }
}
for(const {code} of LOCALES){
 assert.equal(Object.keys(EXTRA_APP_LOCALIZED[code]||{}).length,code==='en'?0:10,'Missing '+code+' app descriptions');
 for(const app of combined){
  for(const field of ['summary','purpose']){
   const localized=appContentTranslation(code,app,field);
   if(code==='en')assert.equal(localized,null);
   else assert.ok(typeof localized==='string'&&localized.trim()&&localized!==app[field],code+' '+app.id+' '+field);
  }
 }
}
const sw=readFileSync('sw.js','utf8');
assert.ok(sw.includes('/lib/i18n-extra-apps-v314.mjs'),'Extra app locale pack must be cached for offline use');
console.log('V3.1 EXTRA APP PASS: 10 travel/dining provider descriptions and purposes × 11 non-English languages, with original publisher eligibility and source records preserved.');
