import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {V411_OPTION_KEYS,v411Option,v411Text} from '../lib/i18n-remaining-v411.mjs';
const browser=await chromium.launch({headless:true});
async function run(viewport){
 const context=await browser.newContext({viewport,locale:'en-SG',serviceWorkers:'block'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.16.0'&&!!window.SGBUDDY_V411,{timeout:35000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
  await page.locator('#discoverTab-eat').click();
  await page.waitForSelector('#foodMeal option[value="Breakfast"]',{state:'attached',timeout:20000});
  await page.waitForSelector('#discoverCategoryFilter option[value="Supermarket — operator locator"]',{state:'attached',timeout:20000});
  await page.waitForSelector('#foodCards .food-stall h4',{state:'attached',timeout:16000});
  const originalWarning=await page.locator('#sgbFoodOriginalWarning .food-note').textContent();
  await page.locator('#foodMeal').selectOption('Breakfast');
  await page.waitForFunction(()=>document.querySelector('#foodCards .food-stall h4'),{timeout:8500});
  const sourceName=await page.locator('#foodCards .food-stall h4').first().textContent();
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(x=>document.documentElement.lang===x,code,{timeout:9500});
   const options=V411_OPTION_KEYS.map(key=>({selector:key==='Supermarket — operator locator'?'#discoverCategoryFilter':key==='Local hawker'||key==='Singapore hawker'?'#foodCuisine':'#foodMeal',key,want:v411Option(code,key)}));
   await page.waitForFunction(items=>items.every(({selector,key,want})=>{
    const node=[...document.querySelectorAll(selector+' option')].find(x=>x.value===key);
    return node?.textContent?.trim()===want;
   }),options,{timeout:9000}).catch(async()=>{
    const actual=await page.evaluate(items=>items.filter(({selector,key,want})=>[...document.querySelectorAll(selector+' option')].find(x=>x.value===key)?.textContent?.trim()!==want).map(x=>({...x,actual:[...document.querySelectorAll(x.selector+' option')].find(y=>y.value===x.key)?.textContent?.trim()})),options);
    throw Error(code+' option labels '+JSON.stringify(actual));
   });
   assert.equal(await page.locator('#foodMeal').inputValue(),'Breakfast','meal changed '+code);
   assert.equal(await page.locator('#foodCards .food-stall h4').first().textContent(),sourceName,'source stall changed '+code);
   assert.equal(await page.locator('#sgbFoodOriginalWarning .food-note').textContent(),originalWarning,'original warning changed');
   await page.evaluate(()=>{document.querySelector('#accountMessage').textContent='Enter your email and password.'});
   await page.waitForFunction(({want,en})=>{
    const actual=document.querySelector('#accountMessage')?.textContent?.trim();
    return actual===want||(document.documentElement.lang!=='en'&&actual&&actual!==en);
   },{want:v411Text(code,'Enter your email and password.'),en:'Enter your email and password.'},{timeout:8500});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'overflow '+code);
  }
  assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3,'offline packs lost');
  assert.ok(await page.locator('#sgbuddyEvents').count()>0,'events lost');
  assert.deepEqual(errors,[],JSON.stringify(errors));
  console.log('V4.11 PASS '+viewport.width+'px: 12 locales, 12 stable-value options, authored account errors, source and offline/events preserved.');
 }finally{await context.close()}
}
try{await run({width:390,height:844});await run({width:1366,height:900});}finally{await browser.close()}
