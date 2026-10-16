import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const origin='http://127.0.0.1:8765';
const errs=[];
const create=async()=>{
 const ctx=await browser.newContext({viewport:{width:1280,height:850},locale:'en-SG',acceptDownloads:true});
 await ctx.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
 return {ctx,page};
};
const openSharing=async(page)=>{
 await page.locator('#navMoney').click();
 await page.locator('#ux423TripView').waitFor({state:'visible',timeout:15000});
 const disclosure=page.locator('#ux423TripTools');
 await disclosure.waitFor({state:'visible',timeout:15000});
 if(!await disclosure.evaluate(el=>el.open))await disclosure.locator('summary').click();
 await page.locator('#tripMakeLink').waitFor({state:'visible',timeout:15000});
};
try{
 const a=await create(),b=await create();
 await a.page.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
 await a.page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.23.0',{timeout:30000});
 await a.page.locator('#navMoney').click();
 await a.page.locator('#tripNewName').fill('Singapore weekend');
 await a.page.locator('#tripStartDate').fill('2027-01-01');
 await a.page.locator('#tripNumberOfDays').fill('3');
 await a.page.locator('#tripCreateForm button[type="submit"]').click();
 await a.page.locator('[name="customName"]').fill('Merlion sunset');
 await a.page.locator('[name="customArea"]').fill('Marina Bay');
 await a.page.locator('#tripCustomForm button[type="submit"]').click();
 await a.page.locator('[data-trip-note="0"]').fill('Bring camera');
 await a.page.locator('[data-trip-note="0"]').press('Tab');
 await openSharing(a.page);await a.page.locator('#tripMakeLink').click();
 const link=await a.page.locator('#tripShareLinkInput').inputValue();
 assert.ok(link.startsWith(origin+'/#sgtrip='),'Share should be self-contained fragment without external service');
 assert.ok(link.length<7800,'Link length bounded');
 await b.page.goto(link,{waitUntil:'domcontentloaded',timeout:30000});
 await b.page.locator('#tripImportShared').waitFor({state:'visible',timeout:30000});
 assert.match(await b.page.locator('.trip-incoming h5').textContent(),/Singapore weekend/);
 assert.ok((await b.page.locator('.trip-incoming').textContent()).includes('1 stops'),'Preview should show stop count');
 assert.equal(await b.page.evaluate(()=>JSON.parse(localStorage.getItem('sgbuddy-my-trips-v260')||'{"trips":[]}').trips.length),0,'Share link must never auto-save');
 await b.page.locator('#tripImportShared').click();
 assert.equal(await b.page.locator('#tripSelect option').count(),1,'Guest should import a separate editable trip');
 assert.equal(await b.page.locator('.trip-stop').count(),1);
 assert.equal(await b.page.locator('[data-trip-note="0"]').inputValue(),'Bring camera');
 assert.ok(!(await b.page.evaluate(()=>location.hash)).includes('sgtrip'),'Consumed link must not persist in address bar');
 // Shared-link import may leave the preview onscreen; open the independent editor first.
 await b.page.locator('#navMoney').click();
 await b.page.locator('#ux423TripView').waitFor({state:'visible'});
 await b.page.locator('[data-trip-note="0"]').fill('Camera and snacks');
 await b.page.locator('[data-trip-note="0"]').press('Tab');
 await openSharing(b.page);await b.page.locator('#tripMakeLink').click();
 const reply=await b.page.locator('#tripShareLinkInput').inputValue();
 assert.notEqual(reply,link,'Collaborator edits produce a new snapshot link');
 assert.equal(await a.page.locator('[data-trip-note="0"]').inputValue(),'Bring camera','Original must remain unchanged');
 const c=await create();
 await c.page.goto(reply,{waitUntil:'domcontentloaded',timeout:30000});
 await c.page.locator('#tripImportShared').waitFor({state:'visible',timeout:30000});
 await c.page.locator('#tripDismissShared').click();
 assert.ok(!(await c.page.evaluate(()=>location.hash)).includes('sgtrip'),'Discard should clear share payload');
 await c.page.locator('#tripImportJsonFile').setInputFiles({name:'trip.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'sgbuddy.trip',version:1,trip:{v:1,n:'File guest',s:'2027-01-01',d:[[['manual-1','Museum','Do','Downtown','','','',0]]]}}))});
 await c.page.locator('#tripSelect').waitFor({state:'visible',timeout:15000});
 assert.equal(await c.page.locator('#tripSelect option').count(),1,'Import JSON trip file');
 // Open the editor before changing language; the preview alone does not mount the editable share panel.
 await c.page.locator('#navMoney').click();
 await c.page.locator('#ux423TripView').waitFor({state:'visible'});
 await c.page.locator('#sgbLanguage').selectOption('zh-CN');
 await c.page.waitForFunction(()=>document.querySelector('#tripShareTitle')?.textContent?.includes('分享'),null,{timeout:12000});
 await openSharing(c.page);
 await c.page.setViewportSize({width:375,height:812});
 assert.ok(await c.page.locator('.trip-share-v270').evaluate(el=>el.getBoundingClientRect().width<=innerWidth+8),'Share panel must fit phone viewport');
 assert.deepEqual(errs,[],'Browser JavaScript errors');
 console.log('SGBuddy V2.7 CHROMIUM PASS: link creation, isolated cross-device preview/import, no auto-save, edited copy round trip, discard, JSON import, Chinese and mobile layout.');
}finally{await browser.close()}
