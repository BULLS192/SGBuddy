import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {homeText as homeText311} from '../lib/i18n-home-v311.mjs';
import {contextMode} from '../lib/i18n-context-v370.mjs';
import {weatherTerm} from '../lib/i18n-weather-home-v311.mjs';

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
  await page.waitForFunction(()=>Boolean(window.SGBUDDY_HOME_I18N)&&Boolean(window.SGBUDDY_WEATHER_DISPLAY_I18N),{timeout:35000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.evaluate(anchors=>{
    // Simulate all legacy renderers writing their original first-party copy.
    const sources={changeMode:'Change mode',residentPrompt:'Find hawker food, healthcare, parks or the best route home.',askMerli:'Ask Merli',merliPrompt:'Ask me about hawker food, transport and Singapore facts.',departureImminent:'A departure is imminent',departureCopy:'Prioritized from nearby and saved transport.',locationPrivacy:'Using your current location · not stored in cloud',locationNear:'Near you'};
    for(const [selector,key] of anchors){const el=document.querySelector(selector);if(!el)throw Error('Missing: '+selector);el.textContent=sources[key]}
    window.SGBUDDY_HOME_I18N.refresh();
   },anchors);
   const latest={
    changeMode:homeText311(code,'changeMode'),
    residentPrompt:contextMode(code,'resident','placesCopy'),
    askMerli:homeText311(code,'askMerli'),
    merliPrompt:homeText311(code,'merliResident'),
    departureImminent:homeText311(code,'imminent'),
    departureCopy:homeText311(code,'prioritizedNearby'),
    locationPrivacy:homeText311(code,'locationPrivacy'),
    locationNear:homeText311(code,'nearYou')
   };
   const expected=anchors.map(([selector,key])=>({selector,value:latest[key]}));
   await page.waitForFunction(items=>items.every(({selector,value})=>document.querySelector(selector)?.textContent?.trim()===value),expected,{timeout:6000});
   const shortcuts=['shortcutNearby','shortcutNearbyCopy','shortcutEat','shortcutEatCopy','shortcutMove','shortcutMoveCopy','shortcutApps','shortcutAppsCopy'];
   const expectedShortcuts=shortcuts.map(key=>homeText311(code,key));
   try{
    await page.waitForFunction(values=>{
     const cards=[...document.querySelectorAll('.ux-primary-shortcuts .ux-shortcut')].slice(0,4);
     return cards.length===4&&cards.flatMap(card=>[card.querySelector('strong')?.textContent,card.querySelector('small')?.textContent]).every((str,i)=>str===values[i]);
    },expectedShortcuts,{timeout:3500});
   }catch(error){
    const actual=await page.evaluate(()=>[...document.querySelectorAll('.ux-primary-shortcuts .ux-shortcut')].slice(0,5).map(card=>[card.querySelector('strong')?.textContent,card.querySelector('small')?.textContent]));
    throw Error('Shortcut localization '+code+' expected '+JSON.stringify(expectedShortcuts)+' actual '+JSON.stringify(actual)+': '+error.message);
   }
   await page.evaluate(()=>{
    document.querySelector('#weatherLabel').textContent='Partly Cloudy (Day) · 59% humidity · 0.0 mm rain';
    document.querySelector('#envPsi').textContent='148 · Unhealthy';
    window.SGBUDDY_WEATHER_DISPLAY_I18N.refresh();
   });
   const weatherExpected=weatherTerm(code,'Partly Cloudy (Day)')+' · 59% '+weatherTerm(code,'humidity')+' · 0.0 mm '+weatherTerm(code,'rain');
   const psiExpected='148 · '+weatherTerm(code,'Unhealthy');
   await page.waitForFunction(({weather,psi})=>
    document.querySelector('#weatherLabel')?.textContent===weather&&
    document.querySelector('#envPsi')?.textContent===psi,
    {weather:weatherExpected,psi:psiExpected},{timeout:6500});
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
