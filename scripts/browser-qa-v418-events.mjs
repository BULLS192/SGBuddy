/* V4.18 real Chromium UX, 12 locale controls, editorial queue isolation. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {discoveryText} from '../lib/events-discovery-i18n-v418.mjs';
const day=singaporeDate();
const shifted=n=>new Date(Date.parse(day+'T12:00:00+08:00')+n*86400000).toISOString().slice(0,10);
const fixtures=[
 {id:'v418-today',title:'Singapore EXPO Family Fair',venue:'Singapore EXPO',sourceId:'expo',
  sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/family/',startDate:day,endDate:day,
  verifiedAt:day,verificationMethod:'official_venue_page',category:'family',admission:'free',summary:'Family fair',
  status:'scheduled',audiences:['visitor','resident']},
 {id:'v418-nextweek',title:'Suntec Makers',venue:'Suntec Singapore',sourceId:'suntec-convention',
  sourceUrl:'https://www.suntecsingapore.com/visit-events/makers/',startDate:shifted(5),endDate:shifted(5),
  verifiedAt:day,verificationMethod:'official_venue_page',category:'arts',admission:'ticketed',summary:'Makers show',
  status:'scheduled',audiences:['visitor']},
 {id:'v418-nextmonth',title:'Suntec Concert',venue:'Suntec Singapore',sourceId:'suntec-convention',
  sourceUrl:'https://www.suntecsingapore.com/visit-events/concert/',startDate:shifted(22),endDate:shifted(22),
  verifiedAt:day,verificationMethod:'official_venue_page',category:'music',admission:'registration',summary:'Concert',
  status:'scheduled',audiences:['visitor']},
 {id:'v418-notapproved',title:'Ghost Unapproved Event',venue:'Singapore EXPO',sourceId:'expo',
  sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/notapproved/',startDate:day,endDate:day,
  verifiedAt:day,verificationMethod:'',category:'family',admission:'free',summary:'Not verified',
  status:'needs-review',audiences:['visitor']}
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:844},locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
  await context.route('**/data/events-v470.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({schemaVersion:1,asOf:day,events:fixtures})}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForSelector('#sgbuddyEvents [data-event-search]',{state:'attached',timeout:65000});
  await page.evaluate(()=>window.SGBUDDY_VIEW_ROUTER?.show?.('places'));
  await page.locator('[data-ux423-group="events"]').click();
  await page.waitForSelector('#sgbuddyEvents [data-event-search]',{state:'visible'});
  const items=()=>page.locator('#sgbuddyEvents .events-item');
  assert.equal(await page.locator('#sgbuddyEvents [data-event-filter]').count(),8);
  await page.locator('[data-event-filter="today"]').click();
  assert.equal(await items().count(),1);
  assert.ok((await items().first().getAttribute('data-event-id'))==='v418-today');
  await page.locator('[data-event-filter="next7"]').click();
  assert.equal(await items().count(),2);
  await page.locator('[data-event-filter="next30"]').click();
  assert.equal(await items().count(),3);
  await page.locator('[data-event-search]').fill('EXPO');
  assert.equal(await items().count(),1);
  assert.equal(await page.locator('[data-event-search]').inputValue(),'EXPO');
  await page.locator('[data-event-search]').fill('No matching event');
  assert.equal(await items().count(),0);
  assert.ok((await page.locator('.events-empty').first().textContent()).includes('No published events'));
  await page.locator('[data-event-search]').fill('');
  assert.equal(await items().count(),3);
  assert.equal(await page.locator('[data-event-trip="v418-notapproved"]').count(),0);
  await page.locator('[data-event-filter="today"]').click();
  for(const {code} of LOCALES){
   await page.evaluate(c=>{window.SGBUDDY_LANGUAGE=c;document.dispatchEvent(new Event('sgbuddy:language'))},code);
   await page.waitForFunction(({label})=>document.querySelector('[data-event-search]')?.placeholder===label,
    {label:discoveryText(code,'placeholder')},{timeout:12000});
   const today=await page.locator('[data-event-filter="today"]').textContent();
   assert.equal(today,discoveryText(code,'today'));
   assert.ok((await page.locator('.events-disclaimer').textContent()).includes(discoveryText(code,'approvedOnly')));
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Horizontal overflow '+width);
  assert.deepEqual(errors.filter(s=>/app-events|events-discovery/i.test(s)),[]);
  console.log('V4.18 BROWSER PASS '+width+'px: time windows, live search, editorial hold, 12 locales.');
  await context.close();
 }
}finally{await browser.close()}
