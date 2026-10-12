import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {SYSTEM_KEYS,SYSTEM_MESSAGES,SYSTEM_ENGLISH,SYSTEM_SOURCE_KEYS,systemText} from '../lib/i18n-system-v330.mjs';
const read=file=>readFileSync(file,'utf8');
assert.equal(LOCALES.length,12,'Twelve supported locales required');
assert.equal(SYSTEM_KEYS.length,30,'V3.3 scoped first-party phrase count changed');
assert.equal(new Set(SYSTEM_KEYS).size,SYSTEM_KEYS.length,'System keys must be unique');
assert.equal(Object.keys(SYSTEM_SOURCE_KEYS).length,SYSTEM_KEYS.length,'Original phrases must be one-to-one, never ambiguous');
for(const {code} of LOCALES){
 assert.equal(Object.keys(SYSTEM_MESSAGES[code]||{}).length,SYSTEM_KEYS.length,code+' missing values');
 for(const key of SYSTEM_KEYS){
  assert.ok(String(systemText(code,key)).trim(),code+' missing '+key);
  assert.equal(SYSTEM_SOURCE_KEYS[SYSTEM_ENGLISH[key]],key,'Source mismatch '+key);
  if(code!=='en')assert.notEqual(systemText(code,key),SYSTEM_ENGLISH[key],'English fallback '+code+' '+key);
 }
}
const html=read('index.html'),boot=read('app-v090.js'),compare=read('app-v110.js'),
      bridge=read('app-i18n-system-v330.js'),sw=read('sw.js');
for(const key of ['accountTitle','accountIntro','accountVerificationNote','accountOfflineNote','resetTitle','resetHint','forgotPassword','resetAction','accountSyncAction','accountHubOpen','accountHubIntro'])assert.ok(bridge.includes("'"+key+"'"),'Unbound account UI phrase '+key);
for(const key of ['compareTitle','compareHeadline','compareDescription','comparePlaceholder','sortBest','sortNearest'])assert.ok(bridge.includes("'"+key+"'"),'Unbound place UI phrase '+key);
for(const selector of ['#profileDescription','#profileSyncBadge','#v110CompareResults .empty-inline','#v110OpenTransitRoute'])assert.ok(bridge.includes(selector),'Missing first-party dynamic text binding '+selector);
assert.ok(bridge.includes('SYSTEM_SOURCE_KEYS[current]'),'Dynamic messages must use exact source lookup');
assert.ok(bridge.includes("'#profileId','notLinked'"),'Unbound legacy unlinked-profile state');
assert.ok(compare.includes(SYSTEM_ENGLISH.compareEmpty),'Transport comparison empty message differs from source-locked catalogue');
assert.ok(!SYSTEM_ENGLISH.compareEmpty.includes('three modes'),'Comparison must not promise three modes when four may be available');
assert.ok(!bridge.includes('document.body.innerHTML'),'Do not blindly translate all page contents');
for(const key of ['accountTitle','accountIntro','accountVerificationNote','accountOfflineNote'])assert.ok(html.includes(SYSTEM_ENGLISH[key]),'Published account original unexpectedly changed '+key);
for(const key of ['compareTitle','compareHeadline','compareDescription','comparePlaceholder'])assert.ok(compare.includes(SYSTEM_ENGLISH[key]),'Original compare UI text unexpectedly changed '+key);
assert.ok(boot.includes("import('/app-i18n-system-v330.js')"),'V3.3 module not loaded');
assert.ok(boot.includes("='4.0.0'")&&html.includes('v4.0.0'),'Release badge mismatch');
assert.ok(sw.includes("sgbuddy-shell-v68"),'PWA cache must be updated');
for(const path of ['/app-i18n-system-v330.js','/lib/i18n-system-v330.mjs'])assert.ok(sw.includes(path),'Offline V3.3 translation missing '+path);
console.log('V3.3 PASS: 30 source-locked first-party messages in 12 languages; UI binding, source integrity, preserved API text and PWA cache v62.');
