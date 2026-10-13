import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const extra=json('data/food-leads-v261.json'),dining=json('data/dining-services-v261.json');
const legacy=json('data/food-stalls-v180.json').stalls,guide=json('data/guide-stalls-v230.json').stalls;
const oldApps=json('data/everyday-apps-v240.json').catalogue,travel=json('data/travel-essentials-v250.json').catalogue;
const food=read('app-food-v180.js'),apps=read('app-apps-v240.js'),picker=read('app-food-tools-v261.js');
const boot=read('app-v090.js'),html=read('index.html'),sw=read('sw.js'),css=read('food-tools-v261.css');
const clean=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const known=new Set([...legacy,...guide].map(x=>clean(x.name))),addedNames=new Set();
assert.equal(extra.stalls.length,46,'Expected 46 previously unlisted 2026 hawker leads, without duplicated name');
assert.equal(extra.counts.priorDeduplicated,10,'Old entries should remain untouched');
for(const p of extra.stalls){
 assert.ok(p.id&&p.name&&p.centreName&&p.area,'Require named stall and source-reported centre');
 assert.ok(!addedNames.has(clean(p.name))&&!known.has(clean(p.name)),'Duplicate pre-existing or new stall '+p.name);
 addedNames.add(clean(p.name));
 assert.equal(p.reviewStatus,'cna-guide-2026');
 assert.equal(p.operatingStatus,'unverified');
 assert.equal(p.guideAsOf,'2026-07-28');
 assert.equal(p.priceSgd,null);
 assert.equal(p.halalCertified,null);
 assert.equal(p.vegetarianAvailable,null);
 assert.equal(p.stallNumber,null);
 assert.equal(p.centreId,null);
 assert.equal(p.address,null);
 assert.equal(p.postal,null);
 assert.equal(p.openingHours,null);
 assert.equal(new URL(p.sourceUrl).hostname,'cnalifestyle.channelnewsasia.com');
 assert.equal(new URL(p.guideUrl).hostname,'guide.michelin.com');
 assert.equal(new URL(p.referenceUrl).hostname,'www.google.com');
}
const ids=new Set([...oldApps,...travel].map(a=>a.id));
const expected=new Set(['Burpple','Chope','treatsure','Jiak Simi? Food Wheel']);
assert.equal(dining.additions.length,4);
assert.equal(dining.enhancements.length,4);
assert.equal(dining.services.length,5);
assert.deepEqual(new Set(dining.additions.map(a=>a.name)),expected);
for(const a of dining.additions){
 assert.ok(!ids.has(a.id),'New app id duplicates baseline');ids.add(a.id);
 assert.ok(a.publisher&&a.summary&&a.purpose&&a.accountNeeded&&Array.isArray(a.modes));
 assert.ok(['mobile-app','web-service'].includes(a.kind));
 const u=new URL(a.sourceUrl);assert.equal(u.protocol,'https:');
 if(a.kind==='web-service'){assert.equal(a.ios,null);assert.equal(a.android,null)}
 if(a.ios)assert.ok(/^https:\/\/apps\.apple\.com\/sg\/app\//.test(a.ios));
 if(a.android)assert.ok(/^https:\/\/play\.google\.com\/store\/apps\/details\?id=/.test(a.android));
}
for(const x of dining.enhancements){
 assert.ok(ids.has(x.id),'Dining enhancement must update a real app: '+x.id);
 assert.ok(/^https:\/\//.test(x.sourceUrl));
}
const platformIds=new Set([...oldApps,...travel,...dining.additions].map(x=>x.id));
for(const service of dining.services){
 assert.ok(service.id&&service.title&&service.caution);
 assert.ok(service.providerIds?.length>=1);
 for(const id of service.providerIds)assert.ok(platformIds.has(id),'Unknown provider '+id);
}
assert.equal(dining.foodAiResearch.status,'research-only');
assert.equal(dining.foodAiResearch.publicLaunch,false);
for(const marker of ['food-leads-v261.json','cna-guide-2026','extraRows','guide-listed-2026'])assert.ok(food.includes(marker),'Food explorer not wired '+marker);
for(const marker of ['dining-services-v261.json','enhancements','additions'])assert.ok(apps.includes(marker),'App catalogue not wired '+marker);
for(const marker of ['foodToolsV261','foodPickArea','foodPickCraving','foodPickButton','foodPickSaved','data-food-pick-save','data-food-service','sgbuddy:food-tools-ready','localStorage.setItem','operatingStatus','unverified'])assert.ok(picker.includes(marker),'Picker not wired '+marker);
assert.ok(picker.includes('Math.random')&&picker.includes('lastId'),'Random picker must avoid immediate duplicate');
assert.ok(!picker.includes('foodAiResearch')&&!picker.includes('innerHTML=review'),'Research-only FoodAI or scraped reviews must not show in consumer UI');
assert.ok(boot.includes("import('/app-trip-v260.js')")&&boot.includes("import('/app-food-tools-v261.js')"),'Food tools must load after trip builder');
assert.ok(boot.includes('4.12.0')&&html.includes('v4.12.0'));
for(const f of ['/app-food-tools-v261.js','/food-tools-v261.css','/data/food-leads-v261.json','/data/dining-services-v261.json'])assert.ok(sw.includes(f),'Installed PWA missing '+f);
assert.ok(sw.includes('sgbuddy-shell-v76'),'PWA version not bumped');
assert.ok(html.includes('/food-tools-v261.css'));
for(const x of ['data-ux-theme="light"','max-width:630px','focus-visible','min-height:44px'])assert.ok(css.includes(x),'Responsive/light accessibility selector missing '+x);
execFileSync(process.execPath,['scripts/food-review-v261.mjs'],{stdio:'inherit'});
const quality=json('reports/food-discovery-v261.json');
assert.ok(quality.counts.foodCardsAfterDeduplication>=140,'Guide expansion must add useful records');
assert.ok(quality.counts.unverifiedCurrentOperation>=140,'No fake current-operation claims');
assert.ok(fs.existsSync('reports/food-review-v261.csv'));
console.log('SGBuddy V2.6 Food PASS:',extra.stalls.length,'new guide leads;',dining.additions.length,'new app/tool entries;',dining.enhancements.length,'app enhancements;',dining.services.length,'food service groups; no fake availability');
