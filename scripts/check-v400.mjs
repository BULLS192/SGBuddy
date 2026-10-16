import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {FOOD_STATUS_KEYS,FOOD_STATUS_MESSAGES,foodStatus} from '../lib/i18n-food-status-v400.mjs';
import {DISCOVER_STATUS_KEYS,DISCOVER_STATUS_MESSAGES,discoverStatus} from '../lib/i18n-discover-status-v400.mjs';
assert.equal(LOCALES.length,12);
assert.equal(FOOD_STATUS_KEYS.length,16);
assert.equal(DISCOVER_STATUS_KEYS.length,11);
const placeholders=s=>[...String(s).matchAll(/\{([a-zA-Z]+)\}/g)].map(x=>x[1]).sort();
for(const {code} of LOCALES){
 for(const [keys,packs,render] of [[FOOD_STATUS_KEYS,FOOD_STATUS_MESSAGES,foodStatus],[DISCOVER_STATUS_KEYS,DISCOVER_STATUS_MESSAGES,discoverStatus]]){
  assert.equal(Object.keys(packs[code]||{}).length,keys.length,code+' catalogue missing');
  for(const key of keys){
   const en=packs.en[key],actual=packs[code][key];
   assert.ok(actual.trim(),code+':'+key);
   assert.deepEqual(placeholders(actual),placeholders(en),code+':'+key+' placeholder mismatch');
   const result=render(code,key,{count:12,shown:4,checked:8,pending:3,centre:'Test Centre',year:'2025',address:'1 Marina Boulevard Singapore'});
   assert.ok(!result.includes('{count}')&&!result.includes('{shown}')&&!result.includes('{checked}')&&!result.includes('{pending}')&&!result.includes('{centre}')&&!result.includes('{year}')&&!result.includes('{address}'),code+' unfilled placeholder');
  }
 }
}
const food=readFileSync('app-food-v180.js','utf8'),discover=readFileSync('app-v120.js','utf8');
for(const key of ['countStalls','countDishes','countHawker','countVendor','vendorWarning','hawkerWarning','guideWarning','roundupWarning','awardWarning','editorialWarning','priceDietWarning','oneMapMatch']){
 assert.ok(food.includes("'"+key+"'"),'Food source not wired: '+key);
}
for(const key of ['placesFound','appsFound','factsStatus','noPlaces','noFacts','more','searchApps','searchFacts','searchPlaces']){
 assert.ok(discover.includes("'"+key+"'"),'Discover source not wired: '+key);
}
assert.ok(food.includes('stallNoteTranslation(locale(),x)'),'Preserve original source-locked stall translations');
assert.ok(food.includes('dishTranslation(locale(),x)'),'Preserve localized dish names and notes');
assert.ok(discover.includes('factTranslation(locale(),fact)'),'Preserve source-authored fact translations');
const app=readFileSync('app-v090.js','utf8');
assert.ok(app.includes("='4.23.0'")&&readFileSync('index.html','utf8').includes('v4.23.0'));
const sw=readFileSync('sw.js','utf8');
for(const asset of ['sgbuddy-shell-v88','/lib/i18n-food-status-v400.mjs','/lib/i18n-discover-status-v400.mjs'])assert.ok(sw.includes(asset),asset);
const audit=JSON.parse(execFileSync(process.execPath,['scripts/audit-app-v380.mjs','--json'],{encoding:'utf8',maxBuffer:30*1024*1024}));
assert.equal(audit.globalWholeAppCompletionPercent,null);
assert.ok(audit.classifiedEligibleEntries>=934,'Existing verified authored inventory must not decrease');
for(const code of LOCALES.map(x=>x.code))assert.equal(audit.locales[code].knownAuthoredInventory.total,audit.classifiedEligibleEntries);
console.log('V4.0 STATIC PASS: 12 locales x 27 source-owned UI messages, placeholders safe, existing authored audit protected, PWA v71.');
