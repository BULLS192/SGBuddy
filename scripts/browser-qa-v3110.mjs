import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {contextMode} from '../lib/i18n-context-v370.mjs';
import {homeText} from '../lib/i18n-home-v311.mjs';
import {weatherTerm} from '../lib/i18n-weather-home-v311.mjs';
import {uxText} from '../lib/i18n-ux-v311.mjs';
const browser=await chromium.launch({headless:true});
async function check(viewport){
 const ctx=await browser.newContext({viewport,locale:'en-SG'});
 await ctx.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','resident');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.SGBUDDY_HOME_I18N)&&document.querySelector('#appVersion')?.textContent==='v4.1.0',{timeout:35000});
  for(const {code} of LOCALES){
   await page.locator('#sgbLanguage').selectOption(code);
   const checks=[
    ['#uxPersonaName',contextMode(code,'resident','label')+homeText(code,'modeSuffix')],
    ['#uxPersonaDescription',contextMode(code,'resident','placesCopy')],
    ['#uxPersonaBanner #uxChangeMode',homeText(code,'changeMode')],
    ['#uxMerliHomeTitle','Merli · '+contextMode(code,'resident','label')+homeText(code,'merliTips')],
    ['#uxMerliHomeCopy',homeText(code,'merliResident')],
    ['#uxMerliHomeAsk',homeText(code,'askMerli')],
    ['#uxExtraConditions > summary',homeText(code,'weatherInsights')],
    ['section.manual.card > div:first-child h3',homeText(code,'stationName')],
    ['#todaySection .hero-row > div:first-child .label',homeText(code,'currentContext')],
    ['#todaySection .hero-grid > div:nth-child(2) .metric-label',homeText(code,'railStatus')]
   ];
   await page.waitForFunction(rows=>rows.every(([selector,expected])=>document.querySelector(selector)?.textContent?.trim()===expected),checks,{timeout:9000}).catch(async error=>{
    const diff=await page.evaluate(rows=>rows.filter(([selector,expected])=>document.querySelector(selector)?.textContent?.trim()!==expected).map(([selector,expected])=>({selector,expected,actual:document.querySelector(selector)?.textContent?.trim()})),checks);
    console.error('V3.11 HOME MISMATCH',JSON.stringify({code,viewport,diff,errors}));throw error;
   });
   for(const [selector,key] of [['#uxMerliMore','moreWays'],['#uxAccountContext','accountContext'],['#uxAccountCopy','accountCopy']]){
    assert.equal((await page.locator(selector).textContent()).trim(),uxText(code,key),code+'/'+key);
   }
   assert.equal(await page.locator('#uxMerliSuggestions').getAttribute('aria-label'),uxText(code,'suggestedActions'));
   assert.equal(await page.locator('#uxMerliHomeDismiss').getAttribute('aria-label'),uxText(code,'dismissTip'));
   await page.locator('#uxMerliMore').evaluate(node=>node.click());
   assert.equal((await page.locator('#uxMerliMore').textContent()).trim(),uxText(code,'hideExtra'));
   await page.locator('#uxMerliMore').evaluate(node=>node.click());
   for(const mode of ['visitor','executive','student','resident']){
    await page.evaluate(value=>{window.SGBUDDY_CORE.state.mode=value;document.dispatchEvent(new Event('sgbuddy:persona'))},mode);
    await page.waitForFunction(expected=>document.querySelector('#uxPersonaName')?.textContent?.includes(expected),contextMode(code,mode,'label'),{timeout:4500});
    assert.equal((await page.locator('#uxMerliMore').textContent()).trim(),uxText(code,'moreWays'));
   }
   const shortcuts=await page.locator('.ux-primary-shortcuts .ux-shortcut').count();
   assert.equal(shortcuts,4,'Four resident-mode quick actions '+code);
   await page.waitForFunction(expected=>document.querySelector('[data-ux-go="apps"] .ux-shortcut-copy strong')?.textContent===expected,homeText(code,'shortcutApps'),{timeout:5000});
   await page.evaluate(()=>{
    document.querySelector('#nextUpTitle').textContent='A departure is imminent';
    document.querySelector('#nextUpCopy').textContent='Prioritized from nearby and saved transport.';
    document.querySelector('#nextUpAction').textContent='3 min';
    document.querySelector('#updatedAt').textContent='Updated 02:29 PM';
    document.querySelector('#weatherLabel').textContent='Partly Cloudy (Day) · 59% humidity · 0.0 mm rain';
    document.querySelector('#envPsi').textContent='148 · Unhealthy';
    document.querySelector('#locationStatus').textContent='Using your current location · not stored in cloud';
    window.SGBUDDY_HOME_I18N.refresh();
   });
   await page.waitForFunction(expected=>Object.entries(expected).every(([selector,value])=>document.querySelector(selector)?.textContent?.trim()===value),{
    '#nextUpTitle':homeText(code,'imminent'),
    '#nextUpCopy':homeText(code,'prioritizedNearby'),
    '#nextUpAction':homeText(code,'minutes',{count:'3'}),
    '#updatedAt':homeText(code,'updated',{time:'02:29 PM'}),
    '#locationStatus':homeText(code,'locationPrivacy'),
    '#weatherLabel':weatherTerm(code,'Partly Cloudy (Day)')+' · 59% '+weatherTerm(code,'humidity')+' · 0.0 mm '+weatherTerm(code,'rain'),
    '#envPsi':'148 · '+weatherTerm(code,'Unhealthy')
   },{timeout:9000});
  }
  await page.evaluate(()=>{
   document.querySelector('#nextUpTitle').textContent='EWL → Pasir Ris';
   document.querySelector('#locationStatus').textContent='User home label: 123 Example Rd';
   document.querySelector('#weatherLabel').textContent='Official sensor: pending';
   window.SGBUDDY_HOME_I18N.refresh();
  });
  await page.locator('#sgbLanguage').selectOption('fr');
  await page.waitForTimeout(150);
  for(const [selector,original] of [
   ['#nextUpTitle','EWL → Pasir Ris'],
   ['#locationStatus','User home label: 123 Example Rd'],
   ['#weatherLabel','Official sensor: pending']
  ])assert.equal((await page.locator(selector).textContent()).trim(),original,selector+' source protection');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+16),'No mobile overflow');
  assert.deepEqual(errors,[],errors.join(' / '));
 }finally{await ctx.close()}
}
try{
 await check({width:390,height:844});
 await check({width:1366,height:900});
 console.log('V3.11 BROWSER PASS: 12 languages, resident dashboard controls, modes, Merli, train and weather terms, live status, provider preservation, mobile and desktop.');
}finally{await browser.close()}
