/* SGBuddy V4.7 curated publication: no automated discovery claims. */
import {readFileSync,writeFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {compileEvents,eventFreshness} from '../lib/events-v470.mjs';
const intake=JSON.parse(readFileSync('data/events-intake-v470.json','utf8'));
const sources=JSON.parse(readFileSync('data/event-sources-v470.json','utf8'));
const path='data/events-v470.json';
const existing=JSON.parse(readFileSync(path,'utf8'));
const mode=process.argv.includes('--write')?'write':process.argv.includes('--check')?'check':'report';
const asOf=mode==='check'?existing.asOf:singaporeDate();
const next=compileEvents(intake,sources,asOf);
if(next.rejected.some(row=>row.reason==='invalid'))throw Error('Invalid source-owned event record: '+JSON.stringify(next.rejected));
const payload={schemaVersion:1,asOf:mode==='check'?existing.asOf:asOf,timezone:'Asia/Singapore',sourceCount:next.sourceCount,events:next.events};
const stale=next.events.filter(e=>eventFreshness(e,asOf)==='review-needed').map(e=>e.id);
const content=JSON.stringify(payload,null,2)+'\n';
if(mode==='check'){
 if(content!==JSON.stringify(existing,null,2)+'\n')throw Error('Published events drifted from official curated intake');
 if(stale.length)console.warn('Source pages require reconfirmation: '+stale.join(', '));
}else if(mode==='write'){
 const currentRows=JSON.stringify(existing.events);
 const nextRows=JSON.stringify(next.events);
 if(currentRows!==nextRows||existing.sourceCount!==next.sourceCount){
  writeFileSync(path,content);
  console.log('Updated published events: '+next.events.length+' current, '+next.rejected.length+' omitted.');
 }else console.log('No event changes; publication skipped to avoid unnecessary GitHub/Vercel deployments.');
}else{
 console.log('SGBuddy verified event feed: '+next.events.length+' active, '+next.rejected.length+' expired/cancelled/duplicates, '+stale.length+' stale-source reviews');
 if(stale.length)console.log('Stale: '+stale.join(', '));
}
