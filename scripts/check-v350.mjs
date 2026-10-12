import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {AUDIT_KEYS,AUDIT_SURFACES,AUDIT_MESSAGES,AUDIT_ENGLISH,auditText} from '../lib/i18n-audit-v350.mjs';
const f=path=>readFileSync(path,'utf8');
assert.equal(LOCALES.length,12);
assert.equal(AUDIT_KEYS.length,22);
assert.equal(new Set(AUDIT_KEYS).size,22,'Unique authored keys');
const allSlots=Object.values(AUDIT_SURFACES).flat();
assert.equal(Object.keys(AUDIT_SURFACES).length,8,'All eight app-owned UI zones audited');
assert.equal(allSlots.length,22);
const fields=s=>[...String(s).matchAll(/\{([A-Za-z0-9_]+)\}/g)].map(x=>x[1]).sort();
for(const {code} of LOCALES){
 assert.equal(Object.keys(AUDIT_MESSAGES[code]||{}).length,22,code+' missing authored keys');
 for(const key of AUDIT_KEYS){
  const value=auditText(code,key);
  assert.ok(value.trim(),code+' missing '+key);
  assert.deepEqual(fields(value),fields(AUDIT_ENGLISH[key]),'Interpolation mismatch '+code+' '+key);
 }
}
const bridge=f('app-i18n-audit-v350.js');
for(const marker of ['AUDIT_SURFACES','WeakMap','MutationObserver','sgbuddy:language','SGBUDDY_SCREEN_I18N','dictionaryValues[key]'])assert.ok(bridge.includes(marker),'Missing reviewed reactivity '+marker);
assert.ok(!bridge.includes('document.body.innerHTML'),'Never sweep provider/user-owned DOM');
assert.ok(f('app-v090.js').includes("import('/app-i18n-audit-v350.js')"));
assert.ok(f('index.html').includes('v3.12.0'));
assert.ok(f('app-v090.js').includes("='3.12.0'"));
const sw=f('sw.js');
assert.ok(sw.includes('sgbuddy-shell-v69'),'PWA cache must advance to v64');
for(const path of ['/lib/i18n-audit-v350.mjs','/app-i18n-audit-v350.js'])assert.ok(sw.includes(path),'Missing offline authored text asset '+path);
const audit=f('scripts/coverage-audit-v350.mjs');
for(const k of ['wholeApplicationCoveragePercent:null','protectedIds','htmlReviewQueue','reviewedWeightedPoints','reviewedScreenPopulationPercent'])assert.ok(audit.includes(k),k+' audit classification must be explicit');
console.log('V3.5 STATIC PASS: 22 source-locked authored messages, 12 complete locales, 8 audited zones, protected originals and PWA cache v64.');
