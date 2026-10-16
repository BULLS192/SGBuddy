/* V4.20 automated Chromium verification: shell v85 offline restart and private trip retention.
 * Browser emulation is NOT equivalent to physical installed iPhone or Android acceptance.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const origin='http://127.0.0.1:8765';
const assets=['/app-trip-quality-v420.js','/lib/trip-insights-v420.mjs','/trip-quality-v420.css'];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/__v420_offline_fixture__',{waitUntil:'domcontentloaded',timeout:30000});
 await page.evaluate(async()=>{
  const old=await caches.open('sgbuddy-shell-v85');
  await old.put('/__v420_obsolete_shell',new Response('old shell'));
  const saved=await caches.open('sgbuddy-offline-packs-v480');
  await saved.put('/data/events-v470.json',new Response('{"events":[]}',{headers:{'content-type':'application/json'}}));
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
  localStorage.setItem('sgbuddy-my-trips-v260',JSON.stringify({schemaVersion:1,activeId:'v420-offline',trips:[{id:'v420-offline',name:'Offline test',startDate:'2026-11-21',createdAt:'2026-10-15T00:00:00Z',days:[[{key:'k1',place:{id:'m1',name:'Merlion',area:'Marina Bay',address:'Fullerton Road',kind:'Attraction'},time:'09:00',note:'Keep note private',done:false}]]}]}));
 });
 await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.23.0',{timeout:60000});
 await page.waitForFunction(async()=>{
  const reg=await navigator.serviceWorker.ready;
  return Boolean(reg.active)&&await caches.has('sgbuddy-shell-v88')&&!await caches.has('sgbuddy-shell-v85');
 },null,{timeout:65000});
 if(!await page.evaluate(()=>!!navigator.serviceWorker.controller)){
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:25000});
 }
 const before=await page.evaluate(async assets=>{
  const cache=await caches.open('sgbuddy-shell-v88');
  return Promise.all(assets.map(async p=>!!await cache.match(p)));
 },assets);
 assert.deepEqual(before,[true,true,true],'All newly imported V4.20 modules must be pre-cached');
 assert.equal(await page.evaluate(async()=>!!await(await caches.open('sgbuddy-offline-packs-v480')).match('/data/events-v470.json')),true,'Pre-downloaded calendar data must survive v85 activation');
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.23.0'&&!!window.SGBUDDY_TRIP_API,{timeout:60000});
 await page.locator('#navMoney').click();
 await page.locator('.trip-quality-summary').waitFor({state:'visible',timeout:20000});
 assert.match(await page.locator('.trip-quality-summary').textContent(),/1.*Stops|Stops.*1/);
 assert.ok(await page.locator('[data-v420-print]').isVisible(),'Local print action should remain available while offline');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sgbuddy-my-trips-v260')).trips[0].days[0][0].note),'Keep note private');
 assert.equal(await page.evaluate(async()=>!!await(await caches.open('sgbuddy-offline-packs-v480')).match('/data/events-v470.json')),true);
 assert.deepEqual(errors.filter(x=>/trip-insights-v420|app-trip-quality-v420|trip-quality-v420/i.test(x)),[]);
 console.log('V4.20 SW UPGRADE BROWSER PASS: v85→v86, new trip modules available offline, downloaded data and private trip intact.');
 await context.close();
}finally{await browser.close()}
