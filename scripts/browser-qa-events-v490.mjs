/* Device-emulation QA only. Safari/iOS installation remains a manual test. */
import assert from 'node:assert/strict';
import {chromium,devices} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {offlineText} from '../lib/offline-i18n-v480.mjs';
import {eventText} from '../lib/events-i18n-v470.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const name of ['iPhone 13','Pixel 7']){
  const {defaultBrowserType,...descriptor}=devices[name];
  const context=await browser.newContext({...descriptor,serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForSelector('#sgbuddyOffline .offline-pack',{state:'attached',timeout:60000});
  await page.waitForSelector('#sgbuddyEvents h2',{state:'attached',timeout:15000});
  assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3);
  // Verify independently authored labels in all supported languages.
  for(const {code} of LOCALES){
   await page.evaluate(c=>{window.SGBUDDY_LANGUAGE=c;document.dispatchEvent(new Event('sgbuddy:language'))},code);
   const expected=eventText(code,'title');
   await page.waitForFunction(s=>document.querySelector('#sgbuddyEvents h2')?.textContent===s,expected,{timeout:7000});
   const header=offlineText(code,'heading');
   await page.waitForFunction(s=>document.querySelector('#sgbuddyOffline h2')?.textContent===s,header,{timeout:7000});
  }
  await page.evaluate(()=>window.SGBUDDY_VIEW_ROUTER?.show?.('places'));
  await page.locator('[data-ux423-group="events"]').click();
  await page.waitForSelector('#sgbuddyEvents .events-filters',{state:'visible',timeout:10000});
  assert.equal(await page.locator('#sgbuddyEvents .events-item').count()>0,true,'curated listing missing');
  const over=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  assert.equal(over,false,'Viewport overflows '+name);
  assert.deepEqual(errors.filter(x=>/app-events-v470|app-offline-v480/.test(x)),[]);
  console.log('V4.9 '+name+' Chromium device simulation: 12 locales and no overflow');
  await context.close();
 }
}finally{await browser.close()}
