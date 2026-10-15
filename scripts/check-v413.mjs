/* V4.13: release invariants for curated events, offline packs and multilingual boot.
 * Operates entirely on checked-in first-party data. No network, keys or writes.
 */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {isValidDay,validateEvent,normalizedKey} from '../lib/events-v470.mjs';
import {OFFLINE_CACHE,OFFLINE_PACKS,packDone,validateOfflineRequest} from '../lib/offline-packs-v480.mjs';
const read=path=>readFileSync(path,'utf8');
const json=path=>JSON.parse(read(path));
const published=json('data/events-v470.json');
const review=json('data/events-review-queue-v470.json');
const approvals=json('data/event-approvals-v490.json');
const sources=json('data/event-sources-v470.json');
const feeds=json('data/event-feeds-v470.json');
const venues=json('data/event-venue-sources-v490.json');
assert.equal(LOCALES.length,12,'12 supported locales required');
assert.deepEqual(new Set(LOCALES.map(x=>x.code)).size,12,'duplicate locale codes');
for(const key of ['events','candidates','approvals'])assert.ok(Array.isArray(({events:published.events,candidates:review.candidates,approvals:approvals.approvals})[key]),key+' malformed');
const sourceIds=new Set(sources.sources.map(x=>x.id));
const ids=new Set(),keys=new Set();
for(const event of published.events){
 assert.ok(validateEvent(event,sourceIds),'invalid published event '+event.id);
 assert.ok(!ids.has(event.id),'duplicate published id '+event.id);
 assert.ok(!keys.has(normalizedKey(event)),'duplicate curated listing '+event.id);
 ids.add(event.id);keys.add(normalizedKey(event));
}
for(const candidate of review.candidates)assert.ok(!ids.has(candidate.id),'unreviewed candidate visible in published dataset '+candidate.id);
const approved=new Set(approvals.approvals.filter(x=>x.decision==='approved').map(x=>x.candidateId));
for(const candidate of review.candidates)if(!approved.has(candidate.id))assert.ok(!ids.has(candidate.id),'candidate leaked to public');
assert.equal(feeds.feeds.length>0,true,'no official feeds configured');
for(const f of feeds.feeds){
 assert.equal(f.mode,'review-only',f.id+' bypasses review');
 const url=new URL(f.url),publicPage=new URL(f.publicPage);
 assert.equal(url.protocol,'https:');
 assert.equal(url.hostname,publicPage.hostname,'publisher host changed');
 assert.ok(sourceIds.has(f.sourceId),'unregistered feed source');
}
assert.equal(venues.mode,'review-only');
for(const v of venues.sources){
 assert.equal(new URL(v.url).hostname,v.host,'venue host mismatch');
 assert.ok(v.maxDetails>0&&v.maxDetails<=20,'unbounded venue crawl');
 assert.ok(sourceIds.has(v.sourceId),'unregistered venue');
}
const scheduled=read('.github/workflows/events-refresh-v470.yml');
const publisher=read('scripts/publish-reviewed-events-v490.mjs');
assert.ok(scheduled.includes('sync-event-feeds-v470.mjs')&&scheduled.includes('sync-event-venues-v490.mjs'),'scheduled discovery disabled');
assert.ok(!scheduled.includes('publish-reviewed-events-v490.mjs')&&!scheduled.includes('--publish'),'scheduled job must not approve/publish events');
for(const gate of ['approval.sourceVerified','approval.publicAdmissionVerified','approval.publicListingRightsVerified','approval.reviewedBy','approval.sourceUrl!==row.sourceUrl'])assert.ok(publisher.includes(gate),'missing editorial gate '+gate);
assert.equal(OFFLINE_PACKS.length,3,'three opt-in packs required');
assert.equal(OFFLINE_CACHE,'sgbuddy-offline-packs-v480','offline user downloads must survive PWA upgrade');
const filePaths=new Set();
for(const pack of OFFLINE_PACKS){
 assert.ok(pack.files.length>0,'empty pack '+pack.id);
 for(const path of pack.files){
  assert.ok(path.startsWith('/data/')&&path.endsWith('.json'),'unexpected offline content '+path);
  assert.ok(!path.includes('/api/')&&!path.includes('..'),'unsafe offline content '+path);
  assert.ok(validateOfflineRequest(path,'https://sgbuddy.omnidite.com'),'not allowlisted '+path);
  assert.ok(!validateOfflineRequest(path+'?live=1','https://sgbuddy.omnidite.com'),'query should not be cached');
  assert.ok(!validateOfflineRequest('https://evil.example/'+path.slice(1),'https://sgbuddy.omnidite.com'),'foreign origin cached');
  assert.ok(existsSync(path.slice(1)),'offline file missing '+path);
  json(path.slice(1));filePaths.add(path);
 }
 assert.ok(packDone(pack.files,pack),'pack completion contract '+pack.id);
}
assert.equal(filePaths.size,13,'offline pack file count changed; review new sources/rights before release');
const sw=read('sw.js'),boot=read('app-v090.js'),html=read('index.html');
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v87'"),'unexpected release shell');
assert.ok(sw.includes(OFFLINE_CACHE)&&sw.includes('SHELL_PATHS.has(url.pathname)'),'offline cache fetch safety');
assert.ok(boot.includes("import('/app-i18n-home-surface-v412.js')"),'V4.12 translations not loaded');
assert.ok(html.includes('v4.22.0')&&boot.includes('v4.22.0'),'public version unexpected');
assert.ok(sw.includes('/app-events-v470.js')&&sw.includes('/app-offline-v480.js'),'feature assets not in shell');
console.log('V4.13 STATIC PASS: 12 locales, curated Events, review-only sources, publishing firewall, three safe offline packs and V4.12 boot.');
