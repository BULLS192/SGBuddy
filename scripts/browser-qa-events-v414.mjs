/* V4.14: Browser proof that homepage weekend ideas are only from curated, recent events. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {eventText} from '../lib/events-i18n-v470.mjs';
import {weekendWindow} from '../lib/events-v470.mjs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const today=singaporeDate(),week=weekendWindow(today);
const staleDate=new Date(Date.parse(today+'T12:00:00+08:00')-30*86400000).toISOString().slice(0,10);
const make=(id,category,admission='free',status='scheduled',verifiedAt=today,method='official_venue_page')=>({
 id,title:'Event '+id,startDate:week.start,endDate:week.end,venue:'Singapore EXPO · Hall 2',
 category,admission,sourceId:'expo',sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/'+id+'/',
 audiences:['visitor','resident'],verifiedAt,verificationMethod:method,status,summary:'Official event listing'});
const approved=[make('market-one','market'),make('music-two','music','ticketed'),
 make('arts-three','arts','ticketed'),make('family-four','family')];
const fixture={schemaVersion:1,asOf:today,events:[...approved,make('fake-review','family','free','needs-review'),make('stale-record','sports','free','scheduled',staleDate),make('unknown-source','food','free','scheduled',today,'')]};
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:844},locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  await context.route('**/data/events-v470.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
  const page=await context.newPage(),errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#sgbuddyEventsQuick .events-quick-picks a',{timeout:60000});
  const picks=page.locator('#sgbuddyEventsQuick .events-quick-picks a');
  assert.equal(await picks.count(),3,'Three curated weekend ideas expected');
  const html=await page.locator('#sgbuddyEventsQuick').innerText();
  assert.ok(!html.includes('fake-review')&&!html.includes('stale-record')&&!html.includes('unknown-source'));
  for(const href of await picks.evaluateAll(items=>items.map(x=>x.href)))
   assert.match(href,/^https:\/\/www\.singaporeexpo\.com\.sg\/events-at-expo\//);
  for(const {code} of LOCALES){
   await page.evaluate(c=>{window.SGBUDDY_LANGUAGE=c;document.dispatchEvent(new Event('sgbuddy:language'))},code);
   await page.waitForFunction(({header})=>document.querySelector('#sgbuddyEventsQuick .label')?.textContent===header,
    {header:eventText(code,'weekend')},{timeout:9500});
   assert.equal(await picks.count(),3,'Events lost on language switch '+code);
   assert.ok((await page.locator('#sgbuddyEventsQuick .events-quick-note').textContent()).trim(),'Missing ticket disclaimer');
  }
  assert.equal(await page.locator('#sgbuddyEventsQuick .events-quick-header').evaluate(el=>getComputedStyle(el).flexDirection),width<=420?'column':'row','Weekend shortcut header alignment '+width);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Homepage overflow at '+width);
  await page.locator('#eventsQuickOpen').click();
  await page.waitForSelector('#sgbuddyEvents .events-filters',{state:'visible',timeout:12000});
  assert.deepEqual(errs.filter(e=>/app-events-v470|events-weekend-v414|events-v470/.test(e)),[]);
  console.log('V4.14 Weekend browser PASS '+width+'px: curated source URLs, exclusions, 12 languages and Discover shortcut.');
  await context.close();
 }
}finally{await browser.close()}
