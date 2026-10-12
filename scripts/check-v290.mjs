import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LOCALES,normalizeLocale} from '../lib/i18n-v280.mjs';
import {CORE_UI,CORE_LABEL_KEYS,coreUi} from '../lib/i18n-interface-v290.mjs';
const read=p=>fs.readFileSync(p,'utf8');
assert.equal(CORE_LABEL_KEYS.length,59,'Expected broad interface key coverage');
assert.equal(new Set(CORE_LABEL_KEYS).size,CORE_LABEL_KEYS.length);
assert.equal(Object.keys(CORE_UI).length,12);
for(const locale of LOCALES){
 const rows=coreUi(locale.code);
 assert.ok(rows,'Missing '+locale.code);
 assert.equal(Object.keys(rows).length,CORE_LABEL_KEYS.length,locale.code+' missing keys');
 for(const key of CORE_LABEL_KEYS)assert.ok(rows[key]?.trim(),locale.code+' missing '+key);
 if(locale.code!=='en'){
  for(const key of ['trains','refresh','savedAddresses','privateSync','money','accountOpen','diagnostics','install'])
   assert.notEqual(rows[key],coreUi('en')[key],locale.code+' fallback in '+key);
 }
}
assert.equal(coreUi('pt-br').install,coreUi('pt-BR').install);
const app=read('app-i18n-v290.js'),boot=read('app-v090.js'),sw=read('sw.js'),html=read('index.html');
assert.ok(app.includes("doc.addEventListener('sgbuddy:language'"),'Language changes not wired');
assert.ok(app.includes('new MutationObserver(schedule)'),'Dynamic UI changes must stay translated');
assert.ok(app.includes('doc.documentElement.lang=locale'),'HTML lang attribute must update');
assert.ok(!app.includes("['#navMoney'"),'Do not recreate the Saved/Money navigation regression');
assert.ok(app.includes("['#fxConvert','convert']")&&app.includes("['#planTrip','planWith']"),'Core controls not translated');
assert.ok(boot.includes("import('/app-i18n-v290.js')")&&boot.includes("4.0.0"),'V2.9 module not loaded');
assert.ok(html.includes('v4.0.0'));
for(const asset of ['/app-i18n-v290.js','/lib/i18n-interface-v290.mjs'])assert.ok(sw.includes(asset),'Offline localization asset missing '+asset);
assert.ok(sw.includes('sgbuddy-shell-v68'),'Installed PWA must refresh');
console.log('SGBuddy V2.9 PASS: 12 locale dictionaries, 59 UI keys each, dynamic UI updates, Saved/Money isolation and PWA cache.');
