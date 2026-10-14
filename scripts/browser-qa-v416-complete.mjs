/* V4.16 real browser CacheStorage selective refresh, Chromium mobile and desktop. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {offline416Text} from '../lib/offline-freshness-i18n-v416.mjs';
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
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#sgbuddyOffline [data-offline-check-changes]',{state:'attached',timeout:65000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
  await page.waitForSelector('#sgbuddyOffline [data-offline-check-changes]',{state:'visible'});
  assert.equal(await page.locator('[data-offline-check-changes]').isDisabled(),true);
  await page.locator('[data-offline-download="calendar"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline'),null,{timeout:50000});
  await page.evaluate(async ({cacheName,files})=>{
   localStorage.setItem('sgbuddy-v416-saved-trip-test','sample-trip-preserved');
   const cache=await caches.open(cacheName);
   for(const [i,file] of files.entries()){
    const old=await cache.match(file),body=await old.text();
    await cache.put(file,new Response(body,{headers:{'content-type':'application/json',etag:i===1?'"old"':'"same"'}}));
   }
  },{cacheName:OFFLINE_CACHE,files:OFFLINE_PACKS[0].files});
  const before=await page.evaluate(async ({name,files})=>{
   const cache=await caches.open(name);
   return Promise.all(files.map(async f=>await(await cache.match(f)).text()));
  },{name:OFFLINE_CACHE,files:OFFLINE_PACKS[0].files});
  const target=OFFLINE_PACKS[0].files[1],requests=[];
  await context.route('**/data/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;
   if(req.method()==='HEAD'&&OFFLINE_PACKS[0].files.includes(path)){
    requests.push({method:'HEAD',path});
    return route.fulfill({status:200,headers:{etag:path===target?'"new"':'"same"'}});
   }
   if(req.method()==='GET'&&OFFLINE_PACKS[0].files.includes(path)){
    requests.push({method:'GET',path});
    if(path===target){
     const record=JSON.parse(before[1]);
     return route.fulfill({status:200,contentType:'application/json',headers:{etag:'"new"'},body:JSON.stringify({...record,v416Verified:true})});
    }
   }
   return route.continue();
  });
  await page.locator('[data-offline-check-changes]').click();
  await page.waitForFunction(()=>document.querySelector('#sgbuddyOffline .offline-status')?.textContent?.includes('1 may have changed'),null,{timeout:30000});
  const postCheck=await page.evaluate(async ({name,path})=>(await(await caches.open(name)).match(path)).text(),{name:OFFLINE_CACHE,path:target});
  assert.equal(postCheck,before[1],'HEAD check mutated saved data');
  assert.equal(requests.filter(x=>x.method==='HEAD').length,3);
  assert.equal(requests.filter(x=>x.method==='GET').length,0);
  await page.locator('[data-offline-apply-changes]').click();
  await page.waitForFunction(()=>document.querySelector('#sgbuddyOffline .offline-status')?.textContent?.includes('Updated 1 file(s)'),null,{timeout:45000});
  const after=await page.evaluate(async ({name,files})=>{
   const cache=await caches.open(name);
   return Promise.all(files.map(async f=>await(await cache.match(f)).text()));
  },{name:OFFLINE_CACHE,files:OFFLINE_PACKS[0].files});
  assert.equal(after[0],before[0]);assert.equal(after[2],before[2]);
  assert.equal(JSON.parse(after[1]).v416Verified,true);
  assert.deepEqual(requests.filter(x=>x.method==='GET').map(x=>x.path),[target]);
  const paths=await page.evaluate(async n=>(await(await caches.open(n)).keys()).map(k=>new URL(k.url).pathname),OFFLINE_CACHE);
  assert.equal(paths.length,3,'Selective update opted into Essentials or Food');
  assert.ok(!paths.some(p=>p.startsWith('/api/')));
  assert.equal(await page.evaluate(()=>localStorage.getItem('sgbuddy-v416-saved-trip-test')),'sample-trip-preserved');
  await context.setOffline(true);
  await page.waitForFunction(()=>document.querySelector('[data-offline-check-changes]')?.disabled===true,null,{timeout:10000});
  await context.setOffline(false);
  await page.waitForFunction(()=>document.querySelector('.offline-status')?.textContent?.includes('Connection restored'),null,{timeout:12000});
  const count=requests.length;
  await page.waitForTimeout(500);
  assert.equal(requests.length,count,'Reconnect silently checked or refreshed data');
  for(const {code} of LOCALES){
   await page.evaluate(c=>{window.SGBUDDY_LANGUAGE=c;document.dispatchEvent(new Event('sgbuddy:language'))},code);
   await page.waitForFunction(({label})=>document.querySelector('#sgbuddyOffline [data-offline-check-changes]')?.textContent?.includes(label),
    {label:offline416Text(code,'check')},{timeout:12000});
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Mobile/desktop overflow');
  assert.deepEqual(errors.filter(s=>/offline|transaction|freshness/i.test(s)),[]);
  console.log('V4.16 COMPLETE BROWSER PASS '+width+'px: read-only metadata, changed-only GET, 12 locales, saved trip, reconnect, no new packs.');
  await context.close();
 }
}finally{await browser.close();}
