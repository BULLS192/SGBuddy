/* V3.1 localization inventory: deterministic counts, no remote services or translation billing.
   Run: node scripts/localization-report-v310.mjs --json
   Optional: --out=/tmp/content-coverage.json writes report for CI artifact upload. */
import fs from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CONTENT_TAXONOMY_KEYS,CONTENT_TAXONOMY} from '../lib/i18n-content-taxonomy-v310.mjs';
import {LOCALIZED_FACTS,factTranslation} from '../lib/i18n-facts-v310.mjs';
import {NATURE_FACTS} from '../lib/i18n-nature-v311.mjs';
import {WATER_SOURCE_FACTS} from '../lib/i18n-water-v312.mjs';
import {CIVIC_FACT_SOURCE} from '../lib/i18n-civic-v313.mjs';
import {PARK_FACT_SOURCE} from '../lib/i18n-parks-v313.mjs';
import {APP_SOURCE_FIELDS,appContentTranslation} from '../lib/i18n-app-content-v312.mjs';
import {DISH_SOURCE_DESCRIPTIONS,dishTranslation} from '../lib/i18n-dishes-v311.mjs';
import {STALL_NOTE_SOURCE,stallNoteTranslation} from '../lib/i18n-stall-notes-v311.mjs';
const load=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const facts=load('data/facts-published.json').facts.filter(x=>x.status==='verified');
const apps=load('data/everyday-apps-v240.json').catalogue;
const dishes=load('data/singapore-dishes-v180.json').dishes;
const stalls=load('data/food-stalls-v180.json').stalls;
const discover=load('data/discover-v120.json');
const dimensions=[
 ['appCategories',[...new Set(apps.map(x=>x.category))]],
 ['factThemes',[...new Set(facts.map(x=>x.theme))]],
 ['dishCuisines',[...new Set(dishes.map(x=>x.cuisine))]],
 ['stallCuisines',[...new Set(stalls.map(x=>x.cuisine))]]
];
const missingDefinitions=dimensions.flatMap(([name,values])=>values.filter(v=>!CONTENT_TAXONOMY_KEYS.includes(v)).map(v=>({name,value:v})));
const report={
 version:'3.1.0',sourceDate:load('data/facts-published.json').publishedOn,
 sourceCounts:{publishedVerifiedFacts:facts.length,appDescriptions:apps.length,dishDescriptions:dishes.length,stallNotes:stalls.length,discoverPlaces:discover.places.length},
 taxonomyDimensions:Object.fromEntries(dimensions.map(([name,values])=>[name,values.length])),
 taxonomySourceKeys:CONTENT_TAXONOMY_KEYS.length,
 missingDefinitions,
 locales:{},
 translationPolicy:'Reviewed source-ID records and fixed taxonomy labels only; nontranslated descriptions remain in original English. Official names, addresses, links, prices and certification are never changed.'
};
for(const {code} of LOCALES){
 const translatedFacts=facts.filter(f=>Boolean(factTranslation(code,f))).length;
 const translatedDishes=dishes.filter(d=>Boolean(dishTranslation(code,d))).length;
 const translatedStalls=stalls.filter(x=>Boolean(stallNoteTranslation(code,x))).length;
 const translatedApps=apps.filter(x=>Boolean(appContentTranslation(code,x,'summary')&&appContentTranslation(code,x,'purpose'))).length;
 const localeTaxonomy=CONTENT_TAXONOMY[code];
 const missingTaxonomy=CONTENT_TAXONOMY_KEYS.filter(k=>!localeTaxonomy?.[k]);
 report.locales[code]={
  translatedVerifiedFacts:code==='en'?facts.length:translatedFacts,
  fallbackVerifiedFacts:code==='en'?0:facts.length-translatedFacts,
  taxonomyEntries:CONTENT_TAXONOMY_KEYS.length-missingTaxonomy.length,
  taxonomyMissing:missingTaxonomy,
  pretranslatedAppSummaries:code==='en'?apps.length:translatedApps,
  fallbackAppSummaries:code==='en'?0:apps.length-translatedApps,
  pretranslatedDishDescriptions:code==='en'?dishes.length:translatedDishes,
  fallbackDishDescriptions:code==='en'?0:dishes.length-translatedDishes,
  pretranslatedStallNotes:code==='en'?stalls.length:translatedStalls,
  fallbackStallNotes:code==='en'?0:stalls.length-translatedStalls
 };
}
const allFactEntries={...LOCALIZED_FACTS,...NATURE_FACTS,...Object.fromEntries(Object.entries(WATER_SOURCE_FACTS).map(([id,source])=>[id,{source}])),...Object.fromEntries(Object.entries(CIVIC_FACT_SOURCE).map(([id,source])=>[id,{source}])),...Object.fromEntries(Object.entries(PARK_FACT_SOURCE).map(([id,source])=>[id,{source}]))};
const orphanTranslations=Object.keys(allFactEntries).filter(id=>!facts.some(f=>f.id===id));
const staleTranslations=Object.keys(allFactEntries).filter(id=>{
 const row=facts.find(f=>f.id===id);return row&&row.text!==allFactEntries[id].source;
});
report.orphanTranslations=orphanTranslations;report.staleTranslations=staleTranslations;
report.staleDishTranslations=dishes.filter(x=>DISH_SOURCE_DESCRIPTIONS[x.id]!==x.description).map(x=>x.id);
report.orphanDishTranslations=Object.keys(DISH_SOURCE_DESCRIPTIONS).filter(id=>!dishes.some(d=>d.id===id));
report.staleStallNotes=stalls.filter(x=>STALL_NOTE_SOURCE[x.id]!==x.notes).map(x=>x.id);
report.orphanStallNotes=Object.keys(STALL_NOTE_SOURCE).filter(id=>!stalls.some(x=>x.id===id));
report.staleAppDescriptions=apps.filter(x=>APP_SOURCE_FIELDS[x.id]&&(APP_SOURCE_FIELDS[x.id].summary!==x.summary||APP_SOURCE_FIELDS[x.id].purpose!==x.purpose)).map(x=>x.id);
report.orphanAppDescriptions=Object.keys(APP_SOURCE_FIELDS).filter(id=>!apps.some(x=>x.id===id));
const payload=JSON.stringify(report,null,2)+'\n';
const out=process.argv.find(arg=>arg.startsWith('--out='));
if(out)fs.writeFileSync(out.slice(6),payload);
if(process.argv.includes('--json'))process.stdout.write(payload);
else{
 console.log('SGBuddy V3.1 CONTENT COVERAGE');
 console.log('Verified facts: '+facts.length+' | localized in each non-English language: '+report.locales['zh-CN'].translatedVerifiedFacts+' | awaiting translation: '+report.locales['zh-CN'].fallbackVerifiedFacts);
 console.log('App summaries/purposes: '+report.locales['zh-CN'].pretranslatedAppSummaries+'/'+apps.length+' translated | Dish descriptions: '+report.locales['zh-CN'].pretranslatedDishDescriptions+'/'+dishes.length+' translated | Stall notes: '+report.locales['zh-CN'].pretranslatedStallNotes+'/'+stalls.length+' translated');
 console.log('Taxonomy vocabulary: '+CONTENT_TAXONOMY_KEYS.length+' keys × '+LOCALES.length+' locales');
 console.log('Stale fact translations: '+staleTranslations.length+'; orphan fact translations: '+orphanTranslations.length);
}
if(missingDefinitions.length||orphanTranslations.length||staleTranslations.length||report.staleDishTranslations.length||report.orphanDishTranslations.length||report.staleStallNotes.length||report.orphanStallNotes.length||report.staleAppDescriptions.length||report.orphanAppDescriptions.length||Object.values(report.locales).some(x=>x.taxonomyMissing.length))process.exitCode=1;
