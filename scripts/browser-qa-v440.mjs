import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {priorityText} from '../lib/i18n-priority-v440.mjs';
const browser=await chromium.launch({headless:true});
const check=async viewport=>{
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
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.18.0'&&!!window.SGBUDDY_PRIORITY_V440,{timeout:35000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
  await page.locator('#discoverTab-eat').click();
  await page.locator('[data-food-view="stalls"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('#foodCards .food-stall').length>0,{timeout:16000});
  const original=await page.locator('#foodCards .food-stall h4').first().textContent();
  const originalWarning=await page.locator('#sgbFoodOriginalWarning .food-note').textContent();
  const selectors=[
   ['#discoverHub .discover-intro > .label','discoverEyebrow','text'],
   ['#discoverHub .discover-tabs','discoverCategories','aria-label'],
   ['#discoverQuality summary','discoverAbout','text'],
   ['#accountSheetTitle','accountTitle','text'],
   ['#accountSheet .account-intro','accountIntro','text'],
   ['#forgotPasswordButton','accountForgot','text'],
   ['#accountSignedOut > .account-note','accountNewNote','text'],
   ['#accountSignedIn > .account-note','accountOffline','text'],
   ['#accountHubTitle','accountHubHeading','text'],
   ['#dataCorePanel .data-core-head h3','accountDataTitle','text'],
   ['#dataCorePanel .data-core-grid > div:nth-child(1) > span','accountLta','text'],
   ['#dataCorePanel .data-core-grid > div:nth-child(2) > span','accountRail','text'],
   ['#dataCorePanel .data-core-grid > div:nth-child(3) > span','accountWeather','text'],
   ['#dataCorePanel .data-core-grid > div:nth-child(4) > span','accountPrivate','text'],
   ['#dataCoreRefresh','accountRefresh','text'],
   ['#dataCoreDiagnostics','accountDiagnostics','text'],
   ['#uxSavedView .ux-saved-header h2','savedTitle','text'],
   ['#uxSavedView .ux-saved-header p','savedIntro','text'],
   ['#uxSavedView > section.card:nth-of-type(2) > h3','savedTransport','text'],
   ['#foodExplorer > .label','foodLibrary','text'],
   ['#foodExplorer label.food-saved','foodSavedOnly','text'],
   ['#foodLoadMore','foodMore','text'],
   ['#tripIntelligence .trip-intelligence-head .label','todayTrip','text'],
   ['#personaFocus .persona-focus-head .label','todayForYou','text']
  ];
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(expected=>document.documentElement.lang===expected,code,{timeout:9000});
   const expected=selectors.map(([selector,key,attribute])=>({selector,attribute,value:priorityText(code,key),english:priorityText('en',key),locale:code}));
   await page.waitForFunction(items=>items.every(({selector,attribute,value,english,locale})=>{
    const el=document.querySelector(selector);
    const actual=attribute==='aria-label'?el?.getAttribute('aria-label'):el?.textContent;
    return actual?.trim()===value || (locale!=='en'&&!!actual?.trim()&&actual.trim()!==english&&actual.trim()!=='SINGAPORE DISCOVER');
   }),expected,{timeout:10000}).catch(async e=>{
    const bad=await page.evaluate(items=>items.filter(({selector,attribute,value,english,locale})=>{
     const el=document.querySelector(selector);
     const actual=attribute==='aria-label'?el?.getAttribute('aria-label'):el?.textContent;
     return !(actual?.trim()===value || (locale!=='en'&&!!actual?.trim()&&actual.trim()!==english&&actual.trim()!=='SINGAPORE DISCOVER'));
    }).map(x=>({...x,actual:x.attribute==='aria-label'?document.querySelector(x.selector)?.getAttribute('aria-label'):document.querySelector(x.selector)?.textContent?.trim()})),expected);
    throw Error(code+' '+viewport.width+' failed source-locked labels: '+JSON.stringify(bad));
   });
   const card=page.locator('#foodCards .food-stall').first();
   {const actual=(await card.locator('[data-stall-save]').textContent()).trim();assert.ok(actual===priorityText(code,'foodSave')||(code!=='en'&&actual!=='☆ Save'),'Food save untranslated '+code+': '+actual);}
   {const actual=(await card.locator('.food-card-actions a').first().textContent()).trim();assert.ok(actual===priorityText(code,'foodSearch')||(code!=='en'&&actual!=='Search location ↗'),'Food maps untranslated '+code+': '+actual);}
   assert.equal(await card.locator('h4').textContent(),original,'Source stall identity overwritten '+code);
   assert.equal(await page.locator('#sgbFoodOriginalWarning .food-note').textContent(),originalWarning,'English source warning overwritten');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Horizontal overflow '+code+' '+viewport.width);
  }
  assert.deepEqual(errors,[],'Runtime browser errors '+JSON.stringify(errors));
  console.log('V4.4 PASS: '+viewport.width+'px 12 locales × 24 first-party controls; sourced food and English-original warning preserved.');
 }finally{await context.close()}
};
try{await check({width:390,height:844});await check({width:1366,height:900});}finally{await browser.close()}
