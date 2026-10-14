import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CLASSIFIED_KEYS,CLASSIFIED_MESSAGES,classifiedText} from '../lib/i18n-classified-v360.mjs';
const browser=await chromium.launch({headless:true});
const controlled=[
 ['#greeting','greetMorning'],['#accountButtonText','guestAccount'],
 ['#locationStatus','locationUnset'],['#sourceBadge','sourceLive'],
 ['#unitsToggle','unitsMetric'],['#editPersonaButton','editMode'],
 ['#goHotelButton','goHotel'],['#placesCardsButton','placesCards'],
 ['#placesMapButton','placesMap'],['#fitPlacesMap','placesFit'],
 ['#signInButton','signIn'],['#createAccountButton','createAccount'],
 ['#allowLocationButton','useLocation'],['#notNowLocationButton','notNow']
];
const alternates=[
 ['#greeting','greetAfternoon'],['#greeting','greetEvening'],
 ['#sourceBadge','sourceMixed'],['#sourceBadge','sourceDemo'],
 ['#unitsToggle','unitsImperial']
];
const baseline=CLASSIFIED_MESSAGES.en;
async function test(width,height){
 const context=await browser.newContext({viewport:{width,height},locale:'en-SG'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.16.0'&&!!window.SGBUDDY_CLASSIFIED_I18N,{timeout:30000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   // Controlled reset of only registered first-party UI controls; source/provider
   // displays are NOT overwritten and user values are never used as fixtures.
   await page.evaluate(({controlled,baseline})=>{
    document.querySelector('#accountButton')?.classList.remove('signed-in');
    for(const [selector,key] of controlled)document.querySelector(selector).textContent=baseline[key];
    window.SGBUDDY_CLASSIFIED_I18N.refresh();
   },{controlled,baseline});
   const expected=Object.fromEntries(CLASSIFIED_KEYS.map(key=>[key,classifiedText(code,key)]));
   await page.waitForFunction(({controlled,expected})=>
    controlled.every(([selector,key])=>document.querySelector(selector)?.textContent?.trim()===expected[key]),
    {controlled,expected},{timeout:12000}).catch(async e=>{
     const missing=await page.evaluate(({controlled,expected})=>controlled.filter(([s,k])=>document.querySelector(s)?.textContent?.trim()!==expected[k]).map(([s,k])=>({selector:s,key:k,actual:document.querySelector(s)?.textContent?.trim(),expected:expected[k]})),{controlled,expected});
     console.error('V3.6 SCREEN DIAGNOSTIC',JSON.stringify({code,width,missing}));
     throw e;
    });
   for(const [selector,key] of alternates){
    await page.evaluate(({selector,key,baseline})=>{
     document.querySelector(selector).textContent=baseline[key];
     window.SGBUDDY_CLASSIFIED_I18N.refresh();
    },{selector,key,baseline});
    await page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent?.trim()===expected,
      {selector,expected:expected[key]},{timeout:5000});
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+8),code+' '+width+' screen overflow');
  }
  await page.evaluate(()=>{
   const guest=document.querySelector('#accountButton'),text=document.querySelector('#accountButtonText');
   guest.classList.add('signed-in');text.textContent='Account';window.SGBUDDY_CLASSIFIED_I18N.refresh();
   document.querySelector('#weatherLabel').textContent='Provider forecast unchanged';
   document.querySelector('#envDetails').textContent='Official PM2.5 warning unchanged';
   document.querySelector('#modeText').textContent='Resident mode source';
   document.querySelector('#placeLabel').textContent='Singapore';
  });
  await page.waitForTimeout(150);
  for(const [selector,expected] of [
   ['#accountButtonText','Account'],
   ['#weatherLabel','Provider forecast unchanged'],
   ['#envDetails','Official PM2.5 warning unchanged'],
   ['#modeText','Resident mode source'],
   ['#placeLabel','Singapore']
  ])assert.equal((await page.locator(selector).textContent()).trim(),expected,'Protected third-party/user data '+selector);
  await page.reload({waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.SGBUDDY_CLASSIFIED_I18N,{timeout:30000});
  assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR','Persisted locale');
  assert.deepEqual(errors,[],'Page script exceptions');
 }finally{await context.close()}
}
try{
 await test(390,844);
 await test(1366,900);
 console.log('V3.6 CHROMIUM PASS: 12 locales × 2 viewports; 14 controls, 19 state strings, provider/username protection, locale persistence, no overflow.');
}finally{await browser.close()}
