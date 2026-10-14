/* V4.14 Wave 2: conservative cross-source duplicate holds + curated weekend suggestions */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonicalEventUrl,canonicalVenue,eventIdentityMatch,duplicateOf} from '../lib/events-identity-v414.mjs';
import {triageEventCandidates} from '../lib/events-review-v413.mjs';
import {selectWeekendPicks} from '../lib/events-weekend-v414.mjs';
import {compileEvents,weekendWindow} from '../lib/events-v470.mjs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const published=read('data/events-v470.json'),sources=read('data/event-sources-v470.json');
const queue=read('data/events-review-queue-v470.json');
assert.equal(published.events.length,11);
assert.equal(queue.candidates.length>0,true);
assert.equal(canonicalEventUrl('https://WWW.suntecsingapore.com/visit-events/fomo-weekend-market-2/?utm_source=a&fbclid=x'),
 'suntecsingapore.com/visit-events/fomo-weekend-market-2');
assert.notEqual(canonicalEventUrl('https://example.com/events?id=1'),canonicalEventUrl('https://example.com/events?id=2'));
assert.equal(canonicalVenue('Suntec Singapore Convention & Exhibition Centre'),canonicalVenue('Suntec Singapore · Hall 403'));
assert.notEqual(canonicalVenue('Suntec Singapore'),canonicalVenue('Singapore EXPO'));
const fomo=published.events.find(e=>e.id==='fomo-market-2026');
assert.equal(eventIdentityMatch({...fomo,id:'alternate-name',title:'Food Market',sourceUrl:fomo.sourceUrl+'?utm_source=official'},fomo),'same-official-url');
assert.equal(eventIdentityMatch({...fomo,id:'other',title:'FOMO Weekend Market',venue:'Suntec Singapore Convention & Exhibition Centre'},fomo),'same-title-venue-dates');
assert.equal(eventIdentityMatch({...fomo,id:'new',sourceUrl:'https://example.com/different',venue:'Singapore EXPO'},fomo),null);
assert.equal(eventIdentityMatch({...fomo,id:'new',sourceUrl:'https://example.com/different',startDate:'2026-12-01',endDate:'2026-12-02'},fomo),null);
const a={id:'a',title:'Community Course',sourceUrl:'https://www.suntecsingapore.com/visit-events',venue:'Suntec',startDate:'2026-10-17',endDate:'2026-10-18'};
const b={...a,id:'b',title:'Yoga Course'};
assert.equal(eventIdentityMatch(a,b),null,'Common venue landing pages must not imply same event');
const holder=published.events[0];
const duplicate={...holder,id:'another-event',title:'An alternative heading',sourceUrl:holder.sourceUrl+'?utm_medium=email'};
assert.equal(duplicateOf(duplicate,published.events)?.id,holder.id);
const compiled=compileEvents({events:[...published.events,duplicate]},sources,published.asOf);
assert.equal(compiled.events.length,published.events.length,'Published exact official URL cannot produce duplicate event');
assert.ok(compiled.rejected.some(e=>e.id===duplicate.id&&e.reason==='duplicate'));
const event=s=>({id:s,title:s,venue:'Suntec',sourceId:'suntec-convention',
 startDate:'2026-10-17',endDate:'2026-10-18',sourceUrl:'https://www.suntecsingapore.com/visit-events/'+s,
 status:'needs-review',admission:'check'});
const synthetic={candidates:[event('market-one'),{...event('market-two'),title:'market-one'},
 {...event('market-three'),title:'market-one',venue:'Singapore EXPO'},
 {...event('market-four'),title:'market-one',startDate:'2026-10-24',endDate:'2026-10-25'}]};
const review=triageEventCandidates(synthetic,published,sources,'2026-10-14');
assert.equal(review.duplicateReview,1);
assert.equal(review.rows.find(r=>r.id==='market-two').duplicateOf,'market-one');
assert.ok(review.rows.find(r=>r.id==='market-two').flags.includes('potential-review-duplicate'));
assert.ok(review.rows.every(r=>r.approvalAllowed===false));
const report=triageEventCandidates(queue,published,sources,'2026-10-14');
assert.equal(report.total,queue.candidates.length);
assert.ok(report.duplicatePublished>0,'Official URL cross-check should find known duplicate curated EXPO listings');
assert.ok(report.rows.every(r=>r.approvalAllowed===false),'Review collector never approves content');
const weekend=weekendWindow('2026-10-14');
assert.deepEqual(weekend,{start:'2026-10-17',end:'2026-10-18'});
const picks=selectWeekendPicks(published.events,'2026-10-14','visitor',3);
assert.equal(picks.length,3);
assert.equal(new Set(picks.map(e=>e.category)).size,3,'Different experience types should be prioritized');
assert.ok(picks.every(e=>e.status==='scheduled'&&e.verifiedAt==='2026-10-13'));
assert.ok(picks.every(e=>e.startDate<=weekend.end&&e.endDate>=weekend.start));
const unapproved={...holder,id:'needs-review',status:'needs-review',verifiedAt:'2026-10-14'};
const stale={...holder,id:'stale',verifiedAt:'2026-09-01'};
const upcoming=[unapproved,stale,...published.events];
assert.ok(!selectWeekendPicks(upcoming,'2026-10-14','student',6).some(x=>['needs-review','stale'].includes(x.id)));
assert.equal(selectWeekendPicks(published.events,'2026-11-15','visitor',3).length,0,'Expired listings cannot appear as weekend suggestions');
console.log('V4.14 Wave 2 PASS: '+report.duplicatePublished+' published duplicate candidates and '+report.duplicateReview+' cross-queue matches; recommendation selection is curated only.');
