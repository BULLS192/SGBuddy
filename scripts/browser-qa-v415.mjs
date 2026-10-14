/* V4.15 browser — real CacheStorage corruption, repair, timestamp staleness and safe removal.
 * Headless Chromium device-sized only; not real Safari or Android certification.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {offline415Text} from '../lib/offline-resilience-i18n-v415.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8765/';
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:844},locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','resident');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await context.newPage(),errs=[];
  page.on('pageerror',x=>errs.push(x.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForSelector('#sgbuddyOffline .offline-pack',{state:'attached',timeout:60000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
  await page.waitForSelector('#sgbuddyOffline .offline-pack',{state:'visible'});
  await page.locator('[data-offline-download="calendar"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline'),null,{timeout:45000});
  await page.evaluate(async ({key})=>{
   const cache=await caches.open(key);
   await cache.put('/data/events-v470.json',new Response('{bad JSON',{headers:{'content-type':'application/json'}}));
  },{key:OFFLINE_CACHE});
  await page.reload({waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Damaged cache'),null,{timeout:60000});
  assert.equal(await page.locator('[data-offline-pack="calendar"] .offline-pack-info').innerText().then(x=>/Ready offline/.test(x)),false);
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
  await page.waitForSelector('#sgbuddyOffline .offline-pack',{state:'visible',timeout:12000});
  await page.locator('[data-offline-download="calendar"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline')&&!document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Damaged cache'),null,{timeout:45000});
  await page.evaluate(()=>{localStorage.setItem('sgbuddy-v480-offline-downloads',JSON.stringify({calendar:'2026-01-01T00:00:00Z'}));});
  await page.reload({waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Check the age'),null,{timeout:60000});
  await page.evaluate(()=>{window.SGBUDDY_LANGUAGE='fr';document.dispatchEvent(new Event('sgbuddy:language'))});
  await page.waitForFunction(({label})=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes(label),
   {label:offline415Text('fr','stale')},{timeout:20000});
  const saved=await page.evaluate(async name=>(await (await caches.open(name)).keys()).map(x=>new URL(x.url).pathname),OFFLINE_CACHE);
  assert.equal(OFFLINE_PACKS[0].files.filter(f=>saved.includes(f)).length,3);
  assert.ok(!saved.some(x=>x.startsWith('/api/')));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'overflow at '+width);
  assert.deepEqual(errs.filter(x=>/app-offline-v480|offline-resilience-v415/.test(x)),[]);
  console.log('V4.15 OFFLINE BROWSER PASS '+width+'px: JSON corruption detected, in-place repair, date freshness, French and cache safety.');
  await context.close();
 }
}finally{await browser.close();}
