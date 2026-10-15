import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CONTEXT_MODES,CONTEXT_FIELDS,CONTEXT_GLOBAL_KEYS,CONTEXT_MESSAGES,contextMode,contextText} from '../lib/i18n-context-v370.mjs';
const read=path=>readFileSync(path,'utf8');
assert.equal(LOCALES.length,12);
assert.equal(CONTEXT_MODES.length,5);
assert.equal(CONTEXT_FIELDS.length,9);
assert.equal(CONTEXT_GLOBAL_KEYS.length,7);
const vars=value=>[...String(value).matchAll(/\{([\w]+)\}/g)].map(v=>v[1]).sort();
for(const {code} of LOCALES){
 const p=CONTEXT_MESSAGES[code];assert.ok(p,code+' missing');
 for(const mode of CONTEXT_MODES){
  assert.equal(Object.keys(p.modes[mode]||{}).length,9,code+'/'+mode+' incomplete');
  for(const field of CONTEXT_FIELDS){
   const value=contextMode(code,mode,field),en=contextMode('en',mode,field);
   assert.ok(value.trim(),code+'/'+mode+'/'+field+' empty');
   assert.deepEqual(vars(value),vars(en),code+'/'+mode+'/'+field+' placeholders');
  }
 }
 for(const key of CONTEXT_GLOBAL_KEYS){
  assert.deepEqual(vars(p.globals[key]),vars(CONTEXT_MESSAGES.en.globals[key]),code+' '+key+' placeholders');
  assert.ok(contextText(code,key).length,code+' '+key+' empty');
 }
}
const bridge=read('app-i18n-context-v370.js');
for(const selector of ['#modeText','#personaFocusTitle','#personaFocusCopy','#journeyMapTitle','#personaPanelLabel','#personaPanelTitle','#personaPanelCopy','#placesPersonaHint','#dataCoreStatus','#placesSection h2'])
 assert.ok(bridge.includes(selector),'Missing first-party target '+selector);
for(const token of ['SGBUDDY_CONTEXT_I18N','sgbuddy:language','MutationObserver','CONTEXT_MESSAGES','sourceOwned','matchTemplate','recommended'])
 assert.ok(bridge.includes(token),'Missing reactivity '+token);
assert.ok(read('app-v090.js').includes("import('/app-i18n-context-v370.js')"));
assert.ok(read('app-v090.js').includes("='4.20.0'"));
assert.ok(read('index.html').includes('v4.20.0'));
const sw=read('sw.js');
for(const asset of ['/app-i18n-context-v370.js','/lib/i18n-context-v370.mjs'])assert.ok(sw.includes(asset),'Offline asset '+asset);
assert.ok(sw.includes('sgbuddy-shell-v85'));
assert.ok(read('scripts/inspect-js-localization-v370.mjs').includes('untriagedCount'));
assert.ok(read('scripts/export-native-review-v370.mjs').includes("status:'pending'"));
const review=read('docs/native-review-v370.csv').trim().split('\n');
assert.equal(review.length,573,'Expected 572 pending candidate-review rows plus header');
assert.ok(review[0].includes('reviewer')&&review[0].includes('proposed_translation'),'Missing native-speaker review fields');
assert.ok(review.slice(1).every(row=>row.includes(',"pending",')),'Do not mark non-native review as approved');
console.log('V3.7 STATIC PASS: 12 locales, 5 personas, 9 context fields, 7 global tokens, source-safe dynamic reactivity and PWA v66.');
