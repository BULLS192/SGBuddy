import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {factTranslation} from '../lib/i18n-facts-v310.mjs';
import {appContentTranslation} from '../lib/i18n-app-content-v312.mjs';
const facts=JSON.parse(readFileSync('data/facts-published.json','utf8')).facts;
const apps=JSON.parse(readFileSync('data/everyday-apps-v240.json','utf8')).catalogue;
const fact=facts.find(x=>x.id==='FACT-V21-022');
const app=apps.find(x=>x.id==='V24-WEB-004');
assert.ok(fact?.sourceUrl&&app?.sourceUrl);
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG'});
await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const waitValue=(selector,expected)=>page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent?.trim()===expected,{selector,expected},{timeout:15000});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.1.0',{timeout:30000});
 const location=page.locator('#locationSheet');await location.waitFor({state:'visible',timeout:2000}).catch(()=>{});
 if(await location.isVisible())await page.locator('#notNowLocationButton').click();
 await page.locator('#navPlaces').click();
 await page.locator('#discoverTab-facts').click();
 await page.locator('#sgbFactQuery').fill('SAFE-grade');
 await page.locator('#sgbFactList [data-fact-id="FACT-V21-022"]').waitFor({state:'attached',timeout:12000});
 const factUrl=await page.locator('#sgbFactList [data-fact-id="FACT-V21-022"] a').first().getAttribute('href');
 assert.equal(factUrl,fact.sourceUrl);
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await waitValue('#sgbFactList [data-fact-id="FACT-V21-022"] p',factTranslation(code,fact)||fact.text);
  assert.equal(await page.locator('#sgbFactList [data-fact-id="FACT-V21-022"] a').first().getAttribute('href'),factUrl,'Official source changed: '+code);
 }
 await page.locator('#sgbFactQuery').fill('');
 await page.locator('#discoverTab-apps').click();
 await page.locator('[data-app-view="all"]').click();
 await page.locator('#appLibrarySearch').fill(app.name);
 await page.locator('[data-app-id="V24-WEB-004"]').waitFor({state:'attached',timeout:15000});
 const appUrl=await page.locator('[data-app-id="V24-WEB-004"] .app-guide-links a').first().getAttribute('href');
 assert.equal(appUrl,app.sourceUrl);
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  const expected=appContentTranslation(code,app,'summary')||app.summary;
  await waitValue('[data-app-id="V24-WEB-004"] .app-guide-description',expected);
  const purpose=appContentTranslation(code,app,'purpose')||app.purpose;
  await page.waitForFunction(p=>document.querySelector('[data-app-id="V24-WEB-004"] .app-guide-purpose')?.textContent?.trim().endsWith(p),purpose,{timeout:15000});
  assert.equal(await page.locator('[data-app-id="V24-WEB-004"] .app-guide-links a').first().getAttribute('href'),appUrl,'Official app URL changed: '+code);
  assert.ok((await page.locator('[data-app-id="V24-WEB-004"] .app-guide-prereq').textContent()).includes(app.accountNeeded),'Eligibility source changed '+code);
 }
 await page.locator('#sgbLanguage').selectOption('fr');
 await page.locator('#appLibrarySearch').fill(appContentTranslation('fr',app,'summary'));
 await page.locator('[data-app-id="V24-WEB-004"]').waitFor({state:'attached',timeout:10000});
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.1.0',{timeout:30000});
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+8),true,'390px mobile viewport overflow');
 assert.deepEqual(errors,[],'Unexpected browser errors');
 console.log('V3.1 FINAL CHROMIUM PASS: 12-language last-source factual record, final app, source URLs, eligibility, translated search and mobile reloading.');
}finally{await browser.close()}
