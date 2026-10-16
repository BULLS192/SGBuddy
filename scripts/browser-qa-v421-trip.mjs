import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const languages=['en','zh-CN','zh-TW','ms','id','ja','ko','th','vi','fr','es','pt-BR'];
const sgDay=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const travelDate=sgDay(new Date(Date.now()+2*86400000));
const source={id:'test-venue',url:'https://events.example.org/whats-on',name:'Official Venue'};
const event={id:'mock-open-event',title:'Weekend Market',venue:'Marina Bay',startDate:travelDate,endDate:travelDate,status:'scheduled',verifiedAt:sgDay(new Date()),verificationMethod:'official_venue_page',sourceId:'test-venue',sourceUrl:'https://events.example.org/whats-on/weekend-market',category:'market',admission:'free',summary:'Sample public listing'};
const held={...event,id:'mock-held-event',status:'needs-review',title:'Unpublished held event'};
try{
 for(const width of [390,1366]){
  const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-SG',acceptDownloads:true,serviceWorkers:'block'});
  await ctx.route('**/data/events-v470.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[event,held]})}));
  await ctx.route('**/data/event-sources-v470.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sources:[source]})}));
  await ctx.addInitScript(date=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
   const trip={id:'v421-trip',name:'Private test itinerary',startDate:date,createdAt:'2026-10-15T00:00:00Z',days:[[
    {key:'k-one',place:{id:'fixture-museum',name:'Museum',area:'Marina Bay',address:'1 Bay Road',kind:'Attraction'},time:'10:30',note:'Keep this note private',done:false}
   ],[]]};
   localStorage.setItem('sgbuddy-my-trips-v260',JSON.stringify({schemaVersion:1,activeId:trip.id,trips:[trip]}));
  },travelDate);
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.23.0'&&!!window.SGBUDDY_TRIP_API,{timeout:60000});
  await page.locator('#navMoney').click();
  await page.locator('#ux423TripView').waitFor({state:'visible'});
  await page.locator('[data-v421-calendar]').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.trip-v421-event').count(),0,'No events fetched without consent');
  const pending=page.waitForEvent('download');
  await page.locator('[data-v421-calendar]').click();
  const download=await pending;
  assert.ok(download.suggestedFilename().endsWith('.ics'));
  const text=readFileSync(await download.path(),'utf8');
  assert.ok(text.includes('BEGIN:VCALENDAR'));
  assert.ok(text.includes('DTSTART;TZID=Asia/Singapore:'+travelDate.replace(/-/g,'')+'T103000'));
  assert.ok(text.includes('Keep this note private'),"ICS should preserve the user's personal note in the locally downloaded file");
  await page.locator('[data-v421-events]').click();
  await page.locator('.trip-v421-event').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.trip-v421-event').count(),1,'Only verified and published event must appear');
  assert.match(await page.locator('.trip-v421-event').first().textContent(),/Weekend Market/);
  assert.ok(!((await page.locator('.trip-v421').textContent()).includes('Unpublished held event')));
  await page.locator('[data-v421-event="mock-open-event"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('sgbuddy-my-trips-v260')).trips[0].days[0].length===2,{timeout:10000});
  assert.equal(await page.locator('.trip-stop').count(),2);
  for(const code of languages){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.locator('[data-v421-calendar]').waitFor({state:'visible'});
   assert.ok((await page.locator('[data-v421-calendar]').textContent()).trim().length>2,'Missing calendar label '+code);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Horizontal overflow '+width);
  assert.deepEqual(errors,[],'Unexpected browser errors at '+width);
  await ctx.close();
  console.log('V4.21 BROWSER PASS '+width+': private .ics, on-demand published-only recommendations, add-to-trip, 12 locales');
 }
}finally{await browser.close()}
