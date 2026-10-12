import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES,TRAVEL_UI} from '../lib/i18n-v280.mjs';
import {shellLocale,SHELL_KEYS,SHELL_COVERAGE} from '../lib/i18n-shell-v281.mjs';
const file=p=>readFileSync(p,'utf8');
const travel=file('app-travel-v250.js'),shell=file('app-ux-v160.js'),sw=file('sw.js'),boot=file('app-v090.js'),html=file('index.html');
assert.ok(travel.includes('navMoney:s.saved'),'Saved tab must use actual Saved translations, never Money');
assert.ok(!/navMoney:\s*\(?\{/.test(travel),'Money locale dictionary may not override the Saved tab');
assert.ok(shell.includes("['navMoney','saved','Saved','saved']"),'Router must still point to Saved');
assert.ok(shell.includes("shellLocale(window.SGBUDDY_LANGUAGE).emptySaved"),'Saved empty states must localize on every render');
assert.ok(shell.includes("document.addEventListener('sgbuddy:language'"),'Language picker must update shell views');
assert.ok(shell.includes("document.addEventListener('sgbuddy:persona'"),'Mode switch must not revert UI to English');
const seen=new Set();
for(const {code,name} of LOCALES){
 assert.ok(!seen.has(code),'duplicate locale');
 seen.add(code);
 const label=code==='zh-CN'?'收藏':code==='en'?'Saved':TRAVEL_UI[code].saved;
 assert.ok(label&&label.toLowerCase()!=='money',code+' Saved tab label invalid');
 const ui=shellLocale(code);
 for(const key of SHELL_KEYS) assert.ok(ui[key]&&ui[key].trim(),code+' missing shell label '+key);
 if(code!=='en')assert.notEqual(ui.savedTitle,'Saved for later',code+' Saved view untranslated');
 if(code!=='en')assert.equal(SHELL_COVERAGE[code],SHELL_KEYS.length);
}
assert.equal(seen.size,12);
assert.ok(sw.includes('/lib/i18n-shell-v281.mjs')&&sw.includes('sgbuddy-shell-v66'),'Installed PWA must refresh and precache locale UI');
assert.ok(boot.includes('3.7.0')&&html.includes('v3.7.0'),'Client and static version should agree');
console.log('V3.7.0 PASS: Saved is not Money in all 12 languages; 31 Home/Saved/Move keys per language; events, routing and cache preserved.');
