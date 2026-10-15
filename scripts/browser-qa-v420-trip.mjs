import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const locales=['en','zh-CN','zh-TW','ms','id','ja','ko','th','vi','fr','es','pt-BR'];
try{
 for(const width of [390,1366]){
  const ctx=await browser.newContext({viewport:{width,height:880},locale:'en-SG'});
  await ctx.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now');
   const make=(id,name,area)=>({key:'k-'+id,place:{id,name,kind:'Custom',area,address:''},time:'',note:'',done:false});
   const day0=['Merlion','Garden','Bayfront','Museum','Esplanade','Bridge'].map((s,i)=>make('v420-'+i,s,'Marina Bay'));
   day0[0].time='09:00';day0[1].time='09:00';
   const repeat=make('v420-0','Merlion','Marina Bay');
   const raw={schemaVersion:1,activeId:'v420-test',trips:[{id:'v420-test',name:'Singapore trip',startDate:'2026-11-20',createdAt:'2026-10-15T00:00:00Z',days:[day0,[repeat],[]]}]};
   localStorage.setItem('sgbuddy-my-trips-v260',JSON.stringify(raw));
  });
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.19.0'&&!!window.SGBUDDY_TRIP_API,{timeout:45000});
  await page.locator('#navPlaces').click();await page.locator('[data-discover-tab="trip"]').click();
  await page.locator('.trip-quality-summary').waitFor({state:'visible',timeout:10000});
  assert.match(await page.locator('.trip-quality-summary').textContent(),/Repeated places/);
  assert.match(await page.locator('.trip-quality-summary').textContent(),/Same-time clashes:\s*1/);
  assert.equal(await page.locator('[data-v420-route]').count(),2,'Six stops must be routed across two linked segments');
  const routes=await page.locator('[data-v420-route]').evaluateAll(nodes=>nodes.map(x=>x.getAttribute('href')));
  assert.equal(new URL(routes[0]).searchParams.get('travelmode'),'walking');
  assert.equal(new URL(routes[1]).searchParams.get('travelmode'),'walking');
  await page.locator('[data-trip-route-mode]').selectOption('driving');
  await page.waitForFunction(()=>document.querySelector('[data-v420-route]')?.getAttribute('href')?.includes('driving'));
  assert.equal(new URL(await page.locator('[data-v420-route="1"]').getAttribute('href')).searchParams.get('travelmode'),'driving');
  await page.evaluate(()=>{
    window.SGBUDDY_DISCOVER_PLACES=[
     {id:'fixture-new-a',name:'Riverside Mall',area:'Marina Bay',kind:'Shop'},
     {id:'fixture-new-b',name:'Museum Café',area:'Marina Bay',kind:'Eat'},
     {id:'fixture-other',name:'Elsewhere',area:'East'},
     {id:'fixture-held',name:'Private candidate',area:'Marina Bay',status:'needs-review'}
    ];
    document.dispatchEvent(new CustomEvent('sgbuddy:discover-places-ready',{detail:{places:window.SGBUDDY_DISCOVER_PLACES}}));
  });
  await page.locator('[data-v420-add]').first().waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('[data-v420-add]').count(),2,'No private/reviewed/unrelated suggestions');
  await page.locator('[data-v420-add="fixture-new-a"]').click();
  assert.equal(await page.locator('.trip-stop').count(),7);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sgbuddy-my-trips-v260')).trips[0].days[0].length),7);
  for(const code of locales){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.locator('.trip-quality-summary strong').waitFor({state:'visible'});
   assert.ok((await page.locator('.trip-quality-summary strong').textContent()).trim().length>2,'Missing '+code);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Horizontal overflow '+width);
  assert.deepEqual(errors,[],'Browser errors '+width);
  console.log('V4.20 W1 CHROMIUM PASS '+width+': 12 locale panels, full segmented route, driving mode, safe directory add, local persistence');
  await ctx.close();
 }
}finally{await browser.close()}
