import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(x,'utf8');
const boot=read('app-v090.js'),html=read('index.html'),sw=read('sw.js');
assert.ok(boot.includes("__SGBUDDY_CLIENT_VERSION__='4.18.0'"),'release bootstrap version');
assert.ok(boot.includes("textContent='v4.18.0'"),'visible version');
assert.ok(html.includes('v4.18.0'),'html version');
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v83'"),'service-worker cache');
for(const module of ['/app-i18n-remaining-v411.js','/app-i18n-categories-v4100.js','/app-i18n-runtime-v490.js','/app-offline-v480.js','/app-events-v470.js','/app-calendar-v460.js']) {
 assert.ok(boot.includes("import('"+module+"')"),module+' not loaded');
 assert.ok(sw.includes("'"+module+"'"),module+' not pre-cached');
}
const events=JSON.parse(read('data/events-v470.json')).events;
const queue=JSON.parse(read('data/events-review-queue-v470.json')).candidates;
assert.equal(events.length,11,'unexpected curated-event count');
assert.ok(queue.every(x=>!events.some(e=>e.id===x.id)),'candidate leak into publication');
assert.equal(JSON.parse(read('data/event-approvals-v490.json')).approvals.length,0,'unexpected approvals');
assert.ok(sw.includes('sgbuddy-offline-packs-v480'),'offline cache');
console.log('V4.12 production static release contract passed');
