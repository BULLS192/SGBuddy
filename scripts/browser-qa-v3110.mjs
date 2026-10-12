import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {homeText} from '../lib/i18n-home-v311.mjs';
import {homeShortcut} from '../lib/i18n-shortcuts-v311.mjs';
import {translatedWeatherSummary} from '../lib/i18n-weather-codes-v311.mjs';
import {translatedPsi} from '../lib/i18n-psi-v311.mjs';
import {contextMode} from '../lib/i18n-context-v370.mjs';
const browser=await chromium.launch({headless:true});
const weather='Partly Cloudy (Day) · 59% humidity · 0.0 mm rain';
const tests=[
 ['#todaySection .hero-row .label','context'],
 ['#todaySection .hero-grid > div:nth-child(2) .metric-label','rail'],
 ['#todaySection .hero-grid > div:nth-child(3) .metric-label','road'],
 ['#railForm button','check'],
 ['#placeLabel','near'],
 ['#locationStatus','locationPrivate'],
 ['#nextUpCard .next-up-head .label','next'],
 ['#nextUpTitle','imminent'],
 ['#nextUpCopy','nearSaved'],
 ['#nextUpAction','minute'],
 ['#updatedAt','updated'],
 ['#uxExtraConditions summary','weatherAir'],
 ['#uxViewConditions','fullConditions']
];
async function run(width,height){
 const context=await browser.newContext({viewport:{width,height}});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>Boolean(window.SGBUDDY_HOME_I18N)&&document.querySelector('#uxPersonaName')?.textContent,{timeout:35000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   await page.evaluate(({source,weather})=>{
    const nodes={
     '#todaySection .hero-row .label':'CURRENT CONTEXT',
     '#todaySection .hero-grid > div:nth-child(2) .metric-label':'Rail status',
     '#todaySection .hero-grid > div:nth-child(3) .metric-label':'Road incidents',
     '#railForm button':'Check',
     '#placeLabel':'Near you',
     '#locationStatus':'Using your current location · not stored in cloud',
     '#nextUpCard .next-up-head .label':'NEXT UP',
     '#nextUpTitle':'A departure is imminent',
     '#nextUpCopy':'Prioritized from nearby and saved transport.',
     '#nextUpAction':'3 min',
     '#updatedAt':'Updated 02:29 PM',
     '#uxExtraConditions summary':'Weather, air quality & daily insights',
     '#uxViewConditions':'Full conditions →',
     '#envPsi':'148 · Unhealthy',
     '#uxPsi':'148 · Unhealthy',
     '#weatherLabel':weather
    };
    for(const [selector,value] of Object.entries(nodes)){
     const element=document.querySelector(selector);
     if(!element)throw Error('Missing first-party home selector: '+selector);
     element.textContent=value;
    }
    window.SGBUDDY_CORE.state.weather={...window.SGBUDDY_CORE.state.weather,summary:weather};
    window.SGBUDDY_CORE.state.mode='resident';
    document.dispatchEvent(new Event('sgbuddy:persona'));
    window.SGBUDDY_HOME_I18N.refresh();
   },{source:'en',weather});
   const expected=tests.map(([selector,key])=>({selector,value:homeText(code,key,{count:'3',time:'02:29 PM'})}));
   await page.waitForFunction(items=>items.every(({selector,value})=>document.querySelector(selector)?.textContent?.trim()===value),expected,{timeout:10000});
   await page.waitForFunction(expected=>document.querySelector('#uxPersonaName')?.textContent===expected,contextMode(code,'resident','panelLabel'),{timeout:5000});
   await page.waitForFunction(expected=>document.querySelector('#uxMerliHomeTitle')?.textContent===expected,homeText(code,'merliTips',{mode:contextMode(code,'resident','label')}),{timeout:5000});
   await page.waitForFunction(expected=>document.querySelector('.ux-primary-shortcuts [data-ux-go="eat"] strong')?.textContent===expected,homeShortcut(code,'eat').title,{timeout:5000});
   await page.waitForFunction(expected=>document.querySelector('#weatherLabel')?.textContent===expected,translatedWeatherSummary(code,weather),{timeout:5000});
   await page.waitForFunction(expected=>document.querySelector('#uxPsi')?.textContent===expected,translatedPsi(code,'148 · Unhealthy'),{timeout:5000});
   assert.equal(await page.locator('#uxViewConditions').textContent(),homeText(code,'fullConditions'));
   const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
   assert.ok(size.scroll<=size.viewport+16,'Horizontal overflow '+code+' '+width+': '+JSON.stringify(size));
  }
  await page.evaluate(()=>{
   document.querySelector('#placeLabel').textContent='Home: Private family address';
   document.querySelector('#nextUpOptions').innerHTML='<div class="next-option"><strong>EWL → Tuas Link</strong><span>Tanah Merah</span></div>';
   document.querySelector('#weatherLabel').textContent='Operator-only weather alert — verify manually';
   window.SGBUDDY_CORE.state.weather.summary='Operator-only weather alert — verify manually';
   window.SGBUDDY_HOME_I18N.refresh();
  });
  await page.waitForTimeout(175);
  assert.equal(await page.locator('#placeLabel').textContent(),'Home: Private family address');
  assert.ok((await page.locator('#nextUpOptions').textContent()).includes('Tuas Link'));
  assert.equal(await page.locator('#weatherLabel').textContent(),'Operator-only weather alert — verify manually');
  assert.deepEqual(errors,[],'Unhandled page errors');
 }finally{await context.close()}
}
try{
 await run(390,844);
 await run(1366,900);
 console.log('V3.11 CHROMIUM PASS: 12 locales x mobile and desktop home contexts; rail labels, departures, location privacy, Merli, shortcuts, weather, PSI, preserved station names.');
}finally{await browser.close()}
