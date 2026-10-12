import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CORE_UI} from '../lib/i18n-interface-v290.mjs';
import {HOME_KEYS,HOME_MESSAGES,homeText} from '../lib/i18n-home-v3110.mjs';
const vars=s=>[...String(s).matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
assert.equal(LOCALES.length,12);
assert.equal(HOME_KEYS.length,38);
for(const {code} of LOCALES){
 const pack=HOME_MESSAGES[code];
 assert.deepEqual(Object.keys(pack||{}),HOME_KEYS,code+' missing/incorrect keys');
 for(const key of HOME_KEYS){
  assert.ok(typeof pack[key]==='string'&&pack[key].trim(),code+'/'+key+' empty');
  assert.deepEqual(vars(pack[key]),vars(HOME_MESSAGES.en[key]),code+'/'+key+' mismatched placeholders');
  if(code!=='en'&&key!=='shortMinute')assert.notEqual(pack[key],HOME_MESSAGES.en[key],code+'/'+key+' untranslated English');
 }
 assert.ok(homeText(code,'nextIn',{count:4}).includes('4'),code+' dynamic minute placeholder lost');
 assert.ok(homeText(code,'shortMinute',{count:3}).includes('3'),code+' short minute placeholder lost');
 assert.ok(CORE_UI[code]?.stationName,code+' missing station name');
}
const script=readFileSync('app-i18n-home-v3110.js','utf8');
for(const anchor of ['#uxExtraConditions summary','#todaySection .hero-row .label','#nextUpTitle','#uxPersonaDescription','#uxMerliHomeTitle','#locationStatus','#railForm button','#weatherLabel','#placeLabel'])
 assert.ok(script.includes(anchor),'Missing screenshot surface '+anchor);
assert.ok(script.includes('known=Object.fromEntries')&&script.includes('MutationObserver')&&script.includes('sourceTemplates'),'Source-locked reactive coverage required');
const boot=readFileSync('app-v090.js','utf8');
assert.ok(boot.includes("import('/app-i18n-home-v3110.js')"),'Home translation module not in active boot chain');
const sw=readFileSync('sw.js','utf8');
for(const asset of ['sgbuddy-shell-v68','/app-i18n-home-v3110.js','/lib/i18n-home-v3110.mjs'])assert.ok(sw.includes(asset),'Missing offline asset '+asset);
console.log('V3.11 PASS: 12 locales x 32 authored home messages, source-locked reactive runtime, station labels and PWA cache v68.');
