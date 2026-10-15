import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_V412_KEYS,HOME_V412} from '../lib/i18n-home-surface-v412.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
const read=path=>readFileSync(path,'utf8');
const boot=read('app-v090.js'),html=read('index.html'),sw=read('sw.js');
assert.ok(boot.includes("__SGBUDDY_CLIENT_VERSION__='4.22.0'"),'client release version');
assert.ok(boot.includes("textContent='v4.22.0'"),'visible version');
assert.ok(html.includes('id="appVersion"')&&html.includes('v4.22.0'),'HTML release version');
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v87'"),'fresh service-worker cache');
assert.ok(boot.includes("import('/app-i18n-remaining-v411.js')).then(()=>import('/app-i18n-home-surface-v412.js')"),'V4.11 + V4.12 boot order');
for(const asset of ['/app-i18n-remaining-v411.js','/app-i18n-home-surface-v412.js','/lib/i18n-home-surface-v412.mjs','/app-offline-v480.js','/app-events-v470.js','/app-calendar-v460.js']){
 assert.ok(sw.includes("'"+asset+"'"),asset+' not precached');
}
assert.equal(HOME_V412_KEYS.length,27);
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES)assert.equal(Object.keys(HOME_V412[code]||{}).length,27,code+' translations');
const events=JSON.parse(read('data/events-v470.json')).events;
const review=JSON.parse(read('data/events-review-queue-v470.json')).candidates;
const approvals=JSON.parse(read('data/event-approvals-v490.json')).approvals;
assert.equal(events.length,11,'unexpected published event count');
assert.ok(review.every(x=>!events.some(e=>e.id===x.id)),'review-only candidate published');
assert.equal(approvals.length,0,'unapproved event published');
assert.ok(sw.includes('sgbuddy-offline-packs-v480')&&sw.includes("SHELL_PATHS.has(url.pathname)"),'offline behavior changed');
assert.ok(read('scripts/check-all.mjs').includes("scripts/check-v412.mjs"),'full regression missing V4.12 checks');
console.log('V4.12 production release contract PASS: badge, PWA cache, offline, 12 locales and approved events.');
