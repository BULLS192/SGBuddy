/* V4.15 Offline 2.0: downloaded-only reconnect refresh and crash recovery, Chromium only. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {OFFLINE_PACKS,OFFLINE_CACHE} from '../lib/offline-packs-v480.mjs';
import {TXN_MARKER,transactionName} from '../lib/offline-transaction-v415.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {offline415Text} from '../lib/offline-resilience-i18n-v415.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:850},locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','resident');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#sgbuddyOffline .offline-readiness',{state:'attached',timeout:65000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
  await page.waitForSelector('#sgbuddyOffline .offline-readiness',{state:'visible'});
  await page.waitForFunction(()=>document.querySelector('.offline-readiness')?.textContent?.includes('0 of 3 packs ready'),null,{timeout:15000});
  assert.equal(await page.locator('#sgbuddyOffline [data-offline-refresh-all]').isDisabled(),true,'Do not refresh any unselected packs');
  await page.locator('[data-offline-download="calendar"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline'),null,{timeout:45000});
  assert.ok((await page.locator('#sgbuddyOffline .offline-readiness').textContent()).includes('1 of 3'));
  await page.locator('#sgbuddyOffline [data-offline-refresh-all]').click();
  await page.waitForFunction(()=>document.querySelector('#sgbuddyOffline .offline-status')?.textContent?.includes('Updated 1 saved pack'),null,{timeout:50000});
  const paths=await page.evaluate(async name=>(await(await caches.open(name)).keys()).map(r=>new URL(r.url).pathname),OFFLINE_CACHE);
  assert.equal(paths.length,3,'Reconnect refresh must not opt in to Essentials or Food');
  for(const pack of OFFLINE_PACKS.slice(1))for(const file of pack.files)assert.ok(!paths.includes(file));
  // Durable simulated process termination midway through a Calendar refresh.
  await page.evaluate(async({name,files,marker,publicCache})=>{
   const original=await caches.open(publicCache),journal=await caches.open(name),existed=[];
   for(const file of files){
    const previous=await original.match(file);
    existed.push(Boolean(previous));
    if(previous)await journal.put(file,previous.clone());
   }
   await journal.put(marker,new Response(JSON.stringify({version:1,files,existed}),{headers:{'content-type':'application/json'}}));
   await original.put(files[1],new Response('{crashed',{headers:{'content-type':'application/json'}}));
  },{name:transactionName(OFFLINE_PACKS[0]),files:OFFLINE_PACKS[0].files,marker:TXN_MARKER,publicCache:OFFLINE_CACHE});
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#sgbuddyOffline .offline-status')?.textContent?.includes('Recovered an interrupted'),null,{timeout:60000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
  await page.waitForSelector('#sgbuddyOffline .offline-readiness',{state:'visible'});
  assert.ok((await page.locator('.offline-readiness').textContent()).includes('1 of 3'));
  const restored=await page.evaluate(async cache=>{
   const r=await(await caches.open(cache)).match('/data/events-v470.json');
   return {ok:r.ok,count:(await r.json()).events.length};
  },OFFLINE_CACHE);
  assert.ok(restored.ok&&restored.count===11);
  assert.equal(await page.evaluate(async()=> (await caches.keys()).some(k=>k.startsWith('sgbuddy-offline-txn-v415-'))),false);
  await context.setOffline(true);
  await page.waitForFunction(()=>document.querySelector('[data-offline-download="calendar"]')?.disabled===true,null,{timeout:10000});
  await context.setOffline(false);
  await page.waitForFunction(()=>document.querySelector('#sgbuddyOffline .offline-status')?.textContent?.includes('Connection restored'),null,{timeout:10000});
  const before=await page.evaluate(key=>localStorage.getItem(key),'sgbuddy-v480-offline-downloads');
  await page.waitForTimeout(400);
  const after=await page.evaluate(key=>localStorage.getItem(key),'sgbuddy-v480-offline-downloads');
  assert.equal(after,before,'Reconnect must not silently refresh downloaded packs');
  for(const {code} of LOCALES){
   await page.evaluate(c=>{window.SGBUDDY_LANGUAGE=c;document.dispatchEvent(new Event('sgbuddy:language'))},code);
   await page.waitForFunction(({label})=>document.querySelector('#sgbuddyOffline .offline-readiness')?.textContent?.includes(label),
    {label:offline415Text(code,'offlineSummary')},{timeout:12000});
  }
  await page.evaluate(()=>{window.SGBUDDY_LANGUAGE='en';document.dispatchEvent(new Event('sgbuddy:language'))});
  if(await page.locator('#sgbuddyOffline [data-offline-persist]').count()){
   await page.locator('#sgbuddyOffline [data-offline-persist]').click();
   await page.waitForFunction(()=>/Persistent storage|did not grant persistent storage/.test(document.querySelector('#sgbuddyOffline .offline-status')?.textContent||''),null,{timeout:14000});
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Horizontal overflow '+width);
  assert.deepEqual(errors.filter(e=>/app-offline-v480|offline-transaction-v415/.test(e)),[]);
  await context.close();
  console.log('V4.15 OFFLINE 2.0 BROWSER PASS '+width+'px: manual refresh, crash recovery, reconnect, 12 locales and opt-in persistence.');
 }
}finally{await browser.close()}
