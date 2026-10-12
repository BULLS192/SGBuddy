import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {extendedUi} from '../lib/i18n-extended-v300.mjs';
const file=readFileSync('app-food-tools-v261.js','utf8');
for(const [id,key] of [['foodToolsTitle','foodToolsTitle'],['foodToolPicker','foodPicker'],['foodToolServices','foodServices'],['foodPickButton','foodPickButton'],['foodPickSaved','foodMyPicks']])
 assert.ok(file.includes("$('#"+id+"').textContent")&&file.includes('labels.'+key),id+' must use 12-locale authored pack');
assert.ok(!file.includes("window.SGBUDDY_LANGUAGE==='zh-CN'"),'Remove two-language conditional');
for(const {code} of LOCALES)for(const key of ['foodToolsTitle','foodPicker','foodServices','foodPickButton','foodMyPicks'])
 assert.ok(extendedUi(code)[key]?.trim(),code+' missing '+key);
assert.ok(file.includes("doc.addEventListener('sgbuddy:language',renderLanguage)"));
assert.ok(file.includes('esc(x.name)')&&file.includes('safeUrl(x.sourceUrl)'),'Preserve provider title and source URLs');
console.log('V3.10 PASS: Food discovery action labels now use the existing 12-locale authored dictionary, with source-owned values preserved.');
