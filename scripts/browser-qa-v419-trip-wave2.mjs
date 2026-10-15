import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1366]){
  const ctx=await b.newContext({viewport:{width,height:850},locale:'en-SG'});
  await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.20.0',{timeout:45000});
  await page.locator('#navPlaces').click();await page.locator('[data-discover-tab="trip"]').click();
  await page.locator('#tripNewName').fill('Singapore 2.0');
  await page.locator('#tripStartDate').fill('2026-11-20');
  await page.locator('#tripCreateForm button[type="submit"]').click();
  await page.locator('.trip-edit-details summary').click();
  await page.locator('#tripEditForm input[name="name"]').fill('Singapore Revised');
  await page.locator('#tripEditForm input[name="start"]').fill('2026-11-21');
  await page.locator('#tripEditForm input[name="days"]').fill('4');
  await page.locator('#tripEditForm button[type="submit"]').click();
  assert.equal(await page.locator('#tripSelect option:checked').textContent(),'Singapore Revised');
  assert.equal(await page.locator('[data-trip-day]').count(),4);
  for(const [name,area] of [['Garden','East'],['Museum','Central'],['Merlion','East']]){
   await page.locator('[name="customName"]').fill(name);
   await page.locator('[name="customArea"]').fill(area);
   await page.locator('#tripCustomForm button[type="submit"]').click();
  }
  assert.equal(await page.locator('.trip-stop').count(),3);
  await page.locator('[data-trip-route-mode]').selectOption('driving');
  let url=new URL(await page.locator('[data-trip-walking-route]').getAttribute('href'));
  assert.equal(url.searchParams.get('travelmode'),'driving');
  await page.locator('[data-trip-group-area]').click();
  assert.deepEqual(await page.locator('.trip-stop-name h4').allTextContents(),['Garden','Merlion','Museum']);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sgbuddy-my-trips-v260')).trips[0].days[0].length),3,'Area grouping must persist all stops locally');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.20.0'&&Boolean(window.SGBUDDY_TRIP_API),{timeout:35000});
  await page.locator('#navPlaces').click();await page.locator('[data-discover-tab="trip"]').click();
  await page.locator('.trip-stop-name h4').first().waitFor({state:'visible',timeout:20000});
  assert.deepEqual(await page.locator('.trip-stop-name h4').allTextContents(),['Garden','Merlion','Museum']);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sgbuddy-my-trips-v260')).trips[0].days[0].length),3,'Reload must preserve grouped stops');
  await page.locator('.trip-edit-details summary').click();
  await page.locator('#tripEditForm input[name="days"]').fill('1');
  await page.locator('#tripEditForm button[type="submit"]').click();
  assert.equal(await page.locator('[data-trip-day]').count(),1);
  await page.locator('[data-trip-day="0"]').click();
  assert.equal(await page.locator('.trip-stop').count(),3);
  assert.deepEqual(errors.filter(x=>/trip/i.test(x)),[]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Horizontal overflow '+width);
  console.log('V4.19 TRIP WAVE 2 BROWSER PASS '+width+'px: edit, area grouping, route mode, reload and no data loss.');
  await ctx.close();
 }
}finally{await b.close()}
