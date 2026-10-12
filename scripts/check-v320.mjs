import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {RUNTIME_KEYS,RUNTIME_MESSAGES,ENGLISH_SOURCE_KEY,runtimeText,runtimeOriginal} from '../lib/i18n-runtime-v320.mjs';
import {PLACE_RUNTIME_KEYS,PLACE_RUNTIME_MESSAGES,placeRuntimeText} from '../lib/i18n-place-eta-v320.mjs';
const read=p=>readFileSync(p,'utf8');
assert.equal(LOCALES.length,12);
assert.equal(RUNTIME_KEYS.length,35);
assert.equal(PLACE_RUNTIME_KEYS.length,22);
assert.equal(new Set(RUNTIME_KEYS).size,RUNTIME_KEYS.length);
assert.equal(new Set(PLACE_RUNTIME_KEYS).size,PLACE_RUNTIME_KEYS.length);
assert.equal(Object.keys(ENGLISH_SOURCE_KEY).length,RUNTIME_KEYS.length,'Canonical source messages should remain one-to-one');
for(const {code} of LOCALES){
 assert.equal(Object.keys(RUNTIME_MESSAGES[code]||{}).length,35,code+' account/weather coverage');
 assert.equal(Object.keys(PLACE_RUNTIME_MESSAGES[code]||{}).length,22,code+' ETA label coverage');
 for(const key of RUNTIME_KEYS)assert.ok(typeof runtimeText(code,key)==='string'&&runtimeText(code,key).trim(),code+' missing '+key);
 for(const key of PLACE_RUNTIME_KEYS)assert.ok(typeof placeRuntimeText(code,key)==='string'&&placeRuntimeText(code,key).trim(),code+' missing ETA '+key);
 for(const [key,fields] of [['sensorsUnavailable',{sensors:'psi, pm25'}],['weatherUpdated',{time:'12:45 PM'}],['weatherConditions',{area:'Singapore'}]]){
  const translated=runtimeText(code,key,fields);
  assert.ok(!translated.includes('{'),'Incomplete interpolation '+code+' '+key);
  assert.ok(translated.includes(Object.values(fields)[0]),'Must keep live source values '+code+' '+key);
 }
 const years='2026', money='SGD 8.50';
 assert.ok(placeRuntimeText(code,'showMore',{count:3}).includes('3'));
 assert.ok(runtimeOriginal(code,'Some unknown remote server error: '+money+' '+years).includes(money),'Raw remote errors must not be machine-translated');
 assert.equal(runtimeText(code,'psiExplanation').includes('PM2.5'),true,'PM2.5 measurement must be retained '+code);
 assert.equal(runtimeText(code,'psiExplanation').includes('PSI'),true,'Air quality index must not be conflated '+code);
 assert.ok(runtimeText(code,'journeyLocation').includes('MRT/LRT'),'Transport station designations must be kept '+code);
}
const root=read('app-v090.js'),place=read('app-v110.js'),sw=read('sw.js');
for(const marker of ["rt('syncing')","rt('weatherConditions'","rt('routingArrive')","dt('pm25Explanation'","runtimeTranslations?.runtimeOriginal(window.SGBUDDY_LANGUAGE","document.addEventListener('sgbuddy:language'"])assert.ok(root.includes(marker),'Main app has not bound runtime translations: '+marker);
for(const marker of ["placeTranslations?.placeRuntimeText(window.SGBUDDY_LANGUAGE","lp('walk')","lp('transit')","lp('drive')","lp('ride')","lp('comparisonUnavailable')","lp('noPlaces')"])assert.ok(place.includes(marker),'Place ETA renderer is not localized: '+marker);
assert.ok(sw.includes('sgbuddy-shell-v66'),'Installed app must refresh cached assets');
for(const path of ['/lib/i18n-runtime-v320.mjs','/lib/i18n-place-eta-v320.mjs'])assert.ok(sw.includes(path),'Missing offline translation asset '+path);
console.log('V3.2 PASS: 35 runtime messages and 22 transport/place labels × all 12 languages; unknown server error text unchanged; NEA PSI/PM2.5 semantics, source data, offline cache and UI bindings checked.');
