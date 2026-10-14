/* V4.17 Wave 2: real two-tab Chromium locking, lifecycle & crash recovery. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {TXN_MARKER,transactionName} from '../lib/offline-transaction-v415.mjs';
const base='http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await ctx.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const first=await ctx.newPage(),second=await ctx.newPage();
 for(const page of [first,second]){
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#sgbuddyOffline [data-offline-download="calendar"]',{state:'attached',timeout:65000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
  await page.waitForSelector('[data-offline-download="calendar"]',{state:'visible'});
 }
 await first.evaluate(()=>localStorage.setItem('sgbuddy-v417-private-sample','preserve'));
 await first.locator('[data-offline-download="calendar"]').click();
 await first.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline'),null,{timeout:50000});
 await second.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline'),null,{timeout:25000});
 // Hold the exclusive pack lock in one tab, request removal in the other.
 await first.evaluate(()=>{
  window.__v417Hold=navigator.locks.request('sgbuddy-offline-calendar',{mode:'exclusive'},async()=>{
   window.__v417Held=true;
   await new Promise(resolve=>window.__v417Release=resolve);
  });
 });
 await first.waitForFunction(()=>window.__v417Held===true);
 await second.locator('[data-offline-remove="calendar"]').click();
 await second.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"] [data-offline-remove]')?.disabled===true);
 const pending=await second.evaluate(async()=>{
  const q=await navigator.locks.query();
  return q.pending.some(x=>x.name==='sgbuddy-offline-calendar');
 });
 assert.equal(pending,true,'Removal must queue while another tab holds the pack lock');
 const prior=await second.evaluate(async name=>(await(await caches.open(name)).keys()).length,OFFLINE_CACHE);
 assert.equal(prior,3,'Concurrent removal wrote while blocked');
 await first.evaluate(()=>window.__v417Release());
 await second.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Not downloaded'),null,{timeout:25000});
 const empty=await second.evaluate(async name=>(await(await caches.open(name)).keys()).length,OFFLINE_CACHE);
 assert.equal(empty,0);
 assert.equal(await second.evaluate(()=>localStorage.getItem('sgbuddy-v417-private-sample')),'preserve');
 // Establish old valid Calendar pack, then simulate an interrupted partial write.
 await second.locator('[data-offline-download="calendar"]').click();
 await second.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline'),null,{timeout:50000});
 const files=OFFLINE_PACKS[0].files;
 const original=await second.evaluate(async ({file,cache})=>(await(await caches.open(cache)).match(file)).text(),{file:files[1],cache:OFFLINE_CACHE});
 await second.evaluate(async({files,cacheName,journalName,marker})=>{
  const publicCache=await caches.open(cacheName),journal=await caches.open(journalName);
  for(const path of files)await journal.put(path,(await publicCache.match(path)).clone());
  await journal.put(marker,new Response(JSON.stringify({
   version:1,files,existed:files.map(()=>true)
  }),{headers:{'content-type':'application/json'}}));
  await publicCache.put(files[1],new Response('{truncated',{headers:{'content-type':'application/json'}}));
 },{files,cacheName:OFFLINE_CACHE,journalName:transactionName(OFFLINE_PACKS[0]),marker:TXN_MARKER});
 // A restart in a second tab must restore previously valid bytes.
 await first.reload({waitUntil:'domcontentloaded',timeout:45000});
 await first.waitForSelector('#sgbuddyOffline',{state:'attached',timeout:65000});
 await first.waitForFunction(async()=> !(await caches.keys()).some(x=>x.startsWith('sgbuddy-offline-txn-v415-')),null,{timeout:30000});
 const restored=await first.evaluate(async({file,cache})=>(await(await caches.open(cache)).match(file)).text(),{file:files[1],cache:OFFLINE_CACHE});
 assert.equal(restored,original,'Interrupted cross-tab write must recover original JSON');
 assert.equal(await first.evaluate(()=>localStorage.getItem('sgbuddy-v417-private-sample')),'preserve');
 await ctx.close();
 // Unsupported browser lock must fail closed, not silently allow writes.
 const noLocks=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await noLocks.addInitScript(()=>{
  Object.defineProperty(navigator,'locks',{value:undefined,configurable:true});
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await noLocks.newPage();
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#sgbuddyOffline',{state:'attached',timeout:65000});
 await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
 await page.waitForSelector('[data-offline-download="calendar"]',{state:'visible'});
 assert.equal(await page.locator('[data-offline-download="calendar"]').isDisabled(),true);
 assert.ok((await page.locator('.offline-integrity').allTextContents()).some(x=>x.includes('cannot guarantee safe updates')));
 assert.ok(!await page.evaluate(async()=> (await caches.keys()).includes('sgbuddy-offline-packs-v480')));
 await noLocks.close();
 console.log('V4.17 MULTI-TAB BROWSER PASS: exclusive lock queue, opt-in removal, crash rollback after restart, no-lock fail-closed, saved data preserved.');
}finally{await browser.close()}
