import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {dishTranslation} from '../lib/i18n-dishes-v311.mjs';
import {factTranslation} from '../lib/i18n-facts-v310.mjs';
import {stallNoteTranslation} from '../lib/i18n-stall-notes-v311.mjs';
const dishes=JSON.parse(readFileSync('data/singapore-dishes-v180.json','utf8')).dishes;
const facts=JSON.parse(readFileSync('data/facts-published.json','utf8')).facts;
const stalls=JSON.parse(readFileSync('data/food-stalls-v180.json','utf8')).stalls;
const historic=stalls.find(x=>x.id==='STL-0079');
const chicken=dishes.find(x=>x.id==='DISH-0001'),generic=dishes.find(x=>x.id==='DISH-0004');
const nature=facts.find(x=>x.id==='FACT-NAT-011');
assert.ok(chicken&&generic&&nature);
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG'});
await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const textIs=(selector,expected)=>page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent?.trim()===expected,{selector,expected},{timeout:16000});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v3.5.0',{timeout:30000});
 const prompt=page.locator('#locationSheet');await prompt.waitFor({state:'visible',timeout:2500}).catch(()=>{});
 if(await prompt.isVisible())await page.locator('#notNowLocationButton').click();
 await page.locator('#navPlaces').click();
 await page.locator('#discoverTab-facts').click();
 await page.locator('#sgbFactQuery').fill('Kranji Mangrove');
 await page.locator('#sgbFactList [data-fact-id="FACT-NAT-011"]').waitFor({state:'attached',timeout:16000});
 const sourceLink=await page.locator('#sgbFactList [data-fact-id="FACT-NAT-011"] a').first().getAttribute('href');
 assert.equal(sourceLink,nature.sourceUrl);
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await textIs('#sgbFactList [data-fact-id="FACT-NAT-011"] p',factTranslation(code,nature)||nature.text);
  assert.equal(await page.locator('#sgbFactList [data-fact-id="FACT-NAT-011"] a').first().getAttribute('href'),sourceLink,'Source mutated: '+code);
 }
 await page.locator('#sgbFactQuery').fill('');
 await page.locator('#discoverTab-eat').click();
 await page.locator('[data-food-view="dishes"]').click();
 await page.locator('#foodCards .food-stall').first().waitFor({state:'attached',timeout:15000});
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await textIs('#foodCards .food-stall:first-child > p:first-of-type',dishTranslation(code,chicken)||chicken.description);
  if(code!=='en')assert.equal(await page.locator('#foodCards .food-stall:first-child > p:first-of-type').getAttribute('data-content-localized'),'true',code+' translated source marker missing');
 }
 await page.locator('#sgbLanguage').selectOption('fr');
 const searchPhrase=dishTranslation('fr',chicken);
 await page.locator('#foodSearch').fill(searchPhrase);
 await textIs('#foodCards .food-stall:first-child h4',chicken.name);
 assert.ok((await page.locator('#foodCount').textContent()).startsWith('1 '),'French dish-description search must match');
 await page.locator('#foodSearch').fill('');
 const genericSource=dishTranslation('fr',generic);
 await page.locator('#foodSearch').fill(genericSource);
 assert.ok((await page.locator('#foodCards .food-stall').count())>=5,'Generic food-culture term translated search should find multiple dishes');
 await page.locator('#foodSearch').fill('');
 // Historical award notes must state that today's trading, menu, address and halal status are unverified.
 await page.locator('[data-food-view="stalls"]').click();
 await page.locator('#foodSearch').fill(historic.name);
 await page.locator('[data-stall-id="STL-0079"]').waitFor({state:'attached',timeout:15000});
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await textIs('#foodCards [data-stall-id="STL-0079"] .food-warning',stallNoteTranslation(code,historic)||'NEA documented in 2022; current trading unverified · Prices and dietary certification unknown');
  if(code!=='en')assert.equal(await page.locator('#foodCards [data-stall-id="STL-0079"] .food-warning').getAttribute('data-content-localized'),'true');
 }
 await page.locator('#foodSearch').fill('');
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.getElementById('appVersion')?.textContent==='v3.5.0');
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR');
 const sizes=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(sizes.scroll<=sizes.width+8,'Mobile overflow '+JSON.stringify(sizes));
 assert.deepEqual(errors,[],'Unexpected page errors');
 console.log('V3.1-B CHROMIUM PASS: all 12 languages, new nature facts, 82 dish descriptions, 93 historic stall safety notes, source URLs and localized search.');
}finally{await browser.close()}
