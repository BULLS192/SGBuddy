/* SGBuddy V4.20 release candidate offline+trip acceptance (no production deployment). */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {STORE_KEY} from '../lib/trip-v260.mjs';
import {tripOverview,dayRouteSegments,suggestDayPlaces} from '../lib/trip-insights-v420.mjs';
const read=p=>readFileSync(p,'utf8');
const html=read('index.html'),boot=read('app-v090.js'),sw=read('sw.js'),quality=read('app-trip-quality-v420.js');
assert.ok(html.includes('id="appVersion"')&&html.includes('v4.20.0'));
assert.ok(boot.includes("__SGBUDDY_CLIENT_VERSION__='4.20.0'")&&boot.includes("textContent='v4.20.0'"));
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v85'"));
for(const file of ['/app-trip-quality-v420.js','/lib/trip-insights-v420.mjs','/trip-quality-v420.css','/app-trip-v260.js','/lib/trip-v260.mjs']){
 assert.ok(sw.includes("'"+file+"'"),'Required offline asset not precached: '+file);
}
assert.ok(sw.includes("const PACK_CACHE='sgbuddy-offline-packs-v480'"));
assert.ok(sw.includes("key.startsWith('sgbuddy-shell-v')&&key!==CACHE"));
assert.ok(!sw.includes("caches.delete('sgbuddy-offline-packs-v480')"));
assert.equal(OFFLINE_CACHE,'sgbuddy-offline-packs-v480');
assert.equal(OFFLINE_PACKS.length,3);
assert.equal(OFFLINE_PACKS.reduce((n,p)=>n+p.files.length,0),13);
assert.equal(STORE_KEY,'sgbuddy-my-trips-v260');
assert.equal(LOCALES.length,12);
for(const token of ['tripOverview','dayRouteSegments','suggestDayPlaces','data-v420-print','printMarkup','escapeHTML(stop.note)'])assert.ok(quality.includes(token),token);
for(const f of [tripOverview,dayRouteSegments,suggestDayPlaces])assert.equal(typeof f,'function');
const publisher=JSON.parse(read('data/events-v470.json')),queue=JSON.parse(read('data/events-review-queue-v470.json'));
assert.equal(publisher.events.length,11);
assert.ok(queue.candidates.length>=70);
const publicIds=new Set(publisher.events.map(e=>e.id));
for(const event of queue.candidates)assert.ok(!publicIds.has(event.id),'Review candidate leaked to publication');
assert.equal(JSON.parse(read('data/event-approvals-v490.json')).approvals.length,0);
assert.ok(!sw.includes('/data/events-review-queue-v470.json'),'Editorial queue must never be cached by public app shell');
console.log('V4.20 RC PASS: v85 shell precaches new trip modules, preserves private trip storage and three downloaded packs, 12 locales and strict event approvals.');
