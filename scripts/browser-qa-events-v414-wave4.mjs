/* V4.14: real first-party UI test for regional filters and My Trip date placement; Chromium emulation only. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {eventExploreText} from '../lib/events-explore-i18n-v414.mjs';
import {weekendWindow} from '../lib/events-v470.mjs';
import {STORE_KEY} from '../lib/trip-v260.mjs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const day=singaporeDate(),win=weekendWindow(day);
const shift=(iso,n)=>new Date(Date.parse(iso+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const tripStart=shift(win.start,-1),later=shift(win.end,9);
const fixture={schemaVersion:1,asOf:day,events:[
 {id:'expo-family-v414',title:'Family Fair',startDate:win.start,endDate:win.start,venue:'Singapore EXPO',
  category:'family',admission:'free',sourceId:'expo',sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/family-fair/',
  summary:'Family activities',verifiedAt:day,verificationMethod:'official_venue_page',audiences:['visitor'],status:'scheduled'},
 {id:'suntec-music-v414',title:'Music Show',startDate:win.end,endDate:win.end,venue:'Suntec Singapore',
  category:'music',admission:'ticketed',sourceId:'suntec-convention',sourceUrl:'https://www.suntecsingapore.com/visit-events/music-show',
  summary:'Live music',verifiedAt:day,verificationMethod:'official_venue_page',audiences:['visitor'],status:'scheduled'},
 {id:'expo-later-v414',title:'Exhibition Next Week',startDate:later,endDate:later,venue:'Singapore EXPO',
  category:'exhibition',admission:'check',sourceId:'expo',sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/exhibition-next-week/',
  summary:'New exhibition',verifiedAt:day,verificationMethod:'official_venue_page',audiences:['resident','visitor'],status:'scheduled'},
 {id:'expo-review-v414',title:'Not Approved',startDate:win.start,endDate:win.start,venue:'Singapore EXPO',category:'family',
  admission:'free',sourceId:'expo',sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/not-approved/',
  summary:'Unreviewed activity',verifiedAt:day,verificationMethod:'',audiences:['visitor'],status:'needs-review'}
]};
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:850},locale:'en-SG',serviceWorkers:'block'});
  const initial={schemaVersion:1,activeId:'existing-trip-v414',trips:[{
   id:'existing-trip-v414',name:'Weekend',startDate:tripStart,createdAt:day+'T00:00:00.000Z',days:[[],[],[]]}]};
  await context.addInitScript(({store,data})=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
   localStorage.setItem(store,JSON.stringify(data));
  },{store:STORE_KEY,data:initial});
  await context.route('**/data/events-v470.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
  const page=await context.newPage(),errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>Boolean(window.SGBUDDY_TRIP_API?.addEvent)&&document.querySelectorAll('#sgbuddyEvents [data-event-trip]').length>=2,null,{timeout:60000});
  await page.evaluate(()=>window.SGBUDDY_VIEW_ROUTER?.show?.('places'));
  await page.waitForSelector('#sgbuddyEvents [data-event-area]',{state:'visible',timeout:12000});
  const region=page.locator('#sgbuddyEvents [data-event-area]');
  const category=page.locator('#sgbuddyEvents [data-event-category]');
  assert.equal(await region.locator('option').count(),7);
  assert.equal(await category.locator('option').count(),11);
  await region.selectOption('east');
  assert.ok(await page.locator('#sgbuddyEvents [data-event-trip="expo-family-v414"]').count());
  assert.equal(await page.locator('#sgbuddyEvents [data-event-trip="suntec-music-v414"]').count(),0);
  await category.selectOption('music');
  assert.equal(await page.locator('#sgbuddyEvents .events-item').count(),0);
  await category.selectOption('family');
  assert.equal(await page.locator('#sgbuddyEvents [data-event-trip="expo-family-v414"]').count(),1);
  for(const {code} of LOCALES){
   await page.evaluate(c=>{window.SGBUDDY_LANGUAGE=c;document.dispatchEvent(new Event('sgbuddy:language'))},code);
   assert.equal((await page.locator('#sgbuddyEvents [data-event-area]').locator('option').first().textContent()).trim(),eventExploreText(code,'allAreas'));
   assert.equal((await page.locator('#sgbuddyEvents [data-event-trip="expo-family-v414"]').textContent()).trim(),eventExploreText(code,'addTrip'));
  }
  await page.evaluate(()=>{window.SGBUDDY_LANGUAGE='en';document.dispatchEvent(new Event('sgbuddy:language'))});
  await page.locator('#sgbuddyEvents [data-event-trip="expo-family-v414"]').click();
  await page.waitForSelector('#myTripPlanner:not([hidden]) .trip-stop',{timeout:12000});
  const afterFirst=await page.evaluate(store=>JSON.parse(localStorage.getItem(store)),STORE_KEY);
  assert.equal(afterFirst.trips.length,1,'Existing trip should receive overlapping event');
  assert.equal(afterFirst.trips[0].days[0].length,0);
  assert.equal(afterFirst.trips[0].days[1].length,1,'Weekend event should land on Saturday');
  assert.equal(afterFirst.trips[0].days[1][0].place.sourceUrl,fixture.events[0].sourceUrl);
  assert.ok((await page.locator('#myTripPlanner .trip-stop a').allTextContents()).some(x=>/Official event source/i.test(x)));
  // Re-adding on same date must not duplicate.
  const duplicate=await page.evaluate(event=>window.SGBUDDY_TRIP_API.addEvent(event),fixture.events[0]);
  assert.equal(duplicate.ok,false);assert.equal(duplicate.reason,'duplicate');
  const unchanged=await page.evaluate(store=>JSON.parse(localStorage.getItem(store)),STORE_KEY);
  assert.equal(unchanged.trips[0].days[1].length,1);
  // Event on a date outside the existing plan creates a dated one-day plan, not a random extra stop.
  const separate=await page.evaluate(event=>window.SGBUDDY_TRIP_API.addEvent(event),fixture.events[2]);
  assert.equal(separate.ok,true);assert.equal(separate.created,true);
  const afterSeparate=await page.evaluate(store=>JSON.parse(localStorage.getItem(store)),STORE_KEY);
  assert.equal(afterSeparate.trips.length,2);
  const active=afterSeparate.trips.find(t=>t.id===afterSeparate.activeId);
  assert.equal(active.startDate,later);
  assert.equal(active.days.length,1);
  assert.equal(active.days[0][0].place.name,'Exhibition Next Week');
  assert.ok(!afterSeparate.trips[0].days.flat().some(x=>x.place.name==='Exhibition Next Week'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Horizontal overflow at '+width);
  assert.deepEqual(errs.filter(x=>/events-v414|app-events-v470|app-trip-v260/.test(x)),[]);
  console.log('V4.14 Wave 4 BROWSER PASS '+width+'px: source areas, categories, all 12 locales and correct device-local My Trip dates.');
  await context.close();
 }
}finally{await browser.close()}
