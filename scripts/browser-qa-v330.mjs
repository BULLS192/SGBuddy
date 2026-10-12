import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {SYSTEM_ENGLISH,systemText} from '../lib/i18n-system-v330.mjs';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG'});
await context.addInitScript(()=>{
 localStorage.setItem('sgc-persona-onboarded','1');
 localStorage.setItem('sgc-mode','visitor');
 localStorage.setItem('sgc-location-choice','not-now');
});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
async function equals(selector,expected){
 await page.waitForFunction(({selector,expected})=>{
  const el=document.querySelector(selector);return el?.textContent?.trim()===expected;
 },{selector,expected},{timeout:14000});
}
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v3.3.0',{timeout:30000});
 await page.waitForFunction(()=>Boolean(window.SGBUDDY_SYSTEM_I18N),{timeout:14000});
 await page.waitForFunction(()=>!!document.querySelector('#v110CompareCard'),{timeout:14000});
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await equals('#accountSheetTitle',systemText(code,'accountTitle'));
  await equals('#accountSheet .account-intro',systemText(code,'accountIntro'));
  await equals('#accountHubOpen',systemText(code,'accountHubOpen'));
  await equals('#v110CompareCard .compare-head h3',systemText(code,'compareHeadline'));
  await equals('#v110CompareCard > p',systemText(code,'compareDescription'));
  await page.waitForFunction(expected=>document.querySelector('#v110CompareDestination')?.placeholder===expected,systemText(code,'comparePlaceholder'),{timeout:14000});
  await equals('#v110PlaceSort option[value="best"]',systemText(code,'sortBest'));
  // Simulate the legacy device-sync renderer: exact first-party messages
  // should translate, but raw account/user information must remain intact.
  await page.evaluate(original=>{
   const desc=document.querySelector('#profileDescription');if(desc)desc.textContent=original;
  },SYSTEM_ENGLISH.legacyGuestNote);
  await equals('#profileDescription',systemText(code,'legacyGuestNote'));
  const routeInput=page.locator('#v110CompareDestination');
  await routeInput.evaluate(el=>{el.value='Marina Bay Sands'});
  assert.equal(await routeInput.inputValue(),'Marina Bay Sands','Do not translate user-entered destination');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+8),true,'Mobile horizontal overflow '+code);
 }
 // Preserve original English when switching back to English.
 await page.locator('#sgbLanguage').selectOption('en');
 await equals('#accountSheetTitle',SYSTEM_ENGLISH.accountTitle);
 // Unknown provider-supplied warnings are never replaced.
 await page.evaluate(()=>{
  const host=document.querySelector('#v110CompareResults');
  host.innerHTML='<div class="empty-inline">Provider error: check the fare directly with the operator.</div>';
  window.SGBUDDY_SYSTEM_I18N.refresh();
 });
 await page.waitForTimeout(70);
 assert.equal(await page.locator('#v110CompareResults .empty-inline').textContent(),'Provider error: check the fare directly with the operator.');
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v3.3.0',{timeout:30000});
 await page.waitForFunction(()=>Boolean(window.SGBUDDY_SYSTEM_I18N),{timeout:14000});
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR','Locale must persist across reloads');
 await equals('#accountSheetTitle',systemText('pt-BR','accountTitle'));
 assert.deepEqual(errors,[],'Browser threw uncaught exceptions');
 console.log('V3.3 CHROMIUM PASS: 12 languages, signed-out account information, compare panel, sorting, dynamic cloud note, safe user input, responsive layout, original provider text and reload persistence.');
}finally{await browser.close()}
