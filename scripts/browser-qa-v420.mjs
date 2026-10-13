import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {contextualText} from '../lib/i18n-contextual-v420.mjs';
const browser=await chromium.launch({headless:true});
async function check(viewport){
 const context=await browser.newContext({viewport,locale:'en-SG'});
 await context.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.12.0',{timeout:35000});
  await page.evaluate(()=>window.SGBUDDY_CORE.navigateTo('places'));
  await page.waitForSelector('#discoverTab-eat',{timeout:30000});
  await page.locator('#discoverTab-do').click();
  await page.waitForFunction(()=>!!document.querySelector('#discoverResults .discover-item'),{timeout:20000});
  const originalName=await page.locator('#discoverResults .discover-item h3').first().textContent();
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForFunction(expected=>document.documentElement.lang===expected,code,{timeout:8000});
   assert.equal((await page.locator('#discoverSourceFilter option[value="official"]').textContent()).trim(),contextualText(code,'sourceOfficial'),code+' source filter');
   assert.equal((await page.locator('#discoverSourceFilter option[value="operator"]').textContent()).trim(),contextualText(code,'sourceOperator'),code+' operator filter');
   assert.equal((await page.locator('.discover-archive-filter').textContent()).trim(),contextualText(code,'archiveFilter'),code+' historical filter');
   assert.equal((await page.locator('#discoverResults .discover-item h3').first().textContent()),originalName,code+' official place identity changed');
   await page.locator('#discoverTab-eat').click();
   await page.locator('[data-food-view="menus"]').click();
   await page.waitForFunction(()=>document.querySelectorAll('#foodCards .food-stall').length>0,{timeout:15000});
   const menu=page.locator('#foodCards .food-stall').first();
   assert.ok((await menu.textContent()).includes(contextualText(code,'foodListedOn',{date:''}).trim().split(' ')[0]),code+' food listing context');
   const links=menu.locator('a');
   if(await links.count())assert.ok((await links.first().textContent()).includes(contextualText(code,'foodVendorMenu')),code+' vendor menu action');
   await page.locator('[data-food-view="hawker-menus"]').click();
   const cards=page.locator('#foodCards .food-stall');
   if(await cards.count())assert.ok((await cards.first().textContent()).includes(contextualText(code,'foodBrand')),code+' hawker brand context');
   await page.locator('#discoverTab-facts').click();
   await page.waitForFunction(()=>!!document.querySelector('#sgbFactCount'),{timeout:5000});
   const counter=await page.locator('#sgbFactCount').textContent();
   assert.ok(counter&&counter.length>10,code+' Merli facts status');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+12),code+' overflow');
   await page.locator('#discoverTab-do').click();
  }
  assert.deepEqual(errors,[],viewport.width+'px JS page errors');
 }finally{await context.close()}
}
try{await check({width:390,height:844});await check({width:1366,height:900});console.log('V4.2 CHROMIUM PASS: 12 locales × mobile/desktop, static filters, Food dynamic notices, preserved source names and Merli facts.')}finally{await browser.close()}
