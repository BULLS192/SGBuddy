import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {HOME_MESSAGES,homeText} from '../lib/i18n-home-v3110.mjs';
import {CORE_UI} from '../lib/i18n-interface-v290.mjs';
const browser=await chromium.launch({headless:true});
const surfaces=[
 ['#todaySection .hero-row .label','context'],
 ['#todaySection .hero-grid > div:nth-child(2) .metric-label','rail'],
 ['#todaySection .hero-grid > div:nth-child(3) .metric-label','roads'],
 ['#locationStatus','locationCurrent'],
 ['#nextUpCard .next-up-head .label','nextUp'],
 ['#nextUpTitle','imminent'],
 ['#nextUpCopy','nearPriority'],
 ['#nextUpAction','now'],
 ['#uxPersonaName','modeSuffix'],
 ['#uxPersonaDescription','residentPrompt'],
 ['#uxMerliHomeTitle','merliTips'],
 ['#uxMerliHomeCopy','residentMerli'],
 ['#uxMerliHomeAsk','askMerli'],
 ['#uxChangeMode','changeMode'],
 ['.ux-primary-shortcuts [data-ux-go="nearby"] strong','nearName'],
 ['.ux-primary-shortcuts [data-ux-go="nearby"] small','nearCopy'],
 ['.ux-primary-shortcuts [data-ux-go="eat"] strong','foodName'],
 ['.ux-primary-shortcuts [data-ux-go="eat"] small','foodCopy'],
 ['.ux-primary-shortcuts [data-ux-go="move"] strong','moveName'],
 ['.ux-primary-shortcuts [data-ux-go="move"] small','moveCopy'],
 ['.ux-primary-shortcuts [data-ux-go="apps"] strong','appsName'],
 ['.ux-primary-shortcuts [data-ux-go="apps"] small','appsCopy']
];
async function run(width,height){
 const context=await browser.newContext({viewport:{width,height},locale:'en-SG'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>Boolean(window.SGBUDDY_HOME_I18N)&&document.querySelector('#appVersion')?.textContent==='v3.9.0',{timeout:35000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.evaluate(({surfaces,english})=>{
    for(const [selector,key] of surfaces){
     const node=document.querySelector(selector);
     if(!node)throw Error('Missing screenshot UI '+selector);
     node.textContent=english[key];
    }
    document.querySelector('.manual.card .label').textContent='CHECK A STATION';
    document.querySelector('.manual.card h3').textContent='Station name or code';
    document.querySelector('#railForm button').textContent='Check';
    document.querySelector('#placeLabel').textContent='Near you';
    document.querySelector('#weatherLabel').textContent='Partly Cloudy (Day) · 59% humidity · 0.0 mm rain';
    window.SGBUDDY_HOME_I18N.refresh();
   },{surfaces,english:HOME_MESSAGES.en});
   const expected=surfaces.map(([selector,key])=>({selector,value:homeText(code,key)}));
   await page.waitForFunction(rows=>rows.every(({selector,value})=>document.querySelector(selector)?.textContent?.trim()===value),expected,{timeout:9000});
   await page.waitForFunction(({code,core})=>
      document.querySelector('.manual.card h3')?.textContent===core.stationName &&
      document.querySelector('.manual.card .label')?.textContent===core.checkStation &&
      (document.querySelector('#placeLabel')?.textContent===core.nearYou || document.querySelector('#placeLabel')?.textContent==='Singapore'),
      {code,core:CORE_UI[code]},{timeout:6000});
   const weather=homeText(code,'cloudyDay')+' · 59% '+homeText(code,'humidity')+' · 0.0 mm '+homeText(code,'rain');
   await page.waitForFunction(expected=>document.querySelector('#weatherLabel')?.textContent===expected,weather,{timeout:6000});
   await page.evaluate(()=>{
    document.querySelector('#nextUpTitle').textContent='Next useful departure in 7 min';
    document.querySelector('#nextUpAction').textContent='3 min';
   });
   await page.waitForFunction(({next,short})=>
     document.querySelector('#nextUpTitle')?.textContent===next&&document.querySelector('#nextUpAction')?.textContent===short,
     {next:homeText(code,'nextIn',{count:7}),short:homeText(code,'shortMinute',{count:3})},{timeout:6000});
   await page.evaluate(()=>{
     document.querySelector('#locationStatus').textContent='Your own saved location: 52 Raffles Place';
     document.querySelector('#nextUpCopy').textContent='Operator-specific delay notice: check your train';
     document.querySelector('#nextUpOptions').innerHTML='<div class="next-option"><strong>EW4 — Tanah Merah</strong><span>East West Line</span></div>';
     window.SGBUDDY_HOME_I18N.refresh();
   });
   await page.waitForTimeout(80);
   assert.equal((await page.locator('#locationStatus').textContent()).trim(),'Your own saved location: 52 Raffles Place');
   assert.equal((await page.locator('#nextUpCopy').textContent()).trim(),'Operator-specific delay notice: check your train');
   assert.ok((await page.locator('#nextUpOptions').textContent()).includes('EW4 — Tanah Merah'),'Route/station names must remain original');
  }
  assert.ok(errors.length===0,'JS exceptions: '+errors.join('; '));
  console.log('V3.11 '+width+'×'+height+': 12 locales, home labels, station, Merli, card shortcuts, weather format, numbers and protected route text PASS');
 }finally{await context.close()}
}
try{await run(390,844);await run(1366,900)}finally{await browser.close()}
