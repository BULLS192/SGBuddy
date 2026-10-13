import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const food=JSON.parse(read('data/food-stalls-v180.json'));
const menus=JSON.parse(read('data/vendor-menus-v210.json'));
const page=read('app-v120.js'),foodUi=read('app-food-v180.js'),foodPack=read('lib/i18n-food-status-v400.mjs'),directoryPack=read('lib/i18n-directory-v410.mjs'),html=read('index.html'),sw=read('sw.js');
const ids=new Set();
assert.ok(food.stalls.length>=90,'V2.2 NEA food expansion missing');
const historical=food.stalls.filter(x=>/^nea-award-listed-20\d\d$/.test(x.reviewStatus));
assert.ok(historical.filter(x=>x.reviewStatus==='nea-award-listed-2022').length>=10,'Missing NEA 2022 award records');
assert.ok(historical.filter(x=>x.reviewStatus==='nea-award-listed-2023').length>=10,'Missing NEA 2023 award records');
for(const p of food.stalls){
 assert.ok(p.id&&!ids.has(p.id),'Duplicate food candidate ID '+p.id);ids.add(p.id);
 assert.ok(p.name&&p.centreName&&p.operatingStatus==='unverified','Historical hawker lead must remain unverified');
 assert.equal(p.priceSgd,null,'No scraped or estimated hawker price');
 assert.equal(p.halalCertified,null,'Never infer halal certification');
 if(/^nea-award-listed-20\d\d$/.test(p.reviewStatus)){
  assert.ok(p.sourceUrl?.startsWith('https://www.nea.gov.sg/'),'Official NEA source required');
  if(['nea-award-listed-2022','nea-award-listed-2023'].includes(p.reviewStatus))assert.ok(/^20\d\d-\d\d-\d\d$/.test(p.sourceCoverageAsOf||''),'New historical award rows require exact publication date');
 }
 if(!p.centreId)assert.ok(p.referenceUrl,'Unmapped centre must be discoverable via source link, without OneMap match claim');
}
assert.ok(menus.items.every(x=>x.availabilityCurrent===false&&x.halalCertified===null),'Vendor listings must not be presented as live verified stock');
for(const marker of ['discoverQuality','discoverIncludeArchive','sourceCoverageAsOf','sourceAge','friendlyDate','freshnessLabel','isArchived','About these listings','Details may have changed','Show older supermarket listings','https://www.chas.sg/clinic-locator','https://www.sfa.gov.sg/tools-and-resources/track-records']){
 assert.ok(page.includes(marker)||directoryPack.includes(marker),'Discover quality UX missing '+marker);
}
for(const marker of ['foodAwardYear','nea-award-listed-20','data-stall-address','current trading unverified','award']){
 assert.ok(foodUi.includes(marker)||foodPack.includes(marker),'Food evidence UX missing '+marker);
}
assert.ok(html.includes('library-quality-v220.css')&&sw.includes('library-quality-v220.css'),'V2.2 quality UI missing from page or PWA shell');
assert.ok(!page.includes('All source ages')&&!page.includes('discoverFreshnessFilter')&&!page.includes('renderQuality()'),'Technical source-age dashboard and filter must not appear in consumer Discover');
assert.ok(!page.includes('library-quality-stats'),'Consumer app should not render editorial audit metrics');
const report=read('scripts/library-quality-v220.mjs');
for(const item of ['library-verification-queue-v220.csv','invalidOperatingClaims','archivalSupermarkets','sourceCoverageAsOf'])assert.ok(report.includes(item),'Review pipeline missing '+item);
execFileSync(process.execPath,['scripts/library-quality-v220.mjs'],{stdio:'inherit'});
const summary=JSON.parse(read('reports/library-quality-v220.json'));
assert.equal(summary.directory.total,2949,'Unintended changes in directory record count');
assert.equal(summary.directory.archivalSupermarkets,477,'Historic supermarkets must not be treated as current locations');
assert.equal(summary.directory.verifiedLive,0,'No live verifications have been completed yet');
assert.equal(summary.food.historicalAndEditorialLeads,food.stalls.length);
assert.ok(summary.food.neaHistoricalAwardLeads>=45,'Historical awards research expansion was lost');
assert.ok(fs.existsSync('reports/library-verification-queue-v220.csv'));
console.log('SGBuddy V2.2 quality/food regression PASS:',summary.directory.total,'source-linked directory rows;',food.stalls.length,'food leads; current verified operation',summary.directory.verifiedLive);
