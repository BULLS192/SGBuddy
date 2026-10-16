/* V4.23 browser acceptance: structural isolation, disclosure, and legacy data continuity. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const locales=['en','zh-CN','zh-TW','ms','id','ja','ko','th','vi','fr','es','pt-BR'];
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:850},locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>!!window.SGBUDDY_V423&&!!window.SGBUDDY_TRIP_API,{timeout:60000});
  assert.equal(await page.locator('#myTripPlanner').evaluate(el=>el.closest('.v1-view')?.dataset.view),'trip');
  assert.equal(await page.locator('#railForm').evaluate(el=>el.closest('.v1-view')?.dataset.view),'move','MRT station lookup belongs on Move');
  await page.evaluate(()=>document.querySelector('#uxPsi').textContent='185 · Unhealthy');
  await page.waitForFunction(()=>document.querySelector('#uxHomeSummary')?.classList.contains('ux423-air-alert'));
  await page.evaluate(()=>document.querySelector('#uxPsi').textContent='45 · Good');
  await page.waitForFunction(()=>!document.querySelector('#uxHomeSummary')?.classList.contains('ux423-air-alert'));
  assert.equal(await page.locator('.bottom-nav [data-nav-target]').count(),5);
  await page.locator('#navMoney').click();
  await page.locator('#ux423TripView').waitFor({state:'visible'});
  assert.equal(await page.locator('.v1-view[data-view="places"]').isVisible(),false,'Discover must be isolated from My Trip');
  assert.ok(await page.locator('#myTripPlanner').isVisible());
  assert.equal(await page.locator('.skip-link').getAttribute('href'),'#ux423TripTitle','Skip link must target My Trip after nav observers run');
  assert.match(await page.locator('.skip-link').textContent(),/My Trip/,'Skip link must name My Trip');
  await page.locator('#tripNewName').fill('V4.23 continuity test');
  await page.locator('#tripStartDate').fill('2026-11-25');
  await page.locator('#tripCreateForm button[type="submit"]').click();
  await page.locator('.ux422-trip-overview').waitFor({state:'visible',timeout:15000});
  await page.locator('#tripCustomForm input[name="customName"]').fill('Merlion Park');
  await page.locator('#tripCustomForm button[type="submit"]').click();
  assert.equal(await page.locator('#myTripPlanner .trip-stop').count(),1);
  const saved=await page.evaluate(()=>localStorage.getItem('sgbuddy-my-trips-v260'));
  assert.ok(saved?.includes('Merlion Park'),'V2.6 private trip store must remain unchanged');
  assert.ok(await page.locator('#ux423TripTools').count()===1,'Share and export tools are disclosed after planning');
  await page.locator('#ux423TripTools > summary').click();
  assert.ok(await page.locator('#tripExportJson').isVisible(),'Existing JSON backup must remain reachable');
  await page.locator('#navPlaces').click();
  await page.locator('#discoverHub').waitFor({state:'visible'});
  assert.equal(await page.locator('#ux423TripView').isVisible(),false,'Trip must hide when changing primary tab');
  assert.equal(await page.locator('.ux423-groups button').count(),4);
  await page.locator('[data-ux423-group="food"]').click();
  assert.ok(await page.locator('[data-ux423-category="eat"]').isVisible());
  await page.locator('[data-ux423-group="guides"]').click();
  assert.equal(await page.locator('.ux423-categories button').count(),3);
  await page.locator('[data-ux423-group="events"]').click();
  assert.ok(await page.locator('#sgbuddyEvents').isVisible(),'Events should live in its own Discover group');
  assert.equal(await page.locator('#discoverResults').isVisible(),false);
  assert.equal(await page.locator('#sgbuddyCalendar').isVisible(),false,'Calendar sources default closed');
  assert.equal(await page.locator('#sgbuddyEvents .events-scope').isVisible(),false,'Secondary filters default closed');
  await page.locator('.ux423-refine').click();
  assert.ok(await page.locator('#sgbuddyEvents .events-scope').isVisible());
  await page.locator('.ux423-calendar-details > summary').click();
  assert.ok(await page.locator('#sgbuddyCalendar').isVisible(),'Official calendar source detail remains available');
  // Adding a published event must land on My Trip with the corresponding tab selected.
  const addEvent=page.locator('#sgbuddyEvents [data-event-trip]').first();
  if(await addEvent.count()){
   await addEvent.click();
   await page.locator('#ux423TripView').waitFor({state:'visible'});
   await page.waitForFunction(()=>document.querySelector('#navMoney')?.getAttribute('aria-current')==='page');
   assert.equal(await page.locator('#navPlaces').getAttribute('aria-current'),null,'Discover must not remain selected after event-to-trip handoff');
  }
  await page.locator('#navAccount').click();
  await page.locator('#ux423Diagnostics').waitFor({state:'attached'});
  assert.equal(await page.locator('#dataCoreDiagnostics').isVisible(),false);
  await page.locator('#ux423Diagnostics > summary').click();
  assert.ok(await page.locator('#dataCoreDiagnostics').isVisible(),'Diagnostics remain accessible');
  for(const code of locales){
   await page.locator('#sgbLanguage').selectOption(code);
   assert.ok((await page.locator('.ux423-groups button').first().textContent()).trim().length>1,code);
   assert.ok((await page.locator('#ux423TripTitle').textContent()).trim().length>1,code);
   await page.locator('#navMoney').click();
   assert.equal(await page.locator('.skip-link').getAttribute('href'),'#ux423TripTitle',code+' My Trip skip target');
   await page.locator('#navAccount').click();
  }
  for(const theme of ['light','dark']){
   await page.evaluate(value=>document.documentElement.dataset.uxTheme=value,theme);
   assert.ok(await page.evaluate(()=>!!getComputedStyle(document.querySelector('.ux423-groups')).backgroundColor));
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'No major horizontal overflow');
  assert.deepEqual(errors,[],'No browser errors in V4.23 acceptance');
  await context.close();
 }
 console.log('V4.23 BROWSER PASS: independent Trip, preserved V2.6 storage, grouped Discover, Events, calendar and diagnostics disclosure, 12 locales.');
}finally{await browser.close()}
