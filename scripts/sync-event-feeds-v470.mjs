/* V4.8 review-only source ingestion: verified publication is never automatic.
 * Preserve review candidates across individual upstream outages and do not
 * rewrite files when new results are unchanged (budget/CI-friendly).
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {fromFeed,normalizeReview} from '../lib/events-feeds-v480.mjs';
const configuration=JSON.parse(readFileSync('data/event-feeds-v470.json','utf8'));
const path='data/events-review-queue-v470.json';
const existing=JSON.parse(readFileSync(path,'utf8'));
const today=singaporeDate(),probe=!process.argv.includes('--write'),outcomes=[];
const retained=(existing.candidates||[]).filter(c=>c.endDate>=today);
for(const feed of configuration.feeds){
 const url=new URL(feed.url),official=new URL(feed.publicPage);
 if(url.protocol!=='https:'||url.hostname!==official.hostname)throw Error('Unapproved publisher host '+feed.id);
 try{
  const response=await fetch(url,{headers:{Accept:feed.format==='rss'?'application/rss+xml, application/xml':'application/json'},redirect:'follow',signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const destination=new URL(response.url);
  if(destination.protocol!=='https:'||destination.hostname!==official.hostname)throw Error('Unapproved cross-host redirect');
  const type=response.headers.get('content-type')||'';
  const claimed=Number(response.headers.get('content-length')||'0');
  if(claimed>feed.maxBytes)throw Error('Feed too large');
  const raw=await response.text();
  if(raw.length>feed.maxBytes)throw Error('Feed exceeds maximum size');
  const candidates=fromFeed(raw,feed,today,type);
  const other=retained.filter(c=>c.sourceId!==feed.sourceId);
  retained.splice(0,retained.length,...other,...candidates);
  outcomes.push({feed:feed.id,state:'reachable',candidateCount:candidates.length,format:feed.format});
 }catch(error){
  outcomes.push({feed:feed.id,state:'unavailable',message:String(error?.message||error).slice(0,130)});
 }
}
const approvedIds=new Set(configuration.feeds.map(x=>x.sourceId));
const reviewed=normalizeReview(retained.filter(c=>approvedIds.has(c.sourceId)),today);
console.log('Official publisher feed review: '+JSON.stringify(outcomes));
console.log('Pending manual review: '+reviewed.length);
if(probe){console.log('Probe mode; no writes.');process.exit(0)}
if(JSON.stringify(existing.candidates)!==JSON.stringify(reviewed)){
 writeFileSync(path,JSON.stringify({schemaVersion:2,asOf:today,candidates:reviewed,diagnostics:outcomes},null,2)+'\n');
 console.log('Review queue updated, no events auto-published.');
}else console.log('No review-candidate changes; skip write.');
