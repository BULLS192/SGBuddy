import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {DISCOVER_KIND_V4100,kindText,controlText} from '../lib/i18n-categories-v4100.mjs';
const browser=await chromium.launch({headless:true});
async function check(viewport){
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
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.21.0'&&!!window.SGBUDDY_V4100,{timeout:35000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
  await page.locator('#discoverTab-eat').click();
  await page.waitForFunction(()=>document.querySelector('#discoverCategoryFilter option[value="CHAS clinic"]'),{timeout:20000});
  await page.waitForSelector('#foodAwardYear option[value="editorial"]',{state:'attached',timeout:12000});
  // Identical machine value must survive locale switches, including rare kinds.
  const selection='CHAS clinic';
  await page.locator('#discoverCategoryFilter').selectOption(selection);
  const selectors=[
   ['#accountSheet .install-sheet-card > .label','accountBadge','text'],
   ['#dataCorePanel .developer-data > summary','developerEndpoints','text'],
   ['#dataCorePanel [data-endpoint="/api/snapshot"] > span','unifiedContext','text'],
   ['#dataCorePanel [data-endpoint="/api/health"] > span','systemHealth','text'],
   ['#passwordResetPanel .account-field','accountNewPassword','text'],
   ['#newPasswordInput','accountResetPlaceholder','placeholder'],
   ['#foodExplorer .food-view-tabs','foodViewAria','aria-label'],
   ['#foodSearch','foodSearchAria','aria-label'],
   ['#foodArea','foodAreaAria','aria-label'],
   ['#foodCuisine','foodCuisineAria','aria-label'],
   ['#foodMeal','foodMealAria','aria-label'],
   ['#foodDish','foodDishAria','aria-label'],
   ['#foodAwardYear','foodAwardAria','aria-label'],
   ['#foodAwardYear option[value="all"]','allEvidenceYears','text'],
   ['#foodAwardYear option[value="editorial"]','editorialLeads','text']
  ];
  const originalMuis=await page.locator('#sgbFoodOriginalWarning .food-note').textContent();
  const stallName=await page.locator('#foodCards .food-stall h4').first().textContent().catch(()=>null);
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(locale=>document.documentElement.lang===locale,code,{timeout:9000});
   const kinds=DISCOVER_KIND_V4100.map(source=>({source,want:kindText(code,source)}));
   await page.waitForFunction(items=>items.every(({source,want})=>{
    const opt=[...document.querySelectorAll('#discoverCategoryFilter option')].find(el=>el.value===source);
    return opt&&opt.textContent.trim()===want;
   }),kinds,{timeout:10000}).catch(async()=>{
    const missing=await page.evaluate(items=>items.filter(({source,want})=>{
     const opt=[...document.querySelectorAll('#discoverCategoryFilter option')].find(el=>el.value===source);
     return !opt||opt.textContent.trim()!==want;
    }).map(x=>({...x,got:[...document.querySelectorAll('#discoverCategoryFilter option')].find(el=>el.value===x.source)?.textContent})),kinds);
    throw Error(code+' category options '+JSON.stringify(missing));
   });
   const expected=selectors.map(([selector,key,mode])=>({selector,want:controlText(code,key),en:controlText('en',key),mode}));
   await page.waitForFunction(items=>items.every(({selector,want,en,mode})=>{
    const e=document.querySelector(selector);
    const value=mode==='aria-label'?e?.getAttribute('aria-label'):mode==='placeholder'?e?.getAttribute('placeholder'):e?.textContent;
    const actual=value?.trim();
    return actual===want || (!!actual&&actual!==en&&document.documentElement.lang!=='en');
   }),expected,{timeout:9000}).catch(async()=>{
    const mismatch=await page.evaluate(items=>items.filter(({selector,want,en,mode})=>{
     const e=document.querySelector(selector);
     const value=mode==='aria-label'?e?.getAttribute('aria-label'):mode==='placeholder'?e?.getAttribute('placeholder'):e?.textContent;
     return value?.trim()!==want && !(document.documentElement.lang!=='en'&&value?.trim()&&value.trim()!==en);
    }).map(x=>({...x,got:x.mode==='aria-label'?document.querySelector(x.selector)?.getAttribute('aria-label'):document.querySelector(x.selector)?.textContent?.trim()})),expected);
    throw Error(code+' Account/Food: '+JSON.stringify(mismatch));
   });
   assert.equal(await page.locator('#discoverCategoryFilter').inputValue(),selection,code+' changed filter machine value');
   assert.equal(await page.locator('#discoverCategoryFilter option[value="CHAS clinic"]').getAttribute('value'),selection);
   assert.equal(await page.locator('#sgbFoodOriginalWarning .food-note').textContent(),originalMuis,'MUIS source warning changed');
   if(stallName)assert.equal(await page.locator('#foodCards .food-stall h4').first().textContent(),stallName,'stall name changed');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+12),code+' overflow');
  }
  // Offline and event UI must remain available on this shared branch.
  assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3);
  assert.ok(await page.locator('#sgbuddyEvents').count()>=1,'event panel missing');
  assert.deepEqual(errors,[],'unexpected page errors');
  console.log('V4.10 PASS '+viewport.width+'px: 12 locales, 15 stable-value categories, 15 Account/Food controls, offline/events preserved.');
 }finally{await context.close()}
}
try{await check({width:390,height:844});await check({width:1366,height:900});}finally{await browser.close()}
