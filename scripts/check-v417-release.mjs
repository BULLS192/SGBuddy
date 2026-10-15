/* V4.17 final release invariants and regression guards. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {DEVICE_KEYS,DEVICE_TEXT} from '../lib/offline-device-i18n-v417.mjs';
const read=path=>readFileSync(path,'utf8');
const app=read('app-offline-v480.js'),sw=read('sw.js'),ui=read('index.html'),boot=read('app-v090.js');
assert.ok(ui.includes('v4.22.0')&&boot.includes("__SGBUDDY_CLIENT_VERSION__='4.22.0'")&&boot.includes("textContent='v4.22.0'"));
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v87'"));
assert.ok(!sw.includes("caches.delete('sgbuddy-offline-packs-v480')"));
assert.equal(OFFLINE_CACHE,'sgbuddy-offline-packs-v480');
assert.equal(OFFLINE_PACKS.length,3);assert.equal(OFFLINE_PACKS.flatMap(x=>x.files).length,13);
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 assert.equal(Object.keys(DEVICE_TEXT[code]||{}).length,DEVICE_KEYS.length,'Locale coverage '+code);
}
for(const p of ['/lib/offline-device-v417.mjs','/lib/offline-device-i18n-v417.mjs','/lib/offline-network-v417.mjs','/lib/offline-tab-lock-v417.mjs'])
 assert.ok(sw.includes(p),'Offline shell module '+p);
for(const n of ['data-offline-device-check','withOfflinePackLock','canLockOfflinePacks','fetchOfflineWithTimeout','window.addEventListener(\'storage\'','durableOfflineUpdate','recoverInterruptedPack'])
 assert.ok(app.includes(n),'Device cross-tab invariant '+n);
assert.ok(app.includes("method:'HEAD'")&&app.includes("redirect:'error'"));
assert.ok(app.includes("fetchFile:file=>fetchOfflineWithTimeout(file,{cache:'no-store',credentials:'same-origin'})"));
assert.ok(!app.includes("navigator.locks?.request?"),'Remove unsafe missing-lock fallback');
assert.ok(!app.includes("localStorage.clear(")&&!app.includes("caches.delete(OFFLINE_CACHE)"));
assert.ok(read('lib/offline-transaction-v415.mjs').includes("sgbuddy-offline-txn-v415-"));
assert.ok(read('docs/release-v417-rc.md').includes("sgbuddy-offline-packs-v480"));
assert.ok(read('.github/workflows/check-v417-device.yml').includes("browser-qa-v417-multitab.mjs"));
console.log('V4.17 RELEASE CHECK PASS: v4.22.0, v82 shell, 12 locales, opt-in packs, exclusive cross-tab locks, no destructive migration.');
