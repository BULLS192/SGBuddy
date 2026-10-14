/* V4.14 Wave 3: editorial worklist, not an automatic approval engine. */
import {isValidDay,weekendWindow} from './events-v470.mjs';
import {triageEventCandidates} from './events-review-v413.mjs';
const MAX=80;
const REQUIRED=['original title','dates/time zone','public access','admission/registration','permission to list'];
const blocking=new Set(['invalid-details','unverified-source-host','unexpected-status','generic-title','unverified-url-title','promotion-not-confirmed-event','public-eligibility-unverified']);
const validAdmission=new Set(['free','ticketed','registration']);
const escape=x=>String(x??'').replace(/[\r\n|[\]]/g,' ').slice(0,155);
export function buildEditorWorklist(queue,published,sources,day){
 if(!isValidDay(day))throw Error('Invalid local date');
 const report=triageEventCandidates(queue,published,sources,day),win=weekendWindow(day);
 const rows=report.rows.map(row=>{
  const original=(queue.candidates||[]).find(c=>c.id===row.id&&c.sourceUrl===row.sourceUrl)||{};
  const missing=[];
  if(!validAdmission.has(original.admission)||!original.admissionEvidence)missing.push('admission');
  if(original.access!=='public-stated'||!original.publicAccessEvidence)missing.push('public access');
  if(!original.titleSource||original.titleSource==='url-slug'||original.titleReviewRequired||row.flags.includes('generic-title'))missing.push('official event title');
  if(!original.sourceUrl?.startsWith('https://'))missing.push('official detail page');
  // Publisher permission and live ticket availability are NEVER inferred from scraping.
  missing.push('permission to list');
  const category=row.flags.includes('expired')?'expired':
   row.flags.includes('potential-already-published')?'already-curated':
   row.flags.includes('potential-review-duplicate')?'duplicate-candidate':
   row.flags.some(f=>blocking.has(f))?'hold-editor':
   row.startDate<=win.end&&row.endDate>=win.start?'this-weekend':
   row.startDate<=addDays(day,14)?'next-14-days':'later';
  return {...row,category,missingEvidence:missing,requiresEditor:true,approvalAllowed:false};
 });
 const stages={};
 for(const row of rows)stages[row.category]=(stages[row.category]||0)+1;
 const order={'this-weekend':0,'next-14-days':1,'hold-editor':2,'duplicate-candidate':3,'already-curated':4,'later':5,'expired':6};
 rows.sort((a,b)=>(order[a.category]??9)-(order[b.category]??9)||a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title));
 return {day,weekend:win,total:rows.length,stages,missingChecklist:REQUIRED,rows,autoApproved:0};
}
function addDays(day,n){const d=new Date(day+'T12:00:00+08:00');return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Singapore'}).format(new Date(d.valueOf()+n*86400000))}
export function editorWorklistMarkdown(result,{limit=MAX}={}){
 const safeUrl=x=>/^https:\/\/[a-z0-9.-]+(?:\/[^\s)]*)?$/i.test(x||'')?x:'#';
 const heading=['## V4.14 Singapore Events editorial worklist · '+result.day,'','**Review-only: discovered candidates are NOT verified public activities and are never automatically published.**',
  '', 'Queue: **'+result.total+'** · '+Object.entries(result.stages).map(([k,v])=>escape(k)+': '+v).join(' · '),
  '','Public access, official admission/registration, dates, identity and republication rights require a named editor. Review the original official pages directly.',
  '', '| Candidate (official source) | Dates (SG) | Editorial lane | Missing evidence | Flags / duplicates |','|---|---|---|---|---|'];
 return [...heading,...result.rows.slice(0,Math.min(Math.max(0,limit),MAX)).map(r=>
  '| ['+escape(r.title)+']('+safeUrl(r.sourceUrl)+') | '+escape(r.startDate)+'–'+escape(r.endDate)+' | '+escape(r.category)+' | '+escape(r.missingEvidence.join(', '))+' | '+escape(r.flags.join(', ')+(r.duplicateOf?' · duplicate '+r.duplicateOf:''))+' |'),
  '','**No changes to published data or approval manifests are made by this report.**'].join('\n');
}
