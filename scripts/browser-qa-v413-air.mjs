/* V4.13: Air Quality end-to-end locale + provenance states, no live network dependency. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {air413Text as text} from '../lib/i18n-air-v413.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG',serviceWorkers:'block'});
await context.addInitScript(()=>{
 localStorage.setItem('sgc-persona-onboarded','1');
 localStorage.setItem('sgc-mode','visitor');
 localStorage.setItem('sgc-location-choice','not-now');
});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const sample={psi24h:{updatedAt:new Date().toISOString(),overall:125,regions:{north:112,south:96,east:120,west:98,central:101}},pm25OneHour:{updatedAt:new Date().toISOString(),regions:{north:27,south:18,east:25,west:19,central:22}},region:'north'};
async function setWeather({source='live',airQuality=sample,staleSignals=[]}={}){
 await page.evaluate(value=>{
  window.SGBUDDY_CORE.state.weather={source:value.source,airQuality:value.airQuality,dataQuality:{status:'complete',staleSignals:value.staleSignals}};
  document.dispatchEvent(new Event('sgbuddy:weather'));
 },{source,airQuality,staleSignals});
}
async function expectText(selector,expected,reason){
 await page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent?.trim()===expected,{selector,expected},{timeout:10000});
 assert.equal((await page.locator(selector).textContent()).trim(),expected,reason||selector);
}
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForSelector('#v120AirPanel',{state:'attached',timeout:60000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.19.0',{timeout:45000});
 await setWeather();
 const originalUrl=await page.locator('#v120AirExtended .discover-actions a').getAttribute('href');
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await page.waitForFunction(c=>document.documentElement.lang===c,code,{timeout:10000});
  await expectText('#v120AirExtended .v120-air-title .label',text(code,'heading'));
  await expectText('#v120AirExtended .v120-air-title h3',text(code,'title'));
  await expectText('#v120AirExtended .v120-air-title + p',text(code,'intro'));
  await expectText('#v120AirStatus',text(code,'official'));
  await expectText('#v120AirPanel .v120-region:first-child strong',text(code,'north'));
  await expectText('#v120AirAdvisory',text(code,'advisoryHigh',{category:text(code,'unhealthy')}));
  assert.equal(await page.locator('#v120AirPanel').getAttribute('aria-label'),text(code,'panelAria'));
  assert.equal(await page.locator('#v120AirPanel .v120-region:first-child span').textContent(),'PSI 112');
  assert.equal(await page.locator('#v120AirPanel .v120-region:first-child small').textContent(),'PM2.5 27 µg/m³');
  assert.equal(await page.locator('#v120AirExtended .discover-actions a').getAttribute('href'),originalUrl,'official source URL rewritten');
  assert.ok((await page.locator('#v120AirUpdated').textContent()).includes('PSI: '),'source timestamp lost');
 }
 const code='pt-BR'; // current locale after all 12 switches
 await setWeather({airQuality:{}});
 await expectText('#v120AirStatus',text(code,'unavailable'));
 await expectText('#v120AirAdvisory',text(code,'advisoryUnavailable'));
 await expectText('#v120AirUpdated',text(code,'timestampsUnavailable'));
 assert.ok((await page.locator('#v120AirStatus').getAttribute('class')).includes('v120-stale'));
 await setWeather({airQuality:{psi24h:sample.psi24h}});
 await expectText('#v120AirStatus',text(code,'partial'));
 assert.ok((await page.locator('#v120AirUpdated').textContent()).includes(text(code,'pmUnavailable')));
 await setWeather({source:'device-cache'});
 await expectText('#v120AirStatus',text(code,'offline'));
 assert.ok((await page.locator('#v120AirUpdated').textContent()).includes(text(code,'cachedCaution')));
 await setWeather({airQuality:{...sample,psi24h:{...sample.psi24h,updatedAt:'2026-01-01T00:00:00Z'}}});
 await expectText('#v120AirStatus',text(code,'delayed'));
 await setWeather({airQuality:{...sample,psi24h:{...sample.psi24h,updatedAt:null},pm25OneHour:{...sample.pm25OneHour,updatedAt:null}}});
 await expectText('#v120AirStatus',text(code,'timestampUnknown'));
 assert.equal(await page.locator('#v120AirPanel .v120-region').count(),5);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'mobile horizontal overflow');
 assert.deepEqual(errors,[],'Air Quality browser errors');
 console.log('V4.13 Air Quality BROWSER PASS: 12 locales, 5 NEA regions, unit/source preservation and unavailable, partial, cached, delayed and unconfirmed states.');
}finally{await context.close();await browser.close();}
