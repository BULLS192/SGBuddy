import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {AUDIT_KEYS,AUDIT_SURFACES,AUDIT_ENGLISH,auditText} from '../lib/i18n-audit-v350.mjs';
import {uxText} from '../lib/i18n-ux-v311.mjs';
const browser=await chromium.launch({headless:true});
const primary=Object.entries(AUDIT_SURFACES).flatMap(([screen,slots])=>slots.map(([selector,key,weight])=>({screen,selector,key,weight}))).filter(x=>x.key!=='merliLess');
const context=async(width,height)=>{
 const ctx=await browser.newContext({viewport:{width,height},locale:'en-SG'});
 await ctx.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 return ctx;
};
async function trial(width,height){
 const ctx=await context(width,height),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.23.0'&&!!window.SGBUDDY_SCREEN_I18N,{timeout:30000});
  const exists=await page.evaluate(entries=>entries.map(x=>({screen:x.screen,selector:x.selector,found:!!document.querySelector(x.selector)})),primary);
  assert.equal(exists.every(x=>x.found),true,JSON.stringify(exists.filter(x=>!x.found)));
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   // Exercise first-party source-lock with the canonical authored English surface,
   // never inject into live operator/provider-owned containers.
   await page.evaluate(({entries,source})=>{
    for(const {selector,key} of entries){
     const node=document.querySelector(selector);
     if(node)node.textContent=source[key];
    }
    document.dispatchEvent(new Event('sgbuddy:language'));
    window.SGBUDDY_SCREEN_I18N?.refresh();
   },{entries:primary,source:AUDIT_ENGLISH});
   const values={entries:primary,expected:{...Object.fromEntries(AUDIT_KEYS.map(k=>[k,auditText(code,k)])),merliMore:uxText(code,'moreWays')}};
   await page.waitForFunction(({entries,expected})=>entries.every(x=>document.querySelector(x.selector)?.textContent?.trim()===expected[x.key]),values,{timeout:5000}).catch(async error=>{
    const diff=await page.evaluate(({entries,expected})=>entries.filter(x=>document.querySelector(x.selector)?.textContent?.trim()!==expected[x.key]).map(x=>({
     selector:x.selector,screen:x.screen,key:x.key,
     actual:document.querySelector(x.selector)?.textContent?.trim()?.slice(0,130),expected:expected[x.key]?.slice(0,130)
    })),values);
    console.error('V3.5 SCREEN MISMATCH',JSON.stringify({code,width,unmatched:diff}));
    throw error;
   });
   // More/Less is one dynamic button, not two simultaneous DOM nodes.
   await page.locator('#uxMerliMore').evaluate(node=>node.click());
   await page.waitForFunction(expected=>document.querySelector('#uxMerliMore')?.textContent?.trim()===expected,uxText(code,'hideExtra'),{timeout:14000});
   await page.locator('#uxMerliMore').evaluate(node=>node.click());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+8),true,code+' horizontal overflow '+width);
  }
  // Provider-controlled route/state text must never be rewritten, even on refresh.
  await page.evaluate(()=>{
   document.querySelector('#journeyStatus').textContent='OPERATOR ALERT 891 · Platform B';
   document.querySelector('#fxResult').textContent='SGD 8.20 · ECB reference';
   document.querySelector('#dataCoreResult').textContent='Provider diagnostic: 503';
   document.querySelector('#moneySourceNote').textContent='MAS/data.gov.sg official attribution';
   document.querySelector('#buddyReply').textContent='User typed a question about Raffles Place';
   window.SGBUDDY_SCREEN_I18N.refresh();
  });
  await page.waitForTimeout(100);
  for(const [selector,expected] of [['#journeyStatus','OPERATOR ALERT 891 · Platform B'],['#fxResult','SGD 8.20 · ECB reference'],['#dataCoreResult','Provider diagnostic: 503'],['#moneySourceNote','MAS/data.gov.sg official attribution'],['#buddyReply','User typed a question about Raffles Place']]){
   assert.equal((await page.locator(selector).textContent()).trim(),expected,'Never overwrite unexpected source/user text: '+selector);
  }
  await page.reload({waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.SGBUDDY_SCREEN_I18N,{timeout:25000});
  assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR','Locale selection should persist');
  assert.deepEqual(errors,[],'Page script failures');
 }finally{await ctx.close()}
}
try{
 await trial(390,844);
 await trial(1366,900);
 console.log('V3.5 CHROMIUM PASS: all 12 locales, 8 reviewed UI zones, 23 source-locked messages, More/Less reactivity, mobile/desktop layouts, original provider/account content and persisted locale.');
}finally{await browser.close()}
