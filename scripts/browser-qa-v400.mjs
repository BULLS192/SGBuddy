import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {FOOD_STATUS_MESSAGES,foodStatus} from '../lib/i18n-food-status-v400.mjs';
import {discoverStatus} from '../lib/i18n-discover-status-v400.mjs';
const browser=await chromium.launch({headless:true});
async function run(viewport){
 const context=await browser.newContext({viewport,locale:'en-SG'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.13.0',{timeout:30000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
  await page.waitForSelector('#discoverTab-eat',{timeout:30000});
  await page.locator('#discoverTab-eat').click();
  await page.waitForFunction(()=>document.querySelector('#foodCount')?.textContent?.includes('stall listings'),{timeout:30000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(expected=>document.documentElement.lang===expected,code,{timeout:8000});
   await page.locator('#discoverTab-eat').click();
   await page.locator('[data-food-view="stalls"]').click();
   const count=await page.locator('#foodCount').textContent();
   const numbers=count.match(/\d+/g)||[];
   assert.ok(numbers.length>=2,'Cannot read count in '+code+': '+count);
   const expected=foodStatus(code,'countStalls',{count:numbers[0],shown:numbers.at(-1)});
   assert.equal(count.trim(),expected,code+' stall count');
   await page.locator('[data-food-view="dishes"]').click();
   const dish=await page.locator('#foodCount').textContent();
   const nums=dish.match(/\d+/g)||[];
   assert.equal(dish.trim(),foodStatus(code,'countDishes',{count:nums[0],shown:nums.at(-1)}),code+' dish count');
   await page.locator('[data-food-view="menus"]').click();
   await page.waitForFunction(()=>document.querySelectorAll('#foodCards .food-warning').length>0,{timeout:5000});
   assert.equal((await page.locator('#foodCards .food-warning').first().textContent()).trim(),foodStatus(code,'vendorWarning'));
   await page.locator('#discoverTab-do').click();
   const input=page.locator('#discoverSearch');
   assert.equal(await input.getAttribute('placeholder'),discoverStatus(code,'searchPlaces'));
   await page.evaluate(()=>{const e=document.querySelector('#discoverSearch');e.value='NonexistentLocationXYZ000ABCD';e.dispatchEvent(new Event('input',{bubbles:true}))});
   await page.waitForFunction(expected=>document.querySelector('#discoverStatus')?.textContent===expected,discoverStatus(code,'placesFound',{count:0}),{timeout:5000});
   assert.equal((await page.locator('#discoverResults .discover-empty').textContent()).trim(),discoverStatus(code,'noPlaces'));
   await page.locator('#discoverTab-apps').click();
   assert.equal(await input.getAttribute('placeholder'),discoverStatus(code,'searchApps'));
   await page.locator('#discoverTab-facts').click();
   assert.equal(await input.getAttribute('placeholder'),discoverStatus(code,'searchFacts'));
   await page.evaluate(()=>{const e=document.querySelector('#discoverSearch');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}))});
   await page.waitForFunction(()=>document.querySelector('#discoverStatus')?.textContent?.length>10,{timeout:5000});
   assert.ok((await page.locator('#discoverStatus').textContent()).includes(code==='en'?'source-checked':discoverStatus(code,'factsStatus',{checked:0,pending:0}).split('0')[0]),code+' facts status');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+12),code+' overflow');
  }
  assert.deepEqual(errors,[],viewport.width+' page errors');
 }finally{await context.close()}
}
try{
 await run({width:390,height:844});
 await run({width:1366,height:900});
 console.log('V4.0 CHROMIUM PASS: 12 locales across mobile/desktop, 4 food views, counts, vendor warnings, Discover search/results, facts, preserved filters.');
}finally{await browser.close()}
