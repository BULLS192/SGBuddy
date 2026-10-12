import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {HOME_KEYS,HOME_MESSAGES,homeText} from '../lib/i18n-home-v311.mjs';
import {SHORTCUT_KEYS,SHORTCUT_MESSAGES,homeShortcut} from '../lib/i18n-shortcuts-v311.mjs';
import {WEATHER_CODES,WEATHER_TRANSLATIONS,translatedWeatherSummary} from '../lib/i18n-weather-codes-v311.mjs';
import {PSI_CATEGORIES,PSI_MESSAGES,translatedPsi} from '../lib/i18n-psi-v311.mjs';
const read=filename=>readFileSync(filename,'utf8');
const vars=s=>[...String(s).matchAll(/\{([a-z]+)\}/g)].map(x=>x[1]).sort();
assert.equal(LOCALES.length,12);
assert.equal(HOME_KEYS.length,38);
assert.equal(SHORTCUT_KEYS.length,7);
for(const {code} of LOCALES){
 assert.equal(Object.keys(HOME_MESSAGES[code]||{}).length,HOME_KEYS.length,'Home locale '+code);
 assert.equal(Object.keys(SHORTCUT_MESSAGES[code]||{}).length,SHORTCUT_KEYS.length,'Shortcuts locale '+code);
 for(const key of HOME_KEYS){
  const text=homeText(code,key,{count:'3',time:'02:29 PM',mode:'Resident',target:'Today'});
  assert.ok(text.trim(),code+'/'+key);
  assert.deepEqual(vars(HOME_MESSAGES[code][key]),vars(HOME_MESSAGES.en[key]),code+'/'+key+' variables');
 }
 for(const key of SHORTCUT_KEYS){
  const row=homeShortcut(code,key);
  assert.ok(row.title&&row.description,code+'/'+key);
 }
 assert.equal(Object.keys(WEATHER_TRANSLATIONS[code]).length,WEATHER_CODES.length+2);
 assert.equal(Object.keys(PSI_MESSAGES[code]).length,PSI_CATEGORIES.length);
 assert.ok(translatedWeatherSummary(code,'Partly Cloudy (Day) · 59% humidity · 0.0 mm rain').includes('59%'));
 assert.ok(translatedWeatherSummary(code,'Partly Cloudy (Day) · 59% humidity · 0.0 mm rain').includes('0.0 mm'));
 assert.equal(translatedWeatherSummary(code,'Operator special live warning'),'Operator special live warning');
 assert.equal(translatedPsi(code,'148 · Unhealthy').split(' · ')[0],'148');
 assert.equal(translatedPsi(code,'145 · Unknown status'),'145 · Unknown status');
}
const ux=read('app-ux-v170.js'),home=read('app-i18n-home-v311.js'),boot=read('app-v090.js'),sw=read('sw.js');
for(const k of ['homeShortcut(locale(),target)','contextual(\'panelLabel\')','sgbuddy:language','homeText(locale(),\'merliTips\''])
 assert.ok(ux.includes(k),'Persona runtime: '+k);
assert.ok(home.includes('MutationObserver')&&home.includes('PSI_CATEGORIES')&&home.includes('#nextUpTitle'));
assert.ok(boot.includes("import('/app-i18n-home-v311.js')"),'Bootstrap missing');
assert.ok(sw.includes('sgbuddy-shell-v68'));
for(const asset of ['/app-i18n-home-v311.js','/lib/i18n-home-v311.mjs','/lib/i18n-shortcuts-v311.mjs','/lib/i18n-weather-codes-v311.mjs','/lib/i18n-psi-v311.mjs'])
 assert.ok(sw.includes(asset),'PWA cache missing '+asset);
console.log('V3.11 STATIC PASS: '+HOME_KEYS.length+' x 12 home strings, '+SHORTCUT_KEYS.length+' x 12 shortcut pairs, localized weather and PSI categories, safe home watchers.');
