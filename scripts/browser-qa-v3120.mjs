import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {v312Text} from '../lib/i18n-v312.mjs';
const browser=await chromium.launch({headless:true});
async function check(viewport){
 const context=await browser.newContext({viewport,locale:'en-SG'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
  localStorage.setItem('sgbuddy-ux-saved-places-v1',JSON.stringify(['INDEX:Test Saved Venue']));
  localStorage.setItem('sgc-recent-destinations',JSON.stringify([{label:'Pasir Ris MRT',value:'EW1',type:'station'}]));
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.SGBUDDY_V312&&document.querySelector('#appVersion')?.textContent==='v4.23.0',{timeout:35000});
  await page.locator('#navAccount').click();
  await page.locator('#ux422MoreHub [data-ux-go="saved"]').click();
  await page.locator('#uxSavedContent .ux-saved-item').first().waitFor({state:'visible',timeout:9000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(data=>{
    const row=document.querySelector('#uxSavedContent .ux-saved-item');
    return row?.querySelector('small')?.textContent===data.note&&row?.querySelector('button')?.textContent===data.action;
   },{note:v312Text(code,'savedNearby'),action:v312Text(code,'openDetails')},{timeout:7500});
   assert.equal((await page.locator('#uxSavedContent .ux-saved-item strong').first().textContent()).trim(),'Test Saved Venue');
   await page.evaluate(()=>{
    window.SGBUDDY_CORE.renderJourney({origin:{label:'Pasir Ris MRT'},destination:{label:'Marina Bay'},
      options:[{id:'rail-route-test',mode:'rail',recommended:true,title:'EWL → City Hall',
        totalMinutes:24,walkMinutes:4,transfers:1,timingMode:'depart-at',
        arrivalAt:'2026-10-12T20:00:00+08:00',weatherAware:true,steps:[]}],
      limitations:['Official route note: preserve the original'],recommendedId:'rail-route-test'});
   });
   await page.waitForFunction(data=>{
    const summary=document.querySelector('#journeyStatus')?.textContent||'';
    const label=document.querySelector('#journeyResults .journey-option-head .label')?.textContent;
    const map=document.querySelector('#journeyResults .show-journey-map')?.textContent||'';
    return summary.includes(data.options)&&label===data.label&&map.includes(data.map);
   },{options:v312Text(code,'optionsOne',{count:1}),label:v312Text(code,'recommended').toUpperCase(),map:v312Text(code,'showOnMap')},{timeout:7500});
   const route=(await page.locator('#journeyStatus').textContent());
   assert.ok(route.includes('Pasir Ris MRT')&&route.includes('Marina Bay'),code+' place names preserved');
   assert.ok((await page.locator('#journeyResults').textContent()).includes('Official route note: preserve the original'),code+' source caution preserved');
   assert.equal((await page.locator('#journeyResults .weather-route-badge').textContent()).trim(),v312Text(code,'rainSmart'));
   await page.locator('#navMoney').click();
   await page.locator('#myTripPlanner').waitFor({state:'visible',timeout:10000});
   assert.equal(await page.locator('#tripNewName').getAttribute('placeholder'),v312Text(code,'tripNamePlaceholder'));
   await page.locator('#navAccount').click();
  await page.locator('#ux422MoreHub [data-ux-go="saved"]').click();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+8),code+' horizontal overflow');
  }
  assert.deepEqual(errors,[],'Uncaught browser errors');
 }finally{await context.close()}
}
try{
 await check({width:390,height:844});
 await check({width:1366,height:900});
 console.log('V3.12 CHROMIUM PASS: Saved via More, trip and journey across 12 locales, desktop/mobile, source protection.');
}finally{await browser.close()}
