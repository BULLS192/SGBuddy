import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {directoryText} from '../lib/i18n-directory-v410.mjs';

const browser=await chromium.launch({headless:true});
async function check(viewport){
 const context=await browser.newContext({viewport,locale:'en-SG'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.19.0',{timeout:30000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
  await page.waitForSelector('#discoverTab-do',{timeout:30000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(expected=>document.documentElement.lang===expected,code,{timeout:8000});
   await page.locator('#discoverTab-do').click();
   const item=page.locator('#discoverResults .discover-item').first();
   await item.waitFor({timeout:15000});
   const id=await item.locator('[data-save-discover]').getAttribute('data-save-discover');
   const name=await page.evaluate(id=>window.SGBUDDY_DISCOVER_PLACES.find(x=>x.id===id)?.name,id);
   assert.ok(name,'Directory source identity unavailable: '+code);
   assert.equal(await item.locator('[data-save-discover]').getAttribute('aria-label'),directoryText(code,'saveAria',{name}),code+' accessible save label');
   assert.equal(await item.locator('[data-trip-add-place]').textContent(),directoryText(code,'addTrip'),code+' trip action');
   await item.locator('[data-save-discover]').click();
   const updated=page.locator('#discoverResults .discover-item').first();
   assert.equal(await updated.locator('[data-save-discover]').getAttribute('aria-label'),directoryText(code,'removeAria',{name}),code+' remove label');
   await updated.locator('[data-save-discover]').click();
   const freshness=await updated.locator('.discover-freshness').textContent();
   assert.ok(freshness.trim(),'Directory freshness state missing '+code);
   await page.locator('#discoverTab-apps').click();
   const appCard=page.locator('#discoverResults .discover-item').first();
   await appCard.waitFor({state:'attached',timeout:10000});
   assert.equal(await appCard.locator('.discover-app-legacy-note').textContent(),directoryText(code,'publisherDownload'),code+' publisher warning');
   await page.locator('#discoverTab-facts').click();
   const facts=page.locator('#discoverResults .discover-fact');
   if(await facts.count()){
    assert.equal(await facts.first().locator('h3').textContent(),directoryText(code,'didYouKnow'),code+' facts title');
    assert.ok((await facts.first().locator('[data-next-discover-fact]').textContent()).includes(directoryText(code,'anotherFact')),code+' next fact');
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+12),code+' horizontal overflow');
  }
  assert.deepEqual(errors,[],'Unexpected page error on '+viewport.width+'px');
 }finally{await context.close()}
}
try{
 await check({width:390,height:844});
 await check({width:1366,height:900});
 console.log('V4.1 CHROMIUM PASS: 12 locales × mobile/desktop, directory warnings/actions, stateful saves, app cards and facts, source identities, no overflow.');
}finally{await browser.close()}
