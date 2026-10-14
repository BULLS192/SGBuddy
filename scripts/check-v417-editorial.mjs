/* V4.17 Wave 3: read-only publication boundary and source-field coverage.
 * Static fixtures are not evidence of current public admissions or live availability.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const published=read('data/events-v470.json'),review=read('data/events-review-queue-v470.json'),curated=read('data/events-curation-v490.json');
assert.equal(published.timezone,'Asia/Singapore');
assert.ok(published.events.length>=1);
assert.ok(review.candidates.length>=1);
const ids=new Set(),urls=new Set();
for(const e of published.events){
 assert.ok(typeof e.id==='string'&&e.id&&!ids.has(e.id),'Unique published event ID required');
 ids.add(e.id);
 assert.ok(typeof e.title==='string'&&e.title.trim().length>=5,'Missing event title');
 assert.ok(!/^Events @ EXPO$/i.test(e.title.trim()),'Generic venue label must not be published');
 assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.startDate)&&/^\d{4}-\d{2}-\d{2}$/.test(e.endDate));
 assert.ok(e.startDate<=e.endDate,'Event end must not precede start');
 assert.ok(typeof e.verifiedAt==='string'&&typeof e.sourceId==='string');
 const u=new URL(e.sourceUrl);
 assert.equal(u.protocol,'https:','Published event needs first-party HTTPS source link');
 assert.ok(!u.username&&!u.password,'No embedded credentials');
 urls.add(u.href);
}
for(const e of review.candidates){
 assert.equal(e.status,'needs-review','Unapproved candidate must remain gated');
 assert.ok(!ids.has(e.id),'Pending event ID was already published');
}
for(const c of curated.records){
 assert.ok(ids.has(c.id),'Curated official evidence should refer to published event');
 assert.ok(c.officialSource?.startsWith('https://'),'Curated source needs HTTPS URL');
}
const lines=['# V4.17 static events editorial audit','',`Snapshot: ${published.asOf} (NOT live checked)`,`Published: ${published.events.length}`,`Awaiting review: ${review.candidates.length}`,`Officially curated supporting records: ${curated.records.length}`,'','This test validates static publication boundaries, NOT real-time access, ticketing, prices, admission, official source currency or editorial decisions.'];
console.log(lines.join('\n'));
console.log('V4.17 EDITORIAL GATE PASS: pending candidates remain unpublished; valid source URLs, dates and IDs.');
