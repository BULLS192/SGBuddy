/* V4.15 Offline 2.0 — real Chromium SW activation, old shell retirement,
 * preservation of downloaded packs, offline fallback and live API exclusion.
 * Emulation is not physical Safari / Android installed-PWA certification.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';

const base='http://127.0.0.1:8765/';
const allFiles=OFFLINE_PACKS.flatMap(p=>p.files);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Start on an unregistered same-origin page to model existing V4.14 offline state.
 await page.goto(base+'__v415_upgrade_fixture__',{waitUntil:'domcontentloaded',timeout:30000});
 await page.evaluate(async ({files,cacheName})=>{
  const legacy=await caches.open('sgbuddy-shell-v79');
  await legacy.put('/__v415_old_shell',new Response('legacy'));
  const saved=await caches.open(cacheName);
  for(const file of files){
   const response=await fetch(file,{cache:'no-store'});
   if(!response.ok)throw Error('fixture source missing: '+file);
   await saved.put(file,response);
  }
  localStorage.setItem('sgbuddy-v415-synthetic-saved-trip','preserve-me');
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 },{files:allFiles,cacheName:OFFLINE_CACHE});
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.15.0'
  &&document.querySelectorAll('#sgbuddyOffline .offline-pack').length===3,null,{timeout:65000});
 await page.waitForFunction(async ()=>{
  const reg=await navigator.serviceWorker.ready;
  return Boolean(reg.active)&&await caches.has('sgbuddy-shell-v80')&&!await caches.has('sgbuddy-shell-v79');
 },null,{timeout:65000});
 if(!await page.evaluate(()=>Boolean(navigator.serviceWorker.controller))){
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:30000});
 }
 const retained=await page.evaluate(async cacheName=>(await(await caches.open(cacheName)).keys()).map(x=>new URL(x.url).pathname),OFFLINE_CACHE);
 assert.equal(retained.length,13,'Previously downloaded files were lost during shell activation');
 for(const file of allFiles)assert.ok(retained.includes(file),'Missing retained offline asset '+file);
 assert.ok(!retained.some(x=>x.startsWith('/api/')),'Private API accidentally stored');
 // The SW deliberately does not intercept /api/, even if a request was made.
 await page.evaluate(()=>fetch('/api/v415-do-not-cache').catch(()=>null));
 const routes=await page.evaluate(async()=>{
  const names=await caches.keys(),entries=[];
  for(const name of names){for(const req of await(await caches.open(name)).keys())entries.push(new URL(req.url).pathname);}
  return entries.filter(x=>x.startsWith('/api/'));
 });
 assert.deepEqual(routes,[]);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.15.0'
  &&document.querySelectorAll('#sgbuddyOffline .offline-pack').length===3,null,{timeout:60000});
 assert.equal(await page.evaluate(()=>localStorage.getItem('sgbuddy-v415-synthetic-saved-trip')),'preserve-me');
 const offline=await page.evaluate(async files=>{
  const outcomes=[];
  for(const file of files){
   try{const response=await fetch(file);outcomes.push({file,ok:response.ok,payload:await response.json()});}
   catch(e){outcomes.push({file,error:String(e)})}
  }
  let apiBlocked=false;
  try{const response=await fetch('/api/weather');apiBlocked=!response.ok}catch{apiBlocked=true}
  return {outcomes,apiBlocked};
 },['/data/events-v470.json','/data/singapore-dishes-v180.json','/data/discover-v120.json']);
 assert.ok(offline.apiBlocked,'Live API response must not be faked by offline shell');
 assert.ok(offline.outcomes.every(x=>x.ok&&x.payload&&typeof x.payload==='object'),'Events / Food / Essentials unavailable offline: '+JSON.stringify(offline.outcomes));
 // Corrupt the user pack. Offline fetch must use the valid shell snapshot, not corrupt JSON.
 await page.evaluate(async name=>(await caches.open(name)).put('/data/events-v470.json',
   new Response('{corrupt',{headers:{'content-type':'application/json'}})),OFFLINE_CACHE);
 const safe=await page.evaluate(async()=>{
  const fallback=await(await caches.open('sgbuddy-shell-v80')).match('/data/events-v470.json');
  const response=await fetch('/data/events-v470.json');
  return {ok:response.ok,expected:await fallback.text(),actual:await response.text()};
 });
 assert.ok(safe.ok&&safe.actual===safe.expected,'Damaged downloaded JSON was exposed rather than repaired by shell fallback');
 assert.deepEqual(errors.filter(e=>/offline-transaction|app-offline-v480/.test(e)),[]);
 console.log('V4.15 SERVICE WORKER UPGRADE PASS: v79->v80, 13 preserved assets, offline restart, 3 content packs, blocked API, corruption fallback and saved data.');
 await context.close();
}finally{await browser.close()}
