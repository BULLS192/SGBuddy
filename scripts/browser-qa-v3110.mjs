import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CORE_UI} from '../lib/i18n-interface-v290.mjs';
import {contextMode} from '../lib/i18n-context-v370.mjs';
import {homeText} from '../lib/i18n-home-v311.mjs';
const browser=await chromium.launch({headless:true});
const pairs=[
 ['.manual.card > div > .label', 'stationCheck','home'],
 ['.manual.card > div > h3','stationName','core'],
 ['#railForm button','checkStation','core'],
 ['#todaySection .hero-row .label','currentContext','home'],
 ['#todaySection .hero-grid > div:nth-child(2) .metric-label','railStatus','home'],
 ['#todaySection .hero-grid > div:nth-child(3) .metric-label','roadIncidents','home'],
 ['#nextUpCard .next-up-head .label','nextUp','home'],
 ['#uxChangeMode','changeMode','home'],
 ['#uxPersonaDescription','residentPrompt','home'],
 ['#uxMerliHomeCopy','residentIntro','home'],
 ['.ux-primary-shortcuts .ux-shortcut:nth-child(1) strong','quickNear','home'],
 ['.ux-primary-shortcuts .ux-shortcut:nth-child(2) strong','quickFood','home'],
 ['.ux-primary-shortcuts .ux-shortcut:nth-child(3) strong','quickTrip','home'],
 ['.ux-primary-shortcuts .ux-shortcut:nth-child(4) strong','quickApps','home'],
 ['.ux-primary-shortcuts .ux-shortcut:nth-child(1) small','nearbySummary','home'],
 ['.ux-primary-shortcuts .ux-shortcut:nth-child(2) small','foodSummary','home'],
 ['.ux-primary-shortcuts .ux-shortcut:nth-child(3) small','tripSummary','home'],
 ['.ux-primary-shortcuts .ux-shortcut:nth-child(4) small','appsSummary','home']
];
const source={
 stationCheck:'CHECK A STATION',stationName:'Station name or code',checkStation:'Check',
 currentContext:'CURRENT CONTEXT',railStatus:'Rail status',roadIncidents:'Road incidents',
 nextUp:'NEXT UP',changeMode:'Change mode',residentPrompt:'Find hawker food, healthcare, parks or the best route home.',
 residentIntro:'Ask me about hawker food, transport and Singapore facts.',
 quickNear:'Near me',quickFood:'Find food',quickTrip:'Get moving',quickApps:'Everyday apps',
 nearbySummary:'Clinics, shops and essentials',foodSummary:'Neighbourhood hawkers',
 tripSummary:'Buses, MRT and routes',appsSummary:'Singpass, Grab, banking and delivery'
};
try{
 for(const width of [390,1366]){
  const ctx=await browser.newContext({viewport:{width,height:844}});
  await ctx.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');
   localStorage.setItem('sgc-mode','resident');
   localStorage.setItem('sgc-location-choice','not-now');
  });
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>!!window.SGBUDDY_HOME_I18N&&!!document.querySelector('#uxPersonaDescription'),{timeout:30000});
   for(const {code} of LOCALES){
    await page.locator('#sgbLanguage').selectOption(code);
    // Reproduce original screenshot: older renderers overwrite nodes in English.
    await page.evaluate(({pairs,source})=>{
     for(const [selector,key] of pairs){
      const node=document.querySelector(selector);
      if(!node)throw Error('Missing screenshot anchor '+selector);
      node.textContent=source[key];
     }
     const next=document.querySelector('#nextUpTitle');next.textContent='A departure is imminent';
     const copy=document.querySelector('#nextUpCopy');copy.textContent='Prioritized from nearby and saved transport.';
     document.querySelector('#uxMerliHomeTitle').textContent='Merli · Resident tips';
     window.SGBUDDY_HOME_I18N.refresh();
    },{pairs,source});
    const expected=pairs.map(([selector,key,pack])=>[selector,pack==='core'?CORE_UI[code][key]:homeText(code,key)]);
    await page.waitForFunction(data=>data.every(([selector,value])=>document.querySelector(selector)?.textContent?.trim()===value),expected,{timeout:8000}).catch(async error=>{
     const different=await page.evaluate(rows=>rows.map(([selector,value])=>({selector,expected:value,actual:document.querySelector(selector)?.textContent?.trim()})).filter(x=>x.expected!==x.actual),expected);
     throw Error('V3.11 mismatch '+code+' at width '+width+': '+JSON.stringify(different)+'; '+error.message);
    });
    assert.equal((await page.locator('#nextUpTitle').textContent()).trim(),homeText(code,'imminent'));
    assert.equal((await page.locator('#nextUpCopy').textContent()).trim(),homeText(code,'nearSaved'));
    assert.ok((await page.locator('#uxMerliHomeTitle').textContent()).includes(homeText(code,'merliTips')),'Merli mode title '+code);
    // Source and user fields should never be rewritten by a home-string translation.
    await page.evaluate(()=>{
     document.querySelector('#nextUpOptions').innerHTML='<div class="next-option"><strong>EW4 · Tanah Merah → Pasir Ris</strong></div>';
     document.querySelector('#placeLabel').textContent='Blk 123 Some Street';
     document.querySelector('#uxPersonaDescription').textContent='My handwritten plan';
     window.SGBUDDY_HOME_I18N.refresh();
    });
    await page.waitForTimeout(80);
    assert.equal((await page.locator('#nextUpOptions').textContent()).trim(),'EW4 · Tanah Merah → Pasir Ris');
    assert.equal((await page.locator('#placeLabel').textContent()).trim(),'Blk 123 Some Street');
    assert.equal((await page.locator('#uxPersonaDescription').textContent()).trim(),'My handwritten plan');
   }
   assert.equal(errors.length,0,'Unexpected page errors '+errors.join(' / '));
  }finally{await ctx.close()}
 }
 console.log('V3.11 HOME BROWSER PASS: 12 locales; 390px/1366px; runtime rerenders, station, persona, shortcuts and next-up; source text protected');
}finally{await browser.close()}
