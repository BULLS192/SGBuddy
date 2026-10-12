import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES,normalizeLocale,TRAVEL_UI} from '../lib/i18n-v280.mjs';
import {coverage,localizedGuide,localizedCheck} from '../lib/i18n-guides-v280.mjs';
import {TRIP_KEYS,translatedTrip,tripCoverage} from '../lib/i18n-trip-v280.mjs';
import {APP_KEYS,appText,appCoverage} from '../lib/i18n-apps-v280.mjs';
const read=path=>readFileSync(path,'utf8');
const data=JSON.parse(read('data/travel-essentials-v250.json'));
const codes=LOCALES.map(x=>x.code);
const expected=['en','zh-CN','zh-TW','ms','id','ja','ko','th','vi','fr','es','pt-BR'];
assert.deepEqual(codes,expected,'Locale selection should preserve ordering and region variants');
assert.equal(new Set(codes).size,12);
assert.equal(normalizeLocale('pt-br'),'pt-BR');
assert.equal(normalizeLocale('zh-hant'),'zh-TW');
assert.equal(normalizeLocale('ms'),'ms');
assert.equal(normalizeLocale('unknown-invalid-locale'),'en','Locale whitelist must fail safely');
assert.ok(LOCALES.every(x=>x.name&&x.dir==='ltr'));
for(const locale of expected.slice(2)){
 const travel=TRAVEL_UI[locale];
 assert.ok(travel,locale+' missing travel interface');
 for(const key of ['language','heading','intro','review','checkTitle','checkCopy','coming','legacy','discoverTitle','travel','apps','trip','payments','messaging','connectivity']){
  assert.ok(typeof travel[key]==='string'&&travel[key].trim().length>0,locale+' missing travel key '+key);
 }
 assert.equal(Object.keys(travel.tabs).length,9);
 assert.equal(coverage[locale].guides,7,'Missing localized travel guides');
 assert.equal(coverage[locale].checklist,5,'Missing localized arrival checklist');
 for(const row of data.guides){
  const t=localizedGuide(row,locale);
  assert.ok(t?.title?.length>3&&t.copy?.length>20,locale+' untranslated guide '+row.id);
  assert.notEqual(t.title,row.en.title,locale+' fallback guide title '+row.id);
 }
 for(const row of data.checklist){
  const t=localizedCheck(row,locale);
  assert.ok(t?.length>5,locale+' checklist '+row.id);
  assert.notEqual(t,row.en,locale+' fallback checklist '+row.id);
 }
 assert.equal(tripCoverage[locale],TRIP_KEYS.length,locale+' incomplete trip labels');
 const trip=translatedTrip(locale,{title:'My Trip'}, {title:'我的行程'});
 assert.notEqual(trip.title,'My Trip',locale+' trip label not translated');
 assert.equal(appCoverage[locale],APP_KEYS.length);
 assert.notEqual(appText(locale,'Apps worth having in Singapore'), 'Apps worth having in Singapore',locale+' apps heading missing');
}
assert.equal(localizedGuide(data.guides[0],'en').title,data.guides[0].en.title,'English source must be retained');
assert.equal(localizedGuide(data.guides[0],'zh-CN').title,data.guides[0].zh.title,'Simplified Chinese preserved');
assert.equal(translatedTrip('zh-CN',{title:'My Trip'},{title:'我的行程'}).title,'我的行程');
assert.equal(appText('en','Apps worth having in Singapore'),'Apps worth having in Singapore');
for(const path of ['app-travel-v250.js','app-trip-v260.js','app-apps-v240.js']){
 const src=read(path);
 assert.ok(src.includes("i18n-v280.mjs"),path+' must import common languages');
 assert.ok(src.includes('sgbuddy:language')||path==='app-travel-v250.js');
}
const travel=read('app-travel-v250.js');
assert.ok(travel.includes('LOCALES.map(')&&travel.includes('normalizeLocale(e.target.value)'),'Selector missing supported locales');
assert.ok(travel.includes("localStorage.setItem(LANGUAGE_KEY,locale())"),'Preference persistence missing');
assert.ok(travel.includes('documentElement.lang=locale()'),'HTML locale missing');
assert.ok(travel.includes('localizedGuide(row,locale())')&&travel.includes('localizedCheck(row,locale())'));
const trip=read('app-trip-v260.js');
assert.ok(trip.includes('translatedTrip(lang(),labels.en,labels.zh)'),'Trip must localize labels');
assert.ok(trip.includes('new Intl.DateTimeFormat(lang()'),'Trip should use chosen locale for dates');
const apps=read('app-apps-v240.js');
assert.ok(apps.includes('appText(currentLocale(),en,cn)'),'Apps translations not wired');
const sw=read('sw.js'),bootstrap=read('app-v090.js'),html=read('index.html');
for(const asset of ['i18n-v280.mjs','i18n-guides-v280.mjs','i18n-trip-v280.mjs','i18n-apps-v280.mjs']){
 assert.ok(sw.includes('/lib/'+asset),'Missing offline shell asset '+asset);
}
assert.ok(sw.includes('sgbuddy-shell-v70'),'PWA should invalidate stale cached assets');
assert.ok(bootstrap.includes("='3.12.0'")&&html.includes('v3.12.0'),'Version mismatch');
console.log('SGBuddy V2.8 12 locales PASS: 10 new UI packs, 70 guide translations, 50 arrival steps, 440 trip labels, 210 app UI labels, cached modules, preserved EN/zh-CN.');
