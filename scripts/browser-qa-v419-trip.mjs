import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1366]){
  const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-SG'});
  await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.21.0',{timeout:35000});
  await page.locator('#navPlaces').click();await page.locator('[data-discover-tab="trip"]').click();
  await page.locator('#tripNewName').fill('My Trip 2.0');
  await page.locator('#tripStartDate').fill('2026-11-21');
  await page.locator('#tripCreateForm button[type="submit"]').click();
  assert.ok(await page.locator('[data-trip-day-insights]').isVisible());
  await page.locator('[name="customName"]').fill('Esplanade');
  await page.locator('[name="customArea"]').fill('Marina Bay');
  await page.locator('#tripCustomForm button[type="submit"]').click();
  await page.locator('[name="customName"]').fill('Gardens by the Bay');
  await page.locator('[name="customArea"]').fill('Marina Bay');
  await page.locator('#tripCustomForm button[type="submit"]').click();
  assert.equal(await page.locator('.trip-stop').count(),2);
  const link=await page.locator('[data-trip-walking-route]').getAttribute('href');
  assert.ok(link.startsWith('https://www.google.com/maps/dir/?'));
  assert.equal(new URL(link).searchParams.get('travelmode'),'walking');
  await page.locator('[data-trip-time="0"]').fill('10:00');
  await page.locator('[data-trip-time="1"]').fill('10:00');
  await page.locator('[data-trip-time="1"]').press('Tab');
  assert.match(await page.locator('[data-trip-day-insights]').textContent(),/Time clashes:\s*1/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#navPlaces').click();await page.locator('[data-discover-tab="trip"]').click();
  assert.match(await page.locator('[data-trip-day-insights]').textContent(),/Time clashes:\s*1/);
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   assert.ok((await page.locator('[data-trip-day-insights] strong').textContent()).length>=2,'Missing day summary '+code);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Overflow '+width);
  assert.deepEqual(errors.filter(s=>s.includes('trip')),[]);
  console.log('MY TRIP 2.0 BROWSER PASS '+width+': day check, live time refresh, route link, reload, 12 locales.');
  await ctx.close();
 }
}finally{await browser.close()}
