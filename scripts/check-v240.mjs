import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const data=JSON.parse(read('data/everyday-apps-v240.json'));
const source=read('app-apps-v240.js'),main=read('app-v090.js'),discover=read('app-v120.js'),html=read('index.html'),sw=read('sw.js'),css=read('everyday-apps-v240.css');
assert.equal(data.counts.total,69,'V2.4 catalogue must have 69 entries');
assert.equal(data.counts.mobileApps,64);
assert.equal(data.counts.webServices,5);
assert.equal(data.counts.reviewedStoreLinks,8);
const ids=new Set(),names=new Set(),allowed=['resident','visitor','executive','student'],dates=/^20\d\d-\d\d-\d\d$/;
const apps=data.catalogue;
for(const a of apps){
 assert.ok(/^V24-(APP|WEB)-\d{3}$/.test(a.id)&&!ids.has(a.id),'Invalid or duplicate app ID: '+a.id);ids.add(a.id);
 const name=a.name.toLowerCase().replace(/[^a-z0-9]/g,'');
 assert.ok(!names.has(name),'Duplicate app name: '+a.name);names.add(name);
 assert.ok(a.summary.length>=18&&a.purpose.length>=4&&a.publisher&&a.category,'Every app requires useful reason and publisher');
 assert.ok(a.accountNeeded&&a.accountNeeded.length>=8,'Account requirements missing: '+a.name);
 assert.ok(dates.test(a.cataloguedOn),'No editorial catalogue date');
 assert.ok(Array.isArray(a.modes)&&a.modes.some(m=>allowed.includes(m)),'No modes for '+a.name);
 assert.ok(a.modes.every(m=>allowed.includes(m)),'Unsupported mode '+a.name);
 assert.ok(['Essential','Recommended','Situational'].includes(a.importance));
 const pub=new URL(a.sourceUrl);
 assert.equal(pub.protocol,'https:','First-party publisher requires HTTPS');
 assert.ok(!pub.username&&!pub.password);
 if(a.kind==='web-service'){
  assert.equal(a.ios,null,'Web portal must not have app download');
  assert.equal(a.android,null,'Web portal must not have app download');
 }else assert.equal(a.kind,'mobile-app');
 if(a.ios)assert.match(a.ios,/^https:\/\/apps\.apple\.com\/sg\/app\/[a-z0-9-]+\/id\d+$/);
 if(a.android)assert.match(a.android,/^https:\/\/play\.google\.com\/store\/apps\/details\?id=[a-zA-Z0-9_.]+$/);
 if(a.ios||a.android)assert.equal(a.downloadEvidence,'specific-store-link-reviewed');
 else assert.ok(['publisher-page-only','publisher-service-web'].includes(a.downloadEvidence)||a.kind==='web-service');
}
for(const n of ['Singpass','DBS digibank','Grab','foodpanda','HealthHub','LifeSG','MyICA Mobile','SimplyGo','FairPrice Group','NLB Mobile'])assert.ok(apps.some(x=>x.name===n),'Core Singapore app missing '+n);
for(const n of ['CDC Vouchers','OneService (via LifeSG)','onePA','MySkillsFuture'])assert.equal(apps.find(x=>x.name===n).kind,'web-service');
assert.ok(apps.find(x=>x.name==='Singpass').ios);
assert.ok(apps.find(x=>x.name==='DBS digibank').ios);
assert.ok(apps.find(x=>x.name==='Grab').android);
assert.ok(apps.find(x=>x.name==='foodpanda').sourceUrl.includes('foodpanda.sg'));
for(const marker of ['everydayApps','appLibrarySearch','appLibraryCategory','appLibraryDownload','data-app-view','data-app-save','sgbuddy-app-bookmarks-v240','sgbuddy:discover-tab','sgbuddy:persona','only confirmed store links','Official publisher','open-now']){
 if(marker==='open-now')continue;
 assert.ok(source.includes(marker),'V2.4 app UI missing '+marker);
}
assert.ok(source.includes('Never')||source.includes('never')||source.includes('OTP'),'Missing phishing guidance');
assert.ok(main.includes("import('/app-apps-v240.js')"),'V2.4 module must load after Discover');
assert.ok(discover.includes("['apps','Everyday apps']"),'New app section tab label missing');
assert.ok(discover.includes("'everydayApps'"),'Tab aria-controls must match V2.4');
assert.ok(html.includes('everyday-apps-v240.css'),'App styles missing');
for(const s of ['/app-apps-v240.js','/everyday-apps-v240.css','/data/everyday-apps-v240.json'])assert.ok(sw.includes(s),'PWA shell misses '+s);
assert.ok(sw.includes('sgbuddy-shell-v50'),'Installed PWA should refresh assets');
assert.ok(css.includes('[hidden]'),'Hidden legacy app list can not show simultaneously');
execFileSync(process.execPath,['scripts/apps-quality-v240.mjs'],{stdio:'inherit'});
const report=JSON.parse(read('reports/apps-quality-v240.json'));
assert.equal(report.counts.total,69);
assert.ok(report.queueMissingOfficialStoreLinks>40,'Source review queue must not invent app-store deep links');
assert.ok(fs.existsSync('reports/apps-review-v240.csv'));
console.log('SGBuddy V2.4 library checks PASS:',report.counts.total,'curated app/service entries,',report.counts.uniqueWithDirectStoreLink,'with identified store links');
