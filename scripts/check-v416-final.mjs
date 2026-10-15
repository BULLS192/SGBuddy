/* V4.16 release-candidate invariants: never silently touch private or opted-out data. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {OFFLINE_V416_KEYS,OFFLINE_V416,offline416Text} from '../lib/offline-freshness-i18n-v416.mjs';
const read=p=>readFileSync(p,'utf8');
const shell=read('sw.js'),app=read('app-offline-v480.js'),txn=read('lib/offline-transaction-v415.mjs');
assert.equal(OFFLINE_CACHE,'sgbuddy-offline-packs-v480','User downloads must survive shell upgrades');
assert.deepEqual(OFFLINE_PACKS.map(x=>x.id),['calendar','essentials','food']);
assert.equal(OFFLINE_PACKS.flatMap(p=>p.files).length,13);
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 assert.equal(Object.keys(OFFLINE_V416[code]||{}).length,OFFLINE_V416_KEYS.length,code+' locale coverage');
 for(const key of OFFLINE_V416_KEYS)assert.ok(offline416Text(code,key,{count:1}).length>1,code+' '+key);
}
assert.ok(read('index.html').includes('v4.22.0'));
assert.ok(read('app-v090.js').includes("__SGBUDDY_CLIENT_VERSION__='4.22.0'"));
assert.ok(shell.includes("const CACHE = 'sgbuddy-shell-v87'"));
assert.ok(!shell.includes("caches.delete('sgbuddy-offline-packs-v480')"));
assert.ok(!shell.includes("key.startsWith('sgbuddy-offline-txn-')"));
for(const path of ['/lib/offline-freshness-v416.mjs','/lib/offline-freshness-i18n-v416.mjs','/lib/offline-transaction-v415.mjs'])
 assert.ok(shell.includes(path),'missing PWA module '+path);
for(const label of ['data-offline-check-changes','data-offline-apply-changes','refreshDownloadedPacks','navigator.storage.persist','planSelectiveOfflineUpdate','filesToUpdate:plan.files'])
 assert.ok(app.includes(label),'missing explicit V4.16 UX '+label);
assert.ok(app.includes("method:'HEAD'")&&app.includes("redirect:'error'"),'Probe must not download bodies or redirect');
assert.ok(app.includes("fetchFile:file=>fetchOfflineWithTimeout(file,{cache:'no-store',credentials:'same-origin'})"),'Cancelable offline downloads must keep same-origin and no-store policies');
assert.ok(app.includes('if(!checked?.present)continue'),'No opt-in to new downloads');
assert.ok(app.includes('if(!info.present)continue'),'Full refresh must preserve opt-in');
assert.ok(app.includes('await lock(pack.id,async()=>{'),'Selectively update under per-pack Web Lock');
assert.ok(app.includes("window.addEventListener('online',()=>{status=tx('reconnected');present()})"),'No automatic download on reconnect');
assert.ok(!app.includes('localStorage.clear(')&&!app.includes('caches.delete(OFFLINE_CACHE)'));
for(const label of ['filesToUpdate','selected.length!==pack.files.length','for(const file of pack.files)','TXN_MARKER','recoverInterruptedPack'])
 assert.ok(txn.includes(label),'Journal recovery/selected-file invariant '+label);
assert.ok(read('scripts/check-all.mjs').includes("scripts/check-v416-selective.mjs"));
assert.ok(read('.github/workflows/check-v416-freshness.yml').includes('browser-qa-v416-complete.mjs'));
assert.ok(read('docs/release-v416-rc.md').includes('sgbuddy-offline-packs-v480'));
console.log('V4.16 RELEASE CONTRACT PASS: v4.22.0, shell v81, 13 public JSON files, 12 locales, selective crash-safe writes, manual-only changes.');
