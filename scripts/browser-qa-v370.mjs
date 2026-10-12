import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CONTEXT_MODES,CONTEXT_MESSAGES,contextMode,contextText} from '../lib/i18n-context-v370.mjs';
const browser=await chromium.launch({headless:true});
const fields=[
 ['#modeText','label'],['#personaFocusTitle','title'],['#personaFocusCopy','copy'],
 ['#personaPanelLabel','panelLabel'],['#personaPanelTitle','panelTitle'],
 ['#personaPanelCopy','panelCopy'],['#placesSection h2','placesTitle']
];
const labels=['coreChecking','coreHealthy','coreDegraded','coreCheckFailed'];
async function pass(width,height){
 const ctx=await browser.newContext({viewport:{width,height},locale:'en-SG'});
 await ctx.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.0.0'&&!!window.SGBUDDY_CONTEXT_I18N,{timeout:35000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   for(const mode of CONTEXT_MODES){
    const english=CONTEXT_MESSAGES.en.modes[mode];
    const expected=CONTEXT_MESSAGES[code].modes[mode];
    await page.evaluate(({mode,fields,english})=>{
     window.SGBUDDY_CORE.state.mode=mode;
     for(const [selector,field] of fields)document.querySelector(selector).textContent=english[field];
     document.querySelector('#placesPersonaHint').textContent='Showing '+english.placesLabel+' ranking · '+english.placesCopy+' · 27 ranked matches';
     document.querySelector('#journeyMapTitle').textContent='Recommended · Operator Line A / Green';
     document.querySelector('#dataCoreStatus').textContent='Checking…';
     window.SGBUDDY_CONTEXT_I18N.refresh();
    },{mode,fields,english});
    const checks={fields,expected,places:contextText(code,'placesRanking',{label:expected.placesLabel,copy:expected.placesCopy,count:'27'}),prefix:contextText(code,'recommendedPrefix'),core:contextText(code,'coreChecking')};
    await page.waitForFunction(({fields,expected,places,prefix,core})=>
     fields.every(([selector,key])=>document.querySelector(selector)?.textContent?.trim()===expected[key])&&
     document.querySelector('#placesPersonaHint')?.textContent?.trim()===places&&
     document.querySelector('#journeyMapTitle')?.textContent===prefix+'Operator Line A / Green'&&
     document.querySelector('#dataCoreStatus')?.textContent?.trim()===core,
     checks,{timeout:6500}).catch(async error=>{
      const observed=await page.evaluate(({fields})=>({
       mode:window.SGBUDDY_CORE.state.mode,items:fields.map(([selector,key])=>({selector,key,text:document.querySelector(selector)?.textContent})),
       hint:document.querySelector('#placesPersonaHint')?.textContent,journey:document.querySelector('#journeyMapTitle')?.textContent,
       core:document.querySelector('#dataCoreStatus')?.textContent
      }),{fields});
      console.error('V3.7 PERSONA DIAGNOSTICS',JSON.stringify({code,mode,width,observed,expected:checks}));
      throw error;
     });
    // Exercise the V0.9 generated (non-V1.1) place hint as well.
    await page.evaluate(label=>{
     document.querySelector('#placesPersonaHint').textContent='Prioritized for '+label+' · 8 useful destinations';
     window.SGBUDDY_CONTEXT_I18N.refresh();
    },english.label);
    await page.waitForFunction(expected=>document.querySelector('#placesPersonaHint')?.textContent?.trim()===expected,
      contextText(code,'placesPrioritized',{label:expected.label,count:'8'}),{timeout:4000});
   }
   for(const key of labels){
    await page.evaluate(()=>{document.querySelector('#dataCoreStatus').textContent='Checking…';window.SGBUDDY_CONTEXT_I18N.refresh()});
    await page.waitForFunction(s=>document.querySelector('#dataCoreStatus')?.textContent===s,contextText(code,'coreChecking'),{timeout:4000});
    // Exercise status text not tied to a provider response.
    await page.evaluate(value=>{document.querySelector('#dataCoreStatus').textContent=value;window.SGBUDDY_CONTEXT_I18N.refresh()},CONTEXT_MESSAGES.en.globals[key]);
    await page.waitForFunction(s=>document.querySelector('#dataCoreStatus')?.textContent===s,contextText(code,key),{timeout:4000});
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+8),code+' page overflow at '+width);
  }
  // Unrecognized content and provider route suffixes must never be altered.
  await page.evaluate(()=>{
   document.querySelector('#journeyMapTitle').textContent='Provider route: Service 42';
   document.querySelector('#placesPersonaHint').textContent='Provider warning: do not translate';
   document.querySelector('#dataCoreStatus').textContent='API-specific diagnostic';
   document.querySelector('#personaFocusCopy').textContent='User-provided special note';
   window.SGBUDDY_CONTEXT_I18N.refresh();
  });
  await page.waitForTimeout(100);
  for(const [selector,expected] of [
   ['#journeyMapTitle','Provider route: Service 42'],
   ['#placesPersonaHint','Provider warning: do not translate'],
   ['#dataCoreStatus','API-specific diagnostic'],
   ['#personaFocusCopy','User-provided special note']
  ])assert.equal((await page.locator(selector).textContent()).trim(),expected,'Unknown content must be preserved: '+selector);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.SGBUDDY_CONTEXT_I18N,{timeout:30000});
  assert.equal(await page.locator('#sgbLanguage').inputValue(),'pt-BR','Persist selected language');
  assert.deepEqual(errors,[],'Page errors');
 }finally{await ctx.close()}
}
try{
 await pass(390,844);
 await pass(1366,900);
 console.log('V3.7 CHROMIUM PASS: 12 languages, 5 personas, 9 dynamic UI targets, source-protected route names and user text, mobile/desktop, persisted locale.');
}finally{await browser.close()}
