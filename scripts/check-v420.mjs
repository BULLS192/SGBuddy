import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CONTEXTUAL_V420_KEYS,CONTEXTUAL_V420_MESSAGES,contextualText} from '../lib/i18n-contextual-v420.mjs';
assert.equal(LOCALES.length,12);
assert.equal(CONTEXTUAL_V420_KEYS.length,30);
assert.equal(new Set(CONTEXTUAL_V420_KEYS).size,30);
const slots=s=>[...String(s).matchAll(/\{([a-zA-Z]+)\}/g)].map(m=>m[1]).sort();
for(const {code} of LOCALES){
 const pack=CONTEXTUAL_V420_MESSAGES[code];
 assert.equal(Object.keys(pack||{}).length,30,code+' incomplete catalogue');
 for(const key of CONTEXTUAL_V420_KEYS){
  const source=CONTEXTUAL_V420_MESSAGES.en[key],text=pack[key];
  assert.ok(typeof text==='string'&&text.trim(),code+' blank: '+key);
  assert.deepEqual(slots(text),slots(source),code+' placeholder mismatch '+key);
  const result=contextualText(code,key,{centre:'<Original Name>',dishes:'Nasi Lemak',year:2024,date:'2026-10-13',count:2,checked:10,pending:3,shown:5,total:13});
  assert.ok(!/\{(?:centre|dishes|year|date|count|checked|pending|shown|total)\}/.test(result),code+' interpolation missing '+key);
 }
 if(code!=='en')assert.ok(CONTEXTUAL_V420_KEYS.filter(key=>pack[key]!==CONTEXTUAL_V420_MESSAGES.en[key]).length>=27,code+' insufficient translations');
}
const read=p=>readFileSync(p,'utf8');
const discover=read('app-v120.js'),food=read('app-food-v180.js'),picker=read('app-food-tools-v261.js'),merli=read('app-v140.js'),sw=read('sw.js');
for(const x of ["localizeStaticFilters()","contextualText(locale(),key,fields)","ctx('archiveFilter')","render()"])assert.ok(discover.includes(x),x);
for(const x of ["ctx('foodLead',{centre:x.centreName,dishes:(x.dishes||[]).join(', ')})","ctx('foodLoadError')","ctx('oneMapChecking')","ctx('foodListedOn',{date:x.observedOn})"])assert.ok(food.includes(x),'Food not localized '+x);
for(const x of ["notify('pickerCount',{count:options.length})","notify('pickerNoMatch')","lastNotice","renderPicked();if(lastNotice)"])assert.ok(picker.includes(x),'Picker not localized '+x);
for(const x of ["ctx('merliCount'","ctx('merliEmpty')","ctx('merliOriginalSource')","factTranslation(locale(),f)||f.text"])assert.ok(merli.includes(x),'Merli not localized '+x);
for(const x of ['sgbuddy-shell-v83','/lib/i18n-contextual-v420.mjs','/merli-avatar-v3111.js'])assert.ok(sw.includes(x),'Offline shell missing '+x);
const audit=JSON.parse(execFileSync(process.execPath,['scripts/audit-app-v380.mjs','--json'],{encoding:'utf8',maxBuffer:35*1024*1024}));
assert.equal(audit.globalWholeAppCompletionPercent,null,'Whole app translation must remain unverified');
assert.equal(audit.locales.en.byArea.authoredUiCatalogue.total,553);
for(const {code} of LOCALES)assert.equal(audit.locales[code].knownAuthoredInventory.total,audit.classifiedEligibleEntries);
console.log('V4.2 STATIC PASS: 30 first-party dynamic messages × 12 locales; verified catalogues, source preservation and offline asset registration.');
