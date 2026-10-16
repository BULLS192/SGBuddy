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
  await page.waitForFunction(()=>window.SGBUDDY_V424?.version==='4.24.0',{timeout:60000});
  assert.equal(await page.locator('.bottom-nav [data-nav-target]').count(),5);
  await page.locator('#v424SOS').click();
  await page.locator('#v424Essentials').waitFor({state:'visible'});
  for(const href of ['tel:999','tel:995','sms:70999'])assert.equal(await page.locator('a.v424-contact[href="'+href+'"]').count(),1);
  await page.locator('[data-v424-tab="arrival"]').click();
  assert.ok((await page.locator('.v424-date-hint').textContent()).includes('Need the SG Arrival Card'));
  await page.locator('#v424Date').fill('2026-10-18');
  assert.ok((await page.locator('.v424-date-hint').textContent()).includes('2026-10-16'));
  await page.locator('#v424Border').selectOption('land');
  await page.locator('#v424Status').selectOption('pr');
  assert.equal(await page.locator('[data-v424-check="sgac"]').count(),0);
  await page.locator('#v424Border').selectOption('air');
  assert.equal(await page.locator('[data-v424-check="sgac"]').count(),1);
  await page.locator('[data-v424-check="passport"]').check();
  assert.ok((await page.evaluate(()=>localStorage.getItem('sgc-v424-arrival'))).includes('"passport":true'));
  await page.locator('#v424Date').fill('2026-10-19');
  assert.equal(await page.locator('[data-v424-check="passport"]').isChecked(),false,'new arrival resets old completion');
  await page.locator('.v424-goods > summary').click();
  await page.locator('#v424GoodsSearch').fill('vape');
  assert.equal(await page.locator('.v424-goods-row').count(),1);
  await page.locator('[data-v424-tab="notices"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.v424-notice').length>0);
  await page.evaluate(()=>{window.SGBUDDY_CORE.state.mode='executive';document.dispatchEvent(new Event('sgbuddy:persona'))});
  await page.waitForFunction(()=>[...document.querySelectorAll('.v424-notice h4')].some(n=>n.textContent.includes('InvoiceNow')));
  await page.evaluate(()=>{window.SGBUDDY_CORE.state.mode='student';document.dispatchEvent(new Event('sgbuddy:persona'))});
  await page.waitForFunction(()=>[...document.querySelectorAll('.v424-notice h4')].some(n=>n.textContent.includes('MOE')));
  assert.equal(await page.locator('.v424-notice a:not([href^="https://"])').count(),0);
  await page.locator('[data-v424-tab="legal"]').click();
  assert.equal(await page.locator('.v424-legal-card').count(),4);
  for(const anchor of ['privacy','accuracy','terms','feedback'])assert.equal(await page.locator('.v424-legal-card a[href="/legal.html#'+anchor+'"]').count(),1);
  assert.equal(await page.locator('a.v424-feedback-action[href="https://omnidite.com/feedback?project=sgbuddy"]').count(),1);
  assert.equal(await page.locator('#v424Content a[href^="mailto:"]').count(),0,'in-app feedback must not reveal email');
  assert.equal(await page.locator('#v424Content form').count(),0,'feedback links to Omnidite, not a hidden form submission');
  for(const code of locales){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.waitForTimeout(70);
   assert.ok((await page.locator('#v424Title').textContent()).trim().length>3,code);
   assert.ok((await page.locator('[data-v424-tab="legal"]').textContent()).trim().length>3,code);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'mobile overflow');
  assert.deepEqual(errors,[]);
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(async()=>{
  const reg=await navigator.serviceWorker.ready;
  return !!reg.active&&await caches.has('sgbuddy-shell-v91');
 },null,{timeout:65000});
 if(!await page.evaluate(()=>!!navigator.serviceWorker.controller)){
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:20000});
 }
 const assets=['/app-essentials-v424.js','/essentials-v424.css','/lib/essentials-v424.mjs','/data/gov-notices-v424.json','/legal.html'];
 const cached=await page.evaluate(async items=>{const c=await caches.open('sgbuddy-shell-v91');return Promise.all(items.map(async path=>!!await c.match(path)))},assets);
  assert.deepEqual(cached,[true,true,true,true,true],'offline shell must precache emergency guidance and legal notice');
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>!!window.SGBUDDY_V424,{timeout:60000});
 await page.locator('#v424SOS').click();
 assert.ok(await page.locator('a.v424-contact[href="tel:999"]').isVisible());
 await page.locator('[data-v424-tab="notices"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.v424-notice').length>0);
  await page.goto('http://127.0.0.1:8765/legal.html',{waitUntil:'domcontentloaded',timeout:45000});
  assert.ok(await page.locator('#privacy').isVisible(),'privacy notice is available offline');
  assert.ok(await page.locator('#accuracy').isVisible(),'accuracy disclaimer is available offline');
  assert.ok(await page.locator('#terms').isVisible(),'terms are available offline');
  assert.ok(await page.locator('#feedback a.cta[href="https://omnidite.com/feedback?project=sgbuddy"]').isVisible(),'feedback contact link is available offline');
  assert.equal(await page.locator('a[href^="mailto:"]').count(),0,'legal notice must not show direct email links');
  assert.ok(!/@omnidite\.com\b/i.test(await page.locator('body').innerText()),'legal notice must not expose a direct Omnidite email address');
 await context.close();
 console.log('V4.24 BROWSER + OFFLINE PASS');
}finally{await browser.close()}
