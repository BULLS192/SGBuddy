/* V4.18 read-only coverage and editorial hold metrics. No scraping, approvals or publishing. */
import {isValidDay,eventFreshness} from './events-v470.mjs';
import {buildEditorWorklist} from './events-editor-v414.mjs';
import {publishedSourceState} from './events-discovery-v418.mjs';
export function eventsSourceHealth({published,queue,sources,day}){
 if(!isValidDay(day)||!Array.isArray(published?.events)||!Array.isArray(queue?.candidates)||!Array.isArray(sources?.sources))
  throw Error('Invalid Singapore Events source health input');
 const worklist=buildEditorWorklist(queue,published,sources,day);
 const ids=new Set(published.events.map(e=>e.id));
 const sourceIds=new Set(sources.sources.map(s=>s.id));
 const coverage=sources.sources.map(s=>({
  id:s.id,name:s.name,area:s.area||'unknown',ingestionStatus:s.ingestionStatus||'unverified',
  published:published.events.filter(e=>e.sourceId===s.id).length,
  awaitingReview:queue.candidates.filter(e=>e.sourceId===s.id).length
 })).sort((a,b)=>b.awaitingReview-a.awaitingReview||a.id.localeCompare(b.id));
 const stale=published.events.filter(e=>e.status==='scheduled'&&e.endDate>=day&&
  publishedSourceState(e,day,sources.sources)!=='snapshot').map(e=>e.id);
 const unapprovedPublished=queue.candidates.filter(e=>ids.has(e.id)).map(e=>e.id);
 const unknownSources=[...new Set([...published.events,...queue.candidates].filter(e=>!sourceIds.has(e.sourceId)).map(e=>e.sourceId))];
 return {
  day,publishedSnapshot:published.asOf||null,reviewSnapshot:queue.asOf||null,
  listed:published.events.length,sourceRegistry:sources.sources.length,
  publishedSourceCount:coverage.filter(s=>s.published>0).length,
  queued:queue.candidates.length,approvalCount:0,
  staleReviewNeeded:stale,unknownSources,unapprovedPublished,
  stages:worklist.stages,coverage,
  // These are editorial tasks, NOT recommended activities.
  editorial:worklist.rows.map(row=>({id:row.id,title:row.title,sourceUrl:row.sourceUrl,
   category:row.category,missingEvidence:row.missingEvidence,
   flags:row.flags,startDate:row.startDate,endDate:row.endDate,
   approvalAllowed:false,requiresEditor:true}))
 };
}
export function eventsHealthMarkdown(report,{limit=30}={}){
 const clean=v=>String(v??'').replace(/[\r\n|<>]/g,' ').slice(0,110);
 const url=v=>/^https:\/\/[a-z\d.-]+(?:\/[^\s)]*)?$/i.test(String(v||''))?v:'#';
 const rows=report.editorial.slice(0,Math.max(0,Math.min(limit,100))).map(r=>
 '| ['+clean(r.title)+']('+url(r.sourceUrl)+') | '+clean(r.startDate)+' – '+clean(r.endDate)+
 ' | '+clean(r.category)+' | '+clean(r.missingEvidence.join(', '))+' |');
 return [
  '## SGBuddy V4.18 — Singapore Events source and editorial health',
  'Report date (SG): '+report.day+'. Data from checked-in published/review snapshots, **not live source verification**.',
  '**Published:** '+report.listed+' · **Discoveries awaiting editorial decision:** '+report.queued+
   ' · **Source registry entries:** '+report.sourceRegistry+' · **Sources with published content:** '+report.publishedSourceCount,
  '**Published records requiring recheck:** '+report.staleReviewNeeded.length+
   ' · **Unapproved candidates leaked into publication:** '+report.unapprovedPublished.length,
  'Review lanes: '+Object.entries(report.stages).map(([key,count])=>clean(key)+': '+count).join(' · '),
  '| Candidate (official source) | Date range (SG) | Review lane | Evidence missing |',
  '|---|---|---|---|',...rows,
  '**No candidate was approved or published.** Admission, listing permission and source currency require independent human evidence.'
 ].join('\n\n');
}
