import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {merliMessage} from '../lib/i18n-merli-replies-v315.mjs';
import {appStatus} from '../lib/i18n-app-status-v315.mjs';
import {serviceNote} from '../lib/i18n-service-safety-v315.mjs';
const apps=JSON.parse(readFileSync('data/everyday-apps-v240.json','utf8')).catalogue;
const myIca=apps.find(x=>x.id==='V24-APP-004');
assert.ok(myIca);
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG'});
await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const expected=(selector,value)=>page.waitForFunction(({selector,value})=>document.querySelector(selector)?.textContent?.trim()===value,{selector,value},{timeout:15000});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.22.0',{timeout:30000});
 const location=page.locator('#locationSheet');await location.waitFor({state:'visible',timeout:2300}).catch(()=>{});
 if(await location.isVisible())await page.locator('#notNowLocationButton').click();
 await page.locator('[data-buddy-action="saved"]').evaluate(button=>button.click());
 await expected('#buddyReply',merliMessage('en','savedFacts'));
 await page.locator('#navPlaces').click();
 await page.locator('#discoverTab-apps').click();
 await page.locator('[data-app-view="all"]').click();
 await page.locator('#appLibrarySearch').fill('MyICA');
 await page.locator('#appLibraryCards [data-app-id="V24-APP-004"]').waitFor({state:'attached',timeout:12000});
 const selector='#appLibraryCards [data-app-id="V24-APP-004"]';
 const original=await page.locator(selector+' .app-guide-links a').first().getAttribute('href');
 assert.equal(original,myIca.sourceUrl,'Official source link changed');
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  await expected('#buddyReply',merliMessage(code,'savedFacts'));
  await page.waitForFunction(({code})=>document.querySelector('#sgbLanguage')?.value===code,{code},{timeout:5000});
  const note=serviceNote(code,myIca,'notes')||myIca.notes;
  const req=serviceNote(code,myIca,'accountNeeded')||myIca.accountNeeded;
  await expected(selector+' .app-guide-note',note);
  const prereq=await page.locator(selector+' .app-guide-prereq').textContent();
  assert.ok(prereq.includes(req),code+' missing requirement');
  if(code!=='en'){
   assert.equal(await page.locator(selector+' .app-guide-prereq details p').textContent(),myIca.accountNeeded,code+' original eligibility not accessible');
   assert.equal(await page.locator(selector+' .app-guide-english-original p[lang="en"]').first().textContent(),myIca.accountNeeded,code+' original English must be preserved');
   assert.equal(await page.locator(selector+' .app-guide-note').getAttribute('data-content-localized'),'true',code+' source-aware note marker');
  }
  assert.equal(await page.locator(selector+' .app-guide-links a').first().getAttribute('href'),original,code+' publisher URL mutation');
  const status=(await page.locator('#appLibraryCount').textContent()).trim();
  const lead=appStatus(code,'count',{matched:1,mobile:0,web:0,saved:0}).split(' · ')[0];
  assert.ok(status.includes(lead),code+' dynamic result count not translated: '+status+' / '+lead);
 }
 await page.locator('#sgbLanguage').selectOption('fr');
 await page.locator('#appLibrarySearch').fill('NotAnActualService123');
 await expected('#appLibraryCards .app-guide-empty',appStatus('fr','empty'));
 await page.locator('#appLibrarySearch').fill('MyICA');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.22.0',{timeout:30000});
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'fr','Language must persist');
 const size=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(size.scroll<=size.inner+8,'Mobile horizontal overflow '+JSON.stringify(size));
 assert.deepEqual(errors,[],'Browser exceptions');
 console.log('V3.1 APP MESSAGES CHROMIUM PASS: 12 Merli reactive replies and app status languages, safe source-locked ICA prerequisites, original English disclosure, publisher link and mobile layout.');
}finally{await browser.close()}
