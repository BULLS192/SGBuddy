/* V4.14 Wave 3: additional editorial sign-off safeguards before --publish. */
import {canonicalEventUrl,duplicateOf} from './events-identity-v414.mjs';
const dayValue=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)?Date.parse(s+'T12:00:00+08:00'):NaN;
const generic=/^(?:events?\s*@\s*expo|events?\s+at\s+expo|events?|upcoming events?|what['’]?s on)$/i;
export function checkEditorApproval({approval,row,event,published=[],accepted=[],sources=[],day}){
 const problems=[];
 if(!approval||!row||!event){return ['Missing signed approval, candidate or proposed event']}
 if(generic.test(String(row.title||''))||row.titleReviewRequired===true||row.titleSource==='url-slug')
  problems.push('Generic or provisional title requires updated official event record');
 if(approval.titleVerified!==true)problems.push('Official title not explicitly verified');
 if(approval.publicAccessVerified!==true)problems.push('Public entry eligibility not signed off');
 if(!['free','ticketed','registration'].includes(approval.admission))problems.push('Admission type must be explicitly established (free, ticketed or registration)');
 const now=dayValue(day),reviewed=dayValue(approval.reviewedAt);
 if(!Number.isFinite(now)||!Number.isFinite(reviewed)||reviewed>now||now-reviewed>14*86400000)problems.push('Editor review must be within the last 14 Singapore days');
 const entry=sources.find(s=>s.id===row.sourceId);
 try{
  const u=new URL(row.sourceUrl),official=new URL(entry?.url||'invalid');
  if(u.protocol!=='https:'||u.hostname.replace(/^www\./,'')!==official.hostname.replace(/^www\./,''))problems.push('Original official publisher host does not match registry');
 }catch{problems.push('Official event URL invalid')}
 const match=duplicateOf(event,[...published,...accepted]);
 if(match)problems.push('Duplicate of '+match.id+' ('+match.reason+')');
 if(!canonicalEventUrl(row.sourceUrl))problems.push('Event URL not HTTPS');
 return problems;
}
