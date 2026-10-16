import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {singaporeDate,upcomingHolidays,nextLongWeekend,formatHolidayDate} from '../lib/calendar-v460.mjs';
import {calendarLabel,CALENDAR_MESSAGES} from '../lib/calendar-i18n-v460.mjs';
const holidays=JSON.parse(readFileSync('data/holidays-2026-2027-v460.json','utf8'));
const registry=JSON.parse(readFileSync('data/event-sources-v470.json','utf8'));
const html=readFileSync('index.html','utf8');
const auditScript=readFileSync('scripts/audit-app-v380.mjs','utf8');
assert.ok(auditScript.includes('sourceOwnedCalendarSnapshots'),'localization audit must explicitly separate external source snapshots');
const sw=readFileSync('sw.js','utf8');
const app=readFileSync('app-v090.js','utf8');
const items=holidays.holidays;
assert.equal(holidays.timezone,'Asia/Singapore');
assert.equal(items.length,26);
assert.equal(new Set(items.map(x=>x.date+' '+x.name)).size,26);
assert.deepEqual(upcomingHolidays(items,'2026-11-01',2).map(x=>x.date),['2026-11-08','2026-11-09']);
assert.equal(nextLongWeekend(items,'2026-10-13').date,'2026-11-09');
assert.equal(upcomingHolidays(items,'2027-01-01').length,9);
assert.equal(upcomingHolidays(items,'2028-01-01').length,0);
assert.match(formatHolidayDate('2026-11-09','en'),/Nov/);
assert.equal(singaporeDate(new Date('2026-10-13T17:00:00Z')),'2026-10-14');
assert.equal(registry.sources.length>=30,true);
assert.equal(new Set(registry.sources.map(x=>x.id)).size,registry.sources.length);
for(const source of registry.sources){
 assert.ok(source.url.startsWith('https://'),source.id);
 assert.equal(source.ingestionStatus,'candidate',source.id);
 assert.ok(['mall','exhibition','arts','tourism','holiday','attraction','community','performance','outdoors','sports','ticketing','family'].includes(source.category),source.category);
}
const locales=['en','zh-CN','zh-TW','ms','id','ja','ko','th','vi','fr','es','pt-BR'];
for(const code of locales){
 assert.equal(Object.keys(CALENDAR_MESSAGES[code]).length,Object.keys(CALENDAR_MESSAGES.en).length,code);
 for(const key of Object.keys(CALENDAR_MESSAGES.en))assert.ok(calendarLabel(code,key),code+' '+key);
}
for(const p of ['/app-calendar-v460.js','/lib/calendar-v460.mjs','/lib/calendar-i18n-v460.mjs','/data/holidays-2026-2027-v460.json','/data/event-sources-v470.json'])assert.ok(sw.includes(p),'offline shell missing '+p);
assert.ok(html.includes('/calendar-v460.css'));
assert.ok(app.includes("import('/app-calendar-v460.js')"),'calendar boot missing');
assert.ok(app.includes("='4.23.0'"),'do not alter production version badge');
assert.ok(sw.includes('sgbuddy-shell-v88'),'retain current production cache baseline');
console.log('V4.6 holiday/calendar/event-source static QA passed: '+items.length+' holidays, '+registry.sources.length+' candidate sources, '+locales.length+' locales.');
