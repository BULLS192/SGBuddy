import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {homeText,homeShortcutText} from '../lib/i18n-home-v310.mjs';
const browser=await chromium.launch({headless:true});
const anchors=[['#uxChangeMode','changeMode'],['#uxPersonaDescription','residentPrompt'],['#uxMerliHomeAsk','askMerli'],['#uxMerliHomeCopy','merliPrompt'],['#nextUpTitle','departureImminent'],['#nextUpCopy','departureCopy'],['#locationStatus','locationPrivacy'],['#placeLabel','locationNear']];
async function test(viewport){
 const ctx=await browser.newContext({viewport});
 await ctx.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>Boolean(window.SGBUDDY_HOME_I18N),{timeout:35000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.evaluate(anchors=>{
    // Simulate all legacy renderers writing their original first-party copy.
    const sources={changeMode:'Change mode',residentPrompt:'Find hawker food, healthcare, parks or the best route home.',askMerli:'Ask Merli',merliPrompt:'Ask me about hawker food, transport and Singapore facts.',departureImminent:'A departure is imminent',departureCopy:'Prioritized from nearby and saved transport.',locationPrivacy:'Using your current location · not stored in cloud',locationNear:'Near you'};
    for(const [selector,key] of anchors){const el=document.querySelector(selector);if(!el)throw Error('Missing: '+selector);el.textContent=sources[key]}
    window.SGBUDDY_HOME_I18N.refresh();
   },anchors);
   const expected=anchors.map(([selector,key])=>({selector,value:homeText(code,key)}));
   await page.waitForFunction(items=>items.every(({selector,value})=>document.querySelector(selector)?.textContent?.trim()===value),expected,{timeout:6000});
   const shortcuts=['nearTitle','nearCopy','foodTitle','foodCopy','moveTitle','moveCopy','appsTitle','appsCopy'];
   const expectedShortcuts=shortcuts.map(key=>homeShortcutText(code,key));
   await page.waitForFunction(values=>{
    const cards=[...document.querySelectorAll('.ux-primary-shortcuts .ux-shortcut')].slice(0,4);
    return cards.length===4&&cards.flatMap(card=>[card.querySelector('strong')?.textContent,card.querySelector('small')?.textContent]).every((str,i)=>str===values[i]);
   },expectedShortcuts,{timeout:6500});
   const mode=await page.locator('#uxPersonaName').textContent();
   assert.ok(!mode.includes('Resident mode')||code==='en',code+' failed to translate mode');
  }
  await page.evaluate(()=>{
   document.querySelector('#nextUpOptions').innerHTML='<span data-test-source>Tanah Merah / EW4</span>';
   window.SGBUDDY_HOME_I18N.refresh();
  });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-test-source]').textContent(),'Tanah Merah / EW4','Never translate route station names');
  assert.deepEqual(errors,[],'Browser errors');
 }finally{await ctx.close()}
}
try{
 await test({width:390,height:844});
 await test({width:1366,height:900});
 console.log('V3.10 HOME CHROMIUM PASS: 12 locales mobile/desktop, exact first-party source, reactive widgets and provider transport names preserved.');
}finally{await browser.close()}
