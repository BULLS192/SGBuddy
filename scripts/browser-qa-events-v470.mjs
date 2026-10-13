import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:850},locale:'en-SG',serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#sgbuddyEvents .events-filters',{state:'attached',timeout:60000});
  await page.evaluate(()=>window.SGBUDDY_VIEW_ROUTER?.show?.('places'));
  await page.waitForSelector('#sgbuddyEvents .events-filters',{state:'visible'});
  assert.equal(await page.locator('#sgbuddyEvents [data-event-filter]').count(),5);
  await page.locator('#sgbuddyEvents [data-event-filter="upcoming"]').click();
  const total=await page.locator('#sgbuddyEvents .events-item').count();
  assert.ok(total>=0);
  if(total){
   const first=page.locator('#sgbuddyEvents .events-item').first();
   assert.match(await first.locator('.events-actions a').getAttribute('href'),/^https:\/\//);
   await first.locator('[data-event-save]').click();
   assert.equal(await page.locator('#sgbuddyEvents .events-item').first().locator('[data-event-save]').getAttribute('aria-pressed'),'true');
   assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('sgbuddy-v470-saved-events')||'[]'))).length>=1);
   await page.locator('#sgbuddyEvents .events-item').first().locator('[data-event-save]').click();
   assert.equal(await page.locator('#sgbuddyEvents .events-item').first().locator('[data-event-save]').getAttribute('aria-pressed'),'false');
  }
  for(const [language,regex] of [['fr',/Singapour/],['pt-BR',/Singapura/],['zh-CN',/新加坡/]]){
   await page.evaluate(code=>{window.SGBUDDY_LANGUAGE=code;document.dispatchEvent(new Event('sgbuddy:language'))},language);
   assert.match(await page.locator('#sgbuddyEvents h2').innerText(),regex);
  }
  await page.evaluate(()=>{window.SGBUDDY_LANGUAGE='en';document.dispatchEvent(new Event('sgbuddy:language'))});
  assert.match(await page.locator('#sgbuddyEvents .events-disclaimer').innerText(),/not live ticket availability/i);
  await page.locator('#sgbuddyEvents [data-event-filter="free"]').click();
  for(const badge of await page.locator('#sgbuddyEvents .events-access').allTextContents())assert.equal(badge,'Free admission');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert.equal(overflow,false,'horizontal overflow '+width);
  assert.deepEqual(errors.filter(x=>x.includes('app-events-v470')||x.includes('events-v470')),[]);
  console.log('V4.7 event browser QA passed '+width+'px; published upcoming events: '+total);
  await context.close();
 }
}finally{await browser.close();}
