/* V4.13: safe editorial triage of discovery candidates. No auto-approvals. */
import {isValidDay,normalizedKey} from './events-v470.mjs';
const generic=/^(?:events?\s*@\s*expo|events?\s+at\s+expo|events?|upcoming events?|what'?s on)$/i;
const restricted=/\b(?:invitation only|by invitation|private event|members only|closed.door|convocation)\b/i;
const canonicalUrl=value=>{try{const u=new URL(value);if(u.protocol!=='https:')return null;return u.hostname.toLowerCase()+u.pathname.replace(/\/+$/,'').toLowerCase()}catch{return null}};
export function triageEventCandidates(queue,published,sourceRegistry,day){
 if(!isValidDay(day))throw Error('Invalid Singapore-local date');
 const ids=new Set((published.events||[]).map(e=>e.id));
 const urls=new Set((published.events||[]).map(e=>canonicalUrl(e.sourceUrl)).filter(Boolean));
 const keys=new Set((published.events||[]).map(normalizedKey));
 const official=new Map((sourceRegistry.sources||[]).map(s=>[s.id,new URL(s.url).hostname]));
 const rows=[],tallies={};
 for(const candidate of queue.candidates||[]){
  const flags=[],id=String(candidate?.id||''),title=String(candidate?.title||'').trim();
  const sourceId=String(candidate?.sourceId||'');
  const srcUrl=canonicalUrl(candidate?.sourceUrl);
  if(!id||!title||!isValidDay(candidate.startDate)||!isValidDay(candidate.endDate)||candidate.endDate<candidate.startDate)flags.push('invalid-details');
  if(!official.has(sourceId)||!srcUrl||srcUrl.split('/')[0]!==official.get(sourceId))flags.push('unverified-source-host');
  if(candidate.status!=='needs-review')flags.push('unexpected-status');
  if(generic.test(title))flags.push('generic-title');
  if(candidate.kind==='promotion')flags.push('promotion-not-confirmed-event');
  if(restricted.test(title+' '+(candidate.reason||'')))flags.push('public-eligibility-unverified');
  if(!candidate.admission&&!candidate.access)flags.push('admission-unverified');
  if(ids.has(id)||urls.has(srcUrl)||keys.has(normalizedKey(candidate)))flags.push('potential-already-published');
  if(isValidDay(candidate.endDate)&&candidate.endDate<day)flags.push('expired');
  const blocking=flags.some(f=>['invalid-details','unverified-source-host','unexpected-status','generic-title','promotion-not-confirmed-event','public-eligibility-unverified','potential-already-published','expired'].includes(f));
  const priority=blocking?'hold-for-review':candidate.startDate<=plusDays(day,14)?'review-soon':'review-later';
  const entry={id,title,sourceId,startDate:candidate.startDate,endDate:candidate.endDate,sourceUrl:candidate.sourceUrl,kind:candidate.kind||'event',priority,flags,approvalAllowed:false};
  rows.push(entry);tallies[sourceId]=(tallies[sourceId]||0)+1;
 }
 const priorityOrder={'review-soon':0,'hold-for-review':1,'review-later':2};
 rows.sort((a,b)=>priorityOrder[a.priority]-priorityOrder[b.priority]||a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title));
 return {day,total:rows.length,bySource:tallies,reviewSoon:rows.filter(x=>x.priority==='review-soon').length,held:rows.filter(x=>x.priority==='hold-for-review').length,reviewLater:rows.filter(x=>x.priority==='review-later').length,genericTitles:rows.filter(x=>x.flags.includes('generic-title')).length,promotions:rows.filter(x=>x.flags.includes('promotion-not-confirmed-event')).length,rows};
}
function plusDays(day,days){const d=new Date(day+'T12:00:00+08:00');return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Singapore'}).format(new Date(d.valueOf()+days*86400000))}
export function reviewMarkdown(report,{limit=20}={}){
 const esc=x=>String(x??'').replace(/[\r\n|\[\]]/g,' ').slice(0,130);
 return ['## SGBuddy candidate discovery triage — '+report.day,'',
  '**Review-only. No candidate is verified as a public event or approved for publishing by this report.**',
  '', 'Total: **'+report.total+'** · Review soon: **'+report.reviewSoon+'** · Held: **'+report.held+'** · Later: **'+report.reviewLater+'**',
  'Generic publisher headings: **'+report.genericTitles+'** · Promotions (not confirmed events): **'+report.promotions+'**',
  '', 'By publisher: '+Object.entries(report.bySource).map(([k,v])=>esc(k)+' '+v).join(' · '),
  '', '| Candidate | Dates (SG) | Publisher | Triage | Editor checks |',
  '|---|---|---|---|---|',
  ...report.rows.slice(0,limit).map(r=>'| ['+esc(r.title)+']('+((/^https:\/\/[^\s)]+$/.test(r.sourceUrl||''))?r.sourceUrl:'#')+') | '+esc(r.startDate)+'–'+esc(r.endDate)+' | '+esc(r.sourceId)+' | '+r.priority+' | '+esc(r.flags.join(', ')||'Confirm dates, access, admission and publishing rights')+' |'),
  '', 'The automated feed **never** writes the approvals manifest or publishes these records. A named editor must verify official source, dates, public eligibility, admission and publisher listing rights in a separate reviewed PR.',''
 ].join('\n');
}
