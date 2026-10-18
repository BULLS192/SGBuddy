/* V4.25: NEA classifications, freshness safety and UI/offline integration. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyAirReading,isCurrentAirReading,numericAirValue,pmBandLabel} from '../lib/air-quality-scale-v425.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
const scale=(kind,value)=>classifyAirReading(kind,value)?.tone??'unknown';
for(const [value,tone] of [
 [0,'good'],[50,'good'],[51,'moderate'],[100,'moderate'],
 [101,'unhealthy'],[200,'unhealthy'],[201,'very-unhealthy'],
 [300,'very-unhealthy'],[301,'hazardous'],[500,'hazardous']
])assert.equal(scale('psi',value),tone,'PSI boundary '+value);
for(const [value,tone] of [
 [0,'good'],[55,'good'],[56,'moderate'],[150,'moderate'],
 [151,'unhealthy'],[250,'unhealthy'],[251,'hazardous']
])assert.equal(scale('pm25',value),tone,'PM2.5 boundary '+value);
for(const invalid of [null,undefined,'',false,-1,NaN,'unavailable']){
 assert.equal(numericAirValue(invalid),null,'Invalid value classified');
 assert.equal(scale('psi',invalid),'unknown');
 assert.equal(scale('pm25',invalid),'unknown');
}
assert.equal(scale('aqi',25),'unknown','Do not conflate AQI and PSI');
const now=Date.parse('2026-10-18T07:00:00Z');
const recent={updatedAt:'2026-10-18T06:30:00Z'};
assert.equal(isCurrentAirReading(recent,{now}),true);
assert.equal(isCurrentAirReading(recent,{now,cached:true}),false);
assert.equal(isCurrentAirReading({updatedAt:'2026-10-17T07:00:00Z'},{now}),false);
assert.equal(isCurrentAirReading({updatedAt:null},{now}),false);
assert.equal(isCurrentAirReading({updatedAt:'unverified'},{now}),false);
assert.equal(isCurrentAirReading({updatedAt:'2026-10-18T07:20:00Z'},{now}),false);
assert.equal(isCurrentAirReading({updatedAt:'2026-10-18T06:00:00Z'},{now,maxAgeMinutes:30}),false);
for(const {code} of LOCALES){
 for(const key of ['normal','elevated','high','veryHigh'])
  assert.ok(pmBandLabel(key,code).trim(),code+' missing '+key);
}
const app=readFileSync('app-v120.js','utf8');
const css=readFileSync('discover-v120.css','utf8');
const sw=readFileSync('sw.js','utf8');
for(const marker of ["classifyAirReading('psi',raw)","data-air-tone","['#envPsi','psi'","['#envPm25','pm25'","isCurrentAirReading(psi","isCurrentAirReading(pm","setAttribute('aria-label'"]){
 assert.ok(app.includes(marker),'Air quality UI integration missing: '+marker);
}
for(const tone of ['good','moderate','unhealthy','very-unhealthy','hazardous']){
 assert.ok(css.includes('[data-air-tone="'+tone+'"]'),'Missing CSS palette tone '+tone);
}
assert.ok(css.includes('@media(forced-colors:active)'),'Missing high-contrast fallback');
assert.ok(sw.includes('/lib/air-quality-scale-v425.mjs'),'Missing offline shell helper');
console.log('V4.25 Air Quality STATIC PASS: PSI/PM2.5 boundaries, 12 locales, freshness, accessibility and offline asset.');
