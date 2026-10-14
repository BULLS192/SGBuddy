import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CORE_LABEL_KEYS,CORE_UI} from '../lib/i18n-interface-v290.mjs';
import {EXTENDED_KEYS,EXTENDED_UI} from '../lib/i18n-extended-v300.mjs';
import {EXPLAINER_KEYS,EXPLAINERS} from '../lib/i18n-explainers-v300.mjs';
const file=p=>readFileSync(p,'utf8');
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 for(const [name,keys,table] of [['core',CORE_LABEL_KEYS,CORE_UI],['extended',EXTENDED_KEYS,EXTENDED_UI],['explainers',EXPLAINER_KEYS,EXPLAINERS]]){
  const translations=table[code];
  assert.ok(translations,'Missing '+code+' '+name);
  assert.equal(Object.keys(translations).length,keys.length,'Missing '+code+' '+name+' keys');
  for(const key of keys)assert.ok(typeof translations[key]==='string'&&translations[key].trim(),code+' missing '+name+'.'+key);
 }
}
assert.equal(EXTENDED_KEYS.length,62);
assert.equal(EXPLAINER_KEYS.length,8);
const runtime=file('app-i18n-v300.js'),source=file('app-device-translate-v300.js'),boot=file('app-v090.js'),sw=file('sw.js'),html=file('index.html');
assert.ok(runtime.includes("['#buddyLauncher > span:last-child','askMerli']"),'Merli launcher label must be selected, not avatar');
for(const ref of ['foodSavedOnly','sgbFactQuery','foodExplorer','everydayApps','sgbuddy:language','sgbuddy:persona','MutationObserver'])
 assert.ok(runtime.includes(ref),ref+' missing extended localization wiring');
assert.ok(source.includes("const TranslatorAPI=globalThis.Translator"),'Browser translation feature detection missing');
assert.ok(source.includes("action.addEventListener('click',start)"),'Source translation must only start on user action');
assert.ok(source.includes('original(node)')&&source.includes('sourceText=new WeakMap()'),'Original factual content must be recoverable');
assert.ok(source.includes('sourceLanguage:\'en\'')&&!source.includes('fetch('),'No remote source translation or user-content leakage');
assert.ok(runtime.includes('halal.muis.gov.sg/halal/establishments'),'Original MUIS reference must stay');
for(const path of ['/app-i18n-v300.js','/app-device-translate-v300.js','/lib/i18n-extended-v300.mjs','/lib/i18n-explainers-v300.mjs','/i18n-v300.css'])
 assert.ok(sw.includes(path),'Missing PWA cache entry '+path);
assert.ok(sw.includes('sgbuddy-shell-v79'),'Must bust installed shell cache');
assert.ok(boot.includes("import('/app-i18n-v300.js')")&&boot.includes("import('/app-device-translate-v300.js')"),'Modules not loaded sequentially');
assert.ok(boot.includes("='4.14.0'")&&html.includes('v4.14.0'),'Version badge inconsistent');
console.log('V3.0 STATIC I18N PASS: 12 locales × '+(CORE_LABEL_KEYS.length+EXTENDED_KEYS.length+EXPLAINER_KEYS.length)+' reviewed interface strings; original-source safeguards, on-device opt-in and offline cache.');
