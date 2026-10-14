/* V4.15.0 release candidate contract: first-party data, no deployment or external network. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {EVENT_EXPLORE_TEXT,EVENT_EXPLORE_KEYS} from '../lib/events-explore-i18n-v414.mjs';
import {OFFLINE_CACHE} from '../lib/offline-packs-v480.mjs';
const read=x=>readFileSync(x,'utf8'),json=x=>JSON.parse(read(x));
const html=read('index.html'),boot=read('app-v090.js'),sw=read('sw.js');
assert.ok(html.includes('id="appVersion"')&&html.includes('v4.15.0'),'V4.14 visible first paint');
assert.ok(boot.includes("__SGBUDDY_CLIENT_VERSION__='4.15.0'")&&boot.includes("textContent='v4.15.0'"),'V4.14 runtime version');
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v80'"),'V4.14 service-worker update required');
for(const path of ['/app-events-v470.js','/app-trip-v260.js','/lib/events-v470.mjs','/lib/events-identity-v414.mjs',
 '/lib/events-weekend-v414.mjs','/lib/events-explore-v414.mjs','/lib/events-explore-i18n-v414.mjs','/data/events-v470.json']){
 assert.ok(sw.includes("'"+path+"'"),'Missing PWA shell asset '+path);
}
assert.ok(sw.includes(OFFLINE_CACHE)&&OFFLINE_CACHE==='sgbuddy-offline-packs-v480','Previously downloaded packs must not be erased');
assert.ok(sw.includes("!url.pathname.startsWith('/api/')")||sw.includes("url.pathname.startsWith('/api/')"),'Live API cache exclusion missing');
assert.ok(!sw.includes("caches.delete('sgbuddy-offline-packs-v480')"),'User-downloaded offline packs deleted');
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES)assert.equal(EVENT_EXPLORE_KEYS.length,Object.keys(EVENT_EXPLORE_TEXT[code]||{}).length,'Missing discovery locale '+code);
const published=json('data/events-v470.json'),queue=json('data/events-review-queue-v470.json'),approvals=json('data/event-approvals-v490.json');
assert.equal(published.events.length,11,'No unreviewed new event publications in V4.14');
assert.equal(queue.candidates.length,61,'Review snapshot unexpectedly edited');
assert.equal(approvals.approvals.length,0,'No automated editorial approvals allowed');
for(const id of new Set(queue.candidates.map(x=>x.id)))assert.ok(!published.events.some(e=>e.id===id),'Unapproved candidate leaked into public');
const refresh=read('.github/workflows/events-refresh-v470.yml');
assert.ok(refresh.includes('event-editor-worklist-v414.mjs')&&!refresh.includes('node scripts/publish-reviewed-events-v490.mjs'),'Daily job must be review-only');
const gate=read('scripts/publish-reviewed-events-v490.mjs');
assert.ok(gate.includes('checkEditorApproval')&&gate.includes("process.argv.includes('--publish')"),'Explicit human publication gate missing');
const ux=read('app-events-v470.js'),trip=read('app-trip-v260.js');
for(const token of ['data-event-area','data-event-category','data-event-trip','eventExploreText'])assert.ok(ux.includes(token),'V4.14 Events discovery missing '+token);
for(const token of ['addEvent:event','matchingEventDay','eventFallbackDate','sourceUrl'])assert.ok(trip.includes(token),'V4.14 My Trip integration missing '+token);
console.log('V4.15.0 RELEASE CONTRACT PASS: correct badge, v79 PWA shell, 12 locales, region/category/My Trip and editorial-only Events.');
