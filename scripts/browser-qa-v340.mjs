import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {dynamicText} from '../lib/i18n-dynamic-v340.mjs';
const browser=await chromium.launch({headless:true});
async function newContext(width=390,height=844){
 const context=await browser.newContext({viewport:{width,height},locale:'en-SG'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 return context;
}
const context=await newContext(),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function equal(selector,expected){
 await page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent?.trim()===expected,{selector,expected},{timeout:14000});
}
const payload={
 walking:{minutes:11,routed:true,distanceM:900,note:'Provider note <b>keep original</b>'},
 publicTransport:{minutes:19,title:'Provider route name',walkMinutes:4,transfers:1,fareEstimateSgd:2.1,note:'Operator note unchanged'},
 drive:{minutes:9,routed:false,distanceM:2200,parkingAllowanceMinutes:6,note:'Drive estimate unchanged'},
 rideshare:{minutesLow:8,minutesHigh:17,routed:false,pickupLowMinutes:3,pickupHighMinutes:7,taxiMeterBaselineSgd:8.7,note:'Taxi note unchanged'},
 fastestEstimate:'drive',disclaimer:'Original provider disclaimer'
};
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v3.11.0'&&!!window.SGBUDDY_DYNAMIC_I18N&&!!document.querySelector('[data-buddy-action="help"]'),{timeout:30000});
 let apiCalls=0;
 await page.route('**/api/journey?*',route=>{
  if(new URL(route.request().url()).searchParams.get('action')==='compare'){
   apiCalls++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  }
  return route.continue();
 });
 await page.evaluate(()=>{
  window.SGBUDDY_CORE.state.lat=1.31;
  window.SGBUDDY_CORE.state.lon=103.85;
  window.SGBUDDY_CORE.state.weather={area:'Singapore',summary:'Provider summary',airQuality:{region:'South'},travelRisk:{level:'watch',message:'Provider warning'}};
  document.dispatchEvent(new Event('sgbuddy:translations-ready'));
 });
 await page.locator('#navMove').click();
 await page.locator('#v110CompareDestination').fill('Marina Bay Sands');
 await page.locator('#v110CompareButton').click();
 await page.waitForFunction(()=>document.querySelectorAll('#v110CompareResults .compare-mode').length===4,{timeout:16000});
 await page.locator('#buddyLauncher').click();
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await equal('#accountHubCopy',dynamicText(code,'accountGuestCopy'));
  await equal('[data-buddy-action="help"]','❔ '+dynamicText(code,'merliHelpChip'));
  await equal('#v110CompareResults .compare-mode .compare-time',dynamicText(code,'minute',{count:11}));
  const result=await page.locator('#v110CompareResults').textContent();
  for(const snippet of [dynamicText(code,'adultFare',{amount:'2.10'}),'Provider route name','Provider note <b>keep original</b>','Original provider disclaimer','SGD 2.10'])assert.ok(result.includes(snippet),code+' comparison text '+snippet);
  assert.equal(await page.locator('#v110CompareResults b').filter({hasText:'keep original'}).count(),0,code+' untrusted provider HTML');
  assert.equal(await page.locator('#v110CompareDestination').inputValue(),'Marina Bay Sands',code+' destination');
  const details=await page.locator('#envDetails').textContent();
  assert.ok(details.includes('Provider warning'),code+' weather source data');
  const expectedPm=dynamicText(code,'pm25Explanation');
  await page.waitForFunction(expected=>document.querySelector('#envDetails')?.textContent?.includes(expected),expectedPm,{timeout:6500}).catch(async error=>{
   console.error('V3.4 PM2.5 DIAGNOSTICS',JSON.stringify({locale:code,details:await page.locator('#envDetails').textContent(),expected:expectedPm,current:await page.evaluate(()=>window.SGBUDDY_LANGUAGE)}));
   throw error;
  });
  await page.evaluate(()=>window.SGBUDDY_OPEN_MERLI?.());
  await page.locator('#buddyPanel').waitFor({state:'visible',timeout:12000});
  // UX v1.7 keeps all secondary Merli chips under the More actions disclosure.
  if(await page.locator('#uxAllMerliActions').isHidden())await page.locator('#uxMerliMore').click();
  await page.locator('[data-buddy-action="help"]').click();await equal('#buddyReply',dynamicText(code,'merliCapability'));
  await page.locator('[data-buddy-action="privacy"]').click();await equal('#buddyReply',dynamicText(code,'merliPrivacy'));
  await page.locator('[data-buddy-action="bookings"]').click();await equal('#buddyReply',dynamicText(code,'merliBooking'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+8),true,code+' mobile overflow');
 }
 assert.equal(apiCalls,1,'Language switching must not refetch the same transport result');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v3.11.0',{timeout:30000});
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR','Locale persistence');
 const desktop=await newContext(1366,900),wide=await desktop.newPage();
 wide.on('pageerror',e=>errors.push('desktop: '+e.message));
 await wide.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await wide.waitForFunction(()=>!!window.SGBUDDY_DYNAMIC_I18N,{timeout:30000});
 for(const {code} of LOCALES){
  await wide.locator('#sgbLanguage').selectOption(code);
  await wide.waitForFunction(expected=>document.querySelector('#accountHubCopy')?.textContent?.trim()===expected,dynamicText(code,'accountGuestCopy'),{timeout:14000});
  assert.equal(await wide.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+8),true,code+' desktop overflow');
 }
 await desktop.close();
 assert.deepEqual(errors,[]);
 console.log('V3.4 CHROMIUM PASS: 12 locales mobile/desktop; source-safe comparison fares, notes, measurements, account/weather/Merli, no extra API call, no overflow, saved language.');
}finally{await browser.close()}
