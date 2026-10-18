/* V4.25 air-quality colors: representative bands, stale, unavailable and mobile. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await context.addInitScript(()=>{
 localStorage.setItem('sgc-persona-onboarded','1');
 localStorage.setItem('sgc-mode','visitor');
 localStorage.setItem('sgc-location-choice','not-now');
});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const current=()=>new Date().toISOString();
async function paint(psi,pm,{offline=false,oldPsi=false,oldPm=false}={}){
 const stamp=current(),old='2025-10-01T00:00:00Z';
 await page.evaluate(sample=>{
  window.SGBUDDY_CORE.state.weather={
   source:sample.offline?'device-cache':'live',
   dataQuality:{status:'complete',staleSignals:[]},
   airQuality:{
    region:'north',
    psi24h:sample.psi===null?null:{overall:sample.psi,regions:{north:sample.psi,south:50},updatedAt:sample.oldPsi?sample.old:sample.stamp},
    pm25OneHour:sample.pm===null?null:{value:sample.pm,regions:{north:sample.pm,south:20},updatedAt:sample.oldPm?sample.old:sample.stamp}
   }
  };
  document.dispatchEvent(new Event('sgbuddy:weather'));
 },{psi,pm,offline,oldPsi,oldPm,stamp,old});
}
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForSelector('#v120AirPanel',{timeout:60000});
 await paint(45,20);
 assert.equal(await page.locator('#envPsi').getAttribute('data-air-tone'),'good');
 assert.equal(await page.locator('#envPm25').getAttribute('data-air-tone'),'good');
 await paint(75,90);
 assert.equal(await page.locator('#envPsi').getAttribute('data-air-tone'),'moderate');
 assert.equal(await page.locator('#envPm25').getAttribute('data-air-tone'),'moderate');
 await paint(150,180);
 assert.equal(await page.locator('#envPsi').getAttribute('data-air-tone'),'unhealthy');
 assert.equal(await page.locator('#envPm25').getAttribute('data-air-tone'),'unhealthy');
 await paint(250,275);
 assert.equal(await page.locator('#envPsi').getAttribute('data-air-tone'),'very-unhealthy');
 assert.equal(await page.locator('#envPm25').getAttribute('data-air-tone'),'hazardous');
 await paint(330,32);
 assert.equal(await page.locator('#envPsi').getAttribute('data-air-tone'),'hazardous');
 assert.equal(await page.locator('#envPm25').getAttribute('data-air-tone'),'good');
 await paint(40,175,{oldPsi:true});
 assert.equal(await page.locator('#envPsi').getAttribute('data-air-tone'),'unknown','Stale PSI shown as green');
 assert.equal(await page.locator('#envPm25').getAttribute('data-air-tone'),'unhealthy');
 await paint(40,18,{offline:true});
 assert.equal(await page.locator('#envPsi').getAttribute('data-air-tone'),'unknown','Offline PSI shown green');
 assert.equal(await page.locator('#envPm25').getAttribute('data-air-tone'),'unknown','Offline PM2.5 shown green');
 await paint(null,80);
 assert.equal(await page.locator('#envPsi').getAttribute('data-air-tone'),'unknown');
 assert.equal(await page.locator('#envPm25').getAttribute('data-air-tone'),'moderate');
 assert.equal(await page.locator('#v120AirPanel .v120-region').count(),5);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+12),'Mobile overflow');
 assert.deepEqual(errors,[],'Air-quality browser errors');
 console.log('V4.25 Air Quality BROWSER PASS: independent thresholds and stale/offline/unknown safeguards.');
}finally{await context.close();await browser.close();}
