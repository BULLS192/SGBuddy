/* V3.1 localization inventory: deterministic counts, no remote services or translation billing.
   Run: node scripts/localization-report-v310.mjs --json
   Optional: --out=/tmp/content-coverage.json writes report for CI artifact upload. */
import fs from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CONTENT_TAXONOMY_KEYS,CONTENT_TAXONOMY} from '../lib/i18n-content-taxonomy-v310.mjs';
import {LOCALIZED_FACTS,factTranslation} from '../lib/i18n-facts-v310.mjs';
import {NATURE_FACTS} from '../lib/i18n-nature-v311.mjs';
import {DISH_SOURCE_DESCRIPTIONS,dishTranslation} from '../lib/i18n-dishes-v311.mjs';
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
 const localeTaxonomy=CONTENT_TAXONOMY[code];
 const missingTaxonomy=CONTENT_TAXONOMY_KEYS.filter(k=>!localeTaxonomy?.[k]);
 report.locales[code]={
  translatedVerifiedFacts:code==='en'?facts.length:translatedFacts,
  fallbackVerifiedFacts:code==='en'?0:facts.length-translatedFacts,
  taxonomyEntries:CONTENT_TAXONOMY_KEYS.length-missingTaxonomy.length,
  taxonomyMissing:missingTaxonomy,
  pretranslatedAppSummaries:code==='en'?apps.length:0,
  pretranslatedDishDescriptions:code==='en'?dishes.length:translatedDishes,
  fallbackDishDescriptions:code==='en'?0:dishes.length-translatedDishes,
  pretranslatedStallNotes:code==='en'?stalls.length:0
 };
}
const allFactEntries={...LOCALIZED_FACTS,...NATURE_FACTS};
const orphanTranslations=Object.keys(allFactEntries).filter(id=>!facts.some(f=>f.id===id));
const staleTranslations=Object.keys(allFactEntries).filter(id=>{
 const row=facts.find(f=>f.id===id);return row&&row.text!==allFactEntries[id].source;
});
report.orphanTranslations=orphanTranslations;report.staleTranslations=staleTranslations;
report.staleDishTranslations=dishes.filter(x=>DISH_SOURCE_DESCRIPTIONS[x.id]!==x.description).map(x=>x.id);
report.orphanDishTranslations=Object.keys(DISH_SOURCE_DESCRIPTIONS).filter(id=>!dishes.some(d=>d.id===id));
const payload=JSON.stringify(report,null,2)+'\n';
const out=process.argv.find(arg=>arg.startsWith('--out='));
if(out)fs.writeFileSync(out.slice(6),payload);
if(process.argv.includes('--json'))process.stdout.write(payload);
else{
 console.log('SGBuddy V3.1 CONTENT COVERAGE');
 console.log('Verified facts: '+facts.length+' | localized in each non-English language: '+report.locales['zh-CN'].translatedVerifiedFacts+' | awaiting translation: '+report.locales['zh-CN'].fallbackVerifiedFacts);
 console.log('App summaries: '+apps.length+' pending | Dish descriptions: '+report.locales['zh-CN'].pretranslatedDishDescriptions+'/'+dishes.length+' translated | Stall notes: '+stalls.length+' pending');
 console.log('Taxonomy vocabulary: '+CONTENT_TAXONOMY_KEYS.length+' keys × '+LOCALES.length+' locales');
 console.log('Stale fact translations: '+staleTranslations.length+'; orphan fact translations: '+orphanTranslations.length);
}
if(missingDefinitions.length||orphanTranslations.length||staleTranslations.length||report.staleDishTranslations.length||report.orphanDishTranslations.length||Object.values(report.locales).some(x=>x.taxonomyMissing.length))process.exitCode=1;
