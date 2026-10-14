/* V4.13: all five personas × all 12 languages on isolated mobile/desktop Chromium.
 * Synthetic local state only; no real profile data, AI usage, or external publishing.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {eventText} from '../lib/events-i18n-v470.mjs';
import {offlineText} from '../lib/offline-i18n-v480.mjs';

const PERSONAS=['resident','visitor','executive','new_in_sg','student'];
const desktop=process.argv.includes('--desktop');
const viewport=desktop?{width:1366,height:900}:{width:390,height:844};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const persona of PERSONAS){
  const context=await browser.newContext({viewport,locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(mode=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode',mode);
   localStorage.setItem('sgc-location-choice','not-now');
  },persona);
  const page=await context.newPage(),jsErrors=[];
  page.on('pageerror',error=>jsErrors.push(error.message));
  try{
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
   await page.waitForFunction(mode=>
    window.SGBUDDY_CORE?.state?.mode===mode&&
    document.querySelector('#appVersion')?.textContent==='v4.15.0'&&
    document.querySelectorAll('#sgbuddyOffline .offline-pack').length===3&&
    !!document.querySelector('#sgbuddyEvents h2')
   ,persona,{timeout:60000});
   assert.ok((await page.locator('#personaFocusTitle').textContent()||'').trim(),'persona guidance missing for '+persona);
   await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
   await page.waitForSelector('#sgbuddyEvents .events-filters',{state:'visible',timeout:14000});
   // Verify real language-switch propagation in both Events and offline controls.
   for(const {code} of LOCALES){
    await page.locator('#sgbLanguage').selectOption(code);
    await page.waitForFunction(code=>document.documentElement.lang===code,code,{timeout:10000});
    await page.waitForFunction(({heading,offline})=>
      document.querySelector('#sgbuddyEvents h2')?.textContent===heading&&
      document.querySelector('#sgbuddyOffline h2')?.textContent===offline,
      {heading:eventText(code,'title'),offline:offlineText(code,'heading')},
      {timeout:10000}
    );
    assert.equal(await page.evaluate(()=>window.SGBUDDY_CORE.state.mode),persona,'persona changed after locale '+code);
    assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3,'missing offline pack for '+persona+'/'+code);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'horizontal overflow for '+persona+'/'+code+'/'+viewport.width);
   }
   // Navigation, profile and reload must preserve the persona and language.
   await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('account'));
   await page.waitForSelector('#sgbuddyOffline',{state:'visible',timeout:10000});
   assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3);
   await page.reload({waitUntil:'domcontentloaded',timeout:40000});
   await page.waitForFunction(mode=>window.SGBUDDY_CORE?.state?.mode===mode&&!!document.querySelector('#sgbuddyEvents'),persona,{timeout:60000});
   assert.equal(await page.evaluate(()=>localStorage.getItem('sgc-mode')),persona,'persona did not persist across reload');
   assert.deepEqual(jsErrors,[],'browser errors: '+persona+' '+JSON.stringify(jsErrors));
   console.log('V4.13 '+viewport.width+'px PASS: '+persona+' × 12 locales, Events/Offline/Account, no overflow, reload persistence.');
  }finally{await context.close()}
 }
}finally{await browser.close()}
