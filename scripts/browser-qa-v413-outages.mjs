/* V4.13: deterministic weather/transport outage and fallback integrity.
 * No private tokens, real provider traffic or production state.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG',serviceWorkers:'block'});
await context.addInitScript(()=>{
 localStorage.setItem('sgc-persona-onboarded','1');
 localStorage.setItem('sgc-mode','visitor');
 localStorage.setItem('sgc-location-choice','not-now');
});
const page=await context.newPage(),errors=[];
page.on('pageerror',err=>errors.push(err.message));
const fail=route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'TEST: official provider unavailable'})});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>!!window.SGBUDDY_CORE&&document.querySelector('#appVersion')?.textContent==='v4.24.0',{timeout:60000});
 await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('move'));
 await page.waitForSelector('#refreshButton',{state:'visible',timeout:12000});
 await page.route('**/api/weather*',fail);
 await page.route('**/api/train*',fail);
 await page.route('**/api/traffic*',fail);
 const individual=await page.evaluate(async()=>{
  localStorage.removeItem('sgc-last-weather');
  const core=window.SGBUDDY_CORE;
  const results=[];
  for(const path of ['/api/train','/api/traffic','/api/weather']){
   try{await core.json(path);results.push({path,unexpectedSuccess:true})}
   catch(e){results.push({path,error:String(e.message)})}
  }
  return results;
 });
 for(const item of individual)assert.ok(item.error?.includes('TEST: official provider unavailable'),item.path+' should report provider outage');
 const before=await page.evaluate(()=>JSON.stringify(window.SGBUDDY_CORE.state.weather||null));
 await page.locator('#refreshButton').click();
 await page.waitForFunction(()=>!document.querySelector('#refreshButton').disabled&&document.querySelector('#toast')?.textContent?.includes('TEST: official provider unavailable'),null,{timeout:15000});
 assert.equal(await page.evaluate(()=>JSON.stringify(window.SGBUDDY_CORE.state.weather||null)),before,'outage overwrote last-known weather');
 assert.notEqual((await page.locator('#toast').textContent()).trim(),'Refreshed','false success on outage');
 // A locally saved weather snapshot may be used, but it must be explicitly labelled cached/partial.
 const saved=await page.evaluate(async()=>{
  localStorage.setItem('sgc-last-weather',JSON.stringify({savedAt:Date.now(),value:{
   source:'live',conditions:{temperatureC:28,humidityPct:72},airQuality:{psi24h:{overall:41},pm25OneHour:{overall:13}},summary:'Last known test weather'
  }}));
  const value=await window.SGBUDDY_CORE.json('/api/weather');
  return {source:value.source,status:value.dataQuality?.status,lastGoodFallbackUsed:value.dataQuality?.lastGoodFallbackUsed,stale:value.dataQuality?.staleSignals||[]};
 });
 assert.equal(saved.source,'device-cache');
 assert.equal(saved.status,'partial');
 assert.equal(saved.lastGoodFallbackUsed,true);
 assert.ok(saved.stale.includes('offline device cache'));
 // Train and traffic subsequently recover, but weather still uses device cache.
 await page.unroute('**/api/train*',fail);await page.unroute('**/api/traffic*',fail);
 await page.route('**/api/train*',route=>route.fulfill({status:200,contentType:'application/json',body:'{"source":"test-recovery","status":0}'}));
 await page.route('**/api/traffic*',route=>route.fulfill({status:200,contentType:'application/json',body:'{"source":"test-recovery","count":0}'}));
 await page.locator('#refreshButton').click();
 await page.waitForFunction(()=>!document.querySelector('#refreshButton').disabled,null,{timeout:15000});
 assert.equal(await page.evaluate(()=>window.SGBUDDY_CORE.state.weather?.source),'device-cache','cached weather incorrectly marked live');
 assert.notEqual((await page.locator('#toast').textContent()).trim(),'Refreshed','cached weather should not be claimed as fresh');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12));
 assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3);
 assert.deepEqual(errors,[],'JS errors during outage QA');
 console.log('V4.13 OUTAGE BROWSER PASS: weather/train/traffic 503, refresh no false success, last-known snapshot and 6h cached weather source classification.');
}finally{await context.close();await browser.close();}
