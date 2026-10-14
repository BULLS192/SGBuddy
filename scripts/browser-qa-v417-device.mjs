/* V4.17 browser: explicit device check, opt-in only, language and mobile layout. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {offlineDeviceText} from '../lib/offline-device-i18n-v417.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:844},locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','resident');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('[data-offline-device-check]',{state:'attached',timeout:65000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
  await page.waitForSelector('#sgbuddyOffline [data-offline-device-check]',{state:'visible'});
  await page.evaluate(()=>{
   localStorage.setItem('sgbuddy-v417-private-test-trip','keep-local');
   window.__v417NetworkCalls=0;
   const original=window.fetch.bind(window);
   window.fetch=(...args)=>{window.__v417NetworkCalls++;return original(...args)};
  });
  await page.locator('[data-offline-device-check]').click();
  await page.waitForFunction(()=>document.querySelector('.offline-device-diagnostics')?.textContent?.includes('No offline packs downloaded'),null,{timeout:20000});
  assert.equal(await page.evaluate(()=>window.__v417NetworkCalls),0,'Device check must not fetch');
  const before=await page.evaluate(async()=>caches.keys());
  assert.ok(!before.includes('sgbuddy-offline-packs-v480'),'Diagnostics should not create an opt-in download cache');
  await page.locator('[data-offline-download="calendar"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-offline-pack="calendar"]')?.textContent?.includes('Ready offline'),null,{timeout:55000});
  const callsAfterDownload=await page.evaluate(()=>window.__v417NetworkCalls);
  await page.locator('[data-offline-device-check]').click();
  await page.waitForFunction(()=>document.querySelector('.offline-device-diagnostics')?.textContent?.includes('1/3 offline packs usable'),null,{timeout:20000});
  assert.equal(await page.evaluate(()=>window.__v417NetworkCalls),callsAfterDownload,'Diagnostic must not download or probe');
  assert.equal(await page.evaluate(()=>localStorage.getItem('sgbuddy-v417-private-test-trip')),'keep-local');
  for(const {code} of LOCALES){
   await page.evaluate(c=>{window.SGBUDDY_LANGUAGE=c;document.dispatchEvent(new Event('sgbuddy:language'))},code);
   await page.waitForFunction(({label})=>document.querySelector('[data-offline-device-check]')?.textContent?.includes(label),
    {label:offlineDeviceText(code,'check')},{timeout:12000});
   await page.waitForFunction(({expected})=>document.querySelector('.offline-device-diagnostics')?.textContent?.includes(expected),
    {expected:offlineDeviceText(code,'ready',{count:1,total:3})},{timeout:15000});
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Unexpected horizontal overflow');
  assert.deepEqual(errors.filter(x=>/offline-device|offline-network|offline-v480/i.test(x)),[]);
  await context.close();
  console.log('V4.17 DEVICE BROWSER PASS at '+width+'px: 12 locales, no diagnostic network calls, private trip intact.');
 }
}finally{await browser.close()}
