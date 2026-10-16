import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:860},locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#sgbuddyCalendar .calendar-feature',{state:'attached',timeout:50000});
  // Discover is not the default visible view; switch before interactive checks.
  await page.evaluate(()=>window.SGBUDDY_VIEW_ROUTER?.show?.('places'));
  await page.locator('[data-ux423-group="events"]').click();
  await page.locator('.ux423-calendar-details > summary').click();
  await page.waitForSelector('#sgbuddyCalendar .calendar-feature',{state:'visible',timeout:15000});
  const first=await page.locator('#sgbuddyCalendar .calendar-feature strong').innerText();
  assert.ok(first.length>3,'missing upcoming holiday');
  assert.ok((await page.locator('#sgbuddyCalendar .calendar-source').count())>=10,'missing event directory');
  assert.ok((await page.locator('#sgbuddyCalendar .calendar-holiday').count())>=1,'missing holidays');
  await page.locator('#sgbuddyCalendar [data-cal-filter="malls"]').click();
  assert.ok((await page.locator('#sgbuddyCalendar .calendar-source').count())>=10,'mall sources missing');
  await page.locator('#sgbuddyCalendar [data-cal-filter="expos"]').click();
  assert.ok((await page.locator('#sgbuddyCalendar .calendar-source').count())>=3,'exhibition venues missing');
  await page.evaluate(()=>{window.SGBUDDY_LANGUAGE='fr';document.dispatchEvent(new Event('sgbuddy:language'))});
  assert.match(await page.locator('#sgbuddyCalendar h2').innerText(),/Singapour/);
  await page.evaluate(()=>{window.SGBUDDY_LANGUAGE='pt-BR';document.dispatchEvent(new Event('sgbuddy:language'))});
  assert.match(await page.locator('#sgbuddyCalendar h2').innerText(),/Singapura/);
  await page.evaluate(()=>{window.SGBUDDY_LANGUAGE='en';document.dispatchEvent(new Event('sgbuddy:language'))});
  assert.match(await page.locator('#sgbuddyCalendar .calendar-caution').innerText(),/not verified event listings/i);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert.equal(overflow,false,'horizontal overflow at '+width);
  await page.close();
  await context.close();
  console.log('V4.6 browser QA passed at '+width+'px. First upcoming: '+first+'. Page errors: '+errors.length);
 }
}finally{await browser.close();}
