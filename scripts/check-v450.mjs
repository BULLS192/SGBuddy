import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {FOOD_DISCOVER_V450_KEYS,FOOD_DISCOVER_V450_MESSAGES,foodDiscoverText} from '../lib/i18n-food-discover-v450.mjs';
assert.equal(LOCALES.length,12);
assert.equal(FOOD_DISCOVER_V450_KEYS.length,15);
assert.equal(new Set(FOOD_DISCOVER_V450_KEYS).size,15);
for(const {code} of LOCALES){
 const pack=FOOD_DISCOVER_V450_MESSAGES[code];
 assert.equal(Object.keys(pack||{}).length,15,code+' missing translation keys');
 for(const key of FOOD_DISCOVER_V450_KEYS){
  assert.ok(typeof pack[key]==='string'&&pack[key].trim().length>2,code+' missing '+key);
  assert.equal(foodDiscoverText(code,key),pack[key]);
 }
 if(code!=='en')assert.ok(FOOD_DISCOVER_V450_KEYS.filter(k=>pack[k]!==FOOD_DISCOVER_V450_MESSAGES.en[k]).length>=14,code+' not localized');
}
const boot=readFileSync('app-v090.js','utf8');
assert.ok(boot.includes("import('/app-i18n-food-discover-v450.js')"));
assert.ok(boot.includes("='4.14.0'"),'release badge should match V4.11');
const sw=readFileSync('sw.js','utf8');
for(const asset of ['/app-i18n-food-discover-v450.js','/lib/i18n-food-discover-v450.mjs'])assert.ok(sw.includes(asset),'missing offline asset '+asset);
assert.ok(sw.includes('sgbuddy-shell-v79'),'release requires upgraded PWA cache');
const mod=readFileSync('app-i18n-food-discover-v450.js','utf8');
for(const fragment of ['#foodToolsSubtitle','food-tool-filters > label:nth-child(1)','food-tool-filters > label:nth-child(2)','#discoverSearch','#discoverAreaFilter','#discoverSourceFilter','#discoverNeighbourhoodFilter','#discoverCategoryFilter','#discoverQuality','sgbuddy:language','sourceEnglish'])assert.ok(mod.includes(fragment),'runtime gap '+fragment);
assert.ok(!mod.includes('innerHTML=')&&!mod.includes('querySelectorAll("*")'),'unsafe translation sweep');
assert.ok(readFileSync('scripts/check-all.mjs','utf8').includes('scripts/check-v450.mjs'),'static regression not wired');
assert.ok(readFileSync('.github/workflows/check-v430-localization-audit.yml','utf8').includes('scripts/browser-qa-v450.mjs'),'Chromium QA not wired');
console.log('V4.5 STATIC PASS: 15 first-party keys x 12 languages, safe source guards, offline bundle, preserved V4.2 release.');
