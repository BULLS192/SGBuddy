import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {factTranslation,translatedFactCount,LOCALIZED_FACTS} from '../lib/i18n-facts-v310.mjs';
import {NATURE_FACTS} from '../lib/i18n-nature-v311.mjs';
import {WATER_SOURCE_FACTS} from '../lib/i18n-water-v312.mjs';
import {CIVIC_FACT_SOURCE} from '../lib/i18n-civic-v313.mjs';
import {PARK_FACT_SOURCE} from '../lib/i18n-parks-v313.mjs';
import {HISTORY_FACT_SOURCE} from '../lib/i18n-history-v313.mjs';
import {HERITAGE_FACT_SOURCE} from '../lib/i18n-heritage-v313.mjs';
import {CULTURE_FACT_SOURCE} from '../lib/i18n-culture-v313.mjs';
import {AWARD_FACT_SOURCE} from '../lib/i18n-awards-v313.mjs';
import {appContentTranslation,COMPLETE_APP_SOURCES,translatedAppCount} from '../lib/i18n-app-content-v312.mjs';
const read=p=>readFileSync(p,'utf8');
const facts=JSON.parse(read('data/facts-published.json')).facts.filter(x=>x.status==='verified');
const apps=JSON.parse(read('data/everyday-apps-v240.json')).catalogue;
const named=[
 ['early',Object.fromEntries(Object.entries(LOCALIZED_FACTS).map(([id,x])=>[id,x.source]))],
 ['nature',Object.fromEntries(Object.entries(NATURE_FACTS).map(([id,x])=>[id,x.source]))],
 ['water',WATER_SOURCE_FACTS],
 ['civic',CIVIC_FACT_SOURCE],
 ['parks',PARK_FACT_SOURCE],
 ['history',HISTORY_FACT_SOURCE],
 ['heritage',HERITAGE_FACT_SOURCE],
 ['culture',CULTURE_FACT_SOURCE],
 ['awards',AWARD_FACT_SOURCE]
];
const union=new Map();
for(const [pack,dict] of named)for(const [id,text] of Object.entries(dict)){
 assert.ok(!union.has(id),'Duplicate fact ID '+id+' across '+pack+' and '+union.get(id)?.pack);
 union.set(id,{pack,text});
}
assert.equal(facts.length,152,'Published catalog changed; add source-reviewed translations');
assert.equal(translatedFactCount,152,'Incomplete fact translation registry');
assert.equal(union.size,152,'All 152 facts need exactly one source-locked translation');
assert.equal(apps.length,69);
assert.equal(translatedAppCount,69);
assert.equal(Object.keys(COMPLETE_APP_SOURCES).length,69);
for(const f of facts){
 assert.ok(union.has(f.id),'Missing published fact '+f.id);
 assert.equal(union.get(f.id).text,f.text,'Source changed: '+f.id);
}
for(const a of apps){
 assert.deepEqual(COMPLETE_APP_SOURCES[a.id],{summary:a.summary,purpose:a.purpose},'App changed: '+a.id);
}
for(const {code} of LOCALES){
 let factsDone=0,appsDone=0;
 for(const f of facts){
  const tr=factTranslation(code,f);
  if(code==='en'){assert.equal(tr,null,'Original English should render canonical source');continue;}
  assert.ok(typeof tr==='string'&&tr.trim()&&tr!==f.text,'Missing source-verified '+code+' fact '+f.id);
  factsDone++;
  const changed={...f,text:'Changed after verification'};
  assert.equal(factTranslation(code,changed),null,'Changed source must fall back '+f.id);
  for(const year of f.text.match(/\b(?:18|19|20)\d{2}\b/g)||[])
   assert.ok(tr.includes(year),'Historic year changed: '+code+' '+f.id+' '+year);
 }
 for(const a of apps){
  for(const field of ['summary','purpose']){
   const tr=appContentTranslation(code,a,field);
   if(code==='en'){assert.equal(tr,null,'Original English should be canonical');continue;}
   assert.ok(typeof tr==='string'&&tr.trim()&&tr!==a[field],code+' missing app '+a.id+' '+field);
   assert.equal(appContentTranslation(code,{...a,summary:'Changed by publisher'},field),null,'App source revision must fall back: '+a.id);
   assert.equal(appContentTranslation(code,a,'accountNeeded'),null,'Eligibility has not been translated');
  }
  if(code!=='en')appsDone++;
 }
 if(code!=='en')assert.deepEqual({factsDone,appsDone},{factsDone:152,appsDone:69});
}
const runtime=read('app-apps-v240.js'),factUi=read('app-v140.js'),sw=read('sw.js');
assert.ok(runtime.includes("appContentTranslation(currentLocale(),a,'summary')"),'App summary renderer must use canonical locale packs');
assert.ok(factUi.includes("factTranslation(locale(),f)"),'Fact renderer must use canonical locale packs');
for(const file of ['i18n-civic-v313.mjs','i18n-parks-v313.mjs','i18n-history-v313.mjs','i18n-heritage-v313.mjs','i18n-culture-v313.mjs','i18n-awards-v313.mjs','i18n-app-content2-v313.mjs','i18n-app-content3-v313.mjs','i18n-app-content4-v313.mjs','i18n-app-content5-v313.mjs'])
 assert.ok(sw.includes('/lib/'+file),'Offline package missing '+file);
console.log('V3.1 FULL CORE PASS: 152/152 verified facts, 69/69 core app summaries and purposes, 11 non-English locales, 0 source-locked English fallbacks; source/revision and year safeguards.');
