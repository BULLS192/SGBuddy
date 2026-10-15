import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {foodDiscoverText} from '../lib/i18n-food-discover-v450.mjs';
const browser=await chromium.launch({headless:true});
async function check(viewport){
 const context=await browser.newContext({viewport,locale:'en-SG',serviceWorkers:'block'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.20.0'&&!!window.SGBUDDY_FOOD_DISCOVER_V450,{timeout:35000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
  await page.locator('#discoverTab-eat').click();
  await page.waitForSelector('#foodToolsV261',{timeout:15000});
  await page.locator('[data-food-view="stalls"]').click();
  await page.waitForSelector('#foodCards .food-stall h4',{timeout:15000});
  const stall=await page.locator('#foodCards .food-stall h4').first().textContent();
  const originalWarning=await page.locator('#sgbFoodOriginalWarning .food-note').textContent();
  const area=page.locator('#foodPickArea'),craving=page.locator('#foodPickCraving');
  // Select a real area without inventing or translating its source-owned name.
  const opts=await area.locator('option').evaluateAll(nodes=>nodes.map(x=>({value:x.value,label:x.textContent})));
  const selectedArea=opts.find(x=>x.value!=='all');
  if(selectedArea)await area.selectOption(selectedArea.value);
  await craving.selectOption('rice');
  const cases=[
   ['#foodToolsV261 .food-tools-heading .label','makanHeading','text'],
   ['#foodToolsSubtitle','makanSubtitle','text'],
   ['#foodToolPickerPanel .food-tool-filters > label:nth-child(1)','makanArea','directText'],
   ['#foodToolPickerPanel .food-tool-filters > label:nth-child(2)','makanCraving','directText'],
   ['#foodToolsV261','makanRegionAria','aria-label'],
   ['#foodToolsV261 .food-tools-nav','makanToolsAria','aria-label'],
   ['#foodToolServicesPanel > p.food-tool-note','makanServicesIntro','text'],
   ['#discoverSearch','discoverSearchAria','aria-label'],
   ['#discoverAreaFilter','discoverAreaAria','aria-label'],
   ['#discoverSourceFilter','discoverSourceAria','aria-label'],
   ['#discoverNeighbourhoodFilter','discoverNeighbourhoodAria','aria-label'],
   ['#discoverCategoryFilter','discoverCategoryAria','aria-label'],
   ['#discoverQuality','discoverQualityAria','aria-label'],
   ['#discoverQuality > p:first-of-type','discoverQualityCaution','text']
  ];
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(code=>document.documentElement.lang===code,code,{timeout:9000});
   const expected=cases.map(([selector,key,mode])=>({selector,key,mode,want:foodDiscoverText(code,key)}));
   await page.waitForFunction(list=>list.every(({selector,mode,want})=>{
    const e=document.querySelector(selector);
    if(!e)return false;
    const text=mode==='aria-label'?e.getAttribute('aria-label'):mode==='directText'?[...e.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())?.textContent:e.textContent;
    return text?.trim()===want;
   }),expected,{timeout:11000}).catch(async err=>{
    const diffs=await page.evaluate(list=>list.filter(({selector,mode,want})=>{
     const e=document.querySelector(selector);
     const text=mode==='aria-label'?e?.getAttribute('aria-label'):mode==='directText'?[...(e?.childNodes||[])].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())?.textContent:e?.textContent;
     return text?.trim()!==want;
    }).map(({selector,mode,want})=>({selector,mode,want,actual:mode==='aria-label'?document.querySelector(selector)?.getAttribute('aria-label'):document.querySelector(selector)?.textContent?.trim().slice(0,180)})),expected);
    throw Error(code+' '+viewport.width+'px untranslated: '+JSON.stringify(diffs));
   });
   assert.equal(await craving.inputValue(),'rice',code+' craving changed on language switch');
   if(selectedArea){
    assert.equal(await area.inputValue(),selectedArea.value,code+' area selection changed');
    assert.equal(await area.locator('option[value="'+selectedArea.value+'"]').textContent(),selectedArea.label,code+' source-owned area changed');
   }
   assert.equal(await page.locator('#foodCards .food-stall h4').first().textContent(),stall,code+' source-owned stall changed');
   assert.equal(await page.locator('#sgbFoodOriginalWarning .food-note').textContent(),originalWarning,code+' MUIS English-original changed');
   assert.equal(await page.locator('#discoverQuality > p:first-of-type').getAttribute('data-source-english'),foodDiscoverText('en','discoverQualityCaution'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),code+' horizontal overflow');
  }
  // Verify the same accessible labels remain localized after switching discovery tabs.
  await page.locator('#discoverTab-do').click();
  assert.equal(await page.locator('#discoverSearch').getAttribute('aria-label'),foodDiscoverText('pt-BR','discoverSearchAria'));
  assert.deepEqual(errors,[],viewport.width+'px client errors '+JSON.stringify(errors));
  console.log('V4.5 CHROMIUM PASS '+viewport.width+'px: 12 locales, 14 scoped UI slots, persistent area/craving, protected MUIS and stall identities, Discover re-render.');
 }finally{await context.close()}
}
try{await check({width:390,height:844});await check({width:1366,height:900});}finally{await browser.close()}
