import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const data=JSON.parse(read('data/travel-essentials-v250.json'));
const old=JSON.parse(read('data/everyday-apps-v240.json'));
const ui=read('app-travel-v250.js'),apps=read('app-apps-v240.js'),boot=read('app-v090.js');
const discover=read('app-v120.js'),nav=read('app-ux-v160.js'),html=read('index.html'),sw=read('sw.js'),css=read('travel-v250.css');
assert.equal(old.counts.total,69,'V2.4 baseline should be unchanged');
assert.equal(data.schemaVersion,'2.5.0');
assert.equal(data.catalogue.length,6,'Expect 3 apps and 3 connectivity web services');
assert.equal(data.catalogue.filter(a=>a.kind==='mobile-app').length,3);
assert.equal(data.catalogue.filter(a=>a.kind==='web-service').length,3);
assert.deepEqual(new Set(data.guides.map(g=>g.group)),new Set(['payments','messaging','connectivity']));
assert.ok(data.guides.length>=7,'All major travel guidance should be included');
assert.ok(data.checklist.length>=5,'Pre-arrival checklist incomplete');
const ids=new Set();
const allowedHosts=['www.whatsapp.com','www.wechat.com','render.alipay.com','www.singtel.com','www.starhub.com','ibuyprepaid.m1.com.sg','www.visitsingapore.com','www.alipayplus.com','www.abs.org.sg'];
for(const row of [...data.catalogue,...data.guides]){
 assert.ok(!ids.has(row.id),'Duplicate ID '+row.id);ids.add(row.id);
 const url=new URL(row.sourceUrl);assert.equal(url.protocol,'https:');
 assert.ok(allowedHosts.includes(url.hostname),'Unexpected source host '+url.hostname);
 assert.ok(!url.username&&!url.password);
 assert.ok(row.zh&&Object.values(row.zh).some(x=>typeof x==='string'&&x.length>5),'Missing bilingual content '+row.id);
 if(row.kind){
  assert.deepEqual([row.ios,row.android],[null,null],'No unverified app-store deep links');
  assert.ok(row.accountNeeded&&Array.isArray(row.modes)&&row.modes.length>0);
 }
}
for(const row of data.checklist){
 assert.ok(row.en&&row.zh&&row.id,'Bilingual checklist incomplete');
 assert.ok(!ids.has(row.id),'Duplicate checklist key');ids.add(row.id);
}
for(const brand of ['WhatsApp','Alipay','WeChat','Singtel','StarHub','M1'])assert.ok(data.catalogue.some(a=>a.name.includes(brand)),'Missing '+brand);
for(const text of ["sgbuddy-language-v250","sgbuddy-travel-checklist-v250","sgbuddy:language","data-travel-section","data-travel-apps","data-travel-route","aria-pressed","sgbuddy:discover-tab","documentElement.lang","data-prep-check"]){
 assert.ok(ui.includes(text),'Travel UI missing '+text);
}
assert.ok(ui.includes("localStorage.setItem(CHECK_KEY")&&ui.includes("localStorage.setItem(LANGUAGE_KEY"),'Persistence incomplete');
assert.ok(apps.includes("/data/travel-essentials-v250.json")&&apps.includes("extra"),'Existing app directory should merge travel additions');
assert.ok(apps.includes('translated(a,')&&apps.includes('sgbuddy:language'),'App library bilingual integration missing');
assert.ok(discover.includes("['travel','Travel prep']")&&discover.includes("'travelEssentials'"),'Discover tab not wired');
assert.ok(nav.includes("tab==='travel'"),'Legacy Discover list must hide when Travel Prep shown');
assert.ok(boot.includes("import('/app-travel-v250.js')")&&/2\.(5|6)\.[0-9]+/.test(boot),'Travel module not loaded');
assert.ok(html.includes('travel-v250.css')&&/v2\.(5|6)\.[0-9]+/.test(html),'CSS or version missing');
for(const asset of ['/app-travel-v250.js','/travel-v250.css','/data/travel-essentials-v250.json'])assert.ok(sw.includes(asset),'PWA cache missing '+asset);
assert.ok(/sgbuddy-shell-v5[2-9]/.test(sw),'PWA cache must refresh');
for(const sel of ['[hidden]','data-ux-theme="light"','focus-visible','max-width:480px'])assert.ok(css.includes(sel),'Missing visual/accessible state '+sel);
execFileSync(process.execPath,['--check','app-travel-v250.js'],{stdio:'inherit'});
console.log('SGBuddy V2.5 Travel Essentials PASS: 6 source-linked services, 7 bilingual guides, 5 bilingual checklist steps, language picker, navigation and PWA coverage.');

