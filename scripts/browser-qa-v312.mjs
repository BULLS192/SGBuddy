import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {appContentTranslation} from '../lib/i18n-app-content-v312.mjs';
import {factTranslation} from '../lib/i18n-facts-v310.mjs';
const apps=JSON.parse(readFileSync('data/everyday-apps-v240.json','utf8')).catalogue;
const facts=JSON.parse(readFileSync('data/facts-published.json','utf8')).facts;
const app=apps.find(x=>x.id==='V24-APP-001'),water=facts.find(x=>x.id==='FACT-WAT-001');
assert.ok(app&&water);
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG'});
await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const textIs=(selector,expected)=>page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent?.trim()===expected,{selector,expected},{timeout:15000});
try {
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.16.0',{timeout:30000});
 const location=page.locator('#locationSheet');await location.waitFor({state:'visible',timeout:2400}).catch(()=>{});
 if(await location.isVisible())await page.locator('#notNowLocationButton').click();
 await page.locator('#navPlaces').click();
 await page.locator('#discoverTab-facts').click();
 await page.locator('#sgbFactQuery').fill('NEWater');
 await page.locator('#sgbFactList [data-fact-id="FACT-WAT-001"]').waitFor({state:'attached',timeout:18000});
 const origLink=await page.locator('#sgbFactList [data-fact-id="FACT-WAT-001"] a').first().getAttribute('href');
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await textIs('#sgbFactList [data-fact-id="FACT-WAT-001"] p',factTranslation(code,water)||water.text);
  assert.equal(await page.locator('#sgbFactList [data-fact-id="FACT-WAT-001"] a').first().getAttribute('href'),origLink);
 }
 await page.locator('#sgbFactQuery').fill('');
 await page.locator('#discoverTab-apps').click();
 await page.locator('[data-app-view="all"]').click();
 await page.locator('#appLibrarySearch').fill('Singpass');
 await page.locator('#appLibraryCards [data-app-id="V24-APP-001"]').waitFor({state:'attached',timeout:15000});
 const link=await page.locator('#appLibraryCards [data-app-id="V24-APP-001"] .app-guide-links a').first().getAttribute('href');
 assert.equal(link,app.sourceUrl);
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  const expectedSummary=appContentTranslation(code,app,'summary')||app.summary;
  const expectedPurpose=appContentTranslation(code,app,'purpose')||app.purpose;
  await textIs('#appLibraryCards [data-app-id="V24-APP-001"] .app-guide-description',expectedSummary);
  await page.waitForFunction(expected=>document.querySelector('#appLibraryCards [data-app-id="V24-APP-001"] .app-guide-purpose')?.textContent?.trim().endsWith(expected),expectedPurpose,{timeout:15000});
  assert.ok((await page.locator('#appLibraryCards [data-app-id="V24-APP-001"] .app-guide-prereq').textContent()).includes(app.accountNeeded),'Eligibility source changed: '+code);
  assert.equal(await page.locator('#appLibraryCards [data-app-id="V24-APP-001"] .app-guide-links a').first().getAttribute('href'),link,'Publisher URL changed');
  if(code!=='en')assert.equal(await page.locator('#appLibraryCards [data-app-id="V24-APP-001"] .app-guide-description').getAttribute('data-content-localized'),'true',code+' needs reviewed marker');
 }
 await page.locator('#sgbLanguage').selectOption('fr');
 await page.locator('#appLibrarySearch').fill(appContentTranslation('fr',app,'summary'));
 await page.locator('#appLibraryCards [data-app-id="V24-APP-001"]').waitFor({state:'attached',timeout:12000});
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.16.0',{timeout:30000});
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+8),true,'Mobile viewport overflow');
 assert.deepEqual(errors,[],'Unexpected page errors');
 console.log('V3.1-C CHROMIUM PASS: 12 locales, NEWater fact, Singpass summary and purpose, eligibility preserved, official links unchanged and multilingual app search.');
} finally {await browser.close()}
