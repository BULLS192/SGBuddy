import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES,TRAVEL_UI} from '../lib/i18n-v280.mjs';
import {extendedUi} from '../lib/i18n-extended-v300.mjs';
import {explainer} from '../lib/i18n-explainers-v300.mjs';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG'});
await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const awaitText=(selector,expected)=>page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent?.trim()===expected,{selector,expected},{timeout:14000});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.getElementById('appVersion')?.textContent==='v4.13.0',{timeout:30000});
 const location=page.locator('#locationSheet');await location.waitFor({state:'visible',timeout:2200}).catch(()=>{});
 if(await location.isVisible())await page.locator('#notNowLocationButton').click();
 await page.locator('#navPlaces').click();
 await page.locator('#foodExplorer').waitFor({state:'attached'});
 await page.locator('#sgbFoodLocalizedWarning').waitFor({state:'attached'});
 const original=await page.locator('#sgbFoodOriginalWarning .food-note').textContent();
 assert.ok(original.includes('not verified'),'Original food safety warning preserved');
 assert.ok(await page.locator('#sgbFoodLocalizedWarning a[href^="https://halal.muis.gov.sg/"]').count()===1,'MUIS source preserved');
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  const tr=extendedUi(code);
  await awaitText('#buddyLauncher > span:last-child',tr.askMerli);
  await awaitText('#foodExplorer > h3',tr.foodTitle);
  await awaitText('#foodToolsTitle',tr.foodToolsTitle);
  await awaitText('#merliKnowledgeLibrary > h3',explainer(code,'knowledgeTitle'));
  await awaitText('#merliKnowledgeLibrary > p',explainer(code,'knowledgeIntro'));
  assert.equal((await page.locator('#foodSearch').getAttribute('placeholder')),tr.foodSearch,code+' Food search');
  assert.equal((await page.locator('#sgbFactQuery').getAttribute('placeholder')),explainer(code,'factSearch'),code+' facts search');
  assert.equal(await page.locator('html').getAttribute('lang'),code);
  const savedLabel=code==='en'?'Saved':code==='zh-CN'?'收藏':TRAVEL_UI[code].saved;
  assert.equal((await page.locator('#navMoney span').textContent()).trim(),savedLabel,code+' Saved should not be Money');
  if(code!=='en'){
   assert.equal((await page.locator('#sgbFoodLocalizedWarning').textContent()).includes(explainer(code,'foodNote')),true,code+' translated MUIS caution');
   assert.equal(await page.locator('#sgbFoodOriginalWarning').getAttribute('hidden'),null,'Original must be accessible');
  }
 }
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.getElementById('appVersion')?.textContent==='v4.13.0',{timeout:30000});
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR');
 await awaitText('#buddyLauncher > span:last-child',extendedUi('pt-BR').askMerli);
 const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(metrics.scroll<=metrics.width+8,'Mobile horizontal overflow '+JSON.stringify(metrics));
 assert.ok(!errors.length,'Client browser errors: '+errors.join(' | '));
 console.log('SGBuddy V3 CHROMIUM PASS: 12 locales, Merli, knowledge, food safety and MUIS source, language persistence, Saved/Money, 390px mobile.');
}finally{await browser.close()}
