import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {FALLBACK_SOURCE,fallbackMessage} from '../lib/i18n-fallback-v390.mjs';
const browser=await chromium.launch({headless:true});
const fields=[
 ['#foodPickNote','foodGuideLoading','textContent'],
 ['#foodCount','foodLibraryUnavailable','textContent'],
 ['#discoverStatus','discoverCatalogUnavailable','textContent'],
 ['#discoverResults .discover-empty','discoverDirectoryUnavailable','textContent'],
 ['#placeSearch','placeSearchPlaceholder','placeholder'],
 ['.places-toolbar > span','placesToolbarNote','textContent']
];
async function check(viewport){
 const ctx=await browser.newContext({viewport});
 await ctx.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.23.0'&&Boolean(window.SGBUDDY_FALLBACK_I18N),{timeout:35000});
  for(const {code} of LOCALES){
   const select=page.locator('#sgbLanguage');
   await select.selectOption(code);
   await page.evaluate(({fields,sources})=>{
    for(const [selector,key,field] of fields){
     let node=document.querySelector(selector);
     if(!node&&selector==='#discoverResults .discover-empty'){
      node=document.createElement('div');node.className='card discover-empty';
      document.querySelector('#discoverResults').appendChild(node);
     }
     if(!node)throw Error('Missing test anchor '+selector);
     if(field==='placeholder')node.setAttribute('placeholder',sources[key]);
     else node.textContent=sources[key];
    }
    const address=document.querySelector('.food-address')||(()=>{
     const element=document.createElement('p');element.className='food-address';
     document.querySelector('#foodExplorer').appendChild(element);
     return element;
    })();
    address.textContent=sources.foodCheckingCentre;
    window.SGBUDDY_FALLBACK_I18N.refresh();
   },{fields,sources:FALLBACK_SOURCE});
   const expected=fields.map(([selector,key,field])=>({selector,field,value:fallbackMessage(code,key)}));
   await page.waitForFunction(items=>items.every(x=>{
    const node=document.querySelector(x.selector);
    return (x.field==='placeholder'?node?.getAttribute('placeholder'):node?.textContent)?.trim()===x.value;
   }),expected,{timeout:6500});
   await page.waitForFunction(expected=>[...document.querySelectorAll('.food-address')].some(el=>el.textContent===expected),fallbackMessage(code,'foodCheckingCentre'),{timeout:4000});
   // Interpolated numbers must survive translation without changing their meaning.
   await page.evaluate(raw=>{
    document.querySelector('#foodPickNote').textContent=raw.replace('{count}','7');
    window.SGBUDDY_FALLBACK_I18N.refresh();
   },FALLBACK_SOURCE.foodPicked);
   await page.waitForFunction(expected=>document.querySelector('#foodPickNote')?.textContent===expected,
     fallbackMessage(code,'foodPicked',{count:'7'}),{timeout:4000});
   await page.evaluate(raw=>{
    document.querySelector('#foodPickNote').textContent=raw.replace('{count}','24').replace('{areas}','5');
    window.SGBUDDY_FALLBACK_I18N.refresh();
   },FALLBACK_SOURCE.foodCandidates);
   await page.waitForFunction(expected=>document.querySelector('#foodPickNote')?.textContent===expected,
     fallbackMessage(code,'foodCandidates',{count:'24',areas:'5'}),{timeout:4000});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+8),code+' horizontal overflow at '+viewport.width);
  }
  await page.evaluate(()=>{
   const notes=[
    ['#foodPickNote','Provider-supplied menu: chicken rice $5.20'],
    ['#foodCount','Official source status: pending'],
    ['#discoverStatus','Transport operator says delay of 12 minutes'],
    ['.places-toolbar > span','Personal note: custom place']
   ];
   for(const [selector,content] of notes)document.querySelector(selector).textContent=content;
   document.querySelector('#placeSearch').setAttribute('placeholder','Your custom search hint');
   const address=document.querySelector('.food-address');
   address.textContent='OneMap matched: 1 Marina Boulevard, Singapore 018989';
   window.SGBUDDY_FALLBACK_I18N.refresh();
  });
  await page.waitForTimeout(200);
  for(const [selector,expected] of [
   ['#foodPickNote','Provider-supplied menu: chicken rice $5.20'],
   ['#foodCount','Official source status: pending'],
   ['#discoverStatus','Transport operator says delay of 12 minutes'],
   ['.places-toolbar > span','Personal note: custom place'],
   ['.food-address','OneMap matched: 1 Marina Boulevard, Singapore 018989']
  ])assert.equal((await page.locator(selector).first().textContent()).trim(),expected,'Must preserve unregistered source: '+selector);
  assert.equal(await page.locator('#placeSearch').getAttribute('placeholder'),'Your custom search hint');
  assert.deepEqual(errors,[],'Page errors');
 }finally{await ctx.close()}
}
try{
 await check({width:390,height:844});
 await check({width:1366,height:900});
 console.log('V3.9 CHROMIUM PASS: all 12 locales, mobile and desktop, 12 first-party fallbacks, numeric interpolation, provider and user source preservation.');
}finally{await browser.close()}
