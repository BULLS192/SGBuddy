/* V4.13: 12-locale Air Quality coverage and source-ownership safety. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {AIR_V413,AIR_V413_KEYS,air413Text} from '../lib/i18n-air-v413.mjs';
assert.equal(LOCALES.length,12);
assert.equal(AIR_V413_KEYS.length,35);
assert.equal(new Set(AIR_V413_KEYS).size,35,'Duplicate authored keys');
assert.deepEqual(Object.keys(AIR_V413).sort(),LOCALES.map(x=>x.code).sort());
for(const {code} of LOCALES){
 const row=AIR_V413[code];
 assert.deepEqual(Object.keys(row),AIR_V413_KEYS,code+' missing authored Air Quality message');
 for(const key of AIR_V413_KEYS)assert.ok(row[key]?.trim(),code+' empty '+key);
 if(code!=='en')assert.ok(AIR_V413_KEYS.filter(key=>row[key]!==AIR_V413.en[key]).length>=33,code+' incomplete');
 const advisory=air413Text(code,'advisoryHigh',{category:'TEST'});
 assert.ok(advisory.includes('TEST')&&!advisory.includes('{category}'),code+' category parameter not interpolated');
 for(const codeword of ['NEA','PSI','PM2.5'])assert.ok(row.intro.includes(codeword),code+' failed source-identity requirement '+codeword);
}
const renderer=readFileSync('app-v120.js','utf8');
const shell=readFileSync('sw.js','utf8');
const boot=readFileSync('app-v090.js','utf8');
for(const s of ["import {air413Text} from './lib/i18n-air-v413.mjs';","document.addEventListener('sgbuddy:weather',drawAirQuality)","document.addEventListener('sgbuddy:language',redrawLocalizedAir)","airT('advisoryHigh',{category:category(overall)})","safe(airT(region))","airT('timestampsUnavailable')"]){
 assert.ok(renderer.includes(s),'Missing Air Quality integration: '+s);
}
assert.ok(shell.includes('/lib/i18n-air-v413.mjs'),'Air Quality translations not installed with offline shell');
assert.ok(shell.includes('sgbuddy-offline-packs-v480')&&shell.includes("sgbuddy-shell-v88"),'Unsafe version/cache change before release');
assert.ok(boot.includes("if(contextOk)toast('Refreshed')"),'Refresh can falsely claim success');
assert.ok(boot.includes("if(contextOk)toast('All SGBuddy data refreshed')"),'Core diagnostics can falsely claim success');
assert.ok(boot.includes("updateHero();return weather?.source!=='device-cache'}catch(e){toast(e.message);return false}"),'Refresh must distinguish success from failure');
console.log('V4.13 Air Quality STATIC PASS: 35 messages × 12 locales and explicit source-safe refresh states.');
