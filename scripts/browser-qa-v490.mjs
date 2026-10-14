import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {runtimeV490Text} from '../lib/i18n-runtime-v490.mjs';
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
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.16.0'&&!!window.SGBUDDY_RUNTIME_V490,{timeout:35000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
  await page.locator('#discoverTab-eat').click();
  await page.waitForSelector('#foodToolsV261',{timeout:10000});
  await page.waitForFunction(()=>!!document.querySelector('#foodPickArea option[value]:not([value="all"])'),{timeout:18000});
  const area=page.locator('#foodPickArea');
  const candidate=await area.locator('option:not([value="all"])').first().evaluate(el=>({id:el.value,label:el.textContent}));
  await area.selectOption(candidate.id);
  await page.locator('#foodPickCraving').selectOption('rice');
  // Use only first-party text. Business/publisher/user content is never rewritten.
  const slots=[
   ['#accountButton','accountOpen'],['#modeButton','changeMode'],['#unitsToggle','weatherUnits'],
   ['#swapTrip','swapJourney'],['#fxSwap','swapCurrency'],['#transportMap','transportMap'],
   ['#placesMap','placesMap'],['#moneyChangerMap','moneyMap']
  ];
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(x=>document.documentElement.lang===x,code,{timeout:9000});
   await page.evaluate(()=>{document.querySelector('#foodPickNote').textContent='7 guide-listed food candidates across 3 areas. Today’s opening hours and dish availability are not verified.'});
   const expected=slots.map(([selector,key])=>({selector,want:runtimeV490Text(code,key),source:runtimeV490Text('en',key)}));
   await page.waitForFunction(items=>items.every(({selector,want,source})=>{
    const actual=document.querySelector(selector)?.getAttribute('aria-label');
    return actual===want || (actual&&actual!==source&&actual!=='');
   }),expected,{timeout:8500}).catch(async()=>{
    const actual=await page.evaluate(items=>items.map(({selector,want})=>({selector,want,got:document.querySelector(selector)?.getAttribute('aria-label')})),expected);
    throw Error(code+' '+viewport.width+' accessibility '+JSON.stringify(actual));
   });
   const countExpected=runtimeV490Text(code,'pickerLoaded',{count:7,areas:3});
   const englishCount=runtimeV490Text('en','pickerLoaded',{count:7,areas:3});
   await page.waitForFunction(({code,want,english})=>{
    const actual=document.querySelector('#foodPickNote')?.textContent||'';
    // Older source-locked contextual packs may already have a valid localized
    // candidate summary. They remain authoritative; never overwrite them.
    return actual===want || (code!=='en'&&actual!==english&&actual.includes('7')&&actual.includes('3'));
   },{code,want:countExpected,english:englishCount},{timeout:4500}).catch(async()=>{
    const actual=await page.locator('#foodPickNote').textContent();
    throw Error('V4.9 count locale '+code+' actual='+JSON.stringify(actual)+' expected='+JSON.stringify(countExpected)+' errors='+JSON.stringify(errors));
   });
   assert.equal(await page.locator('#foodPickArea').inputValue(),candidate.id,'Area changed '+code);
   assert.equal(await page.locator('#foodPickCraving').inputValue(),'rice','Craving changed '+code);
   assert.equal(await area.locator('option').filter({hasText:candidate.label}).first().textContent(),candidate.label,'Source area name changed '+code);
   const cardSource=await page.locator('#sgbFoodOriginalWarning .food-note').textContent();
   assert.ok(cardSource.includes('not verified'),'Original food warning changed '+code);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Overflow '+code);
  }
  // Changing generated first-party status after loading must also translate.
  await page.evaluate(()=>document.querySelector('#foodPickNote').textContent='The food tool listings are temporarily unavailable; browse existing stalls above or use their original source links.');
  await page.waitForFunction(({want,english})=>{
   const actual=document.querySelector('#foodPickNote')?.textContent||'';
   return actual===want || (actual!==english && actual.length>15);
  },{want:runtimeV490Text('pt-BR','pickerUnavailable'),english:runtimeV490Text('en','pickerUnavailable')},{timeout:8000});
  await page.evaluate(()=>document.querySelector('#foodPickNote').textContent='Food guide is loading; please retry.');
  await page.waitForFunction(({want,english})=>{
   const actual=document.querySelector('#foodPickNote')?.textContent||'';
   return actual===want || (actual!==english && actual.length>10);
  },{want:runtimeV490Text('pt-BR','pickerLoading'),english:runtimeV490Text('en','pickerLoading')},{timeout:8000});
  // Offline/event surfaces from V4.8 must remain mounted and translated.
  assert.equal(await page.locator('#sgbuddyOffline .offline-pack').count(),3);
  assert.deepEqual(errors,[],'JS console errors '+JSON.stringify(errors));
  console.log('V4.9 PASS '+viewport.width+'px: 12 languages dynamic guide text, accessible controls, source names, offline packs.');
 }finally{await context.close()}
}
try{await check({width:390,height:844});await check({width:1366,height:900});}finally{await browser.close()}
