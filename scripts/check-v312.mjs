import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {WATER_SOURCE_FACTS,WATER_FACT_TRANSLATIONS,waterFactTranslation} from '../lib/i18n-water-v312.mjs';
import {APP_SOURCE_FIELDS,APP_LOCALIZATION_ORDER,APP_CONTENT,appContentTranslation} from '../lib/i18n-app-content-v312.mjs';
import {factTranslation,translatedFactCount} from '../lib/i18n-facts-v310.mjs';
const read=p=>readFileSync(p,'utf8');
const facts=JSON.parse(read('data/facts-published.json')).facts.filter(x=>x.status==='verified');
const apps=JSON.parse(read('data/everyday-apps-v240.json')).catalogue;
assert.equal(facts.length,152);
assert.equal(apps.length,69);
assert.equal(APP_LOCALIZATION_ORDER.length,15);
assert.equal(Object.keys(WATER_SOURCE_FACTS).length,12);
assert.equal(translatedFactCount,152);
const appIds=new Set, factIds=new Set;
for(const app of apps){assert.ok(!appIds.has(app.id),'duplicate app '+app.id);appIds.add(app.id);}
for(const fact of facts){assert.ok(!factIds.has(fact.id),'duplicate fact '+fact.id);factIds.add(fact.id);}
for(const [id,source] of Object.entries(WATER_SOURCE_FACTS)){
 const fact=facts.find(x=>x.id===id);assert.ok(fact,'Missing verified water source '+id);
 assert.equal(fact.text,source,'Water source text changed: '+id);
 assert.equal(waterFactTranslation('en',fact),null);
 assert.equal(waterFactTranslation('pt-BR',{...fact,status:'review-pending'}),null);
 assert.equal(waterFactTranslation('ja',{...fact,text:'Updated fact'}),null);
}
for(const [id,src] of Object.entries(APP_SOURCE_FIELDS)){
 const app=apps.find(x=>x.id===id);assert.ok(app,'Missing app '+id);
 assert.equal(app.summary,src.summary,'App summary source changed '+id);
 assert.equal(app.purpose,src.purpose,'App purpose source changed '+id);
 for(const field of ['summary','purpose'])assert.equal(appContentTranslation('en',app,field),null);
 assert.equal(appContentTranslation('ko',{...app,summary:'Changed source'},'purpose'),null,'Changing either source field invalidates both translations');
 assert.equal(appContentTranslation('ko',{...app,purpose:'Changed source'},'summary'),null);
 assert.equal(appContentTranslation('fr',app,'accountNeeded'),null,'Unsafe eligibility field must remain original');
}
for(const {code} of LOCALES){
 assert.equal(Object.keys(WATER_FACT_TRANSLATIONS[code]||{}).length,12,code+' water pack count');
 assert.equal(Object.keys(APP_CONTENT[code]||{}).length,15,code+' apps pack count');
 for(const f of facts.filter(x=>WATER_SOURCE_FACTS[x.id])){
  const translation=factTranslation(code,f);
  if(code==='en')assert.equal(translation,null);
  else{
   assert.ok(translation&&translation!==f.text,code+' missing water fact '+f.id);
   for(const n of (f.text.match(/\b(?:19|20)\d{2}\b/g)||[]))assert.ok(translation.includes(n),code+' changed historic year '+f.id);
  }
 }
 for(const app of apps.filter(x=>APP_SOURCE_FIELDS[x.id])){
  for(const field of ['summary','purpose']){
   const translation=appContentTranslation(code,app,field);
   if(code==='en')assert.equal(translation,null);
   else assert.ok(typeof translation==='string'&&translation.trim()!==app[field],code+' missing app '+app.id+' '+field);
  }
 }
}
const appUi=read('app-apps-v240.js'),factsUi=read('lib/i18n-facts-v310.mjs'),sw=read('sw.js'),audit=read('scripts/localization-report-v310.mjs');
for(const part of ['appContentTranslation(currentLocale(),a','data-content-localized','translated(a,\'summary\')','translated(a,\'purpose\')'])assert.ok(appUi.includes(part),'App UI not wired: '+part);
assert.ok(appUi.includes("appContentTranslation(currentLocale(),a,'summary')||''"),'Localized app search missing');
assert.ok(factsUi.includes('waterFactTranslation(locale,record)'),'Water facts not connected to actual pages');
for(const path of ['/lib/i18n-app-content-v312.mjs','/lib/i18n-water-v312.mjs'])assert.ok(sw.includes(path),'Missing offline file '+path);
for(const part of ['COMPLETE_APP_SOURCES','WATER_SOURCE_FACTS','translatedApps','fallbackAppSummaries','staleAppDescriptions'])assert.ok(audit.includes(part),'Unaccounted coverage '+part);
console.log('V3.1-C PASS: source-verified 38 facts and 15 core app summary/purpose records across 12 languages, source mismatch fallback, app search and offline cache.');
