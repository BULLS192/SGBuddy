import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {DISH_SOURCE_DESCRIPTIONS,DISH_DESCRIPTION_KEYS,DISH_TRANSLATIONS,dishTranslation} from '../lib/i18n-dishes-v311.mjs';
import {NATURE_FACTS,NATURE_TEMPLATES,NATURE_PATTERN_KEYS,natureFactTranslation} from '../lib/i18n-nature-v311.mjs';
import {STALL_NOTE_SOURCE,STALL_NOTE_KEYS,STALL_NOTE_TRANSLATIONS,stallNoteTranslation} from '../lib/i18n-stall-notes-v311.mjs';
import {LOCALIZED_FACTS,factTranslation,translatedFactCount} from '../lib/i18n-facts-v310.mjs';
const read=p=>readFileSync(p,'utf8');
const data=p=>JSON.parse(read(p));
const dishes=data('data/singapore-dishes-v180.json').dishes;
const stalls=data('data/food-stalls-v180.json').stalls;
const published=data('data/facts-published.json').facts.filter(f=>f.status==='verified');
const verified=new Map(published.map(f=>[f.id,f]));
assert.equal(Object.keys(DISH_SOURCE_DESCRIPTIONS).length,82,'Dish translations must cover all existing source IDs');
assert.equal(DISH_DESCRIPTION_KEYS.length,13,'Dish translation vocabulary must contain all distinct source phrases');
assert.equal(new Set(dishes.map(d=>d.description)).size,13,'Unexpected new source phrase requires explicit translation review');
assert.equal(Object.keys(STALL_NOTE_SOURCE).length,93,'Source-locked research note coverage must include 93 stall records');
assert.equal(STALL_NOTE_KEYS.length,5,'Expected five unique historic research disclosures');
for(const x of stalls)assert.equal(STALL_NOTE_SOURCE[x.id],x.notes,'Stall source note changed: '+x.id);
assert.equal(Object.keys(NATURE_FACTS).length,16,'Expected 16 newly translated nature facts');
assert.equal(translatedFactCount,38,'Verified fact coverage should advance to 38 with source-locked water records');
assert.equal(Object.keys(LOCALIZED_FACTS).length,10,'Keep existing 10 source-verified translations intact');
assert.equal(new Set(Object.keys(NATURE_FACTS).concat(Object.keys(LOCALIZED_FACTS))).size,26,'No duplicate source IDs');
for(const row of dishes)assert.equal(DISH_SOURCE_DESCRIPTIONS[row.id],row.description,'Dish source changed: '+row.id);
for(const [id,spec] of Object.entries(NATURE_FACTS)){
 const source=verified.get(id);
 assert.ok(source,'Nature record missing or unverified: '+id);
 assert.equal(spec.source,source.text,'Source revision mismatch: '+id);
 assert.ok(NATURE_PATTERN_KEYS.includes(spec.pattern),'Unknown template: '+id);
 for(const [key,value] of Object.entries(spec.values))assert.ok(source.text.includes(value),'Protected factual value '+key+' not in source '+id);
 assert.equal(natureFactTranslation('en',source),null,'Never translate canonical English');
 assert.equal(natureFactTranslation('pt-BR',{...source,text:'new source wording'}),null,'Source mismatch must fallback');
 assert.equal(natureFactTranslation('pt-BR',{...source,status:'review-pending'}),null,'Only verified facts can be translated');
}
for(const {code} of LOCALES){
 assert.equal(Object.keys(DISH_TRANSLATIONS[code]||{}).length,13,'Incomplete dish locale '+code);
 assert.equal(Object.keys(STALL_NOTE_TRANSLATIONS[code]||{}).length,5,'Incomplete stall locale '+code);
 for(const stall of stalls){const translated=stallNoteTranslation(code,stall);
  if(code==='en')assert.equal(translated,null);
  else {assert.ok(translated&&translated!==stall.notes,'Missing stall locale '+code+' '+stall.id);
   assert.equal(stallNoteTranslation(code,{...stall,notes:'New source note'}),null,'Changed note must fallback');
  }
 }
 assert.equal(Object.keys(NATURE_TEMPLATES[code]||{}).length,13,'Incomplete nature locale '+code);
 for(const dish of dishes){
  const translated=dishTranslation(code,dish);
  if(code==='en')assert.equal(translated,null);
  else{
   assert.ok(typeof translated==='string'&&translated.trim().length>=2,'Missing '+code+' dish '+dish.id);
   assert.notEqual(translated,dish.description,'Untranslated dish '+code+' '+dish.id);
   assert.equal(dishTranslation(code,{...dish,description:'changed source'}),null,'Stale dish fallback '+dish.id);
   assert.equal(dishTranslation(code,{...dish,id:'unknown'}),null,'Unknown dish ID must not inherit translation');
  }
 }
 for(const [id,spec] of Object.entries(NATURE_FACTS)){
  const record=verified.get(id),translated=factTranslation(code,record);
  if(code==='en')assert.equal(translated,null);
  else{
   assert.ok(translated&&translated!==record.text,code+' missing new fact '+id);
   for(const part of Object.values(spec.values))assert.ok(translated.includes(part),code+' changed source value in '+id);
  }
 }
}
const food=read('app-food-v180.js'),facts=read('lib/i18n-facts-v310.mjs'),sw=read('sw.js'),report=read('scripts/localization-report-v310.mjs');
assert.ok(food.includes("dishTranslation(locale(),x)||x.description"),'Dish rendering should use offline translations');
assert.ok(food.includes("dishTranslation(locale(),x)||''"),'Dish translations need local-language search');
assert.ok(food.includes('data-content-localized'),'Translated dishes should not be re-translated on device');
assert.ok(food.includes('stallNoteTranslation(locale(),x)'),'Stall safety notes must use source-locked translations');
assert.ok(facts.includes('natureFactTranslation(locale,record)'),'Existing fact UI should use new facts automatically');
for(const path of ['/lib/i18n-dishes-v311.mjs','/lib/i18n-nature-v311.mjs','/lib/i18n-stall-notes-v311.mjs'])assert.ok(sw.includes(path),'Offline locale pack missing '+path);
assert.ok(report.includes('fallbackDishDescriptions')&&report.includes('NATURE_FACTS'),'Coverage report has not been updated');
console.log('V3.1-B PASS: 82/82 dish descriptions and 93/93 stall research notes translated; 38/152 verified facts including V3.1-C water history into 11 non-English languages; exact source, names, dates and fallback preserved.');
