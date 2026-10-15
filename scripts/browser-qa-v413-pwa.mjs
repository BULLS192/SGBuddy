/* V4.13 release-readiness: installed PWA behaviour in Chromium device-sized contexts.
 * Emulates connectivity interruption and restart; NOT physical iOS Safari or Android PWA certification.
 * Public first-party assets only. Never talks to production or external data sources deliberately.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {offlineText} from '../lib/offline-i18n-v480.mjs';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8765/';
const widths=[{name:'iPhone-sized Chromium',width:390,height:844},{name:'Pixel-sized Chromium',width:412,height:915}];
const offlineFiles=OFFLINE_PACKS.flatMap(pack=>pack.files);
const errors=[];

async function contextFor(viewport,serviceWorkers='allow'){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},
   locale:'en-SG',isMobile:true,hasTouch:true,serviceWorkers});
 await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','resident');
   localStorage.setItem('sgc-location-choice','not-now');
 });
 return context;
}
async function launchAccount(page){
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>window.SGBUDDY_CORE?.state?.mode==='resident'
   &&document.querySelector('#appVersion')?.textContent==='v4.20.0'
   &&document.querySelectorAll('#sgbuddyOffline .offline-pack').length===3,
   null,{timeout:60000});
 await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
 await page.waitForSelector('#sgbuddyOffline .offline-pack',{state:'visible',timeout:15000});
}
async function waitPack(page,id){
 const pack=OFFLINE_PACKS.find(x=>x.id===id);
 await page.waitForFunction(async files=>{
   const cache=await caches.open('sgbuddy-offline-packs-v480');
   return (await Promise.all(files.map(file=>cache.match(file)))).every(Boolean);
 },pack.files,{timeout:35000});
 await page.waitForFunction(({id,ready})=>
   document.querySelector('[data-offline-pack="'+id+'"]')?.textContent?.includes(ready),
   {id,ready:offlineText('en','ready')},{timeout:15000});
}
async function cachedPaths(page){
 return page.evaluate(async name=>(await(await caches.open(name)).keys()).map(r=>new URL(r.url).pathname),OFFLINE_CACHE);
}
async function interruptedUpdate(){
 const vp=widths[0];
 // Block SW just for this deterministic first-party route fixture; test the real SW separately.
 const context=await contextFor(vp,'block');
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push('interrupt: '+e.message));
 try{
  await launchAccount(page);
  await page.locator('[data-offline-download="calendar"]').click();
  await waitPack(page,'calendar');
  const original=await page.evaluate(async()=>{
   const r=await (await caches.open('sgbuddy-offline-packs-v480')).match('/data/events-v470.json');
   return r.text();
  });
  let intercepted=0;
  await context.route('**/data/events-v470.json',route=>{
    intercepted++;
    return route.fulfill({status:503,contentType:'application/json',body:'{"error":"synthetic interrupted download"}'});
  });
  await page.locator('[data-offline-download="calendar"]').click();
  await page.waitForFunction(({text})=>
    document.querySelector('#sgbuddyOffline .offline-status')?.textContent?.includes(text),
    {text:offlineText('en','interrupted')},{timeout:15000});
  assert.ok(intercepted>=1,'interrupted download fixture did not exercise a request');
  const after=await page.evaluate(async()=>{
   const r=await(await caches.open('sgbuddy-offline-packs-v480')).match('/data/events-v470.json');
   return r.text();
  });
  assert.equal(after,original,'partial update overwrote a previously valid event pack');
  assert.equal((await cachedPaths(page)).filter(x=>OFFLINE_PACKS[0].files.includes(x)).length,OFFLINE_PACKS[0].files.length);
  console.log('V4.13 PWA PASS: interrupted calendar refresh retained all previously cached data.');
 }finally{await context.close()}
}
async function offlineRestart(vp){
 const context=await contextFor(vp);
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(vp.name+': '+e.message));
 try{
  await launchAccount(page);
  for(const pack of OFFLINE_PACKS){
   await page.locator('[data-offline-download="'+pack.id+'"]').click();
   await waitPack(page,pack.id);
  }
  const paths=await cachedPaths(page);
  assert.equal(offlineFiles.length,13);
  for(const file of offlineFiles)assert.ok(paths.includes(file),'Offline data not downloaded: '+file);
  assert.equal(paths.filter(x=>x.startsWith('/api/')).length,0,'live API unexpectedly persisted to user offline pack');
  await page.locator('#sgbLanguage').selectOption('fr');
  await page.waitForFunction(()=>document.documentElement.lang==='fr',null,{timeout:8000});
  await page.waitForFunction(()=>navigator.serviceWorker.ready.then(reg=>Boolean(reg.active)),null,{timeout:45000});
  if(!await page.evaluate(()=>Boolean(navigator.serviceWorker.controller))){
   await page.reload({waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:30000});
  }
  assert.ok(await page.evaluate(()=>caches.has('sgbuddy-shell-v85')),'installed shell missing from CacheStorage');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.20.0'
    &&document.querySelectorAll('#sgbuddyOffline .offline-pack').length===3,null,{timeout:60000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
  await page.waitForSelector('#sgbuddyOffline .offline-pack',{state:'visible',timeout:15000});
  assert.equal(await page.evaluate(()=>window.SGBUDDY_CORE.state.mode),'resident','offline reload lost saved persona');
  assert.equal(await page.evaluate(()=>localStorage.getItem('sgc-mode')),'resident');
  assert.equal(await page.evaluate(()=>document.documentElement.lang),'fr','offline reload lost selected language');
  for(const pack of OFFLINE_PACKS){
   const available=await page.evaluate(async files=>{
    const cache=await caches.open('sgbuddy-offline-packs-v480');
    return (await Promise.all(files.map(file=>cache.match(file)))).every(Boolean);
   },pack.files);
   assert.ok(available,'Offline pack missing after disconnected restart: '+pack.id);
  }
  const disconnected=await page.evaluate(async files=>{
   const outcomes=[];
   for(const file of files){
    try{const r=await fetch(file);outcomes.push({file,ok:r.ok,contentType:r.headers.get('content-type'),json:!!(await r.json())})}
    catch(e){outcomes.push({file,error:String(e)})}
   }
   let apiBlocked=false;
   try{const r=await fetch('/api/weather');apiBlocked=!r.ok}catch{apiBlocked=true}
   return {outcomes,apiBlocked};
  },['/data/events-v470.json','/data/holidays-2026-2027-v460.json','/data/singapore-dishes-v180.json','/data/discover-v120.json']);
  for(const x of disconnected.outcomes)assert.ok(x.ok&&x.json,'Offline fetch unavailable: '+JSON.stringify(x));
  assert.equal(disconnected.apiBlocked,true,'live weather API served as current data in airplane mode');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'offline UI overflow at '+vp.width);
  await context.setOffline(false);
  await page.waitForFunction(()=>navigator.onLine===true,null,{timeout:8000});
  await page.locator('#sgbLanguage').selectOption('en');
  await page.waitForFunction(()=>document.documentElement.lang==='en',null,{timeout:9000});
  await page.locator('[data-offline-remove="food"]').click();
  await page.waitForFunction(async files=>{
   const cache=await caches.open('sgbuddy-offline-packs-v480');
   return (await Promise.all(files.map(f=>cache.match(f)))).every(x=>!x);
  },OFFLINE_PACKS.find(x=>x.id==='food').files,{timeout:15000});
  const remaining=await cachedPaths(page);
  for(const pack of OFFLINE_PACKS.filter(p=>p.id!=='food')){
   for(const file of pack.files)assert.ok(remaining.includes(file),'Removing Food wrongly erased '+file);
  }
  console.log('V4.13 PWA PASS '+vp.name+': 3 packs, offline restart, French locale/persona, JSON fallback, API isolation, reconnection and selective removal.');
 }finally{await context.close()}
}
try{
 await interruptedUpdate();
 for(const vp of widths)await offlineRestart(vp);
 assert.deepEqual(errors,[],'Uncaught PWA browser errors: '+JSON.stringify(errors));
 console.log('V4.13 PWA BROWSER PASS: device-sized Chromium emulation only; real Safari/Android signoff still required.');
}finally{await browser.close()}
