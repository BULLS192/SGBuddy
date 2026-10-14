import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CONTENT_TAXONOMY,CONTENT_TAXONOMY_KEYS,taxonomyLabel} from '../lib/i18n-content-taxonomy-v310.mjs';
import {LOCALIZED_FACTS,FACT_TEMPLATES,FACT_TRANSLATION_PATTERNS,factTranslation} from '../lib/i18n-facts-v310.mjs';
const load=path=>readFileSync(path,'utf8');
const json=path=>JSON.parse(load(path));
const facts=json('data/facts-published.json').facts;
const apps=json('data/everyday-apps-v240.json').catalogue;
const dishes=json('data/singapore-dishes-v180.json').dishes;
const stalls=json('data/food-stalls-v180.json').stalls;
const sample=Object.values(LOCALIZED_FACTS);
assert.equal(LOCALES.length,12);
assert.equal(CONTENT_TAXONOMY_KEYS.length,36);
assert.equal(sample.length,10,'First content pack must include 10 source-checked facts');
assert.equal(FACT_TRANSLATION_PATTERNS.length,10);
const orig=new Map(facts.filter(x=>x.status==='verified').map(f=>[f.id,f]));
for(const item of Object.entries(LOCALIZED_FACTS)){
 const [id,translation]=item,source=orig.get(id);
 assert.ok(source,'Orphan or unreviewed fact translation '+id);
 assert.equal(source.text,translation.source,'Stale source fact translation: '+id);
 assert.ok(FACT_TRANSLATION_PATTERNS.includes(translation.pattern),'Unknown pattern '+id);
 for(const field of Object.keys(translation.values)){
  assert.ok(translation.source.includes(translation.values[field]),id+' changed factual value '+field);
 }
 assert.equal(factTranslation('en',source),null);
 assert.equal(factTranslation('fr',{...source,text:'Changed source!'}),null,'Mismatched source must not use stale translation');
 assert.equal(factTranslation('fr',{...source,status:'review-pending'}),null,'Pending fact must retain source text');
}
const classification=[
 ...new Set(apps.map(a=>a.category)),
 ...new Set(facts.filter(f=>f.status==='verified').map(f=>f.theme)),
 ...new Set(dishes.map(x=>x.cuisine)),
 ...new Set(stalls.map(x=>x.cuisine))
];
for(const name of classification)assert.ok(CONTENT_TAXONOMY_KEYS.includes(name),'Unmapped taxonomy '+name);
for(const {code} of LOCALES){
 assert.equal(Object.keys(CONTENT_TAXONOMY[code]||{}).length,36,code+' missing content taxonomies');
 assert.equal(Object.keys(FACT_TEMPLATES[code]||{}).length,10,code+' missing fact templates');
 for(const key of CONTENT_TAXONOMY_KEYS)assert.ok(taxonomyLabel(code,key).trim(),code+' missing '+key);
 for(const source of orig.values()){
  if(!LOCALIZED_FACTS[source.id])continue;
  const out=factTranslation(code,source);
  if(code==='en')assert.equal(out,null);
  else{
   assert.ok(out&&out!==source.text,code+' content translation absent '+source.id);
   for(const factPart of Object.values(LOCALIZED_FACTS[source.id].values))assert.ok(out.includes(factPart),code+' factual value modified '+source.id);
  }
 }
}
for(const [file,parts] of [
 ['app-v120.js',["factTranslation(locale(),fact)","taxonomyLabel(locale(),app.category)","sgbuddy:language"]],
 ['app-v140.js',["factTranslation(locale(),f)","factTranslation(locale(),next)","taxonomyLabel(locale(),f.theme)"]],
 ['app-food-v180.js',["taxonomyLabel(locale(),x.cuisine)","sgbuddy:language"]],
 ['app-apps-v240.js',["taxonomyLabel(currentLocale(),a.category)","sgbuddy:language"]]
])for(const part of parts)assert.ok(load(file).includes(part),file+' missing integration '+part);
const browser=load('app-device-translate-v300.js');
assert.ok(browser.includes("node.dataset.contentLocalized==='true'"),'Reviewed content must never be machine-retranslated');
const sw=load('sw.js'),boot=load('app-v090.js'),html=load('index.html');
assert.ok(sw.includes('sgbuddy-shell-v79'),'Installed PWA requires cache bust');
for(const path of ['/lib/i18n-content-taxonomy-v310.mjs','/lib/i18n-facts-v310.mjs'])
 assert.ok(sw.includes(path),'Missing offline content pack '+path);
assert.ok(boot.includes("='4.14.0'")&&html.includes('v4.14.0'),'Release version must agree');
console.log('V3.1 CONTENT PACK PASS: 12 languages, 36 taxonomy labels, 10 source-locked facts, search/render integration and source integrity.');
