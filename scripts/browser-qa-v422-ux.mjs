import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const locales=['en','zh-CN','zh-TW','ms','id','ja','ko','th','vi','fr','es','pt-BR'];
try{
 for(const width of [390,1366]){
  const ctx=await browser.newContext({viewport:{width,height:860},locale:'en-SG',serviceWorkers:'block'});
  await ctx.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.23.0'&&!!window.SGBUDDY_TRIP_API,{timeout:50000});
  assert.equal(await page.locator('.bottom-nav [data-nav-target]').count(),5);
  assert.equal(await page.locator('#navMoney').getAttribute('data-nav-target'),'trip');
  assert.match(await page.locator('#navAccount').textContent(),/More/);
  await page.locator('#navMoney').click();
  await page.locator('#ux423TripView').waitFor({state:'visible'});
  await page.locator('#tripNewName').fill('V4.22 visual test');
  await page.locator('#tripStartDate').fill('2026-11-20');
  await page.locator('#tripCreateForm button[type="submit"]').click();
  await page.locator('.ux422-trip-overview').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.ux422-trip-overview').textContent(),/V4.22 visual test/);
  assert.match(await page.locator('.ux422-trip-overview').textContent(),/Device only/);
  await page.locator('#tripCustomForm input[name="customName"]').fill('Merlion');
  await page.locator('#tripCustomForm input[name="customArea"]').fill('Marina Bay');
  await page.locator('#tripCustomForm button[type="submit"]').click();
  assert.equal(await page.locator('.trip-stop').count(),1);
  assert.match(await page.locator('.ux422-day-tip').textContent(),/1/);
  assert.ok(await page.locator('[data-v421-calendar]').isVisible(),'Existing calendar export must remain visible');
  assert.ok(await page.locator('[data-v420-print]').isVisible(),'Existing local print must remain visible');
  await page.locator('#navAccount').click();
  await page.locator('#ux422MoreHub').waitFor({state:'visible',timeout:12000});
  await page.locator('#ux422MoreHub [data-ux-go="saved"]').click();
  await page.locator('#uxSavedView').waitFor({state:'visible'});
  await page.locator('#navAccount').click();
  await page.locator('#ux422MoreHub [data-ux-go="money"]').click();
  await page.locator('.v1-view[data-view="money"]').waitFor({state:'visible'});
  await page.locator('#navMoney').click();
  assert.match(await page.locator('.ux422-trip-overview').textContent(),/V4.22 visual test/);
  for(const code of locales){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(lang=>document.querySelector('#navMoney span')?.textContent?.trim().length>1,code);
   assert.ok((await page.locator('#navAccount span').textContent()).trim().length>1,code);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Horizontal overflow '+width);
  assert.deepEqual(errors.filter(x=>/ux-v422|trip-v260/i.test(x)),[],'UX runtime errors');
  await ctx.close();
  console.log('V4.22 UX BROWSER PASS '+width+'px: primary Trip, preserved saved/money, trip timeline, 12 languages and no overflow.');
 }
}finally{await browser.close()}
