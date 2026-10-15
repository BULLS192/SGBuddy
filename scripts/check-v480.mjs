import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OFFLINE_PACKS,OFFLINE_CACHE,packFor,packDone,allowedOfflineUrls,validateOfflineRequest} from '../lib/offline-packs-v480.mjs';
import {OFFLINE_KEYS,OFFLINE_STRINGS,offlineText} from '../lib/offline-i18n-v480.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
const sw=readFileSync('sw.js','utf8'),html=readFileSync('index.html','utf8'),boot=readFileSync('app-v090.js','utf8');
assert.equal(OFFLINE_CACHE,'sgbuddy-offline-packs-v480');
assert.deepEqual(OFFLINE_PACKS.map(p=>p.id),['calendar','essentials','food']);
assert.equal(new Set(OFFLINE_PACKS.flatMap(p=>p.files)).size,OFFLINE_PACKS.flatMap(p=>p.files).length);
for(const pack of OFFLINE_PACKS){
 assert.equal(packFor(pack.id),pack);
 assert.ok(!packDone([],pack));
 assert.ok(packDone(pack.files,pack));
 for(const file of pack.files){
  assert.ok(file.startsWith('/data/')&&file.endsWith('.json'));
  assert.ok(allowedOfflineUrls().has(file));
  assert.ok(validateOfflineRequest(file,'https://sgbuddy.omnidite.com'));
  assert.ok(!file.includes('/api/')&&!file.includes('map'));
 }
}
assert.ok(!validateOfflineRequest('https://bad.example/data/events-v470.json','https://sgbuddy.omnidite.com'));
assert.ok(!validateOfflineRequest('/api/nearby','https://sgbuddy.omnidite.com'));
assert.ok(!validateOfflineRequest('/data/events-v470.json?foo=bar','https://sgbuddy.omnidite.com'));
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 assert.equal(Object.keys(OFFLINE_STRINGS[code]).length,OFFLINE_KEYS.length);
 for(const key of OFFLINE_KEYS)assert.ok(offlineText(code,key).length>1,code+' '+key);
}
assert.ok(sw.includes('const PACK_CACHE=')&&sw.includes('sgbuddy-offline-packs-v480'));
assert.ok(sw.includes("url.origin!==self.location.origin")&&sw.includes("url.pathname.startsWith('/api/')"));
assert.ok(sw.includes("key.startsWith('sgbuddy-shell-v')"));
assert.ok(sw.includes("SHELL_PATHS.has(url.pathname)"));
for(const file of ['/app-offline-v480.js','/offline-v480.css','/lib/offline-packs-v480.mjs','/lib/offline-i18n-v480.mjs'])assert.ok(sw.includes(file));
assert.ok(sw.includes('c.addAll([...new Set(SHELL)])'),'precache must deduplicate assets before atomic install');
assert.ok(!sw.includes("keys.filter(k=>k!==CACHE)"),'must preserve downloaded packs');
assert.ok(html.includes('/offline-v480.css'));
assert.ok(boot.includes("import('/app-offline-v480.js')"));
assert.ok(boot.includes("='4.22.0'"),'preserve public release badge');
import {EVENT_CATEGORY_TEXT,EVENT_DESCRIPTIONS,localizedCategory,localizedEventSummary} from '../lib/events-content-v480.mjs';
const events=JSON.parse(readFileSync('data/events-v470.json','utf8')).events;
for(const {code} of LOCALES){
 assert.equal(Object.keys(EVENT_CATEGORY_TEXT[code]||{}).length,10,'Event category localization: '+code);
 assert.equal(Object.keys(EVENT_DESCRIPTIONS[code]||{}).length,11,'Event summaries localization: '+code);
 for(const e of events){
  assert.ok(localizedCategory(code,e.category)!==e.category||code==='en','English event category leaked: '+code);
  assert.ok(localizedEventSummary(code,e).length>4,'Missing event summary '+code+': '+e.id);
 }
}
assert.ok(sw.includes('/lib/events-content-v480.mjs'));
assert.ok(readFileSync('app-events-v470.js','utf8').includes('localizedEventSummary(locale(),e)'));

console.log('V4.8 offline packs validated: '+OFFLINE_PACKS.length+' packs and '+LOCALES.length+' locales.');
