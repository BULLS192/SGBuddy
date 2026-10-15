/* Editorial briefing from locally checked-in source snapshots; no source fetch or mutation. */
import {readFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {eventsSourceHealth,eventsHealthMarkdown} from '../lib/events-source-health-v418.mjs';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const report=eventsSourceHealth({
 published:load('data/events-v470.json'),queue:load('data/events-review-queue-v470.json'),
 sources:load('data/event-sources-v470.json'),day:singaporeDate()
});
if(process.argv.includes('--check')){
 if(report.unapprovedPublished.length||report.unknownSources.length)throw Error('Editorial publication integrity violation');
 if(report.editorial.some(x=>x.approvalAllowed||!x.requiresEditor))throw Error('A discovery became auto-approved');
 console.log('V4.18 EDITORIAL HEALTH PASS: '+report.listed+' published, '+report.queued+
  ' held, '+report.staleReviewNeeded.length+' outdated-source checks needed; no automatic publication.');
}else if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else console.log(eventsHealthMarkdown(report,{limit:50}));
