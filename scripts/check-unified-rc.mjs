/* Single release-candidate contract: preserve events, offline and both localization waves. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {EVENT_DESCRIPTIONS,localizedEventSummary} from '../lib/events-content-v480.mjs';
import {RUNTIME_V490_KEYS} from '../lib/i18n-runtime-v490.mjs';
import {DISCOVER_KIND_V4100,CONTROL_V4100_KEYS} from '../lib/i18n-categories-v4100.mjs';
const content=path=>readFileSync(path,'utf8'),json=path=>JSON.parse(content(path));
const boot=content('app-v090.js'),sw=content('sw.js');
const chain=['/app-i18n-food-discover-v450.js','/app-calendar-v460.js','/app-events-v470.js','/app-offline-v480.js','/app-i18n-runtime-v490.js','/app-i18n-categories-v4100.js'];
let pos=-1;
for(const asset of chain){
 const next=boot.indexOf("import('"+asset+"')");
 assert.ok(next>pos,'missing or misordered boot stage: '+asset);
 pos=next;
 assert.ok(sw.includes("'"+asset+"'"),'PWA shell missing '+asset);
}
for(const asset of ['/lib/i18n-runtime-v490.mjs','/lib/i18n-categories-v4100.mjs','/lib/events-content-v480.mjs','/lib/offline-packs-v480.mjs'])assert.ok(sw.includes("'"+asset+"'"),'uncached module '+asset);
assert.equal(LOCALES.length,12);
assert.equal(OFFLINE_PACKS.length,3);
assert.equal(RUNTIME_V490_KEYS.length,17);
assert.equal(DISCOVER_KIND_V4100.length,15);
assert.equal(CONTROL_V4100_KEYS.length,15);
const saved=json('data/events-v470.json');
const intake=json('data/events-intake-v470.json');
assert.equal(saved.events.length,11);
assert.equal(intake.events.length,11);
for(const locale of LOCALES){
 assert.equal(Object.keys(EVENT_DESCRIPTIONS[locale.code]||{}).length,11,'untranslated curated descriptions '+locale.code);
 for(const event of saved.events)assert.ok(localizedEventSummary(locale.code,event).length>3,'missing localized listing '+locale.code+':'+event.id);
}
const approvals=json('data/event-approvals-v490.json');
assert.equal(approvals.approvals.length,0,'unapproved feed candidates must not be published');
const feed=json('data/event-feeds-v470.json'),venue=json('data/event-venue-sources-v490.json');
assert.ok(feed.feeds.some(x=>x.id==='suntec-json'));
assert.ok(venue.sources.some(x=>x.sourceId==='expo'));
assert.ok(venue.sources.some(x=>x.sourceId==='suntec-city'));
const daily=content('.github/workflows/events-refresh-v470.yml');
assert.ok(!daily.includes('publish-reviewed-events-v490.mjs'));
const eventQA=content('.github/workflows/check-v490.yml');
assert.ok(eventQA.includes('scripts/browser-qa-events-v490.mjs'),'event device emulation overwritten');
const locQA=content('.github/workflows/check-v430-localization-audit.yml');
assert.ok(locQA.includes('scripts/browser-qa-v490.mjs'),'dynamic l10n QA overwritten');
assert.ok(locQA.includes('scripts/browser-qa-v4100.mjs'),'V4.10 l10n QA missing');
assert.ok(content('scripts/check-all.mjs').includes("scripts/check-v4100.mjs"));
assert.ok(sw.includes("c.addAll([...new Set(SHELL)])"),'legacy duplicate PWA precache regression');
assert.ok(sw.includes("key.startsWith('sgbuddy-shell-v')"),'offline packs must not be cleared on activation');
assert.ok(boot.includes("='4.18.0'"),'production badge must not be prematurely changed');
console.log('SGBuddy unified release static contract passed: 12 locales, 11 curated events, 3 offline packs, both v490 QA suites.');
