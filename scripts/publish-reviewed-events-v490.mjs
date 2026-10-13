/* V4.9 manual editorial approval gate. An automated feed may not self-publish. */
import {readFileSync,writeFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {compileEvents,validateEvent} from '../lib/events-v470.mjs';
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const approvalPath='data/event-approvals-v490.json',intakePath='data/events-intake-v470.json',publishedPath='data/events-v470.json';
const manifest=json(approvalPath),queue=json('data/events-review-queue-v470.json'),sources=json('data/event-sources-v470.json');
const intake=json(intakePath),published=json(publishedPath),sourceIds=new Set(sources.sources.map(x=>x.id));
const candidates=new Map((queue.candidates||[]).map(x=>[x.id,x]));
const today=singaporeDate(),accepted=[],issues=[];
const reviewed=new Set();
for(const approval of manifest.approvals||[]){
 if(!approval||approval.decision!=='approved')continue;
 const row=candidates.get(approval.candidateId);
 if(reviewed.has(approval.candidateId)){issues.push('Duplicate signoff '+approval.candidateId);continue}
 reviewed.add(approval.candidateId);
 if(!row){issues.push('Candidate missing from queue '+approval.candidateId);continue}
 // An explicit, attributable editorial decision is necessary, not a scraped Boolean.
 if(typeof approval.reviewedBy!=='string'||approval.reviewedBy.trim().length<3||approval.reviewedBy.toLowerCase().includes('bot')||typeof approval.reviewedAt!=='string'||!/^20\d\d-\d\d-\d\d$/.test(approval.reviewedAt)||approval.reviewedAt>today){
  issues.push('Editor sign-off incomplete for '+row.id);continue;
 }
 if(!approval.sourceVerified||!approval.publicAdmissionVerified||!approval.publicListingRightsVerified||row.kind==='promotion'&&!approval.publicActivityVerified){
  issues.push('Publisher rights / public eligibility not signed off '+row.id);continue;
 }
 if(approval.sourceUrl!==row.sourceUrl||approval.startDate!==row.startDate||approval.endDate!==row.endDate||approval.title!==row.title){
  issues.push('Official source or date changed after approval '+row.id);continue;
 }
 const event={id:approval.eventId,title:row.title,startDate:row.startDate,endDate:row.endDate,venue:approval.venue||row.venue,sourceId:row.sourceId,category:approval.category,admission:approval.admission,summary:approval.summary,sourceUrl:row.sourceUrl,audiences:approval.audiences,status:'scheduled',verifiedAt:approval.reviewedAt,verificationMethod:'editor_approved_official_page'};
 if(!validateEvent(event,sourceIds)||event.endDate<today){issues.push('Invalid or expired approved event '+row.id);continue}
 if(!Array.isArray(event.audiences)||!event.audiences.length){issues.push('Missing audience list '+row.id);continue}
 accepted.push(event);
}
if(issues.length){console.error('Rejected approvals: '+issues.join(' | '));process.exitCode=1}
else {
 console.log('V4.9 editorial approval gate: '+accepted.length+' explicitly approved, '+(queue.candidates||[]).length+' unapproved candidates');
 if(process.argv.includes('--publish')){
  const known=new Map(intake.events.map(e=>[e.id,e]));
  for(const e of accepted)known.set(e.id,e);
  const nextIntake={...intake,events:[...known.values()]};
  const compiled=compileEvents(nextIntake,sources,today);
  const nextPublic={schemaVersion:1,asOf:today,timezone:'Asia/Singapore',sourceCount:compiled.sourceCount,events:compiled.events};
  if(compiled.rejected.some(x=>x.reason==='invalid'))throw Error('Publication candidate invalid');
  if(JSON.stringify(nextIntake)!==JSON.stringify(intake))writeFileSync(intakePath,JSON.stringify(nextIntake,null,2)+'\n');
  if(JSON.stringify(nextPublic.events)!==JSON.stringify(published.events)||nextPublic.sourceCount!==published.sourceCount){
   writeFileSync(publishedPath,JSON.stringify(nextPublic,null,2)+'\n');
   console.log('Manually-approved event publication staged. Review resulting diff before merging.');
  }else console.log('No additional approved events to publish.');
 }else console.log('Dry-run only. Nothing auto-published.');
}
