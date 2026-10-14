import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES,TRAVEL_UI} from '../lib/i18n-v280.mjs';
import {taxonomyLabel} from '../lib/i18n-content-taxonomy-v310.mjs';
import {factTranslation} from '../lib/i18n-facts-v310.mjs';
import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync('data/facts-published.json','utf8')).facts.find(f=>f.id==='FACT-00001');
assert.ok(source?.sourceUrl,'Missing canonical published fact');
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG'});
await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const textIs=(selector,expected)=>page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent?.trim()===expected,{selector,expected},{timeout:15000});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.17.0',{timeout:30000});
 const location=page.locator('#locationSheet');
 await location.waitFor({state:'visible',timeout:2500}).catch(()=>{});
 if(await location.isVisible())await page.locator('#notNowLocationButton').click();
 await page.locator('#navPlaces').click();
 await page.locator('#discoverTab-facts').click();
 await page.locator('#sgbFactList [data-fact-id="FACT-00001"] p').waitFor({state:'attached',timeout:12000});
 await page.locator('#appLibraryCategory option[value="Government & identity"]').waitFor({state:'attached',timeout:12000});
 await page.locator('#foodCuisine option[value="Chinese"]').waitFor({state:'attached',timeout:12000});
 const baseLink=await page.locator('#sgbFactList [data-fact-id="FACT-00001"] .sgb-fact-foot a').first().getAttribute('href');
 assert.equal(baseLink,source.sourceUrl);
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  const expected=factTranslation(code,source)||source.text;
  await textIs('#sgbFactList [data-fact-id="FACT-00001"] p',expected);
  await textIs('#appLibraryCategory option[value="Government & identity"]',taxonomyLabel(code,'Government & identity'));
  await textIs('#foodCuisine option[value="Chinese"]',taxonomyLabel(code,'Chinese'));
  await textIs('#sgbFactTopic option[value="Hawker heritage"]',taxonomyLabel(code,'Hawker heritage'));
  await textIs('#discoverResults .discover-fact p',expected);
  assert.equal(await page.locator('#appLibraryCategory option[value="Government & identity"]').getAttribute('value'),'Government & identity',code+' stable category filter');
  assert.equal(await page.locator('#sgbFactList [data-fact-id="FACT-00001"] .sgb-fact-foot a').first().getAttribute('href'),baseLink,'Original official-source link changed');
  if(code!=='en')assert.equal(await page.locator('#sgbFactList [data-fact-id="FACT-00001"] p').getAttribute('data-content-localized'),'true');
  const savedLabel=code==='en'?'Saved':code==='zh-CN'?'收藏':TRAVEL_UI[code].saved;
  await textIs('#navMoney span',savedLabel);
 }
 // Search using the translated topic, not just the original English vocabulary.
 await page.locator('#sgbLanguage').selectOption('fr');
 await textIs('#sgbFactTopic option[value="Hawker heritage"]',taxonomyLabel('fr','Hawker heritage'));
 await page.locator('#sgbFactQuery').fill(taxonomyLabel('fr','Hawker heritage'));
 await page.locator('#sgbFactList [data-fact-id="FACT-00001"]').waitFor({state:'attached',timeout:8000});
 await page.locator('#sgbFactQuery').fill('');
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.getElementById('appVersion')?.textContent==='v4.17.0');
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR');
 await page.locator('#navPlaces').click();
 await page.locator('#discoverTab-facts').click();
 await textIs('#sgbFactList [data-fact-id="FACT-00001"] p',factTranslation('pt-BR',source));
 const measure=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(measure.scroll<=measure.width+8,'Horizontal overflow '+JSON.stringify(measure));
 assert.deepEqual(errors,[],'Browser exceptions');
 console.log('V3.1 CHROMIUM PASS: 12 locale fact records, theme and cuisine/app categories, localized search, originals, persistence, Saved nav and mobile width.');
}finally{await browser.close()}
