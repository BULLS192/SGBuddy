/* V4.12 first-party Home status localization regression, viewport × locale */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {home412Text,HOME_V412} from '../lib/i18n-home-surface-v412.mjs';
const browser=await chromium.launch({headless:true});
async function run(width,height){
 const context=await browser.newContext({viewport:{width,height},locale:'en-SG',serviceWorkers:'block'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>!!window.SGBUDDY_V412&&document.querySelector('#appVersion')?.textContent==='v4.12.0',{timeout:35000});
  const selectors={weatherLoading:'#weatherLabel',locationOff:'#locationStatus',riskTitleLow:'#tripIntelTitle',riskCopyLow:'#tripIntelCopy',riskLow:'#tripIntelLevel',riskUnknown:'#envRiskBadge',temperature:'#environmentCard .environment-grid > div:nth-child(1) > span:nth-child(2)',humidity:'#environmentCard .environment-grid > div:nth-child(2) > span:nth-child(2)',rain5:'#environmentCard .environment-grid > div:nth-child(3) > span:nth-child(2)',wind:'#environmentCard .environment-grid > div:nth-child(4) > span:nth-child(2)',conditionsHeading:'#environmentCard .environment-head .label'};
  const baselineName=await page.locator('#placeLabel').textContent();
  const baselinePsi=await page.locator('#environmentCard .environment-grid > div:nth-child(5) > span:nth-child(2)').textContent();
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(code=>document.documentElement.lang===code,code,{timeout:8000});
   for(const [key,sel] of Object.entries(selectors)){
    const source=HOME_V412.en[key],want=home412Text(code,key);
    await page.evaluate(({sel,source})=>{const x=document.querySelector(sel);if(!x)throw Error('Missing '+sel);x.textContent=source;},{sel,source});
    await page.waitForFunction(({sel,want})=>document.querySelector(sel)?.textContent?.trim()===want,{sel,want},{timeout:4500}).catch(async()=>{const got=await page.locator(sel).textContent().catch(()=>'(selector missing)');throw Error('V4.12 locale '+code+' key '+key+' expected '+JSON.stringify(want)+' observed '+JSON.stringify(got)+' at '+sel);});
   }
   // A renderer may write an English source again; the scoped observer must restore it.
   await page.evaluate(()=>{document.querySelector('#tripIntelTitle').textContent='Conditions look good';});
   await page.waitForFunction(want=>document.querySelector('#tripIntelTitle')?.textContent?.trim()===want,home412Text(code,'riskTitleLow'),{timeout:6000});
   const tripHeading=await page.locator('#tripIntelligence .trip-intelligence-head .label').textContent();
   if(code!=='en')assert.notEqual(tripHeading.trim(),'TRIP INTELLIGENCE','legacy heading localization regressed');
   assert.equal(await page.locator('#placeLabel').textContent(),baselineName,'geographic identifier overwritten');
   assert.equal(await page.locator('#environmentCard .environment-grid > div:nth-child(5) > span:nth-child(2)').textContent(),baselinePsi,'PSI unit overwritten');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'overflow '+code+' '+width);
  }
  assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3,'offline pack regression');
  assert.ok(await page.locator('#sgbuddyEvents').count()>0,'events missing');
  assert.deepEqual(errors,[]);
  console.log('V4.12 Browser PASS '+width+'px: 12 locales, Home/conditions states; official source tokens unchanged.');
 }finally{await context.close()}
}
try{await run(390,844);await run(1366,900)}finally{await browser.close()}
