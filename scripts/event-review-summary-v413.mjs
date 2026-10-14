/* Read-only view of official discovery queue. Never publishes or approves. */
import {readFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {triageEventCandidates,reviewMarkdown} from '../lib/events-review-v413.mjs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const queue=read('data/events-review-queue-v470.json');
const report=triageEventCandidates(queue,read('data/events-v470.json'),read('data/event-sources-v470.json'),singaporeDate());
if(process.argv.includes('--check')){
 if(!Array.isArray(queue.candidates))throw Error('Malformed event review queue');
 if(report.rows.some(r=>r.flags.includes('invalid-details')||r.flags.includes('unverified-source-host')||r.flags.includes('unexpected-status'))){
  throw Error('Untrusted review candidate schema or official host; inspect publisher source before any approval');
 }
 console.log('V4.13 EVENTS REVIEW PASS: '+report.total+' candidates, '+report.genericTitles+' generic titles, '+report.promotions+' promotions, zero auto-approvals.');
}else if(process.argv.includes('--markdown'))console.log(reviewMarkdown(report));
else console.log(JSON.stringify({day:report.day,total:report.total,bySource:report.bySource,reviewSoon:report.reviewSoon,held:report.held,genericTitles:report.genericTitles,promotions:report.promotions,duplicatePublished:report.duplicatePublished,duplicateReview:report.duplicateReview}));
