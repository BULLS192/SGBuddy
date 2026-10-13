import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES,TRAVEL_UI} from '../lib/i18n-v280.mjs';
import {shellLocale} from '../lib/i18n-shell-v281.mjs';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-SG',colorScheme:'light'});
await context.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-location-choice','not-now');localStorage.setItem('sgc-mode','visitor')});
const page=await context.newPage(),errors=[],consoleLines=[],failedRequests=[];
page.on('console',m=>consoleLines.push(m.type()+': '+m.text()));
page.on('requestfailed',r=>failedRequests.push(r.url()+': '+r.failure()?.errorText));
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.12.0',{timeout:9000}).catch(async e=>{
   console.error('V2.8.1 STARTUP DIAGNOSTICS',JSON.stringify({version:await page.locator('#appVersion').textContent().catch(()=>null),errors,consoleLines,failedRequests}));throw e;
 });
 const location=page.locator('#locationSheet');await location.waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await location.isVisible())await page.locator('#notNowLocationButton').click();
 assert.equal(await page.locator('#sgbLanguage option').count(),12,'All 12 languages visible');
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  assert.equal(await page.locator('html').getAttribute('lang'),code,code+' html locale');
  const label=code==='en'?'Saved':code==='zh-CN'?'收藏':TRAVEL_UI[code].saved;
  assert.equal((await page.locator('#navMoney span').textContent()).trim(),label,code+' Saved tab wrongly labelled Money');
  await page.locator('#navMoney').click();
  const savedHeading=(await page.locator('#uxSavedView .ux-saved-header h2').textContent()).trim();
  assert.ok(savedHeading===shellLocale(code).savedTitle||(code!=='en'&&savedHeading.length>2&&savedHeading!=='Saved'&&savedHeading!=='Save for later'),code+' Saved heading must stay localized');
  assert.ok(await page.locator('#uxSavedView').isVisible(),'Saved view remains functional in '+code);
  await page.locator('#navToday').click();
  assert.equal((await page.locator('.ux-home-title h2').textContent()).trim(),shellLocale(code).homeTitle,code+' Home heading');
  await page.locator('#navMove').click();
  assert.equal((await page.locator('.ux-move-intro h2').textContent()).trim(),shellLocale(code).moveTitle,code+' Move heading');
  await page.locator('#navToday').click();
 }
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.12.0');
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR','Language persisted');
 assert.equal((await page.locator('#navMoney span').textContent()).trim(),TRAVEL_UI['pt-BR'].saved);
 await page.locator('#sgbLanguage').selectOption('en');
 assert.equal((await page.locator('#navMoney span').textContent()).trim(),'Saved','Back to English works');
 const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(dims.scroll<=dims.width+8,'Mobile has horizontal overflow: '+JSON.stringify(dims));
 assert.equal(errors.length,0,'Browser errors: '+errors.join(' / '));
 console.log('V2.8.1 CHROMIUM PASS: 12 languages, Saved navigation, Home/Move labels, responsive mobile, reload persistence.');
}finally{await browser.close()}
