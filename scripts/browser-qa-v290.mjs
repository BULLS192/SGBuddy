import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES,TRAVEL_UI} from '../lib/i18n-v280.mjs';
import {coreUi} from '../lib/i18n-interface-v290.mjs';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light'});
await ctx.addInitScript(()=>{localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');localStorage.setItem('sgc-location-choice','not-now')});
const page=await ctx.newPage();const errs=[];
page.on('pageerror',e=>errs.push(e.message));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v3.9.0',{timeout:30000});
 const location=page.locator('#locationSheet');
 await location.waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await location.isVisible())await page.locator('#notNowLocationButton').click();
 assert.equal(await page.locator('#sgbLanguage option').count(),12);
 for(const {code} of LOCALES){
  await page.locator('#sgbLanguage').selectOption(code);
  const dict=coreUi(code);
  await page.waitForFunction(text=>document.querySelector('#refreshButton')?.textContent?.trim()===text,dict.refresh,{timeout:10000});
  assert.equal((await page.locator('#transportSection h2').textContent()).trim(),dict.trains,code+' train heading');
  assert.equal((await page.locator('#fxConvert').textContent()).trim(),dict.convert,code+' converter');
  assert.equal((await page.locator('#accountHubOpen').textContent()).trim(),dict.accountOpen,code+' account');
  assert.equal((await page.locator('#savePlaces').textContent()).trim(),dict.saveQuick,code+' save addresses');
  const saved=code==='en'?'Saved':code==='zh-CN'?'收藏':TRAVEL_UI[code].saved;
  assert.equal((await page.locator('#navMoney span').textContent()).trim(),saved,code+' Saved navigation');
  assert.equal(await page.locator('html').getAttribute('lang'),code);
  await page.locator('#navMove').click();
  assert.equal((await page.locator('#timingNowButton').textContent()).trim(),dict.leaveNow,code+' departure');
  await page.locator('#navToday').click();
 }
 await page.locator('#sgbLanguage').selectOption('pt-BR');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v3.9.0');
 await page.waitForFunction(()=>document.querySelector('#refreshButton')?.textContent?.trim()==='Atualizar',{timeout:10000});
 assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR');
 assert.equal(await page.locator('#tripFrom').getAttribute('placeholder'),'De — Singapore');
 await page.locator('#sgbLanguage').selectOption('fr');
 await page.waitForFunction(()=>document.querySelector('#tripFrom')?.placeholder==='De — Singapore',{timeout:10000});
 // From is coincidentally "De" in both languages; destination label distinguishes them.
 await page.waitForFunction(text=>document.querySelector('#moneySection h2')?.textContent?.trim()===text,coreUi('fr').rates,{timeout:10000});
 const dim=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(dim.scroll<=dim.width+8,'Horizontal overflow '+JSON.stringify(dim));
 assert.equal(errs.length,0,'Uncaught errors: '+errs.join(' / '));
 console.log('SGBuddy V2.9 CHROMIUM PASS: 12 languages across Move, transport, money, Saved and accounts, persistence and mobile layout.');
}finally{await browser.close()}
