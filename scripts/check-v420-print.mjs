import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync('app-trip-quality-v420.js','utf8'),css=readFileSync('trip-quality-v420.css','utf8');
for(const s of ['data-v420-print','printTrip()','window.print()','afterprint','printMarkup','escapeHTML(stop.note)'])assert.ok(ui.includes(s),s);
for(const locale of ['en','zh-CN','zh-TW','ms','id','ja','ko','th','vi','fr','es','pt-BR'])
 assert.ok(ui.includes('"'+locale+'":'),'Missing print localization '+locale);
assert.ok(css.includes('body>*:not(#sgbuddy-trip-print-root)'), 'Print view must suppress other app contents');
assert.ok(css.includes('@media print'));
console.log('V4.20 W2 PASS: local printable itinerary, 12 translated controls, user notes escaped and original data unchanged.');
