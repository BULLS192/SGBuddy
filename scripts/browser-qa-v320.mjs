import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {dynamicText} from '../lib/i18n-dynamic-v340.mjs';
import {runtimeText} from '../lib/i18n-runtime-v320.mjs';
import {placeRuntimeText} from '../lib/i18n-place-eta-v320.mjs';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG'});
await ctx.addInitScript(()=>{
 localStorage.setItem('sgc-persona-onboarded','1');
 localStorage.setItem('sgc-mode','visitor');
 localStorage.setItem('sgc-location-choice','not-now');
});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function textIs(selector,value){
 await page.waitForFunction(({selector,value})=>document.querySelector(selector)?.textContent?.trim()===value,{selector,value},{timeout:15000});
}
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.12.0',{timeout:30000});
 const modal=page.locator('#locationSheet');
 await modal.waitFor({state:'visible',timeout:2500}).catch(()=>{});
 if(await modal.isVisible())await page.locator('#notNowLocationButton').click();
 await page.waitForFunction(()=>Boolean(window.SGBUDDY_PLACE_INDEX_RENDERER),{timeout:16000});
 await page.evaluate(()=>{
  const s=window.SGBUDDY_CORE.state;
  s.weather={area:'Singapore',summary:'',conditions:{humidityPct:null,rainfallMm:null,temperatureC:27},rain:false,dataQuality:{unavailableSignals:['rainfall']},travelRisk:{level:'low'},airQuality:{psi24h:{overall:42},pm25OneHour:{value:17}}};
  window.SGBUDDY_CORE.renderEnvironment();
  s.v110Places=[{name:'Test Place',category:'Library',kind:'library',sourceKey:'nlb_libraries_geo',personaScore:98,distanceM:130,address:'Singapore'}];
  s.v110LoadedPersona=s.mode;
  window.SGBUDDY_PLACE_INDEX_RENDERER();
 });
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  // The Today screen refreshes asynchronously; isolate locale rendering from network state.
  await page.evaluate(()=>{
   const state=window.SGBUDDY_CORE.state;
   state.weather={area:'Singapore',summary:'',conditions:{humidityPct:null,rainfallMm:null,temperatureC:27},rain:false,dataQuality:{unavailableSignals:['rainfall']},travelRisk:{level:'low'},airQuality:{psi24h:{overall:42},pm25OneHour:{value:17}}};
   window.SGBUDDY_CORE.renderEnvironment();
   state.v110Places=[{name:'Test Place',category:'Library',kind:'library',sourceKey:'nlb_libraries_geo',personaScore:98,distanceM:130,address:'Singapore'}];
   state.v110LoadedPersona=state.mode;
   window.SGBUDDY_PLACE_INDEX_RENDERER();
  });
  await textIs('#envHeadline',runtimeText(code,'weatherConditions',{area:'Singapore'}));
  await textIs('#envHumidity',runtimeText(code,'unavailable'));
  await page.waitForFunction(expect=>document.querySelector('#envDetails')?.textContent?.includes(expect),dynamicText(code,'pm25Explanation'),{timeout:12000});
  assert.ok((await page.locator('#envDetails').textContent()).includes(runtimeText(code,'sensorsUnavailable',{sensors:'rainfall'})),code+' missing source-aware sensor caveat');
  await textIs('#accountSyncBadge',runtimeText(code,'offline'));
  await textIs('#placesGrid .v110-place-card .place-fit',placeRuntimeText(code,'bestFit'));
  await textIs('#placesGrid .v110-place-card .v110-compare-place',placeRuntimeText(code,'compareWays'));
  await page.locator('#tripTo').evaluate(el=>el.value='');
  await page.locator('#planTrip').evaluate(el=>el.click());
  await textIs('#toast',runtimeText(code,'destinationMissing'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+8),true,'Mobile overflow '+code);
 }
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.12.0',{timeout:30000});
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR','Language preference not persisted');
 assert.deepEqual(errors,[],'Unexpected browser runtime exceptions');
 console.log('V3.2 MOBILE PASS: 12 locales for account sync, weather, sensor/PM2.5 disclaimers, place ranking/ETA actions, journey required-destination error, persisted language and responsive layout.');
}finally{await browser.close()}
