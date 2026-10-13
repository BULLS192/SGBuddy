import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:390,height:820},locale:'en-SG'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),js=[];
 page.on('pageerror',e=>js.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForSelector('#sgbuddyOffline .offline-pack',{state:'attached',timeout:60000});
 await page.evaluate(()=>window.SGBUDDY_VIEW_ROUTER?.show?.('account'));
 await page.waitForSelector('#sgbuddyOffline .offline-pack',{state:'visible'});
 assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3);
 await page.locator('#sgbuddyOffline [data-offline-download="calendar"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline'),null,{timeout:30000});
 const stored=await page.evaluate(async()=>{
  const cache=await caches.open('sgbuddy-offline-packs-v480');
  return (await cache.keys()).map(req=>new URL(req.url).pathname);
 });
 for(const p of ['/data/events-v470.json','/data/holidays-2026-2027-v460.json','/data/event-sources-v470.json'])assert.ok(stored.includes(p));
 await page.evaluate(code=>{window.SGBUDDY_LANGUAGE=code;document.dispatchEvent(new Event('sgbuddy:language'))},'fr');
 await page.waitForFunction(()=>/hors ligne/i.test(document.querySelector('#sgbuddyOffline h2')?.textContent||''),null,{timeout:10000});
 await page.evaluate(code=>{window.SGBUDDY_LANGUAGE=code;document.dispatchEvent(new Event('sgbuddy:language'))},'en');
 // Verify that the downloaded pack survives actual network loss, not merely CacheStorage lookup.
 await page.evaluate(()=>navigator.serviceWorker?.ready);
 if(!await page.evaluate(()=>Boolean(navigator.serviceWorker?.controller))){
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:30000});
 }
 await context.setOffline(true);
 const remote=await page.evaluate(async()=>{
  try{const r=await fetch('/data/events-v470.json');return {ok:r.ok,count:(await r.json()).events.length}}catch(e){return {ok:false,error:String(e)}}
 });
 assert.ok(remote.ok&&remote.count>0,'Actual PWA offline fetch should return cached event dataset');
 const content=await page.evaluate(async()=>{
  const r=await caches.match('/data/events-v470.json');
  return {cached:r?.ok||false,records:r?.ok?(await r.json()).events.length:0};
 });
 assert.ok(content.cached&&content.records>0);
 await context.setOffline(false);
 await page.locator('#sgbuddyOffline [data-offline-remove="calendar"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Not downloaded'),null,{timeout:10000});
 const cachedAfter=await page.evaluate(async()=>Boolean(await (await caches.open('sgbuddy-offline-packs-v480')).match('/data/events-v470.json')));
 assert.equal(cachedAfter,false);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 assert.equal(overflow,false);
 assert.deepEqual(js.filter(x=>/app-offline-v480|offline-packs-v480/.test(x)),[]);
 console.log('V4.8 offline browser QA: download, French locale, cached offline data and removal passed.');
 await context.close();
}finally{await browser.close();}
