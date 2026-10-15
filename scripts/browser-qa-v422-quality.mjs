/* V4.22 additional quality acceptance across 12 languages, themes, widths.
 * Browser emulation is not a substitute for human usability or physical PWA QA.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {UX422_LABELS} from '../lib/ux-i18n-v422.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const ports=[320,375,390,768,1366],modes=['light','dark'];
const parseRgb=s=>{const a=s.match(/rgba?\(([^)]+)\)/)?.[1].split(/[\s,]+/).map(Number);return a?.slice(0,3)};
const luminance=v=>{const linear=c=>{const n=c/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*linear(v[0])+.7152*linear(v[1])+.0722*linear(v[2])};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
try{
 for(const width of ports){
  const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
  await context.addInitScript(()=>{
   localStorage.setItem('sgc-persona-onboarded','1');localStorage.setItem('sgc-mode','visitor');
   localStorage.setItem('sgc-location-choice','not-now');
   const t={id:'a11y-trip',name:'UX Accessibility',startDate:'2026-11-20',createdAt:'2026-10-15T00:00:00Z',days:[
    [{key:'a1',place:{id:'merlion-park',name:'Merlion',area:'Marina Bay',address:'Fullerton Road',kind:'Attraction'},time:'09:00',note:'Sample',done:false}],[]]};
   localStorage.setItem('sgbuddy-my-trips-v260',JSON.stringify({schemaVersion:1,activeId:t.id,trips:[t]}));
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.22.0'&&!!window.SGBUDDY_TRIP_API,{timeout:45000});
  for(const theme of modes){
   await page.evaluate(mode=>document.documentElement.dataset.uxTheme=mode,theme);
   await page.locator('#navAccount').click();
   await page.locator('#ux422MoreHub').waitFor({state:'visible',timeout:12000});
   const state=await page.evaluate(()=>{
    const hub=document.querySelector('#ux422MoreHub'),button=hub.querySelector('button strong');
    const strongStyle=getComputedStyle(button),parentStyle=getComputedStyle(button.closest('button'));
    const targets=[...document.querySelectorAll('.bottom-nav [data-nav-target],#ux422MoreHub button')];
    return {text:strongStyle.color,background:parentStyle.backgroundColor,
     targets:targets.map(x=>({size:x.getBoundingClientRect().height,width:x.getBoundingClientRect().width,aria:x.getAttribute('aria-label')||x.textContent.trim()})),
     scroll:document.documentElement.scrollWidth,viewport:innerWidth,
     moreTitle:hub.getAttribute('aria-labelledby'),exists:!!hub.querySelector('#ux422MoreTitle')};
   });
   assert.ok(state.scroll<=state.viewport+12,'Horizontal overflow '+width+' '+theme+' '+JSON.stringify(state));
   assert.ok(state.exists&&state.moreTitle==='ux422MoreTitle','More hub should have a screen-reader label');
   for(const target of state.targets){
    assert.ok(target.size>=44,'Touch target below 44 CSS pixels '+width+' '+theme+' '+JSON.stringify(target));
    assert.ok(target.width>=40,'Touch target too narrow '+width+' '+theme+' '+JSON.stringify(target));
    assert.ok(target.aria.length>1,'Unlabelled control '+width+' '+theme);
   }
   const contrast=ratio(parseRgb(state.text),parseRgb(state.background));
   assert.ok(contrast>=4.5,'More button title text contrast below WCAG AA: '+contrast.toFixed(2)+' '+theme);
   await page.locator('#navMoney').click();
   const panel=page.locator('.ux422-trip-overview');
   await panel.waitFor({state:'visible',timeout:12000});
   assert.equal(await panel.getAttribute('role'),'region');
   assert.ok(await panel.locator('h4').isVisible(),'Trip title needs semantic heading');
   assert.equal(await page.locator('.ux422-trip-overview').count(),1,'No duplicated overview');
   assert.ok(await page.locator('[data-v421-calendar]').isVisible(),'V4.21 export is preserved');
   assert.ok(await page.locator('[data-v420-print]').isVisible(),'V4.20 print is preserved');
  }
  if(width===390){
   for(const [code,labels] of Object.entries(UX422_LABELS)){
    await page.locator('#sgbLanguage').selectOption(code);
    await page.waitForFunction(data=>document.querySelector('#navMoney span')?.textContent?.trim()===data.trip&&document.querySelector('#navAccount span')?.textContent?.trim()===data.more,{trip:labels[0],more:labels[1]},{timeout:15000});
    await page.locator('#navAccount').click();
    await page.waitForFunction(data=>document.querySelector('#ux422MoreHub [data-ux-go="saved"] strong')?.textContent===data.saved,{saved:labels[2]},{timeout:15000});
    await page.locator('#navMoney').click();
    await page.locator('.ux422-trip-overview').waitFor({state:'visible',timeout:15000});
    assert.equal(await page.locator('.ux422-trip-overview').count(),1,'Locale must not duplicate overview '+code);
   }
  }
  assert.deepEqual(errors,[],'Browser errors '+width);
  await context.close();
  console.log('V4.22 QUALITY PASS '+width+'px light/dark: contrast, touch, regions, exports, no overflow');
 }
}finally{await browser.close()}
