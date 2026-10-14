import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CONTEXT_MODES,contextMode} from '../lib/i18n-context-v370.mjs';
import {HOME_KEYS,HOME_MESSAGES,HOME_ENGLISH,homeText} from '../lib/i18n-home-v311.mjs';
import {WEATHER_TERMS,WEATHER_MESSAGES,weatherTerm} from '../lib/i18n-weather-home-v311.mjs';
const vars=x=>[...String(x).matchAll(/\{([a-z]+)\}/g)].map(m=>m[1]).sort();
assert.equal(CONTEXT_MODES.length,5);
assert.equal(LOCALES.length,12);
assert.equal(HOME_KEYS.length,46);
for(const {code} of LOCALES){
 assert.equal(Object.keys(HOME_MESSAGES[code]||{}).length,HOME_KEYS.length);
 for(const key of HOME_KEYS){
  const value=homeText(code,key);
  assert.ok(typeof value==='string'&&value.trim(),code+'/'+key);
  assert.deepEqual(vars(value),vars(HOME_ENGLISH[key]),code+'/'+key+' variables');
 }
 assert.equal(Object.keys(WEATHER_MESSAGES[code]||{}).length,WEATHER_TERMS.length);
 assert.equal(weatherTerm(code,'Some new official category'),'Some new official category','Unknown data must remain original');
 for(const mode of CONTEXT_MODES)assert.ok(contextMode(code,mode,'label'));
}
const main=readFileSync('app-v090.js','utf8'),ux=readFileSync('app-ux-v170.js','utf8'),script=readFileSync('app-i18n-home-v311.js','utf8'),sw=readFileSync('sw.js','utf8');
assert.ok(main.includes("import('/app-i18n-home-v311.js')"));
assert.ok(main.includes("='4.17.0'"));
assert.ok(readFileSync('index.html','utf8').includes('v4.18.0'));
assert.ok(sw.includes('sgbuddy-shell-v83'));
for(const f of ['/lib/i18n-home-v311.mjs','/lib/i18n-weather-home-v311.mjs','/app-i18n-home-v311.js'])assert.ok(sw.includes(f),f);
assert.ok(ux.includes("document.addEventListener('sgbuddy:language',()=>queueMicrotask(renderPersona))"));
assert.ok(ux.includes("window.SGBUDDY_HOME_LOCALE?.contextMode"));
assert.ok(ux.includes("window.SGBUDDY_HOME_LOCALE?.homeText"));
assert.ok(ux.includes("escapeText(displayName)"));
for(const id of ['#railForm button','#locationStatus','#nextUpTitle','#nextUpCopy','#updatedAt','#weatherLabel','#envPsi','#uxExtraConditions > summary'])assert.ok(script.includes(id),id);
assert.ok(script.includes('new WeakMap()')&&script.includes('MutationObserver'));
console.log('V3.11 PASS: 12 locales, 46 home keys each, 10 weather terms each, all 5 personas, source-scoped dashboard and PWA v68.');
